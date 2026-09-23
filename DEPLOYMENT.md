# Deployment Checklist

Follow these steps to deploy your Falcon Drums e-commerce site:

## 1. Install Wrangler CLI

```bash
npm install
```

## 2. Login to Cloudflare

```bash
npx wrangler login
```

This will open your browser to authenticate with Cloudflare.

## 3. Create D1 Database

```bash
npm run db:create
```

Copy the `database_id` from the output and update it in `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "falcon-drums-orders",
    "database_id": "PASTE_YOUR_DATABASE_ID_HERE"
  }
]
```

## 4. Run Database Migrations

```bash
# Apply migrations to production
npm run db:migrate:remote
```

## 5. Set Up Secrets

You need to configure the following secrets in Cloudflare Workers:

### PayPal Credentials
Get these from https://developer.paypal.com/dashboard/

```bash
npx wrangler secret put PAYPAL_CLIENT_ID
# Paste your PayPal Client ID when prompted

npx wrangler secret put PAYPAL_CLIENT_SECRET
# Paste your PayPal Client Secret when prompted

npx wrangler secret put PAYPAL_MODE
# Enter: sandbox (for testing) or live (for production)
```

### EasyPost API Key
Get this from https://www.easypost.com/

```bash
npx wrangler secret put EASYPOST_API_KEY
# Paste your EasyPost API key when prompted
```

### Shipping Origin Address
Your business address where products ship from:

```bash
npx wrangler secret put SHIP_FROM_NAME
# Enter: Falcon Drums

npx wrangler secret put SHIP_FROM_STREET1
# Enter your street address

npx wrangler secret put SHIP_FROM_CITY
# Enter your city

npx wrangler secret put SHIP_FROM_STATE
# Enter your province/state (e.g., ON)

npx wrangler secret put SHIP_FROM_ZIP
# Enter your postal code

npx wrangler secret put SHIP_FROM_COUNTRY
# Enter: CA (for Canada)

npx wrangler secret put SHIP_FROM_PHONE
# Enter your phone number (e.g., +14165551234)
```

## 6. Deploy Worker

```bash
npm run deploy
```

After deployment, you'll see output like:

```
Published falcon-drums-api (X.XX sec)
  https://falcon-drums-api.YOUR_SUBDOMAIN.workers.dev
```

**Copy this URL!** You'll need it for the next step.

## 7. Update Frontend

Open `shop.html` and update two things:

### A. Update API URL (line ~1228)

Replace:
```javascript
const API_URL = 'http://localhost:8787/api';
```

With your Worker URL:
```javascript
const API_URL = 'https://falcon-drums-api.YOUR_SUBDOMAIN.workers.dev/api';
```

### B. Update PayPal Client ID (line ~1223)

Replace:
```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_PAYPAL_CLIENT_ID&currency=CAD"></script>
```

With your actual PayPal Client ID:
```html
<script src="https://www.paypal.com/sdk/js?client-id=AbC123XyZ...&currency=CAD"></script>
```

## 8. Test Your Site

1. Open `shop.html` in your browser
2. Click "Buy Now" on the Canadian Snare
3. Fill in shipping address
4. Select a shipping method
5. Complete PayPal payment (use sandbox test accounts if in sandbox mode)

## 9. Monitor Orders

View orders in your D1 database:

```bash
npx wrangler d1 execute falcon-drums-orders --remote --command "SELECT * FROM orders ORDER BY created_at DESC LIMIT 10"
```

## 10. Production Checklist

Before going live:

- [ ] Switch PayPal from sandbox to live mode
  ```bash
  npx wrangler secret put PAYPAL_MODE
  # Enter: live
  ```
- [ ] Use live PayPal credentials (not sandbox)
- [ ] Update `shop.html` with live PayPal client ID
- [ ] Test a real purchase end-to-end
- [ ] Set up email notifications for new orders
- [ ] Update `ALLOWED_ORIGINS` in `wrangler.jsonc` with your production domain

## Troubleshooting

### "Product not found" error
- Make sure the Worker is deployed: `npm run deploy`
- Check the API URL in `shop.html` is correct

### "PayPal not defined" error  
- Make sure you updated the PayPal script with your real client ID
- Check browser console for errors

### Shipping rates not loading
- Verify EasyPost API key is set: `npx wrangler secret list`
- Check shipping address is valid (all required fields)

### Payment succeeds but no tracking number
- This is expected if shipping label purchase fails
- Check Cloudflare Worker logs: `npx wrangler tail`
- Manually create shipping labels from EasyPost dashboard

## Support

For help with Cloudflare Workers: https://developers.cloudflare.com/workers/
For PayPal integration: https://developer.paypal.com/docs/
For EasyPost shipping: https://www.easypost.com/docs/

Questions? Contact: info@falcondrums.com
