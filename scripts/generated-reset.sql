
CREATE OR REPLACE FUNCTION public.chaos_reset_iphone_shop()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.iphone_sales WHERE true;
  DELETE FROM public.iphone_inventory WHERE true;
  INSERT INTO public.iphone_inventory (model, sku, units_in_stock, display_order, list_price, image_url) VALUES
  ('iPhone 16 Pro Max 256GB', 'IPH-001', 95, 1, 1199, '/products/iphone/01.svg'),
  ('iPhone 16 Pro 256GB Black', 'IPH-002', 120, 2, 999, '/products/iphone/02.svg'),
  ('iPhone 16 128GB White', 'IPH-003', 85, 3, 799, '/products/iphone/03.svg'),
  ('iPhone 16 Plus 256GB', 'IPH-004', 64, 4, 899, '/products/iphone/04.svg'),
  ('iPhone 15 Pro Max 512GB', 'IPH-005', 42, 5, 1099, '/products/iphone/05.svg'),
  ('iPhone 15 128GB Blue', 'IPH-006', 40, 6, 699, '/products/iphone/06.svg'),
  ('iPhone 15 Plus 128GB', 'IPH-007', 55, 7, 749, '/products/iphone/07.svg'),
  ('iPhone 14 128GB Midnight', 'IPH-008', 28, 8, 599, '/products/iphone/08.svg'),
  ('iPhone 14 Plus 256GB', 'IPH-009', 33, 9, 649, '/products/iphone/09.svg'),
  ('iPhone SE 64GB', 'IPH-010', 110, 10, 429, '/products/iphone/10.svg'),
  ('iPhone 13 128GB Green', 'IPH-011', 22, 11, 549, '/products/iphone/11.svg'),
  ('iPhone 13 mini 128GB', 'IPH-012', 15, 12, 499, '/products/iphone/12.svg'),
  ('iPhone 12 64GB Purple', 'IPH-013', 18, 13, 449, '/products/iphone/13.svg'),
  ('iPhone 11 128GB Black', 'IPH-014', 12, 14, 399, '/products/iphone/14.svg'),
  ('iPhone 16 Pro 512GB Desert', 'IPH-015', 70, 15, 1099, '/products/iphone/15.svg'),
  ('iPhone 16 256GB Teal', 'IPH-016', 48, 16, 849, '/products/iphone/16.svg'),
  ('iPhone 15 Pro 128GB', 'IPH-017', 36, 17, 899, '/products/iphone/17.svg'),
  ('iPhone 15 256GB Pink', 'IPH-018', 52, 18, 799, '/products/iphone/18.svg'),
  ('iPhone 14 Pro 256GB Gold', 'IPH-019', 9, 19, 749, '/products/iphone/19.svg'),
  ('iPhone 12 Pro Max 128GB', 'IPH-020', 7, 20, 649, '/products/iphone/20.svg');
  INSERT INTO public.iphone_sales (model, buyer_email, quantity, unit_price)
  SELECT i.model, 'buyer' || g || '@apple-fans.test', 1, i.list_price
  FROM generate_series(1, 24) g
  CROSS JOIN LATERAL (
    SELECT model, list_price FROM public.iphone_inventory ORDER BY display_order OFFSET (g % 20) LIMIT 1
  ) i;
END;
$$;

CREATE OR REPLACE FUNCTION public.chaos_reset_shoe_store()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.shoe_sales WHERE true;
  DELETE FROM public.shoe_inventory WHERE true;
  INSERT INTO public.shoe_inventory (style, sku, units_in_stock, display_order, list_price, image_url) VALUES
  ('Air Runner Elite', 'SHO-001', 200, 1, 129, '/products/shoes/01.svg'),
  ('Trail Max GTX', 'SHO-002', 65, 2, 159, '/products/shoes/02.svg'),
  ('City Slip On', 'SHO-003', 110, 3, 89, '/products/shoes/03.svg'),
  ('Sprint Pro Carbon', 'SHO-004', 88, 4, 179, '/products/shoes/04.svg'),
  ('Urban Flex Knit', 'SHO-005', 142, 5, 99, '/products/shoes/05.svg'),
  ('Court Classic Low', 'SHO-006', 76, 6, 79, '/products/shoes/06.svg'),
  ('Hike Ridge Waterproof', 'SHO-007', 54, 7, 149, '/products/shoes/07.svg'),
  ('Velocity Track Spike', 'SHO-008', 31, 8, 119, '/products/shoes/08.svg'),
  ('Cloud Step Lite', 'SHO-009', 165, 9, 69, '/products/shoes/09.svg'),
  ('Peak Summit Boot', 'SHO-010', 44, 10, 189, '/products/shoes/10.svg'),
  ('Retro Jam High', 'SHO-011', 92, 11, 109, '/products/shoes/11.svg'),
  ('Studio Yoga Grip', 'SHO-012', 118, 12, 59, '/products/shoes/12.svg'),
  ('Marathon Elite 2', 'SHO-013', 58, 13, 169, '/products/shoes/13.svg'),
  ('Street Bold Red', 'SHO-014', 73, 14, 94, '/products/shoes/14.svg'),
  ('Glide Foam Racer', 'SHO-015', 99, 15, 139, '/products/shoes/15.svg'),
  ('Kids Zoom Mini', 'SHO-016', 130, 16, 49, '/products/shoes/16.svg'),
  ('Work Steel Toe', 'SHO-017', 41, 17, 129, '/products/shoes/17.svg'),
  ('Lounge Fleece Clog', 'SHO-018', 156, 18, 39, '/products/shoes/18.svg'),
  ('Pro Basketball Court', 'SHO-019', 67, 19, 159, '/products/shoes/19.svg'),
  ('Eco Knit Walker', 'SHO-020', 84, 20, 74, '/products/shoes/20.svg');
  INSERT INTO public.shoe_sales (style, buyer_email, size, quantity, unit_price)
  SELECT i.style, 'buyer' || g || '@sneakerheads.test', 9 + (g % 4), 1, i.list_price
  FROM generate_series(1, 24) g
  CROSS JOIN LATERAL (
    SELECT style, list_price FROM public.shoe_inventory ORDER BY display_order OFFSET (g % 20) LIMIT 1
  ) i;
END;
$$;

SELECT public.chaos_reset_iphone_shop();
SELECT public.chaos_reset_shoe_store();

