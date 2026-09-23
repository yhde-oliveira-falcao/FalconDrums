/**
 * Falcon Drums E-Commerce API
 * Cloudflare Worker with D1 database, PayPal, and EasyPost integration
 */

interface Env {
  DB: D1Database;
  PAYPAL_CLIENT_ID: string;
  PAYPAL_CLIENT_SECRET: string;
  PAYPAL_MODE: string;
  EASYPOST_API_KEY: string;
  SHIP_FROM_NAME: string;
  SHIP_FROM_STREET1: string;
  SHIP_FROM_CITY: string;
  SHIP_FROM_STATE: string;
  SHIP_FROM_ZIP: string;
  SHIP_FROM_COUNTRY: string;
  SHIP_FROM_PHONE: string;
  ALLOWED_ORIGINS: string;
}

// Product catalog with server-side prices (SECURITY: Never trust frontend!)
const PRODUCTS = {
  'canadian-snare': {
    id: 'canadian-snare',
    name: 'Canadian Snare',
    price: 400.00,
    currency: 'CAD',
    weight: 8, // pounds
    dimensions: { length: 12, width: 12, height: 7 },
    description: 'Flagship 10x5" snare drum with reinforcement rings',
    sku: 'FD-CAN-SNARE-001'
  }
} as const;

type ProductId = keyof typeof PRODUCTS;

// CORS helper
function corsHeaders(origin: string, allowedOrigins: string): HeadersInit {
  const allowed = allowedOrigins.split(',').map(o => o.trim());
  const allowOrigin = allowed.includes('*') || allowed.includes(origin) ? origin : allowed[0];
  
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

// PayPal API helpers
async function getPayPalAccessToken(env: Env): Promise<string> {
  const auth = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);
  const baseUrl = env.PAYPAL_MODE === 'live' 
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
  
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json() as { access_token: string };
  return data.access_token;
}

async function createPayPalOrder(env: Env, orderData: any): Promise<any> {
  const accessToken = await getPayPalAccessToken(env);
  const baseUrl = env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(orderData),
  });

  return await response.json();
}

async function capturePayPalOrder(env: Env, orderId: string): Promise<any> {
  const accessToken = await getPayPalAccessToken(env);
  const baseUrl = env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  return await response.json();
}

// EasyPost shipping helpers
async function calculateShippingRates(env: Env, product: any, toAddress: any): Promise<any> {
  const response = await fetch('https://api.easypost.com/v2/shipments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.EASYPOST_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      shipment: {
        from_address: {
          name: env.SHIP_FROM_NAME,
          street1: env.SHIP_FROM_STREET1,
          city: env.SHIP_FROM_CITY,
          state: env.SHIP_FROM_STATE,
          zip: env.SHIP_FROM_ZIP,
          country: env.SHIP_FROM_COUNTRY,
          phone: env.SHIP_FROM_PHONE,
        },
        to_address: toAddress,
        parcel: {
          length: product.dimensions.length,
          width: product.dimensions.width,
          height: product.dimensions.height,
          weight: product.weight * 16, // Convert pounds to ounces
        },
      },
    }),
  });

  return await response.json();
}

