import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Palette, Sparkles, Calendar, Clock, Users, FileText, Download, MapPin, CreditCard, CheckCircle2, Truck, PackageCheck, Circle, ChevronRight, ShoppingBag, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';

interface OrderItem {
  id: string;
  item_name: string;
  item_type: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  updated_at: string;
  total_amount: number;
  subtotal: number;
  shipping_cost: number;
  payment_status: string;
  order_status: string;
  shipping_address: string;
  order_items: OrderItem[];
  buyer_gstin: string | null;
  buyer_state: string | null;
  cgst_amount: number | null;
  sgst_amount: number | null;
  igst_amount: number | null;
  taxable_amount: number | null;
  invoice_url: string | null;
  invoice_number: string | null;
}

interface CustomOrder {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  usage_description: string;
  preferred_size: string;
  notes: string | null;
  status: string;
  estimated_price: number | null;
  estimated_delivery_date: string | null;
  shipping_address: string | null;
  admin_notes: string | null;
  created_at: string;
  reference_images: string[] | null;
}

interface ExperienceBooking {
  id: string;
  experience_type: string;
  booking_date: string;
  time_slot: string;
  guests: number;
  notes: string | null;
  total_amount: number;
  payment_status: string;
  booking_status: string;
  created_at: string;
}

const experienceNames: Record<string, string> = {
  couple: 'Couple Pottery Dates',
  birthday: 'Birthday Sessions',
  farm: 'Farm & Garden Mini Parties',
  studio: 'Studio-Based Experiences'
};

// Order status steps for tracking
const orderStatusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'in_delivery', 'delivered'];

