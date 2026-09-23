# Local Development Setup

For local development with the Cloudflare Worker:

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.dev.vars` file:**
   ```bash
   cp .dev.vars.example .dev.vars
   ```

3. **Edit `.dev.vars` with your credentials** (see `.dev.vars.example` for required values)

4. **Create local D1 database:**
   ```bash
   npm run db:migrate:local
   ```

5. **Start the Worker:**
   ```bash
   npm run dev
   ```

6. **Open `shop.html` in your browser**

   Make sure `API_URL` in `shop.html` is set to:
   ```javascript
   const API_URL = 'http://localhost:8787/api';
   ```

## Testing Payments

When using PayPal sandbox mode, use these test accounts:

**Buyer Account (for testing purchases):**
- Email: sb-buyer@example.com
- Password: (create at https://developer.paypal.com/dashboard/)

**Business Account (receives payments):**
- This is automatically set up with your sandbox credentials

## Local Development Features

- Hot reload on code changes
- Local D1 database (`.wrangler/state/v3/d1/`)
- All API endpoints work locally
- PayPal sandbox integration
- EasyPost test mode

## Viewing Local Orders

```bash
npx wrangler d1 execute falcon-drums-orders --local --command "SELECT * FROM orders"
```

## Common Issues

### CORS Errors
Make sure `ALLOWED_ORIGINS` in `wrangler.jsonc` includes your development origin.

### Database Not Found
Run: `npm run db:migrate:local`

### PayPal SDK Not Loading
Check that your PayPal Client ID is correct in `shop.html`
