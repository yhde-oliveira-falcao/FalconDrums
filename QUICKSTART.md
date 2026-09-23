# Quick Start Guide

Get your Falcon Drums shop running in 10 minutes!

## Prerequisites

- Node.js 18+ installed
- Cloudflare account (free tier works!)
- PayPal Developer account
- EasyPost account (free trial)

## Steps

### 1. Install Dependencies (2 min)

```bash
npm install
```

### 2. Login to Cloudflare (1 min)

```bash
npx wrangler login
```

This opens your browser to authenticate.

### 3. Create Database (1 min)

```bash
npm run db:create
```

Copy the `database_id` from output and paste it into `wrangler.jsonc` line 9.

### 4. Run Migrations (1 min)

```bash
npm run db:migrate:remote
```

### 5. Configure Secrets (3 min)

Run each command and paste your credentials when prompted:

```bash
npx wrangler secret put PAYPAL_CLIENT_ID
npx wrangler secret put PAYPAL_CLIENT_SECRET
npx wrangler secret put PAYPAL_MODE
npx wrangler secret put EASYPOST_API_KEY
npx wrangler secret put SHIP_FROM_NAME
npx wrangler secret put SHIP_FROM_STREET1
npx wrangler secret put SHIP_FROM_CITY
npx wrangler secret put SHIP_FROM_STATE
npx wrangler secret put SHIP_FROM_ZIP
npx wrangler secret put SHIP_FROM_COUNTRY
npx wrangler secret put SHIP_FROM_PHONE
```

**Where to get credentials:**
- PayPal: https://developer.paypal.com/dashboard/
- EasyPost: https://www.easypost.com/signup

### 6. Deploy (1 min)

```bash
npm run deploy
```

Copy the Worker URL from output (looks like: `https://falcon-drums-api.XXXXX.workers.dev`)

### 7. Update Frontend (1 min)

Edit `shop.html`:

**Line ~1228:** Update API URL
```javascript
const API_URL = 'https://falcon-drums-api.XXXXX.workers.dev/api';
```

**Line ~1223:** Update PayPal Client ID
```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_ACTUAL_CLIENT_ID&currency=CAD"></script>
```

### 8. Test! (1 min)

Open `shop.html` in your browser and try to buy the Canadian Snare!

---

## Testing Mode

Use PayPal sandbox for testing:
- Set `PAYPAL_MODE` to `sandbox`
- Create test accounts at https://developer.paypal.com/dashboard/
- Test purchases are free

## Going Live

When ready for production:

1. Switch to live PayPal:
   ```bash
   npx wrangler secret put PAYPAL_MODE
   # Enter: live
   ```

2. Use live PayPal credentials (not sandbox)

3. Update PayPal Client ID in `shop.html`

4. Test a real $1 purchase

5. 🎉 You're live!

---

## Troubleshooting

**API not working?**
- Check Worker is deployed: `npm run deploy`
- Check API URL in `shop.html` matches Worker URL

**PayPal errors?**
- Verify PayPal Client ID in both secrets and `shop.html`
- Check `PAYPAL_MODE` is set correctly (sandbox or live)

**Shipping rates not loading?**
- Verify EasyPost API key: `npx wrangler secret list`
- Check shipping address has all required fields

**Need help?**
- Open `setup.html` in browser for interactive setup
- Read `DEPLOYMENT.md` for detailed instructions
- Check `SECURITY.md` for security details

---

## Next Steps

- Set up email notifications for new orders
- Customize product catalog in `src/worker.ts`
- Add more products to your shop
- Configure production domain in `ALLOWED_ORIGINS`

Questions? Contact info@falcondrums.com
