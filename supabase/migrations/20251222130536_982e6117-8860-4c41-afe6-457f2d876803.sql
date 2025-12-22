-- Add new columns to workshops table for enhanced workshop management

-- Location field for approximate workshop location
ALTER TABLE public.workshops ADD COLUMN IF NOT EXISTS location text;

-- Details as bullet points stored as JSON array
ALTER TABLE public.workshops ADD COLUMN IF NOT EXISTS details jsonb DEFAULT '[]'::jsonb;

-- Time slots with booking counts - stores array of { time: string, max_spots: number, booked: number }
ALTER TABLE public.workshops ADD COLUMN IF NOT EXISTS time_slots jsonb DEFAULT '[]'::jsonb;

-- Number of days for multi-day workshops (defaults to 1)
ALTER TABLE public.workshops ADD COLUMN IF NOT EXISTS duration_days integer DEFAULT 1;

-- Short tagline for the workshop
ALTER TABLE public.workshops ADD COLUMN IF NOT EXISTS tagline text;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workshops_type ON public.workshops(workshop_type);
CREATE INDEX IF NOT EXISTS idx_workshops_active ON public.workshops(is_active);