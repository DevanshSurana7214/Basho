import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Upload, X, Clock, Palette, Ruler, Sparkles } from "lucide-react";

// Gallery images
import wabiSabiBowl from "@/assets/products/wabi-sabi-bowl.jpg";
import kintsugiPlatter from "@/assets/products/kintsugi-platter.jpg";
import ikebanaVase from "@/assets/products/ikebana-vase.jpg";
import tokonameTeapot from "@/assets/products/tokoname-teapot.jpg";
import matchaBowl from "@/assets/products/matcha-bowl.jpg";
import sakeSet from "@/assets/products/sake-set.jpg";

const pastWorkGallery = [
  { image: wabiSabiBowl, title: "Custom Serving Bowl", description: "Wedding gift commission" },
  { image: kintsugiPlatter, title: "Kintsugi Restoration", description: "Family heirloom repair" },
  { image: ikebanaVase, title: "Custom Ikebana Vase", description: "Interior designer project" },
  { image: tokonameTeapot, title: "Personalized Teapot", description: "Tea ceremony enthusiast" },
  { image: matchaBowl, title: "Custom Matcha Set", description: "Restaurant commission" },
  { image: sakeSet, title: "Anniversary Sake Set", description: "10th anniversary gift" },
];

const customizationOptions = [
  { icon: Ruler, title: "Size & Dimensions", description: "From petite tea cups to large serving platters" },
  { icon: Palette, title: "Glazes & Colors", description: "Choose from our signature earthy palette or request custom colors" },
  { icon: Sparkles, title: "Surface Textures", description: "Smooth, carved, stamped, or organic wabi-sabi finishes" },
  { icon: Clock, title: "Form & Function", description: "Adapt any piece to your specific usage needs" },
];

