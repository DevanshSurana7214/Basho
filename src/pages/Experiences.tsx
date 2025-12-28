import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Users, Heart, Cake, TreePine, Palette, LogIn, Sparkles, Star, ArrowRight, ArrowDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ExperiencesFAQ from "@/components/home/ExperiencesFAQ";
import PaymentProcessingOverlay from "@/components/PaymentProcessingOverlay";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

import coupleImage from "@/assets/workshops/couple-pottery-date.jpg";
import kidsImage from "@/assets/workshops/kids-clay-play.jpg";
import studioImage from "@/assets/studio/studio-interior.jpg";
import handsImage from "@/assets/hero/pottery-hands-clay.jpg";
import potteryCollection from "@/assets/hero/pottery-collection.jpg";
import kilnImage from "@/assets/studio/kiln.jpg";
import glazingImage from "@/assets/studio/pottery-glazing.jpg";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Experience {
  id: string;
  title: string;
  tagline: string;
  description: string;
  includes: string[];
  duration: string;
  price: string;
  priceValue: number;
  image: string;
  icon: React.ReactNode;
  gradient: string;
}

// Use semantic design tokens from the design system (matching Workshops page)

const getExperienceTypeInfo = (id: string) => {
  switch (id) {
    case 'couple': return { label: 'Couples', icon: Heart, gradient: 'from-rose-500/20 to-pink-500/10' };
    case 'birthday': return { label: 'Celebration', icon: Cake, gradient: 'from-amber-500/20 to-orange-500/10' };
    case 'farm': return { label: 'Outdoor', icon: TreePine, gradient: 'from-emerald-500/20 to-teal-500/10' };
    case 'studio': return { label: 'Studio', icon: Palette, gradient: 'from-violet-500/20 to-purple-500/10' };
    default: return { label: 'Experience', icon: Sparkles, gradient: 'from-primary/20 to-primary/5' };
  }
};

const experiences: Experience[] = [
  {
    id: "couple",
    title: "Couple Pottery Dates",
    tagline: "Shape something together",
    description: "An intimate evening where hands meet clay. Create keepsakes that hold the warmth of shared moments, guided gently through each step.",
    includes: ["Private session for two", "Guided assistance", "Keepsake piece to take home", "Refreshments"],
    duration: "90 minutes",
    price: "₹3,500",
    priceValue: 3500,
    image: coupleImage,
    icon: <Heart className="w-5 h-5" />,
    gradient: "from-rose-500/20 to-pink-500/10"
  },
  {
    id: "birthday",
    title: "Birthday Sessions",
    tagline: "Celebrate with your hands",
    description: "A gathering that turns into lasting memories. Small groups, customizable themes, and pieces that carry the joy of the day.",
    includes: ["Small group celebration (up to 8)", "Customizable themes", "Take-home pieces", "Optional decoration & setup"],
    duration: "2 hours",
    price: "₹12,000",
    priceValue: 12000,
    image: kidsImage,
    icon: <Cake className="w-5 h-5" />,
    gradient: "from-amber-500/20 to-orange-500/10"
  },
  {
    id: "farm",
    title: "Farm & Garden Parties",
    tagline: "Clay under open skies",
    description: "Friends, family, or colleagues gathering in nature. Creative bonding where conversations flow as freely as the clay.",
    includes: ["Outdoor setting", "Small private groups (6-12)", "All materials provided", "Refreshments & ambiance"],
    duration: "2-3 hours",
    price: "₹15,000",
    priceValue: 15000,
    image: studioImage,
    icon: <TreePine className="w-5 h-5" />,
    gradient: "from-emerald-500/20 to-teal-500/10"
  },
  {
    id: "studio",
    title: "Studio Experiences",
    tagline: "The heart of creation",
    description: "Step into our studio space—where the wheel turns, kilns breathe, and every surface holds a story. Perfect for intimate gatherings.",
    includes: ["Full studio access", "Personalized guidance", "Materials & firing", "Peaceful atmosphere"],
    duration: "Flexible",
    price: "₹2,500",
    priceValue: 2500,
    image: handsImage,
    icon: <Palette className="w-5 h-5" />,
    gradient: "from-violet-500/20 to-purple-500/10"
  }
];

