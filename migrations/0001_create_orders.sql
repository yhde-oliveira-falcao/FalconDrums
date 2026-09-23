-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_zip TEXT NOT NULL,
  shipping_country TEXT NOT NULL,
  shipping_phone TEXT,
  product_price REAL NOT NULL,
  shipping_cost REAL NOT NULL,
  total_amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CAD',
  paypal_order_id TEXT,
  paypal_capture_id TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Create index for faster lookups
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_paypal ON orders(paypal_order_id);