async function buyShippingLabel(env: Env, rateId: string): Promise<any> {
  const response = await fetch(`https://api.easypost.com/v2/shipments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.EASYPOST_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rate: { id: rateId } }),
  });

  return await response.json();
}

// Router
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin, env.ALLOWED_ORIGINS);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    try {
      // Health check
      if (url.pathname === '/api/health') {
        return new Response(JSON.stringify({
          status: 'ok',
          timestamp: Date.now(),
          paypal: env.PAYPAL_CLIENT_ID ? 'configured' : 'missing',
          easypost: env.EASYPOST_API_KEY ? 'configured' : 'missing',
        }), {
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }

      // Get product details
      if (url.pathname.match(/^\/api\/products\/(.+)$/)) {
        const productId = url.pathname.split('/').pop() as ProductId;
        const product = PRODUCTS[productId];
        
        if (!product) {
          return new Response(JSON.stringify({ error: 'Product not found' }), {
            status: 404,
            headers: { ...headers, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify(product), {
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }

      // Calculate shipping rates
      if (url.pathname === '/api/shipping/rates' && request.method === 'POST') {
        const body = await request.json() as any;
        const { productId, shippingAddress } = body;

        const product = PRODUCTS[productId as ProductId];
        if (!product) {
          return new Response(JSON.stringify({ error: 'Product not found' }), {
            status: 404,
            headers: { ...headers, 'Content-Type': 'application/json' }
          });
        }

        const shipment = await calculateShippingRates(env, product, {
          name: shippingAddress.name,
          street1: shippingAddress.street1,
          street2: shippingAddress.street2 || '',
          city: shippingAddress.city,
          state: shippingAddress.state,
          zip: shippingAddress.zip,
          country: shippingAddress.country,
          phone: shippingAddress.phone || '',
        });

        // Filter and format rates
        const availableRates = (shipment.rates || [])
          .filter((rate: any) => {
            const carrier = rate.carrier.toLowerCase();
            return carrier.includes('ups') || 
                   carrier.includes('fedex') || 
                   carrier.includes('usps') ||
                   carrier.includes('canadapost');
          })
          .map((rate: any) => ({
            id: rate.id,
            carrier: rate.carrier,
            service: rate.service,
            rate: parseFloat(rate.rate),
            currency: rate.currency,
            delivery_days: rate.delivery_days,
            delivery_date: rate.delivery_date,
          }))
          .sort((a: any, b: any) => a.rate - b.rate);

        return new Response(JSON.stringify({
          shipmentId: shipment.id,
          rates: availableRates,
        }), {
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }

      // Create PayPal order
      if (url.pathname === '/api/orders/create' && request.method === 'POST') {
        const body = await request.json() as any;
        const { productId, shippingRateId, shippingAddress } = body;

        // SECURITY: Get product price from server
        const product = PRODUCTS[productId as ProductId];
        if (!product) {
          return new Response(JSON.stringify({ error: 'Product not found' }), {
            status: 404,
            headers: { ...headers, 'Content-Type': 'application/json' }
          });
        }

        // Verify shipping rate (prevents price manipulation)
        const rateResponse = await fetch(`https://api.easypost.com/v2/rates/${shippingRateId}`, {
          headers: { 'Authorization': `Bearer ${env.EASYPOST_API_KEY}` }
        });
        
        if (!rateResponse.ok) {
          return new Response(JSON.stringify({ error: 'Invalid shipping rate' }), {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' }
          });
        }

        const rate = await rateResponse.json();
        const shippingCost = parseFloat(rate.rate);
        const total = product.price + shippingCost;

        // Create PayPal order
        const paypalOrder = await createPayPalOrder(env, {
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: crypto.randomUUID(),
            description: product.description,
            custom_id: JSON.stringify({
              productId: product.id,
              shippingRateId: shippingRateId,
            }),
            amount: {
              currency_code: product.currency,
              value: total.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: product.currency,
                  value: product.price.toFixed(2),
                },
                shipping: {
                  currency_code: product.currency,
                  value: shippingCost.toFixed(2),
                },
              },
            },
            items: [{
              name: product.name,
              description: product.description,
              sku: product.sku,
              unit_amount: {
                currency_code: product.currency,
                value: product.price.toFixed(2),
              },
              quantity: '1',
              category: 'PHYSICAL_GOODS',
            }],
            shipping: {
              name: { full_name: shippingAddress.name },
              address: {
                address_line_1: shippingAddress.street1,
                address_line_2: shippingAddress.street2 || '',
                admin_area_2: shippingAddress.city,
                admin_area_1: shippingAddress.state,
                postal_code: shippingAddress.zip,
                country_code: shippingAddress.country,
              },
            },
          }],
          application_context: {
            brand_name: 'Falcon Drums',
            shipping_preference: 'SET_PROVIDED_ADDRESS',
            user_action: 'PAY_NOW',
          },
        });

        // Store order in D1
        const orderId = crypto.randomUUID();
        const now = Date.now();
        
        await env.DB.prepare(`
          INSERT INTO orders (
            id, product_id, product_name, customer_name,
            shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country, shipping_phone,
            product_price, shipping_cost, total_amount, currency,
            paypal_order_id, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          orderId,
          product.id,
          product.name,
          shippingAddress.name,
          shippingAddress.street1,
          shippingAddress.city,
          shippingAddress.state,
          shippingAddress.zip,
          shippingAddress.country,
          shippingAddress.phone || '',
          product.price,
          shippingCost,
          total,
          product.currency,
          paypalOrder.id,
          'pending',
          now,
          now
        ).run();

        return new Response(JSON.stringify({
          orderId: paypalOrder.id,
          orderDetails: {
            productName: product.name,
            subtotal: product.price,
            shipping: shippingCost,
            total: total,
            currency: product.currency,
          },
        }), {
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }

      // Capture PayPal payment
      if (url.pathname === '/api/orders/capture' && request.method === 'POST') {
        const body = await request.json() as any;
        const { orderId } = body;

        // Capture payment
        const capture = await capturePayPalOrder(env, orderId);

        if (capture.status !== 'COMPLETED') {
          return new Response(JSON.stringify({ error: 'Payment not completed' }), {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' }
          });
        }

        const customData = JSON.parse(capture.purchase_units[0].custom_id);
        const captureId = capture.purchase_units[0].payments.captures[0].id;

        // Get customer email from PayPal
        const customerEmail = capture.payer?.email_address || '';

        // Buy shipping label
        let trackingInfo = {};
        try {
          const shipment = await buyShippingLabel(env, customData.shippingRateId);
          trackingInfo = {
            trackingNumber: shipment.tracking_code,
            trackingUrl: shipment.tracker?.public_url || '',
          };

          // Update order in database
          await env.DB.prepare(`
            UPDATE orders 
            SET paypal_capture_id = ?, customer_email = ?, tracking_number = ?, 
                tracking_url = ?, status = 'completed', updated_at = ?
            WHERE paypal_order_id = ?
          `).bind(
            captureId,
            customerEmail,
            shipment.tracking_code,
            shipment.tracker?.public_url || '',
            Date.now(),
            orderId
          ).run();
        } catch (shipError) {
          console.error('Shipping label error:', shipError);
          
          // Update order as paid but shipping pending
          await env.DB.prepare(`
            UPDATE orders 
            SET paypal_capture_id = ?, customer_email = ?, status = 'paid_no_label', updated_at = ?
            WHERE paypal_order_id = ?
          `).bind(captureId, customerEmail, Date.now(), orderId).run();
        }

        return new Response(JSON.stringify({
          success: true,
          captureId: captureId,
          status: capture.status,
          ...trackingInfo,
        }), {
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }

      // 404
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });

    } catch (error: any) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
  },
};
