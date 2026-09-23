# Falcon Drums E-Commerce

Secure payment and shipping integration using Cloudflare Workers, PayPal, and EasyPost.

## Features

- **Serverless Backend**: Cloudflare Workers (free tier: 100,000 requests/day)
- **Secure Payment**: PayPal integration with server-side price validation
- **Real Shipping Rates**: EasyPost API (UPS, FedEx, Canada Post)
- **Order Storage**: Cloudflare D1 SQLite database
- **No Price Manipulation**: All prices verified server-side

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Cloudflare D1 Database

```bash
npm run db:create
```

Copy the database ID from the output and update `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "falcon-drums-orders",
    "database_id": "YOUR_DATABASE_ID_HERE"  // <-- Paste here
  }
]
```

### 3. Run Database Migrations

```bash
# For local development
npm run db:migrate:local

# For production
npm run db:migrate:remote
```

### 4. Configure Environment Variables

Copy `.dev.vars.example` to `.dev.vars` and fill in your credentials:

```bash
cp .dev.vars.example .dev.vars
```

Required credentials:
- **PayPal**: Get from https://developer.paypal.com/dashboard/
- **EasyPost**: Get from https://www.easypost.com/
- **Shipping Address**: Your business address for shipping from

### 5. Deploy Secrets to Cloudflare

```bash
wrangler secret put PAYPAL_CLIENT_ID
wrangler secret put PAYPAL_CLIENT_SECRET
wrangler secret put PAYPAL_MODE
wrangler secret put EASYPOST_API_KEY
wrangler secret put SHIP_FROM_NAME
wrangler secret put SHIP_FROM_STREET1
wrangler secret put SHIP_FROM_CITY
wrangler secret put SHIP_FROM_STATE
wrangler secret put SHIP_FROM_ZIP
wrangler secret put SHIP_FROM_COUNTRY
wrangler secret put SHIP_FROM_PHONE
```

### 6. Update Frontend

In `shop.html`, update the API URL to your Worker URL:

```javascript
const API_URL = 'https://falcon-drums-api.YOUR_SUBDOMAIN.workers.dev/api';
```

Or for local development:

```javascript
const API_URL = 'http://localhost:8787/api';
```

Also update the PayPal SDK script with your client ID:

```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_PAYPAL_CLIENT_ID&currency=CAD"></script>
```

## Development

Start local development server:

```bash
npm run dev
```

The API will be available at `http://localhost:8787`

## Deployment

Deploy to Cloudflare:

```bash
npm run deploy
```

Your API will be available at: `https://falcon-drums-api.YOUR_SUBDOMAIN.workers.dev`

## Security Features

✅ **Server-side price validation**: Product prices stored in Worker code, never trusted from frontend
✅ **Shipping rate verification**: EasyPost rates validated server-side before PayPal order creation
✅ **CORS protection**: Only allowed origins can access the API
✅ **PayPal server SDK**: Payment processing secured through PayPal's official SDK
✅ **Order tracking**: All orders stored in D1 database with full audit trail

## API Endpoints

### `GET /api/health`
Health check endpoint

### `GET /api/products/:productId`
Get product details with server-verified pricing

### `POST /api/shipping/rates`
Calculate shipping rates for an address

### `POST /api/orders/create`
Create PayPal order with validated pricing

### `POST /api/orders/capture`
Capture payment and create shipping label

## Cost Estimates

- **Cloudflare Workers**: Free (100K requests/day)
- **Cloudflare D1**: Free (5GB storage, 5M reads/day)
- **PayPal**: 2.9% + $0.30 per transaction
- **EasyPost**: Pay for actual shipping labels only

## Support

For issues, contact: info@falcondrums.com
