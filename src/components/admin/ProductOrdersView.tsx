import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Loader2, 
  Package, 
  User, 
  Calendar, 
  IndianRupee,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Search,
  ArrowLeft,
  ChevronRight,
  ShoppingBag,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  in_stock: boolean | null;
}

interface ProductOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: string | null;
  total_amount: number;
  order_status: string;
  payment_status: string;
  created_at: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface ProductOrdersViewProps {
  product: Product;
  onBack: () => void;
}

const ProductOrdersView = ({ product, onBack }: ProductOrdersViewProps) => {
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<ProductOrder | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchProductOrders();
  }, [product.id]);

  const fetchProductOrders = async () => {
    setLoading(true);
    try {
      // Fetch order items for this product
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('order_id, quantity, unit_price, total_price')
        .eq('product_id', product.id);
      
      if (itemsError) throw itemsError;
      
      if (!orderItems || orderItems.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }
      
      const orderIds = [...new Set(orderItems.map(item => item.order_id))];
      
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, customer_email, customer_phone, shipping_address, total_amount, order_status, payment_status, created_at')
        .in('id', orderIds)
        .order('created_at', { ascending: false });
      
      if (ordersError) throw ordersError;
      
      // Combine order data with item quantities
      const ordersWithQuantity = (ordersData || []).map(order => {
        const item = orderItems.find(i => i.order_id === order.id);
        return {
          ...order,
          quantity: item?.quantity || 0,
          unit_price: item?.unit_price || 0,
          total_price: item?.total_price || 0
        };
      });
      
      setOrders(ordersWithQuantity as ProductOrder[]);
    } catch (error: any) {
      console.error('Error fetching product orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status: string | null) => {
    const statusMap: Record<string, { 
      label: string;
      icon: React.ReactNode;
      className: string;
    }> = {
      pending: { 
        label: 'Pending', 
        icon: <Clock className="h-3 w-3" />,
        className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
      },
      confirmed: { 
        label: 'Confirmed', 
        icon: <CheckCircle2 className="h-3 w-3" />,
        className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
      },
      shipped: { 
        label: 'Shipped', 
        icon: <Truck className="h-3 w-3" />,
        className: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400'
      },
      delivered: { 
        label: 'Delivered', 
        icon: <Package className="h-3 w-3" />,
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
      },
      cancelled: { 
        label: 'Cancelled', 
        icon: <XCircle className="h-3 w-3" />,
        className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'
      },
    };
    return statusMap[status || 'pending'] || statusMap.pending;
  };

  const getPaymentStatusConfig = (status: string | null) => {
    if (status === 'paid') {
      return {
        label: 'Paid',
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
      };
    }
    return {
      label: 'Pending',
      className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
    };
  };

  // Calculate stats
  const totalUnitsSold = orders.reduce((sum, order) => sum + order.quantity, 0);
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_price, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Products
          </button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Management</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{product.name}</span>
        </div>

        {/* Product Info Header */}
        <div className="bg-card border border-border/60 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted/30 flex-shrink-0">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-serif text-xl font-semibold">{product.name}</h2>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {product.description || 'No description'}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <Badge variant="outline" className="capitalize">
                  {product.category}
                </Badge>
                <span className="text-sm font-semibold text-primary">
                  ₹{product.price.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-border/50">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{orders.length}</p>
              <p className="text-xs text-muted-foreground">Total Orders</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{totalUnitsSold}</p>
              <p className="text-xs text-muted-foreground">Units Sold</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">₹{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number, customer name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50 backdrop-blur-sm border-border/50"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-background/50 backdrop-blur-sm border-border/50">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders Grid */}
        <AnimatePresence mode="popLayout">
          {filteredOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 px-4"
            >
              <div className="mx-auto w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg mb-1">No orders found</h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'This product hasn\'t been ordered yet'}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredOrders.map((order, index) => {
                const statusConfig = getStatusConfig(order.order_status);
                const paymentConfig = getPaymentStatusConfig(order.payment_status);
                
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => {
                      setSelectedOrder(order);
                      setIsDialogOpen(true);
                    }}
                    className="group bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:border-primary/20 cursor-pointer"
                  >
                    {/* Order Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-sm">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(order.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge
                          variant="outline"
                          className={`text-[10px] flex items-center gap-1 ${statusConfig.className}`}
                        >
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${paymentConfig.className}`}
                        >
                          {paymentConfig.label}
                        </Badge>
                      </div>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    {/* Customer Info */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium truncate">{order.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{order.customer_email}</span>
                      </div>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    {/* Product Details in Order */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold">{order.quantity}</p>
                        <p className="text-[10px] text-muted-foreground">Qty</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">₹{order.unit_price.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">Unit Price</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-primary">₹{order.total_price.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">Total</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Order Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                Order Details
              </DialogTitle>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{selectedOrder.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedOrder.created_at), 'MMMM dd, yyyy • hh:mm a')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      variant="outline"
                      className={`flex items-center gap-1 ${getStatusConfig(selectedOrder.order_status).className}`}
                    >
                      {getStatusConfig(selectedOrder.order_status).icon}
                      {getStatusConfig(selectedOrder.order_status).label}
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Customer Information</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-medium">{selectedOrder.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <a href={`mailto:${selectedOrder.customer_email}`} className="hover:text-primary transition-colors">
                        {selectedOrder.customer_email}
                      </a>
                    </div>
                    {selectedOrder.customer_phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <a href={`tel:${selectedOrder.customer_phone}`} className="hover:text-primary transition-colors">
                          {selectedOrder.customer_phone}
                        </a>
                      </div>
                    )}
                    {selectedOrder.shipping_address && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 mt-0.5" />
                        <span className="whitespace-pre-line">{selectedOrder.shipping_address}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Product in this Order</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted/50">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedOrder.quantity} × ₹{selectedOrder.unit_price.toLocaleString()}
                      </p>
                    </div>
                    <p className="font-semibold text-primary">
                      ₹{selectedOrder.total_price.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm text-muted-foreground">Order Total:</span>
                  <span className="text-lg font-bold text-primary">
                    ₹{selectedOrder.total_amount.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default ProductOrdersView;