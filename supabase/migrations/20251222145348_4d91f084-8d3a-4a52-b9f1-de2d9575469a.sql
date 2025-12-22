-- Create storage bucket for workshop images
INSERT INTO storage.buckets (id, name, public)
VALUES ('workshop-images', 'workshop-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view workshop images (public bucket)
CREATE POLICY "Anyone can view workshop images"
ON storage.objects FOR SELECT
USING (bucket_id = 'workshop-images');

-- Allow admins to upload workshop images
CREATE POLICY "Admins can upload workshop images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'workshop-images' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to update workshop images
CREATE POLICY "Admins can update workshop images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'workshop-images' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete workshop images
CREATE POLICY "Admins can delete workshop images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'workshop-images' 
  AND public.has_role(auth.uid(), 'admin')
);