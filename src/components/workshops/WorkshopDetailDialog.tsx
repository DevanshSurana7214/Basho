import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Clock, MapPin, Users, Check, 
  ChevronRight, Loader2
} from "lucide-react";
import { format, isSameDay, parseISO, addMinutes, parse } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthModal } from "@/components/AuthModal";
import PaymentProcessingOverlay from "@/components/PaymentProcessingOverlay";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface TimeSlot {
  time: string;
  max_spots: number;
  booked: number;
}

// Flat slot structure as stored in DB
interface FlatSlot {
  date: string;
  time: string;
  max_spots: number;
  booked: number;
}

interface DateSlot {
  date: string;
  slots: TimeSlot[];
}

// Helper to convert flat slots to grouped by date
const groupSlotsByDate = (flatSlots: FlatSlot[]): DateSlot[] => {
  const grouped = flatSlots.reduce((acc, slot) => {
    const existingDate = acc.find(d => d.date === slot.date);
    const timeSlot: TimeSlot = {
      time: slot.time,
      max_spots: slot.max_spots,
      booked: slot.booked
    };
    
    if (existingDate) {
      existingDate.slots.push(timeSlot);
    } else {
      acc.push({ date: slot.date, slots: [timeSlot] });
    }
    return acc;
  }, [] as DateSlot[]);
  
  // Sort dates
  return grouped.sort((a, b) => a.date.localeCompare(b.date));
};

interface Workshop {
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
}

interface WorkshopDetailDialogProps {
  workshop: Workshop | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workshopImage?: string;
}

// Helper to calculate end time from start time and duration
const calculateEndTime = (startTime: string, duration: string | null): string => {
  if (!duration) return startTime;
  
  // Parse duration like "2 hours", "1.5 hours", "90 minutes"
  const durationLower = duration.toLowerCase();
  let durationMinutes = 0;
  
  const hoursMatch = durationLower.match(/(\d+\.?\d*)\s*hour/);
  const minutesMatch = durationLower.match(/(\d+)\s*min/);
  
  if (hoursMatch) {
    durationMinutes += parseFloat(hoursMatch[1]) * 60;
  }
  if (minutesMatch) {
    durationMinutes += parseInt(minutesMatch[1]);
  }
  
  if (durationMinutes === 0) return startTime;
  
  try {
    // Parse start time like "10:00 AM" or "01:00 PM"
    const parsedTime = parse(startTime, 'hh:mm a', new Date());
    const endTime = addMinutes(parsedTime, durationMinutes);
    return format(endTime, 'hh:mm a');
  } catch {
    return startTime;
  }
};

