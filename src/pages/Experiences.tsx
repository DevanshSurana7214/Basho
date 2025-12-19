import { useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Calendar, Clock, Users, Heart, Cake, TreePine, Palette } from "lucide-react";
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
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

import coupleImage from "@/assets/workshops/couple-pottery-date.jpg";
import kidsImage from "@/assets/workshops/kids-clay-play.jpg";
import studioImage from "@/assets/studio/studio-interior.jpg";
import handsImage from "@/assets/hero/pottery-hands-clay.jpg";

interface Experience {
  id: string;
  title: string;
  tagline: string;
  description: string;
  includes: string[];
  duration: string;
  price: string;
  image: string;
  icon: React.ReactNode;
}

const experiences: Experience[] = [
  {
    id: "couple",
    title: "Couple Pottery Dates",
    tagline: "Shape something together",
    description: "An intimate evening where hands meet clay. Create keepsakes that hold the warmth of shared moments, guided gently through each step.",
    includes: ["Private session for two", "Guided assistance", "Keepsake piece to take home", "Refreshments"],
    duration: "90 minutes",
    price: "₹3,500 per couple",
    image: coupleImage,
    icon: <Heart className="w-5 h-5" />
  },
  {
    id: "birthday",
    title: "Birthday Sessions",
    tagline: "Celebrate with your hands",
    description: "A gathering that turns into lasting memories. Small groups, customizable themes, and pieces that carry the joy of the day.",
    includes: ["Small group celebration (up to 8)", "Customizable themes", "Take-home pieces", "Optional decoration & setup"],
    duration: "2 hours",
    price: "₹12,000 onwards",
    image: kidsImage,
    icon: <Cake className="w-5 h-5" />
  },
  {
    id: "farm",
    title: "Farm & Garden Mini Parties",
    tagline: "Clay under open skies",
    description: "Friends, family, or colleagues gathering in nature. Creative bonding where conversations flow as freely as the clay.",
    includes: ["Outdoor setting", "Small private groups (6-12)", "All materials provided", "Refreshments & ambiance"],
    duration: "2-3 hours",
    price: "₹15,000 onwards",
    image: studioImage,
    icon: <TreePine className="w-5 h-5" />
  },
  {
    id: "studio",
    title: "Studio-Based Experiences",
    tagline: "The heart of creation",
    description: "Step into our studio space—where the wheel turns, kilns breathe, and every surface holds a story. Perfect for intimate gatherings seeking authenticity.",
    includes: ["Full studio access", "Personalized guidance", "Materials & firing", "Peaceful, creative atmosphere"],
    duration: "Flexible",
    price: "₹2,500 per person",
    image: handsImage,
    icon: <Palette className="w-5 h-5" />
  }
];

const timeSlots = [
  "10:00 AM",
  "11:30 AM",
  "2:00 PM",
  "4:00 PM",
  "6:00 PM"
];

