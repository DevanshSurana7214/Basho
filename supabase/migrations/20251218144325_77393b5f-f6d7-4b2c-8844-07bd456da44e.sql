-- Update product categories for better classification
UPDATE products SET category = 'Mugs' WHERE name IN ('Ocean Blue Mugs', 'Meadow Flower Mugs', 'Turquoise Geometric Mugs', 'Minimalist Cream Mugs', 'Rustic Duo Mug Set');
UPDATE products SET category = 'Bowls' WHERE name IN ('Ocean Palette Bowls', 'Terracotta Fruit Bowls', 'Ribbed Dual-Tone Bowls');
UPDATE products SET category = 'Plates' WHERE name IN ('Hexagonal Pastel Plates', 'Earth Tone Serving Plates', 'Ceramic Grater Plates');
UPDATE products SET category = 'Platters' WHERE name IN ('Organic Edge Platters', 'Cloud Serving Platters');
UPDATE products SET category = 'Tea Sets' WHERE name IN ('Forest Green Tea Set', 'Songbird Tea Set');
UPDATE products SET category = 'Storage' WHERE name = 'Bird Lid Storage Jars';
UPDATE products SET category = 'Sculptures' WHERE name IN ('Cupped Hands Sculpture', 'Praying Hands Collection', 'Fortune Cookie Keepsakes');
UPDATE products SET category = 'Planters' WHERE name = 'Indigo Planters';