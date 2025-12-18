-- Create storage bucket for custom order reference images
INSERT INTO storage.buckets (id, name, public)
VALUES ('custom-order-images', 'custom-order-images', true);

-- Allow anyone to upload images (for custom order submissions)
CREATE POLICY "Anyone can upload custom order images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'custom-order-images');

-- Allow public read access
CREATE POLICY "Public read access for custom order images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'custom-order-images');

-- Allow admins to delete images
CREATE POLICY "Admins can delete custom order images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'custom-order-images' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Add reference_images column to custom_order_requests table
ALTER TABLE public.custom_order_requests
ADD COLUMN reference_images TEXT[] DEFAULT '{}';