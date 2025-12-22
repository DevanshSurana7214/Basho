import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Users, Sparkles, ChevronDown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkshopGridSkeleton } from "@/components/skeletons/WorkshopCardSkeleton";
import WorkshopCard from "@/components/workshops/WorkshopCard";
import WorkshopDetailDialog from "@/components/workshops/WorkshopDetailDialog";
import { supabase } from "@/integrations/supabase/client";

// Workshop images
import kidsClayPlay from "@/assets/workshops/kids-clay-play.jpg";
import beginnerPottery from "@/assets/workshops/beginner-pottery.jpg";
import couplePotteryDate from "@/assets/workshops/couple-pottery-date.jpg";
import masterClass from "@/assets/workshops/master-class.jpg";
import studioInterior from "@/assets/studio/studio-interior.jpg";

const workshopImages: Record<string, string> = {
  "Kids Clay Play": kidsClayPlay,
  "Beginner Pottery Workshop": beginnerPottery,
  "Couple Pottery Date": couplePotteryDate,
  "One-on-One Master Class": masterClass,
  "Group Workshop": beginnerPottery,
  "Private Session": masterClass,
};

const defaultImage = studioInterior;

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
  is_active: boolean | null;
}

const Workshops = () => {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  

  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    const { data, error } = await supabase
      .from('workshops')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) {
      console.error('Error fetching workshops:', error);
    } else {
      setWorkshops(data || []);
    }
    setLoading(false);
  };

  const getWorkshopImage = (workshop: Workshop) => {
    if (workshop.image_url) return workshop.image_url;
    return workshopImages[workshop.title] || defaultImage;
  };

  const groupWorkshops = workshops.filter(w => w.workshop_type === 'group' || w.workshop_type === 'kids');
  const privateWorkshops = workshops.filter(w => w.workshop_type === 'private' || w.workshop_type === 'masterclass' || w.workshop_type === 'individual');
  const coupleWorkshops = workshops.filter(w => w.workshop_type === 'couple');

  const filteredWorkshops = activeTab === 'all' 
    ? workshops 
    : activeTab === 'group' 
      ? groupWorkshops 
      : activeTab === 'private'
        ? privateWorkshops
        : coupleWorkshops;

  // Workshop booking is now handled directly in the dialog with payment

  return (
    <>
      <Helmet>
        <title>Pottery Workshops | Learn & Create - Basho</title>
        <meta 
          name="description" 
          content="Join our pottery workshops in Surat, Gujarat. Group sessions, one-on-one classes, couple dates, and private events. Experience the meditative art of clay." 
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section 
            ref={heroRef}
            className="relative min-h-[70vh] flex items-center justify-center overflow-hidden"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img 
                src={studioInterior} 
                alt="Pottery studio" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-charcoal/70 via-charcoal/50 to-background" />
            </div>

            {/* Content */}
            <div className="relative z-10 container px-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                className="max-w-3xl mx-auto"
              >
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={isHeroInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.2 }}
                  className="inline-block text-xs tracking-[0.3em] uppercase text-cream/80 mb-4"
                >
                  Workshops & Experiences
                </motion.span>
                
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="font-serif text-4xl md:text-5xl lg:text-6xl text-cream mb-6"
                >
                  Pottery Workshops<br />
                  <span className="text-cream/70">for Everyone</span>
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="text-cream/70 text-lg md:text-xl max-w-xl mx-auto mb-8"
                >
                  Discover the meditative art of pottery. From group sessions to 
                  personalized one-on-one guidance, find your creative rhythm.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="flex flex-wrap justify-center gap-4"
                >
                  <Button 
                    size="lg" 
                    className="bg-cream text-charcoal hover:bg-cream/90"
                    onClick={() => document.getElementById('workshops')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Browse Workshops
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-cream/30 text-cream hover:bg-cream/10"
                    asChild
                  >
                    <Link to="/contact">Private Event Inquiry</Link>
                  </Button>
                </motion.div>
              </motion.div>

              {/* Scroll Indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
              >
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <ChevronDown className="w-6 h-6 text-cream/50" />
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* Category Highlights */}
          <section className="py-20 bg-card">
            <div className="container px-6">
              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* Group Workshops */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="relative bg-background rounded-lg p-8 border border-border/50 group hover:border-primary/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-serif text-2xl text-foreground mb-2">Group Workshops</h3>
                  <p className="text-muted-foreground mb-4">
                    Learn alongside fellow enthusiasts in our guided group sessions. 
                    Perfect for beginners and those who love shared creative experiences.
                  </p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-primary gap-2"
                    onClick={() => {
                      setActiveTab('group');
                      document.getElementById('workshops')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    View Group Workshops <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>

                {/* One-on-One */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="relative bg-background rounded-lg p-8 border border-border/50 group hover:border-primary/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-serif text-2xl text-foreground mb-2">One-on-One Sessions</h3>
                  <p className="text-muted-foreground mb-4">
                    Personalized instruction tailored to your pace and interests. 
                    Deep dive into techniques with dedicated attention from our artists.
                  </p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-primary gap-2"
                    onClick={() => {
                      setActiveTab('private');
                      document.getElementById('workshops')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    View Private Sessions <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Workshops Grid */}
          <section id="workshops" className="py-20 bg-background scroll-mt-20">
            <div className="container px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <span className="text-xs tracking-[0.2em] uppercase text-primary mb-2 block">
                  Choose Your Experience
                </span>
                <h2 className="font-serif text-3xl md:text-4xl text-foreground">
                  Available Workshops
                </h2>
              </motion.div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-4 mb-10">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="group">Group</TabsTrigger>
                  <TabsTrigger value="private">Private</TabsTrigger>
                  <TabsTrigger value="couple">Couples</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-0">
                  {loading ? (
                    <WorkshopGridSkeleton count={4} />
                  ) : filteredWorkshops.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-16"
                    >
                      <p className="text-muted-foreground mb-4">
                        No workshops available in this category right now.
                      </p>
                      <Button variant="outline" onClick={() => setActiveTab('all')}>
                        View All Workshops
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredWorkshops.map((workshop, index) => (
                        <WorkshopCard
                          key={workshop.id}
                          workshop={workshop}
                          image={getWorkshopImage(workshop)}
                          index={index}
                          onSelect={(w) => setSelectedWorkshop(w)}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </section>

          {/* Registration CTA */}
          <section className="py-20 bg-charcoal text-cream">
            <div className="container px-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-3xl mx-auto text-center"
              >
                <span className="text-xs tracking-[0.2em] uppercase text-cream/60 mb-4 block">
                  Registration Process
                </span>
                <h2 className="font-serif text-3xl md:text-4xl text-cream mb-6">
                  How to Book Your Session
                </h2>
                
                <div className="grid md:grid-cols-3 gap-8 mt-12">
                  {[
                    { step: "01", title: "Select Workshop", desc: "Browse our offerings and find the perfect session for you" },
                    { step: "02", title: "Choose Your Slot", desc: "Pick a date and time that works with your schedule" },
                    { step: "03", title: "Confirm & Pay", desc: "Complete your registration and receive confirmation" },
                  ].map((item, i) => (
                    <motion.div
                      key={item.step}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="text-left"
                    >
                      <span className="text-4xl font-serif text-cream/20">{item.step}</span>
                      <h3 className="font-serif text-xl text-cream mt-2 mb-2">{item.title}</h3>
                      <p className="text-cream/60 text-sm">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>

          {/* Corporate Section */}
          <section className="py-20 bg-card">
            <div className="container px-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto"
              >
                <div className="space-y-6">
                  <span className="text-xs tracking-[0.2em] uppercase text-primary">
                    For Teams & Events
                  </span>
                  <h2 className="font-serif text-3xl md:text-4xl text-foreground">
                    Corporate & Private Events
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Looking for a unique team-building experience or planning a special celebration? 
                    We offer customized workshop experiences for groups of all sizes.
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Custom group sizes and durations",
                      "On-site and off-site options",
                      "Branded merchandise creation",
                      "Professional facilitation"
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button asChild>
                    <Link to="/corporate">Inquire About Corporate Events</Link>
                  </Button>
                </div>
                
                <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={beginnerPottery} 
                    alt="Corporate pottery workshop" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </section>

          {/* FAQ */}
          <section className="py-20 bg-background">
            <div className="container px-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-2xl mx-auto"
              >
                <div className="text-center mb-12">
                  <h2 className="font-serif text-3xl text-foreground">
                    Frequently Asked Questions
                  </h2>
                </div>
                
                <div className="space-y-6">
                  {[
                    { 
                      q: "Do I need prior experience?", 
                      a: "Not at all! Our workshops are designed for complete beginners. We'll guide you through every step of the process." 
                    },
                    { 
                      q: "What should I wear?", 
                      a: "Comfortable clothes that can get a bit dirty. We provide aprons, but clay can be messy and that's part of the fun!" 
                    },
                    { 
                      q: "When can I collect my pieces?", 
                      a: "Pieces need about 2-3 weeks for drying, glazing and firing. We'll notify you when they're ready for pickup." 
                    },
                    { 
                      q: "Can I cancel or reschedule?", 
                      a: "Yes, you can reschedule up to 48 hours before your session. Cancellations made within 48 hours are non-refundable." 
                    },
                  ].map((faq, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="border-b border-border pb-6"
                    >
                      <h3 className="font-serif text-lg text-foreground mb-2">{faq.q}</h3>
                      <p className="text-muted-foreground">{faq.a}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>
        </main>

        <Footer />
      </div>

      {/* Workshop Detail Dialog */}
      <WorkshopDetailDialog
        workshop={selectedWorkshop}
        open={!!selectedWorkshop}
        onOpenChange={(open) => !open && setSelectedWorkshop(null)}
        workshopImage={selectedWorkshop ? getWorkshopImage(selectedWorkshop) : undefined}
      />
    </>
  );
};

export default Workshops;
