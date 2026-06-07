-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  category TEXT NOT NULL,
  rating FLOAT CHECK (rating >= 0 AND rating <= 5),
  stock INTEGER NOT NULL CHECK (stock >= 0),
  featured BOOLEAN DEFAULT false,
  top_product BOOLEAN DEFAULT false,
  image TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  order_items JSONB NOT NULL,
  total_price NUMERIC NOT NULL CHECK (total_price >= 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  shipping_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Products policies (public read, admin write)
CREATE POLICY "Public can view products"
  ON products FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- Orders policies (users can view their own orders, create orders)
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update their own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

-- Insert sample products
INSERT INTO products (name, description, price, category, rating, stock, featured, top_product, image) VALUES
('Rolex Submariner', 'Iconic diving watch with exceptional water resistance and timeless design', 3500000, 'Luxury', 4.9, 5, true, true, 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800'),
('Omega Speedmaster', 'The legendary moonwatch worn by astronauts during space missions', 1900000, 'Sport', 4.8, 8, true, false, 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=800'),
('TAG Heuer Carrera', 'Racing-inspired chronograph with precision and style', 1175000, 'Sport', 4.7, 12, false, true, 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=800'),
('Patek Philippe Calatrava', 'Elegant dress watch representing the pinnacle of Swiss watchmaking', 7840000, 'Dress', 5.0, 3, true, true, 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=800'),
('Seiko Presage', 'Japanese craftsmanship with stunning dial work and automatic movement', 154000, 'Dress', 4.6, 20, false, false, 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800'),
('Breitling Navitimer', 'Aviation chronograph with slide rule bezel for calculations', 2212000, 'Aviation', 4.8, 6, true, false, 'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=800'),
('Cartier Santos', 'Historic pilot watch with distinctive square case and exposed screws', 2100000, 'Luxury', 4.7, 7, false, true, 'https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=800'),
('Tudor Black Bay', 'Heritage diving watch with vintage-inspired design and modern reliability', 1064000, 'Dive', 4.8, 15, false, false, 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=800');
