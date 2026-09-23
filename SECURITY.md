# Security Architecture

This document explains how the Falcon Drums e-commerce system prevents price manipulation and ensures secure transactions.

## 🔒 Security Features

### 1. Server-Side Price Validation

**Problem**: If prices are determined on the frontend, malicious users could modify JavaScript to change the price before checkout.

**Solution**: All product prices are stored in the Cloudflare Worker code:

```typescript
const PRODUCTS = {
  'canadian-snare': {
    id: 'canadian-snare',
    name: 'Canadian Snare',
    price: 400.00,  // ← This NEVER comes from frontend
    currency: 'CAD',
    // ... other details
  }
}
```

**How it works**:
1. Frontend requests product details: `GET /api/products/canadian-snare`
2. Worker responds with server-verified price
3. Frontend displays price but cannot modify it
4. When creating PayPal order, Worker uses its own stored price, NOT frontend data

### 2. Shipping Rate Verification

**Problem**: Users could manipulate shipping rates to pay less for shipping.

**Solution**: Shipping rates are fetched from EasyPost API and verified server-side:

```typescript
// Frontend sends: shippingRateId (just an ID, not the price)
// Worker verifies the rate with EasyPost before using it:
const rateResponse = await fetch(`https://api.easypost.com/v2/rates/${shippingRateId}`);
const rate = await rateResponse.json();
const shippingCost = parseFloat(rate.rate);  // ← Verified by EasyPost

// If the ID is invalid or tampered with, EasyPost returns error
// Worker rejects the order before it reaches PayPal
```

**How it works**:
1. User enters address → Worker calls EasyPost for real rates
2. EasyPost returns rates with unique IDs
3. User selects a rate → Frontend sends only the rate ID
4. Worker validates the ID with EasyPost before creating PayPal order
5. Only verified shipping costs are added to PayPal payment

### 3. CORS Protection

**What it does**: Prevents unauthorized websites from making API calls to your Worker

```typescript
function corsHeaders(origin: string, allowedOrigins: string) {
  const allowed = allowedOrigins.split(',');
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0];
  
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    // Only specified origins can make requests
  };
}
```

**Configuration** (in `wrangler.jsonc`):
```jsonc
"vars": {
  "ALLOWED_ORIGINS": "https://falcondrums.com,https://www.falcondrums.com"
}
```

### 4. PayPal Server SDK Integration

**What it does**: Uses PayPal's official server-side SDK for secure payment processing

**Benefits**:
- Payments are created server-side (users can't see/modify PayPal API calls)
- Client secret never exposed to frontend
- PayPal verifies all amounts before accepting payment
- Built-in fraud detection

### 5. Database Order Tracking

**What it does**: Every order is stored in Cloudflare D1 database with full audit trail

**Stored data**:
- Product details and verified prices
- Customer information
- Payment status and IDs
- Shipping tracking
- Timestamps for creation and updates

**Benefits**:
- Complete order history
- Fraud detection (unusual patterns)
- Customer support and refunds
- Business analytics

## 🚫 What Users CANNOT Do

❌ Change product prices in browser console
❌ Modify shipping costs before payment
❌ Send fake payment confirmations
❌ Skip payment and get tracking numbers
❌ Access other customers' order data
❌ Make API calls from unauthorized domains

## ✅ What is Protected

✅ Product prices (stored in Worker code)
✅ Shipping rates (verified with EasyPost)
✅ Payment processing (secured by PayPal)
✅ Order data (stored in private D1 database)
✅ API credentials (Cloudflare secrets)
✅ Customer information (HTTPS + private database)

## 🔐 Secrets Management

All sensitive credentials are stored as Cloudflare Workers secrets:

```bash
npx wrangler secret put PAYPAL_CLIENT_SECRET
npx wrangler secret put EASYPOST_API_KEY
# etc...
```

**Security features**:
- Secrets are encrypted at rest
- Never exposed in code or logs
- Only accessible to the Worker at runtime
- Separate from code repository
- Can be rotated without redeploying

## 🛡️ Additional Recommendations

### 1. Enable PayPal Advanced Fraud Protection
- Available in your PayPal business account
- Automatically blocks suspicious transactions
- Machine learning fraud detection

### 2. Monitor Orders Regularly
```bash
npx wrangler d1 execute falcon-drums-orders --remote \
  --command "SELECT * FROM orders WHERE created_at > strftime('%s', 'now', '-24 hours')"
```

### 3. Set Up Alerts
- Monitor failed payment attempts
- Alert on unusual order patterns
- Track API error rates in Cloudflare dashboard

### 4. Rate Limiting (Optional)
Add rate limiting to prevent API abuse:

```typescript
// In worker.ts, before processing requests:
const rateLimiter = env.RATE_LIMITER; // KV namespace
const ip = request.headers.get('CF-Connecting-IP');
// Implement rate limiting logic
```

### 5. Email Notifications
Send email confirmations for:
- New orders
- Payment confirmations
- Shipping updates
- Failed transactions

## 📊 Attack Scenarios & Defenses

### Scenario 1: User tries to change price in browser
**Attack**: User opens browser console and tries to modify price JavaScript variable
**Defense**: Frontend price is display-only; PayPal order uses Worker's stored price
**Result**: User pays the real price regardless of frontend modifications

### Scenario 2: User intercepts API call and modifies shipping cost
**Attack**: User uses browser dev tools to change shipping cost in API request
**Defense**: Worker validates shipping rate ID with EasyPost before using it
**Result**: Invalid rate ID rejected; order creation fails

### Scenario 3: Replay attack with old shipping rates
**Attack**: User captures a cheap shipping rate ID from previous session
**Defense**: EasyPost rate IDs are tied to specific shipments and expire
**Result**: Old rate ID returns error from EasyPost; order rejected

### Scenario 4: Direct PayPal API calls from frontend
**Attack**: User tries to create PayPal order directly from browser
**Defense**: PayPal client secret is server-side only; CORS blocks unauthorized calls
**Result**: PayPal API rejects unauthorized requests

## 🔍 Audit Trail

Every transaction creates a complete audit trail:

```sql
SELECT 
  id,
  product_name,
  customer_name,
  product_price,
  shipping_cost,
  total_amount,
  paypal_order_id,
  paypal_capture_id,
  status,
  datetime(created_at, 'unixepoch') as created,
  datetime(updated_at, 'unixepoch') as updated
FROM orders
WHERE status = 'completed'
ORDER BY created_at DESC;
```

## 📝 Compliance Notes

- **PCI DSS**: Not required (PayPal handles all card data)
- **GDPR**: Store minimal customer data; implement deletion on request
- **CCPA**: Provide customer data export if requested
- **Tax Collection**: Consult with accountant for Canadian tax obligations

## 🆘 Incident Response

If you suspect fraudulent activity:

1. **Immediate**: Pause Worker deployment
   ```bash
   npx wrangler delete
   ```

2. **Investigate**: Check D1 database for suspicious orders
   ```bash
   npx wrangler d1 execute falcon-drums-orders --remote \
     --command "SELECT * FROM orders WHERE status = 'suspicious'"
   ```

3. **Contact PayPal**: Report fraudulent transactions

4. **Rotate Secrets**: Update all API credentials
   ```bash
   npx wrangler secret put PAYPAL_CLIENT_SECRET
   npx wrangler secret put EASYPOST_API_KEY
   ```

5. **Redeploy**: Fix issues and redeploy Worker

---

## Questions?

For security concerns or questions about this implementation:
- Review Cloudflare Workers security best practices
- Consult PayPal's fraud prevention guide
- Contact info@falcondrums.com
