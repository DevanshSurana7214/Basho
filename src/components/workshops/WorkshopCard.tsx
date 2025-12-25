import { motion } from "framer-motion";
import { Clock, MapPin, ArrowRight, Users, Sparkles, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Workshop {
  id: string;
  title: string;
  tagline?: string | null;
  description: string | null;
  price: number;
  duration: string | null;
  duration_days?: number | null;
  location?: string | null;
  workshop_type: string | null;
  max_participants: number | null;
  current_participants: number | null;
  workshop_date: string | null;
  image_url: string | null;
  is_active: boolean | null;
}

interface WorkshopCardProps {
  workshop: Workshop;
  image: string;
  index: number;
  onSelect: (workshop: Workshop) => void;
}

const getWorkshopTypeInfo = (type: string | null) => {
  switch (type) {
    case 'kids': return { label: 'Kids', icon: Sparkles, gradient: 'from-amber-500/20 to-orange-500/10' };
    case 'couple': return { label: 'Couples', icon: Heart, gradient: 'from-rose-500/20 to-pink-500/10' };
    case 'private': return { label: 'Private', icon: Star, gradient: 'from-violet-500/20 to-purple-500/10' };
    case 'masterclass': return { label: 'Master Class', icon: Star, gradient: 'from-emerald-500/20 to-teal-500/10' };
    default: return { label: 'Group', icon: Users, gradient: 'from-primary/20 to-primary/5' };
  }
};

const WorkshopCard = ({ workshop, image, index, onSelect }: WorkshopCardProps) => {
  const typeInfo = getWorkshopTypeInfo(workshop.workshop_type);
  const TypeIcon = typeInfo.icon;
  const spotsLeft = workshop.max_participants && workshop.current_participants 
    ? workshop.max_participants - workshop.current_participants 
    : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="group cursor-pointer h-full"
      onClick={() => onSelect(workshop)}
    >
      <div className="relative h-full bg-card rounded-[1.5rem] overflow-hidden border border-border/20 hover:border-primary/30 transition-all duration-700 hover:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)]">
        {/* Image Container with cinematic aspect */}
        <div className="aspect-[4/3] overflow-hidden relative">
          <motion.div
            className="absolute inset-0"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src={image}
              alt={workshop.title}
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
                  ₹{workshop.price.toLocaleString()}
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
              {workshop.title}
            </motion.h3>
            {workshop.tagline && (
              <p className="text-sm text-cream/70 italic">
                "{workshop.tagline}"
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
                View Details
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-5">
          {/* Description */}
          <p className="text-muted-foreground line-clamp-2 leading-relaxed">
            {workshop.description}
          </p>

          {/* Meta Info Pills */}
          <div className="flex flex-wrap gap-2">
            {workshop.duration && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/40 rounded-full text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-primary/70" />
                <span>{workshop.duration}</span>
              </div>
            )}
            {workshop.duration_days && workshop.duration_days > 1 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm text-primary font-medium">
                <span>{workshop.duration_days} Days</span>
              </div>
            )}
            {workshop.location && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/40 rounded-full text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary/70" />
                <span className="truncate max-w-[100px]">{workshop.location}</span>
              </div>
            )}
          </div>

          {/* Footer with Date & CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-border/30">
            <div>
              {workshop.workshop_date ? (
                <div className="text-sm">
                  <span className="text-muted-foreground">Starts </span>
                  <span className="text-foreground font-medium">
                    {new Date(workshop.workshop_date).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'short'
                    })}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Flexible scheduling</span>
              )}
              
              {spotsLeft !== null && spotsLeft <= 5 && spotsLeft > 0 && (
                <div className="text-xs font-medium text-amber-600 dark:text-amber-500 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Only {spotsLeft} spots left
                </div>
              )}
            </div>
            
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
    </motion.article>
  );
};

export default WorkshopCard;
