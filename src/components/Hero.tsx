import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Leaf, Users, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-agriculture.jpg";

const Hero = () => {
  const { toast } = useToast();

  const handleStartPredicting = () => {
    toast({
      title: "Starting AI Analysis",
      description: "Initializing crop yield prediction system..."
    });
    // Scroll to predictions section
    setTimeout(() => {
      window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    }, 500);
  };

  const handleViewDemo = () => {
    toast({
      title: "Demo Mode",
      description: "Opening interactive demo of the AI prediction system"
    });
  };
  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Modern agricultural landscape with smart farming technology"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-sm text-accent-foreground px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            AI-Powered Crop Intelligence
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Maximize Your
            <span className="block bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Crop Yields
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Advanced AI predicts your crop yields and provides actionable recommendations 
            for irrigation, fertilization, and pest control. Increase productivity by 10%+ 
            with data-driven farming decisions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300 text-lg px-8 py-6"
              onClick={handleStartPredicting}
            >
              Start Predicting
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={handleViewDemo}
            >
              <Play className="w-5 h-5 mr-2" />
              View Demo
            </Button>
          </div>

          <div className="flex flex-wrap gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-primary" />
              Smart Recommendations
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Real-time Analytics
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Multilingual Support
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;