const WorkshopDetailDialog = ({ 
  workshop, 
  open, 
  onOpenChange, 
  workshopImage 
}: WorkshopDetailDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'details' | 'booking'>('details');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [guests, setGuests] = useState("1");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'verifying' | 'success' | null>(null);
  const [realtimeDateSlots, setRealtimeDateSlots] = useState<DateSlot[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Storage key for form persistence
  const storageKey = workshop ? `workshop_booking_${workshop.id}` : null;

  // Load saved form data on mount
  useEffect(() => {
    if (!storageKey || !open) return;
    
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        const savedTime = data.savedAt || 0;
        const tenMinutes = 10 * 60 * 1000;
        
        // Only restore if saved within the last 10 minutes
        if (Date.now() - savedTime < tenMinutes) {
          if (data.selectedDate) setSelectedDate(new Date(data.selectedDate));
          if (data.selectedSlot) setSelectedSlot(data.selectedSlot);
          if (data.guests) setGuests(data.guests);
          if (data.name) setName(data.name);
          if (data.email) setEmail(data.email);
          if (data.phone) setPhone(data.phone);
          if (data.step) setStep(data.step);
        } else {
          // Clear expired data
          sessionStorage.removeItem(storageKey);
        }
      }
    } catch (e) {
      console.error('Error loading saved form data:', e);
    }
  }, [storageKey, open]);

  // Save form data whenever it changes
  useEffect(() => {
    if (!storageKey || step === 'details') return;
    
    const formData = {
      selectedDate: selectedDate?.toISOString(),
      selectedSlot,
      guests,
      name,
      email,
      phone,
      step,
      savedAt: Date.now()
    };
    
    sessionStorage.setItem(storageKey, JSON.stringify(formData));
  }, [storageKey, selectedDate, selectedSlot, guests, name, email, phone, step]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Subscribe to real-time updates for this workshop
  useEffect(() => {
    if (!workshop?.id || !open) return;

    // Helper to parse slots from DB
    const parseSlots = (slots: unknown): DateSlot[] => {
      if (!Array.isArray(slots) || slots.length === 0) return [];
      
      const firstSlot = slots[0];
      if (typeof firstSlot !== 'object' || firstSlot === null) return [];
      
      // Check if it's flat structure (each slot has date, time, max_spots, booked)
      if ('date' in firstSlot && 'time' in firstSlot) {
        return groupSlotsByDate(slots as FlatSlot[]);
      }
      
      // Check if it's already grouped structure (date with nested slots array)
      if ('date' in firstSlot && 'slots' in firstSlot) {
        return slots as DateSlot[];
      }
      
      return [];
    };

    // Fetch initial data
    const fetchWorkshopSlots = async () => {
      const { data, error } = await supabase
        .from('workshops')
        .select('time_slots')
        .eq('id', workshop.id)
        .single();
      
      if (data && !error) {
        setRealtimeDateSlots(parseSlots(data.time_slots));
      }
    };

    fetchWorkshopSlots();

    // Set up real-time subscription
    const channel = supabase
      .channel(`workshop-${workshop.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'workshops',
          filter: `id=eq.${workshop.id}`
        },
        (payload) => {
          setRealtimeDateSlots(parseSlots(payload.new.time_slots));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workshop?.id, open]);

  // Parse date_slots - use realtime data if available, otherwise from workshop prop
  const dateSlots: DateSlot[] = useMemo(() => {
    if (realtimeDateSlots.length > 0) return realtimeDateSlots;
    
    if (!workshop?.time_slots) return [];
    
    const slots = workshop.time_slots as unknown;
    if (!Array.isArray(slots) || slots.length === 0) return [];
    
    const firstSlot = slots[0];
    if (typeof firstSlot !== 'object' || firstSlot === null) return [];
    
    // Check if it's flat structure (each slot has date, time, max_spots, booked)
    if ('date' in firstSlot && 'time' in firstSlot) {
      return groupSlotsByDate(slots as FlatSlot[]);
    }
    
    // Check if it's already grouped structure
    if ('date' in firstSlot && 'slots' in firstSlot) {
      return slots as DateSlot[];
    }
    
    // Fallback for old format without date in each slot
    if ('time' in firstSlot && workshop.workshop_date) {
      return [{ date: workshop.workshop_date, slots: slots as TimeSlot[] }];
    }
    
    return [];
  }, [workshop, realtimeDateSlots]);

  // Calculate total booked spots across all dates and slots
  const totalBookedSpots = useMemo(() => {
    return dateSlots.reduce((total, dateSlot) => {
      return total + dateSlot.slots.reduce((slotTotal, slot) => slotTotal + slot.booked, 0);
    }, 0);
  }, [dateSlots]);

  // Calculate total max spots across all dates and slots
  const totalMaxSpots = useMemo(() => {
    return dateSlots.reduce((total, dateSlot) => {
      return total + dateSlot.slots.reduce((slotTotal, slot) => slotTotal + slot.max_spots, 0);
    }, 0);
  }, [dateSlots]);

  // Get available dates from dateSlots
  const availableDates: Date[] = useMemo(() => {
    return dateSlots.map(ds => parseISO(ds.date));
  }, [dateSlots]);

  // Get slots for selected date
  const slotsForSelectedDate: TimeSlot[] = useMemo(() => {
    if (!selectedDate || dateSlots.length === 0) return [];
    
    const matchingDateSlot = dateSlots.find(ds => 
      isSameDay(parseISO(ds.date), selectedDate)
    );
    
    return matchingDateSlot?.slots || [];
  }, [selectedDate, dateSlots]);

  // Get available spots for selected slot
  const selectedSlotData = useMemo(() => {
    return slotsForSelectedDate.find(s => s.time === selectedSlot);
  }, [slotsForSelectedDate, selectedSlot]);

  const availableSpots = useMemo(() => {
    if (!selectedSlotData) return 0;
    return selectedSlotData.max_spots - selectedSlotData.booked;
  }, [selectedSlotData]);

  // Reset slot when date changes
  useEffect(() => {
    setSelectedSlot("");
    setGuests("1");
  }, [selectedDate]);

  // Validate guests against available spots
  useEffect(() => {
    if (availableSpots > 0 && parseInt(guests) > availableSpots) {
      setGuests(availableSpots.toString());
      toast.warning(`Only ${availableSpots} spots available for this slot`);
    }
  }, [guests, availableSpots]);

  const resetForm = (clearStorage = false) => {
    setStep('details');
    setSelectedDate(undefined);
    setSelectedSlot("");
    setGuests("1");
    setName("");
    setEmail(user?.email || "");
    setPhone("");
    
    // Clear storage only on successful booking
    if (clearStorage && storageKey) {
      sessionStorage.removeItem(storageKey);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Don't clear storage on close - keep data for later
      setStep('details');
      setSelectedDate(undefined);
      setSelectedSlot("");
      setGuests("1");
      setName("");
      setEmail(user?.email || "");
      setPhone("");
    }
    onOpenChange(open);
  };

  const isDateDisabled = (date: Date) => {
    // Only allow dates that are in the availableDates array
    return !availableDates.some(availableDate => isSameDay(availableDate, date));
  };

  const handleStartBooking = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setStep('booking');
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setStep('booking');
  };

  const handleSubmit = async () => {
    if (!workshop || !selectedDate || !selectedSlot) return;

    if (!user) {
      toast.error("Please sign in to book a workshop");
      return;
    }

    if (!name || !email || !phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate phone number
    if (!/^\d{10}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    // Validate guests against available spots
    if (parseInt(guests) > availableSpots) {
      toast.error(`Only ${availableSpots} spots available for this slot`);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to continue");
        setIsSubmitting(false);
        return;
      }

      const totalAmount = workshop.price * parseInt(guests);
      const bookingDate = format(selectedDate, 'yyyy-MM-dd');

      // Create order via edge function
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-workshop-order', {
        body: {
          workshop_id: workshop.id,
          booking_date: bookingDate,
          time_slot: selectedSlot,
          guests: parseInt(guests),
          total_amount: totalAmount,
          customer_name: name,
          customer_email: email,
          customer_phone: phone
        }
      });

      if (orderError || !orderData) {
        console.error('Error creating order:', orderError);
        toast.error(orderData?.error || 'Failed to create booking. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Open Razorpay checkout
      const options: RazorpayOptions = {
        key: orderData.key_id,
        amount: orderData.amount * 100,
        currency: orderData.currency,
        name: 'Basho Byy Shivangi',
        description: `Workshop: ${orderData.workshop_title}`,
        order_id: orderData.order_id,
        prefill: {
          name: name,
          email: email,
          contact: phone
        },
        theme: {
          color: '#a68b6a'
        },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          setPaymentStatus('verifying');
          try {
            // Verify payment
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-workshop-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                booking_id: orderData.booking_id
              }
            });

            if (verifyError || !verifyData?.success) {
              console.error('Payment verification failed:', verifyError);
              setPaymentStatus(null);
              toast.error('Payment verification failed. Please contact support.');
              return;
            }

            // Clear saved form data on successful booking
            if (storageKey) {
              sessionStorage.removeItem(storageKey);
            }
            
            setPaymentStatus('success');
            
            // Small delay to show success state before redirect
            setTimeout(() => {
              handleOpenChange(false);
              navigate(`/workshop-confirmation/${orderData.booking_id}`);
            }, 1500);
          } catch (error) {
            console.error('Error verifying payment:', error);
            setPaymentStatus(null);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
            setPaymentStatus(null);
            // Reset form and clear storage on cancel
            resetForm(false);
            toast.info('Payment cancelled');
          }
        }
      };

      // Show processing overlay before closing dialog
      setPaymentStatus('processing');
      
      // Close the dialog before opening Razorpay to prevent modal stacking issues
      onOpenChange(false);
      
      // Small delay to ensure dialog is closed before Razorpay opens
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Booking error:', error);
      setPaymentStatus(null);
      setIsSubmitting(false);
      toast.error('Failed to process booking. Please try again.');
    }
  };

  if (!workshop) return null;

  const details = Array.isArray(workshop.details) ? workshop.details.filter((d): d is string => typeof d === 'string') : [];
  const totalAmount = workshop.price * parseInt(guests || "1");

  // Get first date for display
  const firstDate = availableDates.length > 0 ? availableDates[0] : null;

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <AnimatePresence mode="wait">
          {step === 'details' ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Workshop Image */}
              {workshopImage && (
                <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg">
                  <img 
                    src={workshopImage} 
                    alt={workshop.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                </div>
              )}

              <div className="p-6 space-y-6">
                <DialogHeader className="p-0">
                  {workshop.tagline && (
                    <span className="text-xs tracking-[0.2em] uppercase text-primary font-medium">
                      {workshop.tagline}
                    </span>
                  )}
                  <DialogTitle className="font-serif text-2xl md:text-3xl text-foreground">
                    {workshop.title}
                  </DialogTitle>
                </DialogHeader>

                {/* Quick Info */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {workshop.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{workshop.duration}</span>
                    </div>
                  )}
                  {workshop.duration_days && workshop.duration_days > 1 && (
                    <div className="flex items-center gap-2 px-2 py-0.5 bg-primary/10 rounded-full">
                      <span className="text-primary font-medium">{workshop.duration_days} days</span>
                    </div>
                  )}
                  {workshop.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{workshop.location}</span>
                    </div>
                  )}
                </div>

                {/* First Date Display */}
                {firstDate && (
                  <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-2 rounded-lg">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Starts:</span>
                    <span className="font-medium">{format(firstDate, "PPP")}</span>
                    {availableDates.length > 1 && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({availableDates.length} dates available)
                      </span>
                    )}
                  </div>
                )}

                {/* Description */}
                <p className="text-muted-foreground leading-relaxed">
                  {workshop.description}
                </p>

                {/* Schedule - All Dates and Slots */}
                {dateSlots.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-sans text-sm tracking-wider uppercase text-foreground/70">
                        Schedule & Availability
                      </h4>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">
                          <span className="font-medium text-foreground">{totalBookedSpots}</span>
                          /{totalMaxSpots} booked
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {dateSlots.map((dateSlot, dateIndex) => (
                        <div key={dateIndex} className="bg-muted/30 rounded-lg p-4 border border-border/50">
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="font-medium text-foreground">
                              {format(parseISO(dateSlot.date), "EEEE, MMMM d, yyyy")}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {dateSlot.slots.map((slot, slotIndex) => {
                              const endTime = calculateEndTime(slot.time, workshop.duration);
                              const available = slot.max_spots - slot.booked;
                              return (
                                <div 
                                  key={slotIndex}
                                  className={cn(
                                    "flex items-center justify-between p-2 rounded-md text-sm",
                                    available > 0 
                                      ? "bg-background border border-border/50" 
                                      : "bg-destructive/10 border border-destructive/20"
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-foreground">
                                      {slot.time} - {endTime}
                                    </span>
                                  </div>
                                  <div className={cn(
                                    "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                                    available > 5 
                                      ? "bg-primary/10 text-primary" 
                                      : available > 0 
                                        ? "bg-amber-500/10 text-amber-600" 
                                        : "bg-destructive/10 text-destructive"
                                  )}>
                                    <Users className="w-3 h-3" />
                                    {available > 0 ? `${available} spots` : 'Full'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Details/What's Included */}
                {details.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-sans text-sm tracking-wider uppercase text-foreground/70">
                      Additional Information
                    </h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {details.map((detail, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Price & CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <span className="text-2xl font-serif text-foreground">
                      ₹{workshop.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">per person</span>
                  </div>
                  <Button 
                    onClick={handleStartBooking}
                    className="gap-2"
                  >
                    {user ? 'Register Now' : 'Sign In to Register'}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="booking"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="p-6"
            >
              <DialogHeader className="pb-4">
                <button
                  onClick={() => setStep('details')}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Back to details
                </button>
                <DialogTitle className="font-serif text-2xl text-foreground">
                  Register for {workshop.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                {/* Date Selection - Only admin-configured dates */}
                <div className="space-y-2">
                  <Label>Select Date *</Label>
                  {availableDates.length > 0 ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={isDateDisabled}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <p className="text-sm text-muted-foreground">No dates available for this workshop</p>
                  )}
                </div>

                {/* Time Slot Selection - Based on selected date */}
                {selectedDate && slotsForSelectedDate.length > 0 && (
                  <div className="space-y-2">
                    <Label>Select Time Slot *</Label>
                    <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {slotsForSelectedDate.map((slot) => {
                          const available = slot.max_spots - slot.booked;
                          return (
                            <SelectItem 
                              key={slot.time} 
                              value={slot.time}
                              disabled={available <= 0}
                            >
                              <span className="flex items-center justify-between w-full gap-4">
                                <span>{slot.time}</span>
                                <span className={cn(
                                  "text-xs",
                                  available <= 3 ? "text-destructive" : "text-muted-foreground"
                                )}>
                                  {available > 0 ? `${available} spots left` : 'Full'}
                                </span>
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Number of Guests - Limited by available spots and max 6 per booking */}
                {selectedSlot && availableSpots > 0 && (
                  <div className="space-y-2">
                    <Label>Number of Guests * (Max: {Math.min(availableSpots, 6)} per booking)</Label>
                    <Select value={guests} onValueChange={setGuests}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: Math.min(availableSpots, 6) }, (_, i) => i + 1).map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? 'person' : 'people'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {availableSpots > 6 && (
                      <p className="text-xs text-muted-foreground">
                        Maximum 6 guests per booking. For larger groups, please make multiple bookings.
                      </p>
                    )}
                  </div>
                )}

                {/* Contact Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <Input 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile"
                      type="tel"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    type="email"
                  />
                </div>

                {/* Summary */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-2 border border-border/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Workshop</span>
                    <span>{workshop.title}</span>
                  </div>
                  {selectedDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Date</span>
                      <span>{format(selectedDate, "PPP")}</span>
                    </div>
                  )}
                  {selectedSlot && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Time</span>
                      <span>{selectedSlot}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Guests</span>
                    <span>{guests}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-border/50 font-medium">
                    <span>Total Amount</span>
                    <span className="text-primary">₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Submit */}
                <Button 
                  className="w-full" 
                  onClick={handleSubmit}
                  disabled={!selectedDate || !selectedSlot || !name || !email || !phone || isSubmitting || parseInt(guests) > availableSpots}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay ₹${totalAmount.toLocaleString()} & Register`
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>

    <AuthModal 
      open={showAuthModal} 
      onOpenChange={setShowAuthModal}
      onSuccess={handleAuthSuccess}
      title="Sign in to register"
      description="You need an account to book this workshop"
    />

    <AnimatePresence>
      {paymentStatus && <PaymentProcessingOverlay status={paymentStatus} />}
    </AnimatePresence>
    </>
  );
};

export default WorkshopDetailDialog;