const timeSlots = ["10:00 AM", "11:30 AM", "2:00 PM", "4:00 PM", "6:00 PM"];

// Experience card matching WorkshopCard design
const ExperienceCard = ({ experience, index }: { experience: Experience; index: number }) => {
  const typeInfo = getExperienceTypeInfo(experience.id);
  const TypeIcon = typeInfo.icon;

  return (
    <motion.article
      id={experience.id}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="group cursor-pointer h-full"
    >
      <a href="#book" className="block h-full">
        <div className="relative h-full bg-card rounded-[1.5rem] overflow-hidden border border-border/20 hover:border-primary/30 transition-all duration-700 hover:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)]">
          {/* Image Container with cinematic aspect */}
          <div className="aspect-[4/3] overflow-hidden relative">
            <motion.div
              className="absolute inset-0"
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              <img
                src={experience.image}
                alt={experience.title}
                className="w-full h-full object-cover"
              />
            </motion.div>
            
            {/* Cinematic gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-br from-charcoal/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* Top Badges */}
            <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
              {/* Type Badge with gradient */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.4, duration: 0.5 }}
                className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${typeInfo.gradient} backdrop-blur-xl rounded-full border border-cream/10`}
              >
                <TypeIcon className="w-4 h-4 text-cream" />
                <span className="text-xs font-medium text-cream tracking-wide">{typeInfo.label}</span>
              </motion.div>
              
              {/* Price Badge - Premium styling */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.4, duration: 0.5 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-cream blur-sm opacity-50" />
                <div className="relative px-4 py-2 bg-cream rounded-full shadow-xl">
                  <span className="text-sm font-bold text-charcoal tracking-tight">
                    {experience.price}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Bottom Content on Image */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <motion.h3 
                className="font-serif text-2xl md:text-3xl font-medium text-cream leading-tight mb-2"
                style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
              >
                {experience.title}
              </motion.h3>
              {experience.tagline && (
                <p className="text-sm text-cream/70 italic">
                  "{experience.tagline}"
                </p>
              )}
            </div>

            {/* Elegant Hover Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-charcoal/50 backdrop-blur-[3px] opacity-0 group-hover:opacity-100 transition-all duration-500">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileHover={{ scale: 1 }}
                className="opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100"
              >
                <Button 
                  size="lg" 
                  className="bg-cream text-charcoal hover:bg-cream/95 gap-3 shadow-2xl px-8 h-14 text-base font-medium"
                >
                  Book Now
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 space-y-5">
            {/* Description */}
            <p className="text-muted-foreground line-clamp-2 leading-relaxed">
              {experience.description}
            </p>

            {/* Meta Info Pills */}
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/40 rounded-full text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-primary/70" />
                <span>{experience.duration}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/40 rounded-full text-sm text-muted-foreground">
                <Users className="w-4 h-4 text-primary/70" />
                <span>Private</span>
              </div>
            </div>

            {/* Includes preview */}
            <div className="space-y-2">
              {experience.includes.slice(0, 2).map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="w-3 h-3 text-primary/70" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Footer with CTA */}
            <div className="flex items-center justify-between pt-4 border-t border-border/30">
              <span className="text-sm text-muted-foreground">Flexible scheduling</span>
              
              <motion.div 
                className="flex items-center gap-2 text-primary font-medium opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 group-hover:translate-x-0"
              >
                <span className="text-sm">Book Now</span>
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </div>
          </div>

          {/* Subtle corner accent */}
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-primary/5 to-transparent rounded-tl-[4rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </div>
      </a>
    </motion.article>
  );
};

// Booking Section with warm aesthetic
const BookingSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [selectedExperience, setSelectedExperience] = useState("");
  const [date, setDate] = useState<Date>();
  const [timeSlot, setTimeSlot] = useState("");
  const [guests, setGuests] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'verifying' | 'success' | null>(null);

  const selectedExp = experiences.find(e => e.id === selectedExperience);
  const totalAmount = selectedExp 
    ? selectedExp.id === 'studio' 
      ? selectedExp.priceValue * parseInt(guests || '1')
      : selectedExp.priceValue
    : 0;

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please sign in to book an experience");
      navigate('/auth');
      return;
    }

    if (!selectedExperience || !date || !timeSlot || !guests) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: booking, error: bookingError } = await supabase
        .from('experience_bookings')
        .insert({
          user_id: user.id,
          experience_type: selectedExperience,
          booking_date: format(date, 'yyyy-MM-dd'),
          time_slot: timeSlot,
          guests: parseInt(guests),
          notes: notes || null,
          total_amount: totalAmount,
          payment_status: 'pending',
          booking_status: 'confirmed'
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        'create-razorpay-order',
        {
          body: {
            amount: totalAmount,
            currency: 'INR',
            receipt: `exp_${booking.id.substring(0, 8)}`,
            notes: {
              booking_id: booking.id,
              experience_type: selectedExperience
            }
          }
        }
      );

      if (orderError) throw orderError;

      await supabase
        .from('experience_bookings')
        .update({ razorpay_order_id: orderData.orderId })
        .eq('id', booking.id);

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Basho Byy Shivangi',
        description: `${selectedExp?.title} - ${format(date, 'PPP')} at ${timeSlot}`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          setPaymentStatus('verifying');
          try {
            const { error: verifyError } = await supabase.functions.invoke(
              'verify-experience-payment',
              {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  booking_id: booking.id
                }
              }
            );

            if (verifyError) throw verifyError;

            setPaymentStatus('success');
            setTimeout(() => {
              navigate(`/experience-confirmation/${booking.id}`);
            }, 1500);
          } catch (error) {
            console.error('Payment verification error:', error);
            setPaymentStatus(null);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          email: user.email
        },
        theme: {
          color: '#B5651D'
        },
        modal: {
          ondismiss: () => {
            toast.info('Payment cancelled');
            setIsSubmitting(false);
            setPaymentStatus(null);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to process booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {paymentStatus && <PaymentProcessingOverlay status={paymentStatus} />}
      </AnimatePresence>
      
      <section
        id="book"
        ref={ref}
        className="relative py-28 md:py-40 overflow-hidden bg-sand"
      >
        {/* Warm decorative background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            background: `
              radial-gradient(ellipse 80% 50% at 20% 20%, hsl(var(--terracotta) / 0.12) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 80% 80%, hsl(var(--clay) / 0.08) 0%, transparent 50%)
            `
          }} />
          {/* Subtle pattern overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--deep-clay)) 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }}
          />
        </div>

        <div className="container relative max-w-2xl mx-auto px-6">
          {/* Elegant section header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-14"
          >
            {/* Decorative circle */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={isInView ? { scale: 1, rotate: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-8 relative"
            >
              <div className="absolute inset-0 rounded-full border-2 border-terracotta/30" />
              <div className="absolute inset-2 rounded-full border border-terracotta/20" />
              <Calendar className="w-7 h-7 text-terracotta" />
            </motion.div>
            
            <motion.span 
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-4 mb-5"
            >
              <span className="w-12 h-px bg-terracotta/40" />
              <span className="font-sans text-xs tracking-[0.35em] uppercase text-terracotta">
                Reserve Your Spot
              </span>
              <span className="w-12 h-px bg-terracotta/40" />
            </motion.span>
            
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-deep-clay leading-tight">
              Book an
              <span className="italic font-light"> Experience</span>
            </h2>
            
            <p className="text-clay/70 mt-4 max-w-md mx-auto text-lg leading-relaxed">
              Choose your experience and let us create something beautiful together
            </p>
          </motion.div>

          {/* Auth prompt with warm styling */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 }}
              className="relative bg-gradient-to-br from-parchment via-parchment to-sand rounded-3xl p-8 md:p-10 mb-10 text-center border border-terracotta/15 shadow-xl shadow-terracotta/5 overflow-hidden"
            >
              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-terracotta/10 to-transparent rounded-bl-[4rem]" />
              
              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-terracotta/15 to-clay/10 border border-terracotta/20 mb-5">
                  <LogIn className="w-6 h-6 text-terracotta" />
                </div>
                <p className="text-clay/80 mb-6 text-lg">Please sign in to book an experience</p>
                <Link to="/auth">
                  <Button 
                    className="px-10 py-6 text-xs tracking-[0.2em] uppercase bg-gradient-to-r from-terracotta to-terracotta/90 hover:from-terracotta/90 hover:to-terracotta text-white shadow-lg shadow-terracotta/25 hover:shadow-xl hover:shadow-terracotta/30 transition-all duration-300"
                  >
                    Sign In to Continue
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Beautiful booking form card */}
          <motion.form
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            onSubmit={handleSubmit}
            className="relative bg-gradient-to-br from-parchment via-parchment to-sand/80 rounded-[2rem] p-8 md:p-10 shadow-2xl shadow-deep-clay/10 border border-terracotta/15 overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-terracotta/8 to-transparent rounded-br-[5rem]" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-clay/5 to-transparent rounded-tl-[5rem]" />
            
            <div className="relative space-y-7">
              {/* Experience Type */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 font-sans text-xs tracking-[0.2em] uppercase text-deep-clay/70">
                  <Sparkles className="w-3.5 h-3.5 text-terracotta/70" />
                  Experience Type
                </label>
                <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                  <SelectTrigger className="bg-white/60 border-terracotta/20 h-14 text-deep-clay focus:ring-terracotta/30 focus:border-terracotta/40 rounded-xl hover:border-terracotta/30 transition-colors shadow-sm">
                    <SelectValue placeholder="Choose your experience..." />
                  </SelectTrigger>
                  <SelectContent className="bg-parchment border-terracotta/20 rounded-xl shadow-xl">
                    {experiences.map((exp) => {
                      const TypeIcon = getExperienceTypeInfo(exp.id).icon;
                      return (
                        <SelectItem 
                          key={exp.id} 
                          value={exp.id}
                          className="text-deep-clay focus:bg-terracotta/10 focus:text-deep-clay py-3 cursor-pointer"
                        >
                          <span className="flex items-center gap-3">
                            <TypeIcon className="w-4 h-4 text-terracotta" />
                            <span>{exp.title}</span>
                            <span className="ml-auto text-terracotta font-medium">{exp.price}</span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Date & Time Row - Elegant cards */}
              <div className="grid grid-cols-2 gap-5">
                {/* Date Picker */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 font-sans text-xs tracking-[0.2em] uppercase text-deep-clay/70">
                    <Calendar className="w-3.5 h-3.5 text-terracotta/70" />
                    Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white/60 border-terracotta/20 h-14 hover:bg-white/80 hover:border-terracotta/30 rounded-xl transition-all shadow-sm",
                          !date ? "text-clay/50" : "text-deep-clay"
                        )}
                      >
                        <Calendar className="mr-3 h-4 w-4 text-terracotta/60" />
                        {date ? format(date, "MMM d, yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-parchment border-terracotta/20 rounded-xl shadow-xl" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time Slot */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 font-sans text-xs tracking-[0.2em] uppercase text-deep-clay/70">
                    <Clock className="w-3.5 h-3.5 text-terracotta/70" />
                    Time
                  </label>
                  <Select value={timeSlot} onValueChange={setTimeSlot}>
                    <SelectTrigger className="bg-white/60 border-terracotta/20 h-14 text-deep-clay focus:ring-terracotta/30 focus:border-terracotta/40 rounded-xl hover:border-terracotta/30 transition-colors shadow-sm">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent className="bg-parchment border-terracotta/20 rounded-xl shadow-xl">
                      {timeSlots.map((slot) => (
                        <SelectItem 
                          key={slot} 
                          value={slot}
                          className="text-deep-clay focus:bg-terracotta/10 focus:text-deep-clay py-3 cursor-pointer"
                        >
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Number of Guests - Card style */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 font-sans text-xs tracking-[0.2em] uppercase text-deep-clay/70">
                  <Users className="w-3.5 h-3.5 text-terracotta/70" />
                  Number of People
                </label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-terracotta/50" />
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    placeholder="How many guests will join?"
                    className="pl-12 bg-white/60 border-terracotta/20 h-14 text-deep-clay placeholder:text-clay/40 focus:ring-terracotta/30 focus:border-terracotta/40 rounded-xl hover:border-terracotta/30 transition-colors shadow-sm"
                  />
                </div>
              </div>

              {/* Notes - Elegant textarea */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 font-sans text-xs tracking-[0.2em] uppercase text-deep-clay/70">
                  <Heart className="w-3.5 h-3.5 text-terracotta/70" />
                  Special Requests 
                  <span className="text-clay/50 normal-case tracking-normal text-[10px]">(optional)</span>
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tell us about your occasion, any special requirements, or how we can make this experience memorable..."
                  rows={4}
                  className="bg-white/60 border-terracotta/20 text-deep-clay placeholder:text-clay/40 resize-none focus:ring-terracotta/30 focus:border-terracotta/40 rounded-xl hover:border-terracotta/30 transition-colors shadow-sm"
                />
              </div>

              {/* Total Amount - Premium display */}
              <AnimatePresence>
                {selectedExperience && guests && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: 10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="pt-4"
                  >
                    <div className="relative bg-gradient-to-r from-deep-clay via-deep-clay to-clay/90 rounded-2xl p-6 overflow-hidden">
                      {/* Decorative shimmer */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
                      <div className="absolute top-0 right-0 w-24 h-24 bg-terracotta/20 rounded-full blur-2xl" />
                      
                      <div className="relative flex justify-between items-center">
                        <div>
                          <span className="block text-parchment/60 text-xs tracking-wide uppercase mb-1">Total Amount</span>
                          <span className="text-parchment/80 text-sm">{selectedExp?.title}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-serif text-4xl md:text-5xl text-parchment">
                            ₹{totalAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit button - Luxurious styling */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.6 }}
                className="pt-4"
              >
                <Button
                  type="submit"
                  disabled={isSubmitting || !user}
                  className="w-full py-7 text-sm tracking-[0.2em] uppercase font-sans bg-gradient-to-r from-terracotta via-terracotta to-terracotta/90 hover:from-terracotta/95 hover:via-terracotta/90 hover:to-terracotta/85 text-white shadow-xl shadow-terracotta/30 hover:shadow-2xl hover:shadow-terracotta/40 transition-all duration-500 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                  {/* Button shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-3 relative">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Processing...
                    </span>
                  ) : user ? (
                    <span className="flex items-center justify-center gap-3 relative">
                      Complete Booking
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  ) : (
                    <span className="relative">Sign In to Book</span>
                  )}
                </Button>
                
                {/* Security note */}
                <p className="text-center text-clay/50 text-xs mt-4 flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border border-clay/30 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-clay/40 rounded-full" />
                  </span>
                  Secure payment powered by Razorpay
                </p>
              </motion.div>
            </div>
          </motion.form>
        </div>
      </section>
    </>
  );
};

// Statistics section

// Main component
const Experiences = () => {
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });
  const location = useLocation();
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 1.1]);

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-charcoal overflow-x-hidden">
      <Helmet>
        <title>Experiences | Basho by Shivangi - Create Moments with Clay</title>
        <meta
          name="description"
          content="Book intimate pottery experiences - couple dates, birthday sessions, farm parties, and studio gatherings. Create lasting memories with handcrafted clay."
        />
      </Helmet>

      <Navigation />

      {/* Hero Section - Matching Workshops page */}
      <section 
        ref={heroRef} 
        className="relative min-h-[100vh] pb-32 flex items-center justify-center overflow-hidden"
      >
        {/* Parallax Background Image */}
        <motion.div 
          style={{ scale: heroScale }}
          className="absolute inset-0"
        >
          <img
            src={potteryCollection}
            alt="Pottery collection"
            className="w-full h-full object-cover"
          />
          {/* Cinematic gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/60 via-charcoal/40 to-charcoal/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal/50 via-transparent to-charcoal/50" />
          {/* Vignette effect */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_hsl(var(--charcoal)/0.4)_100%)]" />
        </motion.div>
        
        {/* Bottom gradient transition to next section */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent z-[5]" />

        {/* Floating decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ y: [0, -30, 0], x: [0, 10, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-[10%] w-2 h-2 rounded-full bg-cream/30"
          />
          <motion.div
            animate={{ y: [0, 20, 0], x: [0, -15, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-1/3 right-[15%] w-3 h-3 rounded-full bg-cream/20"
          />
        </div>

        {/* Content */}
        <motion.div 
          style={{ opacity: heroOpacity }}
          className="relative z-10 container px-6 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
            className="max-w-4xl mx-auto"
          >
            {/* Decorative line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={isHeroInView ? { scaleX: 1 } : {}}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="w-16 h-px bg-cream/40 mx-auto mb-8"
            />
            
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-3 text-xs tracking-[0.4em] uppercase text-cream/70 mb-6"
            >
              <span className="w-8 h-px bg-cream/40" />
              Curated Pottery Experiences
              <span className="w-8 h-px bg-cream/40" />
            </motion.span>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 1 }}
              className="font-serif text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-cream mb-6 leading-[0.95]"
            >
              Create Moments<br />
              <span className="italic font-light text-cream/80">with Clay</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-cream/60 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Intimate gatherings where hands meet clay, 
              creating memories that endure beyond the moment.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <Button 
                size="lg" 
                className="bg-cream text-charcoal hover:bg-cream/90 px-8 h-14 text-base font-medium tracking-wide group"
                onClick={() => document.getElementById('experiences')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Experiences
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-cream/30 text-cream hover:bg-cream/10 px-8 h-14 text-base font-medium tracking-wide"
                onClick={() => document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Book Now
              </Button>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isHeroInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap justify-center gap-8 md:gap-16 mt-16 pt-8 border-t border-cream/10"
            >
              {[
                { value: "500+", label: "Happy Guests" },
                { value: "4.9", label: "Rating", icon: Star },
                { value: "4+", label: "Experience Types" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.9 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-1 text-2xl md:text-3xl font-serif text-cream">
                    {stat.value}
                    {stat.icon && <stat.icon className="w-5 h-5 fill-cream text-cream" />}
                  </div>
                  <div className="text-xs tracking-widest uppercase text-cream/50 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-[10px] tracking-[0.3em] uppercase text-cream/40">Scroll</span>
              <ArrowDown className="w-5 h-5 text-cream/40" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>


      {/* Experience Cards Grid */}
      <section 
        id="experiences" 
        className="-mt-20 pt-8 pb-20 md:pb-32 bg-gradient-to-b from-background via-card to-background relative overflow-hidden"
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
        </div>
        
        <div className="container max-w-7xl mx-auto px-6 relative">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              className="w-12 h-px bg-primary/50 mx-auto mb-6"
            />
            <span className="inline-block text-xs tracking-[0.3em] uppercase text-primary/70 mb-4">
              Curated For You
            </span>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-4">
              Choose Your <span className="italic font-light">Experience</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              From intimate couple sessions to joyful celebrations, each experience is designed to create lasting connections.
            </p>
          </motion.div>

          {/* Cards grid - 2 per row, 2 rows */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {experiences.map((experience, index) => (
              <ExperienceCard key={experience.id} experience={experience} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Large feature image section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={glazingImage}
            alt="Pottery glazing process"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-charcoal/85" />
        </div>
        
        <div className="container relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="block font-sans text-xs tracking-[0.3em] uppercase text-cream/60 mb-6">
              Our Philosophy
            </span>
            <blockquote className="font-serif text-3xl md:text-4xl lg:text-5xl leading-relaxed mb-8 italic text-cream">
              "Every imperfection tells a story of human touch. Every piece carries the warmth of the moment it was made."
            </blockquote>
            <p className="text-cream/60">— Shivangi, Founder</p>
          </motion.div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="py-20 md:py-28 bg-parchment">
        <div className="container max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="block font-sans text-xs tracking-[0.3em] uppercase text-terracotta mb-4">
              What to Expect
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-deep-clay">
              Your Experience Includes
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Palette className="w-6 h-6" />,
                title: "All Materials",
                description: "Premium clay, tools, glazes, and firing—everything you need to create."
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Expert Guidance",
                description: "Patient, personalized instruction for all skill levels."
              },
              {
                icon: <Star className="w-6 h-6" />,
                title: "Take Home",
                description: "Your finished, fired piece delivered within 2-3 weeks."
              }
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="text-center p-8 rounded-2xl bg-white/50 border border-stone-200"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-terracotta/10 text-terracotta mb-6">
                  {item.icon}
                </div>
                <h3 className="font-serif text-xl text-deep-clay mb-3">{item.title}</h3>
                <p className="text-stone-500">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <BookingSection />

      {/* FAQ Section */}
      <div className="bg-sand">
        <ExperiencesFAQ />
      </div>

      <Footer />
    </div>
  );
};

export default Experiences;
