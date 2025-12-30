import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { CheckCircle, LogIn, Loader2, FileText, Download } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  subtotal: number;
  shipping_cost: number;
  payment_status: string;
  created_at: string;
  buyer_gstin: string | null;
  buyer_state: string | null;
  cgst_amount: number | null;
  sgst_amount: number | null;
  igst_amount: number | null;
  taxable_amount: number | null;
  invoice_url: string | null;
  invoice_number: string | null;
}

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('No order ID provided');
        setLoading(false);
        return;
      }

      // Wait for auth to complete
      if (authLoading) return;

      if (!user) {
        setLoading(false);
        return;
      }
      
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching order:', fetchError);
        setError('Unable to load order details');
      } else if (data) {
        setOrder(data);
      } else {
        setError('Order not found');
      }
      setLoading(false);
    };

    fetchOrder();
  }, [orderId, user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // User not signed in
  if (!user) {
    return (
      <>
        <Helmet>
          <title>Order Confirmed | Basho by Shivangi</title>
        </Helmet>
        <Navigation />
        <main className="min-h-screen bg-background pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <CheckCircle className="h-20 w-20 mx-auto text-green-500 mb-6" />
            </motion.div>

            <motion.h1 
              className="font-display text-4xl md:text-5xl text-foreground mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Payment Successful!
            </motion.h1>

            <motion.p 
              className="text-muted-foreground text-lg mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Your order has been confirmed. A confirmation email has been sent to your email address.
            </motion.p>

            <motion.div 
              className="bg-card border border-border rounded-lg p-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <LogIn className="h-10 w-10 mx-auto text-primary mb-4" />
              <h2 className="font-display text-xl mb-2">Sign in to view order details</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Sign in to your account to view your complete order details, track your order, and access your order history.
              </p>
              <Link to={`/auth?redirect=/order-confirmation/${orderId}`}>
                <Button variant="earth">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            </motion.div>

            <motion.div
              className="flex gap-4 justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Link to="/products">
                <Button variant="outline">Continue Shopping</Button>
              </Link>
              <Link to="/">
                <Button variant="ghost">Back to Home</Button>
              </Link>
            </motion.div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Error or order not found
  if (error || !order) {
    return (
      <>
        <Helmet>
          <title>Order Confirmation | Basho by Shivangi</title>
        </Helmet>
        <Navigation />
        <main className="min-h-screen bg-background pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <CheckCircle className="h-20 w-20 mx-auto text-green-500 mb-6" />
            </motion.div>

            <motion.h1 
              className="font-display text-4xl md:text-5xl text-foreground mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Payment Successful!
            </motion.h1>

            <motion.p 
              className="text-muted-foreground text-lg mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Your order has been confirmed. Check your email for details.
            </motion.p>

            <motion.div
              className="flex gap-4 justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Link to="/orders">
                <Button variant="earth">View My Orders</Button>
              </Link>
              <Link to="/products">
                <Button variant="outline">Continue Shopping</Button>
              </Link>
            </motion.div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Order Confirmed | Basho by Shivangi</title>
        <meta name="description" content="Thank you for your order!" />
      </Helmet>

      <Navigation />

      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            <CheckCircle className="h-20 w-20 mx-auto text-green-500 mb-6" />
          </motion.div>

          <motion.h1 
            className="font-display text-4xl md:text-5xl text-foreground mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Thank You!
          </motion.h1>

          <motion.p 
            className="text-muted-foreground text-lg mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Your order has been confirmed and is being processed.
          </motion.p>

          {order && (
            <motion.div 
              className="bg-card border border-border rounded-lg p-6 text-left mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="font-display text-xl mb-4">Order Details</h2>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Number</span>
                  <span className="font-medium">{order.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span>{order.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{order.customer_email}</span>
                </div>
                
                {order.buyer_gstin && order.taxable_amount && (
                  <div className="border-t border-b py-2 my-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">GSTIN</span>
                      <span>{order.buyer_gstin}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Taxable Amount</span>
                      <span>₹{Number(order.taxable_amount).toLocaleString()}</span>
                    </div>
                    {order.igst_amount && Number(order.igst_amount) > 0 ? (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">IGST (18%)</span>
                        <span>₹{Number(order.igst_amount).toLocaleString()}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">CGST (9%)</span>
                          <span>₹{Number(order.cgst_amount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">SGST (9%)</span>
                          <span>₹{Number(order.sgst_amount || 0).toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-medium text-primary">₹{Number(order.total_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Status</span>
                  <span className="text-green-600 capitalize">{order.payment_status}</span>
                </div>
                
                {order.buyer_gstin && (
                  <div className="pt-3 border-t mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="font-medium">GST Invoice</span>
                    </div>
                    {order.invoice_url ? (
                      <a 
                        href={order.invoice_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="outline" className="w-full gap-2">
                          <Download className="w-4 h-4" />
                          Download Invoice {order.invoice_number && `(${order.invoice_number})`}
                        </Button>
                      </a>
                    ) : (
                      <p className="text-xs text-muted-foreground italic text-center">
                        Invoice is being generated and will be available shortly...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <motion.p 
            className="text-muted-foreground mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            A confirmation email has been sent to your email address.
          </motion.p>

          <motion.div
            className="flex gap-4 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Link to="/products">
              <Button variant="earth">Continue Shopping</Button>
            </Link>
            <Link to="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </motion.div>
        </div>
      </main>

      <Footer />
    </>
  );
}
