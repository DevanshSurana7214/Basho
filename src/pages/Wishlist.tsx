import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingBag, Trash2, ArrowRight, Package, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { productImages } from "@/lib/productImages";

export default function Wishlist() {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = async (item: typeof items[0]) => {
    await addToCart({
      productId: item.id,
      itemType: 'product',
      product: {
        id: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
      },
    });
    removeFromWishlist(item.id);
  };

  const handleMoveAllToCart = async () => {
    for (const item of items) {
      await addToCart({
        productId: item.id,
        itemType: 'product',
        product: {
          id: item.id,
          name: item.name,
          price: item.price,
          image_url: item.image_url,
        },
      });
    }
    clearWishlist();
    toast.success('All items moved to cart');
  };

  return (
    <div className="min-h-screen bg-sand">
      <Helmet>
        <title>Wishlist | Basho by Shivangi</title>
        <meta name="description" content="Your saved items - handcrafted pottery pieces you love." />
      </Helmet>

      <Navigation />

      <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pt-24 pb-24">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <Heart className="w-7 h-7 text-primary" />
            </motion.div>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-4 tracking-tight">
              Your Wishlist
            </h1>
            <motion.div 
              className="flex items-center justify-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <span className="text-muted-foreground text-sm tracking-widest uppercase">Saved for later</span>
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            </motion.div>
          </motion.div>

          {items.length === 0 ? (
            <motion.div 
              className="text-center py-20 max-w-lg mx-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" />
                <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
                  <Heart className="h-12 w-12 text-muted-foreground/60" />
                </div>
              </div>
              <h2 className="font-serif text-3xl text-foreground mb-3">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-10 text-lg leading-relaxed">
                Browse our collection and tap the heart icon to save pieces you love
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link to="/products">
                  <Button variant="earth" size="lg" className="gap-2 px-8 h-12">
                    <Package className="w-4 h-4" />
                    Browse Products
                  </Button>
                </Link>
                <Link to="/workshops">
                  <Button variant="outline" size="lg" className="gap-2 px-8 h-12 border-2">
                    <Sparkles className="w-4 h-4" />
                    View Workshops
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="grid lg:grid-cols-5 gap-10 lg:gap-14">
              {/* Wishlist Items */}
              <div className="lg:col-span-3 space-y-5">
                <motion.div 
                  className="flex items-center justify-between mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-muted-foreground">
                    <span className="text-foreground font-medium">{items.length}</span> {items.length === 1 ? 'item' : 'items'} saved
                  </p>
                  <Link to="/products" className="text-sm text-primary hover:underline underline-offset-4 transition-all">
                    Continue Shopping
                  </Link>
                </motion.div>

                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className="group relative bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    layout
                  >
                    {/* Subtle gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    
                    <div className="relative flex gap-5 p-5 md:p-6">
                      {/* Image */}
                      <Link to={`/products/${item.id}`} className="block">
                        <div className="w-28 h-28 md:w-36 md:h-36 bg-muted rounded-xl flex-shrink-0 overflow-hidden ring-1 ring-border/50">
                          {productImages[item.name] || item.image_url ? (
                            <img 
                              src={productImages[item.name] || item.image_url} 
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-muted to-muted/50">
                              <Package className="w-10 h-10" />
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Details */}
                      <div className="flex-grow min-w-0 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="inline-flex items-center gap-1.5 text-xs text-primary/80 font-medium uppercase tracking-wider mb-1.5">
                                <Package className="w-3 h-3" />
                                {item.category}
                              </span>
                              <Link to={`/products/${item.id}`}>
                                <h3 className="font-serif text-xl md:text-2xl text-foreground leading-tight line-clamp-2 hover:text-primary transition-colors">
                                  {item.name}
                                </h3>
                              </Link>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 -mt-1 -mr-2 rounded-full transition-colors"
                              onClick={() => removeFromWishlist(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-end justify-between mt-4">
                          <p className="text-2xl font-serif text-foreground">
                            ₹{Number(item.price).toLocaleString()}
                          </p>

                          <Button 
                            variant="earth" 
                            size="sm"
                            className="gap-2"
                            onClick={() => handleAddToCart(item)}
                          >
                            <ShoppingBag className="h-4 w-4" />
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Wishlist Summary */}
              <motion.div 
                className="lg:col-span-2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <div className="bg-card border border-border/50 rounded-2xl overflow-hidden sticky top-24 shadow-xl shadow-black/5">
                  {/* Summary Header */}
                  <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 md:px-8 py-5 border-b border-border/50">
                    <h2 className="font-serif text-2xl text-foreground">Wishlist Summary</h2>
                  </div>
                  
                  <div className="p-6 md:p-8">
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Items saved</span>
                        <span className="font-medium text-foreground">{items.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total value</span>
                        <span className="font-medium text-foreground">
                          ₹{items.reduce((sum, item) => sum + Number(item.price), 0).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-6" />
                    </div>

                    <Button 
                      variant="earth" 
                      className="w-full h-14 text-base font-medium gap-2 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300" 
                      onClick={handleMoveAllToCart}
                    >
                      <ShoppingBag className="w-5 h-5" />
                      Move All to Cart
                    </Button>

                    <Button 
                      variant="outline" 
                      className="w-full mt-3 h-12 gap-2 rounded-xl border-2" 
                      onClick={clearWishlist}
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear Wishlist
                    </Button>

                    {/* Trust badges */}
                    <div className="mt-8 pt-6 border-t border-border/50">
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center">
                            <Heart className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <span className="text-[10px] text-muted-foreground leading-tight">Save for<br/>Later</span>
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <span className="text-[10px] text-muted-foreground leading-tight">Handcrafted<br/>Quality</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
