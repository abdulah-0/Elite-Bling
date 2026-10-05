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
-- Sample Products (32 Luxury Jewelry Items)
-- ============================================================
INSERT INTO products (name, description, price, category, rating, stock, featured, top_product, image) VALUES
('Royal Kundan Bridal Set', 'Magnificent gold-plated Royal Kundan bridal choker set complete with matching statement jhumkas and maang tikka. Designed for unforgettable wedding celebrations.', 9500, 'Bridal Sets', 4.9, 25, true, true, 'https://images.unsplash.com/photo-1515562141589-07e3e00c00bd?auto=format&fit=crop&q=80&w=800'),
('Crystal Drop Chandelier Earrings', 'Glamorous tiered crystal drop earrings with 24K gold micron plating and precision-cut Austrian crystals that sparkle under evening lighting.', 2600, 'Earrings', 4.8, 60, true, true, 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&q=80&w=800'),
('Vintage Floral Statement Necklace', 'Handcrafted floral filigree statement necklace in champagne gold finish, accented with delicate micro-pearls and shimmering zircon crystals.', 4800, 'Necklaces', 4.9, 35, true, true, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800'),
('Rose Gold Zircon Stacking Rings', 'Set of 5 minimalist rose-gold stackable eternity rings adorned with pavé cubic zirconia. Wear individually or stacked together.', 1850, 'Rings', 4.7, 90, true, false, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800'),
('Baroque Freshwater Pearl Choker', 'Double-strand lustrous freshwater baroque pearl choker with an ornate vintage gold filigree clasp. A timeless classic for formal attire.', 3400, 'Necklaces', 4.8, 40, false, true, 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?auto=format&fit=crop&q=80&w=800'),
('Rhodium Crystal Tennis Bracelet', 'Classic 4mm prong-set round brilliant zircon tennis bracelet with secure double-latch box clasp. Radiant shine with non-tarnish rhodium plating.', 2900, 'Bracelets', 4.8, 50, true, false, 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=800'),
('Traditional Meenakari Chandbali Earrings', 'Exquisite hand-enameled Meenakari Chandbalis bordered with freshwater seed pearls and cluster bead drops. Authentic royal festive design.', 3200, 'Earrings', 4.9, 45, false, true, 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800'),
('Imperial Emerald Bridal Choker', 'Deep emerald-green simulated gemstones set in gold-finished brass with cascading pearl droplets. Includes statement drop earrings.', 8800, 'Bridal Sets', 5.0, 20, true, true, 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=80&w=800'),
('Textured Gold Statement Cuff', 'Wide architectural cuff bracelet with hammered satin finish. Adjustable open-back design fits all wrist sizes comfortably.', 3600, 'Bracelets', 4.6, 35, false, false, 'https://images.unsplash.com/photo-1617038220302-464505b0d8db?auto=format&fit=crop&q=80&w=800'),
('Solitaire Cushion-Cut Cocktail Ring', 'High-clarity 3-carat cushion-cut simulated diamond ring with diamond-encrusted micro pavé halo and split shank band.', 2100, 'Rings', 4.7, 75, false, true, 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=800'),
('Delicate Layered Paperclip Chain', 'Trending dual-strand paperclip and rope chain necklace with miniature coin medallion. 18K yellow gold ion plating for everyday wear.', 2400, 'Necklaces', 4.7, 80, false, false, 'https://images.unsplash.com/photo-1599643477871-8eb5c1db3b3a?auto=format&fit=crop&q=80&w=800'),
('Classic Chunky Gold Hoops (Set of 3)', 'Trio of hollow lightweight tubular hoop earrings in small, medium, and large diameters. Hypoallergenic posts with snap-bar closure.', 1950, 'Earrings', 4.6, 120, false, false, 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&q=80&w=800'),
('Sapphire Blue Velvet Polki Necklace', 'Regal Polki necklace highlighted with faceted royal blue sapphirine stones and natural pearl tassels. Exceptional heritage craftsmanship.', 6200, 'Necklaces', 4.8, 28, true, false, 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?auto=format&fit=crop&q=80&w=800'),
('Crystal Stud Earrings Capsule Collection', 'Box set of 6 assorted pairs of cushion, round, and marquise-cut crystal stud earrings. Ideal high-turnover package for resellers.', 2200, 'Earrings', 4.5, 110, false, true, 'https://images.unsplash.com/photo-1588444837495-c6cfeb53a32a?auto=format&fit=crop&q=80&w=800'),
('Ruby Velvet Heritage Bridal Haar', 'Traditional long Raani Haar necklace crafted with simulated rubies and antique gold finish. A magnificent centerpiece for Pakistani brides.', 10500, 'Bridal Sets', 4.9, 15, true, true, 'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?auto=format&fit=crop&q=80&w=800'),
('Engraved Turkish Filigree Bangle Pair', 'Set of two openable hinged gold bangles featuring hand-etched botanical motifs and push-lock safety clasps.', 3800, 'Bracelets', 4.7, 45, false, false, 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&q=80&w=800'),
('Floral Zircon adjustable Cocktail Ring', 'Blooming flower cluster ring with petal-cut crystals and a central golden pearl. Free size adjustable band for comfortable fit.', 1650, 'Rings', 4.6, 85, false, false, 'https://images.unsplash.com/photo-1589674781759-c21c37956a44?auto=format&fit=crop&q=80&w=800'),
('Champagne Crystal Choker Set', 'Modern luxury choker necklace studded with champagne-toned Austrian crystals and matching delicate drop earrings.', 4200, 'Necklaces', 4.7, 50, false, true, 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800'),
('Traditional Jhumka with Pearl Saharas', 'Classic dome jhumkas with detachable pearl ear-chains (saharas) that pin gracefully into the hair for festive parties.', 3100, 'Earrings', 4.8, 55, false, false, 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&q=80&w=800'),
('Geometric Cubic Zirconia Tennis Choker', 'Sleek high-fashion tennis necklace with alternating baguette and round cut stones. Shines brilliantly at wedding receptions.', 4900, 'Necklaces', 4.9, 30, true, false, 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&q=80&w=800'),
('Dual-Tone Pearl Kada Bracelet', 'Contemporary two-tone gold and rhodium kada bracelet capped with oversized faux south sea pearls on each end.', 2700, 'Bracelets', 4.6, 40, false, false, 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=80&w=800'),
('Zircon Encrusted Snake Ring', 'Bold statement coiled serpent ring encrusted with micro-pavé zircons and emerald-green crystal eyes.', 1950, 'Rings', 4.8, 65, false, false, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800'),
('Luxe Velvet Bridal Trousseau Set', 'Complete 5-piece bridal trousseau suite: choker, long haar, earrings, tikka, and matching ring presented in premium velvet casing.', 12500, 'Bridal Sets', 5.0, 12, true, true, 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800'),
('Petite Solitaire Diamond Pendant', 'Minimalist round brilliant solitaire pendant suspended on an ultra-fine 18K gold-dipped link chain. Perfect for daily elegance.', 1750, 'Necklaces', 4.7, 140, false, true, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800'),
('Hammered Gold Dome Earstuds', 'Chic modern molten gold dome studs with organic textured surface. A must-have staple for contemporary boutique lines.', 1400, 'Earrings', 4.5, 100, false, false, 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&q=80&w=800'),
('Pavé Crystal Charm Link Bracelet', 'Chunky chain link bracelet featuring five interchangeable crystal charms: heart, evil eye, key, star, and clover.', 3200, 'Bracelets', 4.7, 35, false, false, 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=800'),
('Emerald Cut Eternity Band Ring', 'Continuous band of prong-set emerald-cut simulated diamonds. Designed to stack effortlessly with engagement and solitaire rings.', 2300, 'Rings', 4.8, 50, false, false, 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=800'),
('Art Deco Crystal Bridal Collar', 'Intricately patterned Art Deco collar necklace featuring geometric zircon baguettes and rhodium mirror polish.', 7600, 'Bridal Sets', 4.8, 18, false, false, 'https://images.unsplash.com/photo-1515562141589-07e3e00c00bd?auto=format&fit=crop&q=80&w=800'),
('Bohemian Tassel Threader Earrings', 'Fluid linear threader earrings with cascading gold chains and micro-bead fringe that dance gracefully with every turn.', 1800, 'Earrings', 4.6, 70, false, false, 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&q=80&w=800'),
('Zircon Link Anklet Pair (Payal)', 'Pair of delicate gold-plated anklets with shimmering bezel-set crystals and adjustable extender clasps.', 2100, 'Bracelets', 4.7, 60, false, false, 'https://images.unsplash.com/photo-1617038220302-464505b0d8db?auto=format&fit=crop&q=80&w=800'),
('Vintage Locket Pendant Necklace', 'Opening oval photo locket engraved with vintage Victorian scrolls on an antique rope chain. Emotional heirloom appeal.', 2500, 'Necklaces', 4.8, 45, false, false, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800'),
('Trio Gemstone Cluster Ring', 'Trilogy ring featuring ruby red, sapphire blue, and emerald green pear-cut crystals symbolizing past, present, and future.', 2200, 'Rings', 4.7, 55, false, false, 'https://images.unsplash.com/photo-1589674781759-c21c37956a44?auto=format&fit=crop&q=80&w=800');