const getStepInfo = (status: string) => {
  const steps: Record<string, { label: string; icon: typeof Package }> = {
    pending: { label: 'Order Placed', icon: ShoppingBag },
    confirmed: { label: 'Confirmed', icon: CheckCircle2 },
    processing: { label: 'Processing', icon: Package },
    shipped: { label: 'Shipped', icon: Truck },
    in_delivery: { label: 'Out for Delivery', icon: Truck },
    delivered: { label: 'Delivered', icon: PackageCheck },
  };
  return steps[status] || { label: status, icon: Circle };
};

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [experienceBookings, setExperienceBookings] = useState<ExperienceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCustomOrder, setSelectedCustomOrder] = useState<CustomOrder | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<ExperienceBooking | null>(null);

  useEffect(() => {
    if (user) {
      fetchAllOrders();
    }
  }, [user]);

  const fetchAllOrders = async () => {
    if (!user) return;

    const [ordersResult, customOrdersResult, experiencesResult] = await Promise.all([
      supabase
        .from('orders')
        .select(`
          id,
          order_number,
          created_at,
          updated_at,
          total_amount,
          subtotal,
          shipping_cost,
          payment_status,
          order_status,
          shipping_address,
          buyer_gstin,
          buyer_state,
          cgst_amount,
          sgst_amount,
          igst_amount,
          taxable_amount,
          invoice_url,
          invoice_number,
          order_items (
            id,
            item_name,
            item_type,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('custom_order_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('experience_bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('booking_date', { ascending: false })
    ]);

    if (ordersResult.error) {
      console.error('Error fetching orders:', ordersResult.error);
    } else {
      setOrders(ordersResult.data || []);
    }

    if (customOrdersResult.error) {
      console.error('Error fetching custom orders:', customOrdersResult.error);
    } else {
      setCustomOrders(customOrdersResult.data || []);
    }

    if (experiencesResult.error) {
      console.error('Error fetching experiences:', experiencesResult.error);
    } else {
      setExperienceBookings(experiencesResult.data || []);
    }

    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'confirmed':
      case 'delivered':
      case 'payment_done':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'under_review':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'payment_pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cancelled':
      case 'failed':
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'shipped':
      case 'in_progress':
      case 'in_delivery':
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getCurrentStepIndex = (status: string) => {
    const index = orderStatusSteps.indexOf(status?.toLowerCase());
    return index === -1 ? 0 : index;
  };

  const getEstimatedDelivery = (order: Order) => {
    const orderDate = new Date(order.created_at);
    return addDays(orderDate, 7);
  };

  const hasNoOrders = orders.length === 0 && customOrders.length === 0 && experienceBookings.length === 0;

  return (
    <div className="min-h-screen bg-sand">
      <Helmet>
        <title>My Orders | Basho by Shivangi</title>
        <meta name="description" content="View your order history" />
      </Helmet>

      <Navigation />

      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <h1 className="font-display text-4xl md:text-5xl text-foreground">My Orders</h1>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            ) : hasNoOrders ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
                    <Package className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h2 className="text-2xl font-display mb-2">No orders yet</h2>
                  <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                    Start exploring our handcrafted pottery collection and place your first order
                  </p>
                  <Link to="/products">
                    <Button size="lg" className="gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      Browse Products
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="regular" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8 h-auto p-1">
                  <TabsTrigger value="regular" className="flex items-center gap-2 py-3 data-[state=active]:shadow-md">
                    <Package className="w-4 h-4" />
                    <span className="hidden sm:inline">Orders</span>
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{orders.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="experiences" className="flex items-center gap-2 py-3 data-[state=active]:shadow-md">
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">Experiences</span>
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{experienceBookings.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="custom" className="flex items-center gap-2 py-3 data-[state=active]:shadow-md">
                    <Palette className="w-4 h-4" />
                    <span className="hidden sm:inline">Custom</span>
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{customOrders.length}</Badge>
                  </TabsTrigger>
                </TabsList>

                {/* Regular Orders Tab */}
                <TabsContent value="regular">
                  {orders.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-12 text-center">
                        <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">No regular orders yet</p>
                        <Link to="/products">
                          <Button variant="outline">Browse Products</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {orders.map((order, index) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card 
                            className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex gap-4 flex-1">
                                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0">
                                    <Package className="w-7 h-7 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-semibold text-foreground">Order #{order.order_number}</h3>
                                      <Badge className={`${getStatusColor(order.order_status)} text-xs`}>
                                        {formatStatus(order.order_status || 'pending')}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {format(new Date(order.created_at), 'PPP')}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">
                                      {order.order_items.length} {order.order_items.length === 1 ? 'item' : 'items'} • {order.order_items.map(i => i.item_name).slice(0, 2).join(', ')}
                                      {order.order_items.length > 2 && ` +${order.order_items.length - 2} more`}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-lg">₹{order.total_amount.toLocaleString()}</span>
                                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Experiences Tab */}
                <TabsContent value="experiences">
                  {experienceBookings.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-12 text-center">
                        <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">No experience bookings yet</p>
                        <Link to="/experiences">
                          <Button variant="outline">Book an Experience</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {experienceBookings.map((booking, index) => (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card 
                            className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5"
                            onClick={() => setSelectedExperience(booking)}
                          >
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex gap-4 flex-1">
                                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-100 to-orange-50 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-7 h-7 text-amber-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-semibold text-foreground">
                                        {experienceNames[booking.experience_type] || booking.experience_type}
                                      </h3>
                                      <Badge className={`${getStatusColor(booking.booking_status)} text-xs`}>
                                        {formatStatus(booking.booking_status)}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {format(new Date(booking.booking_date), 'PPP')} at {booking.time_slot}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-lg">₹{booking.total_amount.toLocaleString()}</span>
                                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Custom Orders Tab */}
                <TabsContent value="custom">
                  {customOrders.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-12 text-center">
                        <Palette className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">No custom orders yet</p>
                        <Link to="/custom-orders">
                          <Button variant="outline">Request Custom Pottery</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {customOrders.map((order, index) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card 
                            className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5"
                            onClick={() => setSelectedCustomOrder(order)}
                          >
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex gap-4 flex-1">
                                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-100 to-pink-50 flex items-center justify-center shrink-0">
                                    <Palette className="w-7 h-7 text-purple-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-semibold text-foreground">Custom Order Request</h3>
                                      <Badge className={`${getStatusColor(order.status)} text-xs`}>
                                        {formatStatus(order.status)}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {format(new Date(order.created_at), 'PPP')}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">
                                      Size: {order.preferred_size} • {order.usage_description.slice(0, 50)}...
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {order.estimated_price && (
                                    <span className="font-semibold text-lg">₹{order.estimated_price.toLocaleString()}</span>
                                  )}
                                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </motion.div>
        </div>
      </main>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
              <DialogHeader className="p-6 pb-0 sticky top-0 bg-background z-10">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl font-display">Order #{selectedOrder.order_number}</DialogTitle>
                  <Badge className={`${getStatusColor(selectedOrder.order_status)}`}>
                    {formatStatus(selectedOrder.order_status || 'pending')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Placed on {format(new Date(selectedOrder.created_at), 'PPP')} at {format(new Date(selectedOrder.created_at), 'p')}
                </p>
              </DialogHeader>

              <div className="p-6 space-y-6">
                {/* Order Tracking Timeline */}
                <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl p-6">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Order Tracking
                  </h4>
                  <div className="relative">
                    {/* Progress Bar Background */}
                    <div className="absolute top-4 left-4 right-4 h-1 bg-muted rounded-full" />
                    {/* Progress Bar Fill */}
                    <div 
                      className="absolute top-4 left-4 h-1 bg-primary rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min((getCurrentStepIndex(selectedOrder.order_status) / (orderStatusSteps.length - 1)) * 100, 100)}%`,
                        maxWidth: 'calc(100% - 2rem)'
                      }}
                    />
                    
                    <div className="flex justify-between relative">
                      {orderStatusSteps.slice(0, 4).map((step, index) => {
                        const stepInfo = getStepInfo(step);
                        const StepIcon = stepInfo.icon;
                        const currentIndex = getCurrentStepIndex(selectedOrder.order_status);
                        const isCompleted = index <= currentIndex;
                        const isCurrent = index === currentIndex;
                        
                        return (
                          <div key={step} className="flex flex-col items-center relative z-10">
                            <motion.div
                              initial={{ scale: 0.8 }}
                              animate={{ scale: isCurrent ? 1.1 : 1 }}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                                isCompleted 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted text-muted-foreground'
                              } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                            >
                              <StepIcon className="w-4 h-4" />
                            </motion.div>
                            <span className={`text-xs mt-2 text-center max-w-16 ${isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                              {stepInfo.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50 flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Delivery</span>
                    <span className="font-medium">{format(getEstimatedDelivery(selectedOrder), 'PPP')}</span>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-semibold mb-3">Items Ordered</h4>
                  <div className="space-y-3">
                    {selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Package className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.item_name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-medium">₹{item.total_price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Payment Summary */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Payment Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{selectedOrder.subtotal.toLocaleString()}</span>
                    </div>
                    {selectedOrder.buyer_gstin && selectedOrder.taxable_amount && (
                      <>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Taxable Amount</span>
                          <span>₹{Number(selectedOrder.taxable_amount).toLocaleString()}</span>
                        </div>
                        {selectedOrder.igst_amount && Number(selectedOrder.igst_amount) > 0 ? (
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>IGST (18%)</span>
                            <span>₹{Number(selectedOrder.igst_amount).toLocaleString()}</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>CGST (9%)</span>
                              <span>₹{Number(selectedOrder.cgst_amount || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>SGST (9%)</span>
                              <span>₹{Number(selectedOrder.sgst_amount || 0).toLocaleString()}</span>
                            </div>
                          </>
                        )}
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{selectedOrder.shipping_cost > 0 ? `₹${selectedOrder.shipping_cost.toLocaleString()}` : 'Free'}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold text-base">
                      <span>Total</span>
                      <span>₹{selectedOrder.total_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-muted-foreground text-xs">Payment Status:</span>
                      <Badge variant="outline" className={`${getStatusColor(selectedOrder.payment_status)} text-xs`}>
                        {formatStatus(selectedOrder.payment_status || 'pending')}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* GST Invoice */}
                {selectedOrder.buyer_gstin && (
                  <>
                    <Separator />
                    <div className="bg-primary/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-sm">GST Invoice</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        GSTIN: {selectedOrder.buyer_gstin}
                        {selectedOrder.buyer_state && ` • ${selectedOrder.buyer_state}`}
                      </p>
                      {selectedOrder.invoice_url ? (
                        <a href={selectedOrder.invoice_url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="gap-2">
                            <Download className="w-3 h-3" />
                            Download Invoice {selectedOrder.invoice_number && `(${selectedOrder.invoice_number})`}
                          </Button>
                        </a>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Invoice being generated...</p>
                      )}
                    </div>
                  </>
                )}

                {/* Shipping Address */}
                {selectedOrder.shipping_address && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Shipping Address
                      </h4>
                      <p className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-4">
                        {selectedOrder.shipping_address}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Experience Detail Modal */}
      <AnimatePresence>
        {selectedExperience && (
          <Dialog open={!!selectedExperience} onOpenChange={() => setSelectedExperience(null)}>
            <DialogContent className="max-w-lg p-0">
              <DialogHeader className="p-6 pb-0">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl font-display">
                    {experienceNames[selectedExperience.experience_type] || selectedExperience.experience_type}
                  </DialogTitle>
                  <Badge className={`${getStatusColor(selectedExperience.booking_status)}`}>
                    {formatStatus(selectedExperience.booking_status)}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="p-6 space-y-6">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <Calendar className="w-6 h-6 mx-auto text-amber-600 mb-2" />
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="font-medium text-sm">{format(new Date(selectedExperience.booking_date), 'PP')}</p>
                    </div>
                    <div>
                      <Clock className="w-6 h-6 mx-auto text-amber-600 mb-2" />
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="font-medium text-sm">{selectedExperience.time_slot}</p>
                    </div>
                    <div>
                      <Users className="w-6 h-6 mx-auto text-amber-600 mb-2" />
                      <p className="text-xs text-muted-foreground">Guests</p>
                      <p className="font-medium text-sm">{selectedExperience.guests}</p>
                    </div>
                  </div>
                </div>

                {selectedExperience.notes && (
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Special Notes</h4>
                    <p className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-4">
                      {selectedExperience.notes}
                    </p>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-semibold">₹{selectedExperience.total_amount.toLocaleString()}</p>
                  </div>
                  <Badge variant="outline" className={`${getStatusColor(selectedExperience.payment_status)}`}>
                    {formatStatus(selectedExperience.payment_status)}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Booked on {format(new Date(selectedExperience.created_at), 'PPp')}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Custom Order Detail Modal */}
      <AnimatePresence>
        {selectedCustomOrder && (
          <Dialog open={!!selectedCustomOrder} onOpenChange={() => setSelectedCustomOrder(null)}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
              <DialogHeader className="p-6 pb-0 sticky top-0 bg-background z-10">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl font-display">Custom Order Request</DialogTitle>
                  <Badge className={`${getStatusColor(selectedCustomOrder.status)}`}>
                    {formatStatus(selectedCustomOrder.status)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Submitted on {format(new Date(selectedCustomOrder.created_at), 'PPP')}
                </p>
              </DialogHeader>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Description</h4>
                    <p className="text-sm">{selectedCustomOrder.usage_description}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Preferred Size</h4>
                    <p className="text-sm capitalize">{selectedCustomOrder.preferred_size}</p>
                  </div>
                  {selectedCustomOrder.notes && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1">Your Notes</h4>
                      <p className="text-sm">{selectedCustomOrder.notes}</p>
                    </div>
                  )}
                </div>

                {selectedCustomOrder.admin_notes && (
                  <div className="bg-primary/5 rounded-xl p-4">
                    <h4 className="font-semibold text-sm mb-2">Response from Artisan</h4>
                    <p className="text-sm text-muted-foreground">{selectedCustomOrder.admin_notes}</p>
                  </div>
                )}

                {(selectedCustomOrder.estimated_price || selectedCustomOrder.estimated_delivery_date) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      {selectedCustomOrder.estimated_price && (
                        <div>
                          <p className="text-xs text-muted-foreground">Estimated Price</p>
                          <p className="text-lg font-semibold">₹{selectedCustomOrder.estimated_price.toLocaleString()}</p>
                        </div>
                      )}
                      {selectedCustomOrder.estimated_delivery_date && (
                        <div>
                          <p className="text-xs text-muted-foreground">Est. Delivery</p>
                          <p className="text-lg font-semibold">{format(new Date(selectedCustomOrder.estimated_delivery_date), 'PP')}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {selectedCustomOrder.shipping_address && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4" />
                        Shipping Address
                      </h4>
                      <p className="text-sm text-muted-foreground">{selectedCustomOrder.shipping_address}</p>
                    </div>
                  </>
                )}

                {selectedCustomOrder.reference_images && selectedCustomOrder.reference_images.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm mb-3">Reference Images</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {selectedCustomOrder.reference_images.map((img, idx) => (
                          <a
                            key={idx}
                            href={img}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aspect-square rounded-lg overflow-hidden border hover:opacity-80 transition-opacity"
                          >
                            <img src={img} alt={`Reference ${idx + 1}`} className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="text-xs text-muted-foreground pt-2">
                  Contact: {selectedCustomOrder.email}
                  {selectedCustomOrder.phone && ` • ${selectedCustomOrder.phone}`}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
