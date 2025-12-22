import { motion } from "framer-motion";
import { Clock, MapPin, ArrowRight } from "lucide-react";
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

const WorkshopCard = ({ workshop, image, index, onSelect }: WorkshopCardProps) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
      className="group cursor-pointer"
      onClick={() => onSelect(workshop)}
    >
      <div className="relative bg-card border border-border/50 rounded-lg overflow-hidden hover:border-primary/30 hover:shadow-warm transition-all duration-500">
        {/* Image */}
        <div className="aspect-[4/3] overflow-hidden relative">
          <motion.img
            src={image}
            alt={workshop.title}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Price Badge */}
          <div className="absolute top-4 right-4 px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-full border border-border/50">
            <span className="text-sm font-medium text-foreground">
              ₹{workshop.price.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground ml-1">per person</span>
          </div>

          {/* Hover CTA */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <Button variant="secondary" className="gap-2">
              View Details
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-serif text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
            {workshop.title}
          </h3>
          
          {workshop.tagline && (
            <p className="text-sm italic text-muted-foreground mb-3">
              "{workshop.tagline}"
            </p>
          )}
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {workshop.description}
          </p>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {workshop.duration && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{workshop.duration}</span>
              </div>
            )}
            {workshop.duration_days && workshop.duration_days > 1 && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded-full text-primary">
                <span>{workshop.duration_days} days</span>
              </div>
            )}
            {workshop.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate max-w-[100px]">{workshop.location}</span>
              </div>
            )}
          </div>
          
          {/* First Date Display */}
          {workshop.workshop_date && (
            <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
              <span className="text-foreground font-medium">Starts: </span>
              {new Date(workshop.workshop_date).toLocaleDateString('en-IN', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
};

export default WorkshopCard;
