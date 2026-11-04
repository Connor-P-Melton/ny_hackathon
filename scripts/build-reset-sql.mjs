import fs from 'fs'

const IPHONE_MODELS = [
  ['iPhone 16 Pro Max 256GB', 'IPH-001', 95, 1, 1199.0],
  ['iPhone 16 Pro 256GB Black', 'IPH-002', 120, 2, 999.0],
  ['iPhone 16 128GB White', 'IPH-003', 85, 3, 799.0],
  ['iPhone 16 Plus 256GB', 'IPH-004', 64, 4, 899.0],
  ['iPhone 15 Pro Max 512GB', 'IPH-005', 42, 5, 1099.0],
  ['iPhone 15 128GB Blue', 'IPH-006', 40, 6, 699.0],
  ['iPhone 15 Plus 128GB', 'IPH-007', 55, 7, 749.0],
  ['iPhone 14 128GB Midnight', 'IPH-008', 28, 8, 599.0],
  ['iPhone 14 Plus 256GB', 'IPH-009', 33, 9, 649.0],
  ['iPhone SE 64GB', 'IPH-010', 110, 10, 429.0],
  ['iPhone 13 128GB Green', 'IPH-011', 22, 11, 549.0],
  ['iPhone 13 mini 128GB', 'IPH-012', 15, 12, 499.0],
  ['iPhone 12 64GB Purple', 'IPH-013', 18, 13, 449.0],
  ['iPhone 11 128GB Black', 'IPH-014', 12, 14, 399.0],
  ['iPhone 16 Pro 512GB Desert', 'IPH-015', 70, 15, 1099.0],
  ['iPhone 16 256GB Teal', 'IPH-016', 48, 16, 849.0],
  ['iPhone 15 Pro 128GB', 'IPH-017', 36, 17, 899.0],
  ['iPhone 15 256GB Pink', 'IPH-018', 52, 18, 799.0],
  ['iPhone 14 Pro 256GB Gold', 'IPH-019', 9, 19, 749.0],
  ['iPhone 12 Pro Max 128GB', 'IPH-020', 7, 20, 649.0],
]

const SHOE_MODELS = [
  ['Air Runner Elite', 'SHO-001', 200, 1, 129.0],
  ['Trail Max GTX', 'SHO-002', 65, 2, 159.0],
  ['City Slip On', 'SHO-003', 110, 3, 89.0],
  ['Sprint Pro Carbon', 'SHO-004', 88, 4, 179.0],
  ['Urban Flex Knit', 'SHO-005', 142, 5, 99.0],
  ['Court Classic Low', 'SHO-006', 76, 6, 79.0],
  ['Hike Ridge Waterproof', 'SHO-007', 54, 7, 149.0],
  ['Velocity Track Spike', 'SHO-008', 31, 8, 119.0],
  ['Cloud Step Lite', 'SHO-009', 165, 9, 69.0],
  ['Peak Summit Boot', 'SHO-010', 44, 10, 189.0],
  ['Retro Jam High', 'SHO-011', 92, 11, 109.0],
  ['Studio Yoga Grip', 'SHO-012', 118, 12, 59.0],
  ['Marathon Elite 2', 'SHO-013', 58, 13, 169.0],
  ['Street Bold Red', 'SHO-014', 73, 14, 94.0],
  ['Glide Foam Racer', 'SHO-015', 99, 15, 139.0],
  ['Kids Zoom Mini', 'SHO-016', 130, 16, 49.0],
  ['Work Steel Toe', 'SHO-017', 41, 17, 129.0],
  ['Lounge Fleece Clog', 'SHO-018', 156, 18, 39.0],
  ['Pro Basketball Court', 'SHO-019', 67, 19, 159.0],
  ['Eco Knit Walker', 'SHO-020', 84, 20, 74.0],
]

const esc = (s) => s.replace(/'/g, "''")
const img = (folder, i) => `/products/${folder}/${String(i).padStart(2, '0')}.svg`

const iphoneValues = IPHONE_MODELS.map(
  ([m, sku, stock, ord, price], i) =>
    `('${esc(m)}', '${sku}', ${stock}, ${ord}, ${price}, '${img('iphone', i + 1)}')`,
).join(',\n  ')

const shoeValues = SHOE_MODELS.map(
  ([s, sku, stock, ord, price], i) =>
    `('${esc(s)}', '${sku}', ${stock}, ${ord}, ${price}, '${img('shoes', i + 1)}')`,
).join(',\n  ')

const sql = `
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
  ${iphoneValues};
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
  ${shoeValues};
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
`

console.log(sql)
