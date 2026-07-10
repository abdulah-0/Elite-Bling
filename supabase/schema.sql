-- ============================================================
-- Elite Bling - Supabase Schema
-- Luxury Artificial Jewelry Wholesale Store
-- ============================================================

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

-- Orders policies (users can view their own orders, anyone can create)
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

-- ============================================================
-- Sample Products (Jewelry)
-- ============================================================
INSERT INTO products (name, description, price, category, rating, stock, featured, top_product, image) VALUES
('Crystal Drop Earrings', 'Elegant crystal drop earrings with gold-plated settings. Perfect for bridal wear and formal occasions.', 2500, 'Earrings', 4.8, 50, true, true, 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=800'),
('Gold Statement Necklace', 'Premium gold-plated statement necklace with intricate floral design. A bestseller for resellers.', 4500, 'Necklaces', 4.9, 35, true, true, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800'),
('Rose Gold Stacking Rings', 'Set of 5 rose gold stacking rings with cubic zirconia accents. Mix and match for any look.', 1800, 'Rings', 4.7, 100, true, false, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800'),
('Pearl Choker Necklace', 'Classic freshwater pearl choker with gold clasp. Timeless elegance for every wardrobe.', 3200, 'Necklaces', 4.6, 25, false, true, 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800'),
('Crystal Tennis Bracelet', 'Stunning crystal tennis bracelet with rhodium-plated chain. Exceptional sparkle and quality.', 2800, 'Bracelets', 4.8, 40, true, false, 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800'),
('Bridal Jewelry Set', 'Complete bridal set including necklace, earrings, and maang tikka. Gold-plated with authentic crystals.', 8500, 'Bridal Sets', 4.9, 15, true, true, 'https://images.unsplash.com/photo-1515562141589-07e3e00c00bd?w=800'),
('Hoop Earrings Gold', 'Classic gold-plated hoop earrings available in 3 sizes. A staple for every boutique.', 1500, 'Earrings', 4.5, 200, false, false, 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800'),
('Adjustable Ring Set', 'Set of 6 adjustable rings with various stone colors. Perfect for party wear and gifting.', 1200, 'Rings', 4.4, 150, false, true, 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800'),
('Layered Gold Necklace', 'Trendy layered gold chain necklace with pendant. Lightweight and elegant for daily wear.', 2200, 'Necklaces', 4.7, 60, false, false, 'https://images.unsplash.com/photo-1599643477871-8eb5c1db3b3a?w=800'),
('Cuff Bracelet Gold', 'Wide gold-plated cuff bracelet with embossed pattern. Statement piece for evening wear.', 3500, 'Bracelets', 4.6, 30, false, false, 'https://images.unsplash.com/photo-1617038220302-464505b0d8db?w=800'),
('Stud Earrings Collection', 'Set of 6 pairs of crystal stud earrings in assorted colors. Great variety for resellers.', 2000, 'Earrings', 4.5, 80, false, true, 'https://images.unsplash.com/photo-1588444837495-c6cfeb53a32a?w=800'),
('Vintage Bridal Necklace', 'Vintage-inspired gold bridal necklace with emerald-cut crystals. Heirloom quality design.', 5500, 'Bridal Sets', 4.8, 20, true, false, 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800');
