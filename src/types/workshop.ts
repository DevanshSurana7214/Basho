export interface TimeSlot {
  time: string;
  max_spots: number;
  booked: number;
}

export interface Workshop {
  id: string;
  title: string;
  tagline?: string | null;
  description: string | null;
  price: number;
  duration: string | null;
  duration_days?: number | null;
  location?: string | null;
  details?: unknown;
  time_slots?: unknown;
  workshop_date: string | null;
  max_participants: number | null;
  current_participants: number | null;
  workshop_type: string | null;
  image_url: string | null;
  is_active: boolean | null;
}

export const parseWorkshopDetails = (details: unknown): string[] => {
  if (Array.isArray(details)) {
    return details.filter((d): d is string => typeof d === 'string');
  }
  return [];
};

export const parseTimeSlots = (slots: unknown): TimeSlot[] => {
  if (Array.isArray(slots)) {
    return slots.filter((s): s is TimeSlot => 
      typeof s === 'object' && s !== null && 'time' in s && 'max_spots' in s && 'booked' in s
    );
  }
  return [];
};