const ExperienceCard = ({ experience, index }: { experience: Experience; index: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.15, ease: [0.25, 0.1, 0.25, 1] }}
      className={`grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
        index % 2 === 1 ? "lg:grid-flow-dense" : ""
      }`}
    >
      {/* Image */}
      <div className={`relative overflow-hidden rounded-sm ${index % 2 === 1 ? "lg:col-start-2" : ""}`}>
        <motion.div
          initial={{ scale: 1.1 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="aspect-[4/3]"
        >
          <img
            src={experience.image}
            alt={experience.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-deep-clay/30 to-transparent" />
        </motion.div>
      </div>

      {/* Content */}
      <div className={`space-y-6 ${index % 2 === 1 ? "lg:col-start-1" : ""}`}>
        <div className="flex items-center gap-3 text-terracotta">
          {experience.icon}
          <span className="text-sm font-sans tracking-widest uppercase">
            {experience.tagline}
          </span>
        </div>

        <h3 className="font-serif text-3xl md:text-4xl text-deep-clay">
          {experience.title}
        </h3>

        <p className="text-muted-foreground leading-relaxed text-lg">
          {experience.description}
        </p>

        <div className="space-y-3">
          <p className="font-sans text-sm tracking-wide text-stone uppercase">What's included</p>
          <ul className="space-y-2">
            {experience.includes.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-foreground/80">
                <span className="w-1 h-1 rounded-full bg-terracotta mt-2.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-6 pt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {experience.duration}
          </div>
          <div className="flex items-center gap-2 font-medium text-foreground">
            {experience.price}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const BookingSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [selectedExperience, setSelectedExperience] = useState("");
  const [date, setDate] = useState<Date>();
  const [timeSlot, setTimeSlot] = useState("");
  const [guests, setGuests] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedExperience || !date || !timeSlot || !guests) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("We've received your booking request. We'll be in touch soon.");
    
    // Reset form
    setSelectedExperience("");
    setDate(undefined);
    setTimeSlot("");
    setGuests("");
    setNotes("");
    setIsSubmitting(false);
  };

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }}
      className="bg-card/50 py-24 md:py-32"
    >
      <div className="container max-w-2xl mx-auto px-6">
        <div className="text-center mb-12">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="font-sans text-sm tracking-widest uppercase text-terracotta"
          >
            Begin your experience
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="font-serif text-3xl md:text-4xl text-deep-clay mt-4"
          >
            Book a Session
          </motion.h2>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Experience Type */}
          <div className="space-y-2">
            <label className="font-sans text-sm text-muted-foreground">Experience Type</label>
            <Select value={selectedExperience} onValueChange={setSelectedExperience}>
              <SelectTrigger className="bg-background border-border/60">
                <SelectValue placeholder="Choose an experience" />
              </SelectTrigger>
              <SelectContent>
                {experiences.map((exp) => (
                  <SelectItem key={exp.id} value={exp.id}>
                    {exp.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <label className="font-sans text-sm text-muted-foreground">Preferred Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-background border-border/60",
                    !date && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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
          <div className="space-y-2">
            <label className="font-sans text-sm text-muted-foreground">Time Slot</label>
            <Select value={timeSlot} onValueChange={setTimeSlot}>
              <SelectTrigger className="bg-background border-border/60">
                <SelectValue placeholder="Select a time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Number of Guests */}
          <div className="space-y-2">
            <label className="font-sans text-sm text-muted-foreground">Number of People</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                min="1"
                max="20"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                placeholder="How many guests?"
                className="pl-10 bg-background border-border/60"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="font-sans text-sm text-muted-foreground">
              Notes <span className="text-muted-foreground/60">(occasion, preferences)</span>
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tell us about your occasion..."
              rows={4}
              className="bg-background border-border/60 resize-none"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-6 text-sm tracking-widest uppercase font-sans"
          >
            {isSubmitting ? "Sending..." : "Book Experience"}
          </Button>
        </motion.form>
      </div>
    </motion.section>
  );
};

const Experiences = () => {
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });

  return (
    <>
      <Helmet>
        <title>Experiences | Basho by Shivangi - Create Moments with Clay</title>
        <meta
          name="description"
          content="Book intimate pottery experiences - couple dates, birthday sessions, farm parties, and studio gatherings. Create lasting memories with handcrafted clay."
        />
      </Helmet>

      <Navigation />

      {/* Hero Section */}
      <section ref={heroRef} className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={handsImage}
            alt="Hands shaping clay together"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-deep-clay/60 via-deep-clay/40 to-background" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-6">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.3 }}
            className="font-serif text-4xl md:text-6xl lg:text-7xl text-parchment leading-tight"
          >
            Create moments with clay.
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={isHeroInView ? { opacity: 1 } : {}}
            transition={{ duration: 1, delay: 0.8 }}
            className="w-16 h-px bg-parchment/40 mx-auto mt-8"
          />
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isHeroInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-12 bg-gradient-to-b from-parchment/60 to-transparent"
          />
        </motion.div>
      </section>

      {/* Experience Types */}
      <section className="py-24 md:py-32 lg:py-40">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="space-y-24 md:space-y-32">
            {experiences.map((experience, index) => (
              <ExperienceCard key={experience.id} experience={experience} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <BookingSection />

      <Footer />
    </>
  );
};

export default Experiences;
