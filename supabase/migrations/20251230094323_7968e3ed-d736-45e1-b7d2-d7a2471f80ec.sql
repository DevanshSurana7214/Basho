-- Create business_settings table for GST configuration
CREATE TABLE public.business_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gstin TEXT,
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  state_code TEXT NOT NULL,
  pincode TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  pan TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  bank_branch TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view business settings"
  ON public.business_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage business settings"
  ON public.business_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert initial data with Surat address
INSERT INTO public.business_settings (
  gstin,
  legal_name,
  trade_name,
  address_line1,
  address_line2,
  city,
  state,
  state_code,
  pincode,
  email
) VALUES (
  '24AXXXX1234X1Z5',
  'Shivangi Pottery Private Limited',
  'Basho Byy Shivangi',
  '311, Silent Zone, Gavier',
  'Dumas Road',
  'Surat',
  'Gujarat',
  '24',
  '395007',
  'hello@basho.in'
);

-- Add updated_at trigger
CREATE TRIGGER update_business_settings_updated_at
  BEFORE UPDATE ON public.business_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add hsn_code to products table
ALTER TABLE public.products
ADD COLUMN hsn_code TEXT DEFAULT '6912';

-- Add invoice columns to orders table
ALTER TABLE public.orders
ADD COLUMN invoice_number TEXT,
ADD COLUMN invoice_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN buyer_gstin TEXT,
ADD COLUMN buyer_state TEXT,
ADD COLUMN buyer_state_code TEXT,
ADD COLUMN cgst_amount NUMERIC DEFAULT 0,
ADD COLUMN sgst_amount NUMERIC DEFAULT 0,
ADD COLUMN igst_amount NUMERIC DEFAULT 0,
ADD COLUMN taxable_amount NUMERIC DEFAULT 0,
ADD COLUMN invoice_url TEXT;

-- Create invoices storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true);

-- Storage policies for invoices bucket
CREATE POLICY "Anyone can view invoices"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'invoices');

CREATE POLICY "Admins can manage invoices"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'invoices' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert invoices"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'invoices');