const CustomOrders = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    size: "medium",
    usage: "",
    notes: "",
  });
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + referenceImages.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }
    setReferenceImages(prev => [...prev, ...files].slice(0, 5));
  };

  const removeImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.usage) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate submission - in production, this would send to your backend
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success("Custom order request submitted! We'll contact you within 48 hours.");
    setFormData({ name: "", email: "", phone: "", size: "medium", usage: "", notes: "" });
    setReferenceImages([]);
    setIsSubmitting(false);
  };

  return (
    <>
      <Helmet>
        <title>Custom Orders | Bespoke Pottery - Basho</title>
        <meta 
          name="description" 
          content="Request custom handcrafted pottery. Personalized sizes, glazes, and designs. 2-4 week turnaround for bespoke ceramic pieces." 
        />
      </Helmet>

      <div className="min-h-screen">
        <Navigation />
        <main className="pt-24">
          {/* Hero Section */}
          <section className="py-20 bg-gradient-to-b from-sand to-background relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary blur-3xl" />
              <div className="absolute bottom-10 right-20 w-80 h-80 rounded-full bg-amber blur-3xl" />
            </div>
            
            <div className="container px-6 relative">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-3xl mx-auto text-center"
              >
                <span className="font-sans text-xs tracking-[0.3em] uppercase text-primary">
                  Bespoke Ceramics
                </span>
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mt-4">
                  Custom Orders
                </h1>
                <p className="font-sans text-lg text-muted-foreground mt-6 max-w-2xl mx-auto">
                  Every piece tells a story. Let us craft something uniquely yours — 
                  a vessel that holds not just tea, but meaning.
                </p>
              </motion.div>
            </div>
          </section>

          {/* Process Section */}
          <section className="py-20 bg-background">
            <div className="container px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <span className="font-sans text-xs tracking-[0.3em] uppercase text-primary">
                  Our Process
                </span>
                <h2 className="font-serif text-3xl md:text-4xl text-foreground mt-4">
                  How It Works
                </h2>
              </motion.div>

              <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
                {[
                  { step: "01", title: "Share Your Vision", description: "Tell us about your dream piece and how you'll use it" },
                  { step: "02", title: "Design Discussion", description: "We'll discuss options and provide a quote within 48 hours" },
                  { step: "03", title: "Crafting", description: "Your piece is wheel-thrown, dried, glazed, and kiln-fired" },
                  { step: "04", title: "Delivery", description: "Carefully packaged and delivered to your doorstep" },
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <span className="font-serif text-2xl text-primary">{item.step}</span>
                    </div>
                    <h3 className="font-serif text-lg text-foreground mb-2">{item.title}</h3>
                    <p className="font-sans text-sm text-muted-foreground">{item.description}</p>
                  </motion.div>
                ))}
              </div>

              {/* Timeline Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="mt-12 flex justify-center"
              >
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-card rounded-full border border-border">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="font-sans text-sm text-foreground">
                    Typical turnaround: <strong className="text-primary">2–4 weeks</strong>
                  </span>
                </div>
              </motion.div>
            </div>
          </section>

          {/* What Can Be Customized */}
          <section className="py-20 bg-card">
            <div className="container px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <span className="font-sans text-xs tracking-[0.3em] uppercase text-primary">
                  Possibilities
                </span>
                <h2 className="font-serif text-3xl md:text-4xl text-foreground mt-4">
                  What Can Be Customized
                </h2>
              </motion.div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {customizationOptions.map((option, index) => (
                  <motion.div
                    key={option.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-background p-6 rounded-xl border border-border hover:border-primary/30 transition-colors"
                  >
                    <option.icon className="h-8 w-8 text-primary mb-4" />
                    <h3 className="font-serif text-lg text-foreground mb-2">{option.title}</h3>
                    <p className="font-sans text-sm text-muted-foreground">{option.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Past Work Gallery */}
          <section className="py-20 bg-background">
            <div className="container px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <span className="font-sans text-xs tracking-[0.3em] uppercase text-primary">
                  Portfolio
                </span>
                <h2 className="font-serif text-3xl md:text-4xl text-foreground mt-4">
                  Past Custom Work
                </h2>
                <p className="font-sans text-muted-foreground mt-4 max-w-xl mx-auto">
                  A glimpse into the bespoke pieces we've crafted for our clients
                </p>
              </motion.div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {pastWorkGallery.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="group relative overflow-hidden rounded-xl"
                  >
                    <div className="aspect-square">
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                      <h3 className="font-serif text-lg text-white">{item.title}</h3>
                      <p className="font-sans text-sm text-white/70">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Request Form */}
          <section className="py-20 bg-card">
            <div className="container px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <span className="font-sans text-xs tracking-[0.3em] uppercase text-primary">
                  Get Started
                </span>
                <h2 className="font-serif text-3xl md:text-4xl text-foreground mt-4">
                  Request a Custom Piece
                </h2>
                <p className="font-sans text-muted-foreground mt-4 max-w-xl mx-auto">
                  Share your vision and we'll bring it to life
                </p>
              </motion.div>

              <motion.form
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                onSubmit={handleSubmit}
                className="max-w-2xl mx-auto space-y-8"
              >
                {/* Contact Info */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210"
                  />
                </div>

                {/* Size Selection */}
                <div className="space-y-3">
                  <Label>Preferred Size</Label>
                  <RadioGroup
                    value={formData.size}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, size: value }))}
                    className="flex flex-wrap gap-4"
                  >
                    {[
                      { value: "small", label: "Small", desc: "Tea cups, small bowls" },
                      { value: "medium", label: "Medium", desc: "Dinner plates, vases" },
                      { value: "large", label: "Large", desc: "Platters, large pots" },
                      { value: "custom", label: "Custom", desc: "Specific dimensions" },
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="cursor-pointer">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground ml-1">({option.desc})</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Usage */}
                <div className="space-y-2">
                  <Label htmlFor="usage">Intended Usage *</Label>
                  <Textarea
                    id="usage"
                    name="usage"
                    value={formData.usage}
                    onChange={handleInputChange}
                    placeholder="How will you use this piece? (e.g., daily tea ceremony, serving ware for dinner parties, decorative display...)"
                    rows={3}
                    required
                  />
                </div>

                {/* Reference Images */}
                <div className="space-y-3">
                  <Label>Reference Images (optional)</Label>
                  <p className="text-sm text-muted-foreground">
                    Upload up to 5 images for inspiration
                  </p>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="font-sans text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="font-sans text-xs text-muted-foreground mt-1">
                      PNG, JPG up to 5MB each
                    </p>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {referenceImages.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-4">
                      {referenceImages.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Reference ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border border-border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any specific colors, textures, inscriptions, or details you'd like..."
                    rows={4}
                  />
                </div>

                <Button 
                  type="submit" 
                  variant="terracotta" 
                  size="lg" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  We'll respond within 48 hours with a quote and timeline
                </p>
              </motion.form>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default CustomOrders;
