import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Loader2, 
  Download, 
  FileText, 
  RefreshCw, 
  Package, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  IndianRupee,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Search,
  Filter,
  X,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';
import { format, formatDistanceToNow, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: string | null;
  subtotal: number;
  shipping_cost: number | null;
  total_amount: number;
  order_status: string | null;
  payment_status: string | null;
  created_at: string;
  gst_number: string | null;
  buyer_gstin: string | null;
  buyer_state: string | null;
  buyer_state_code: string | null;
  cgst_amount: number | null;
  sgst_amount: number | null;
  igst_amount: number | null;
  taxable_amount: number | null;
  invoice_number: string | null;
  invoice_url: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  invoice_generated_at: string | null;
}

interface OrderItem {
  id: string;
  item_name: string;
  item_type: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const AdminOrders = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

  // Filtered orders
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    
    return orders.filter((order) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          order.order_number.toLowerCase().includes(query) ||
          order.customer_name.toLowerCase().includes(query) ||
          order.customer_email.toLowerCase().includes(query) ||
          (order.customer_phone && order.customer_phone.includes(query));
        if (!matchesSearch) return false;
      }

      // Order status filter
      if (orderStatusFilter !== 'all') {
        if ((order.order_status || 'pending') !== orderStatusFilter) return false;
      }

      // Payment status filter
      if (paymentStatusFilter !== 'all') {
        if ((order.payment_status || 'pending') !== paymentStatusFilter) return false;
      }

      // Date range filter
      if (dateRange.from || dateRange.to) {
        const orderDate = parseISO(order.created_at);
        if (dateRange.from && dateRange.to) {
          if (!isWithinInterval(orderDate, { 
            start: startOfDay(dateRange.from), 
            end: endOfDay(dateRange.to) 
          })) return false;
        } else if (dateRange.from) {
          if (orderDate < startOfDay(dateRange.from)) return false;
        } else if (dateRange.to) {
          if (orderDate > endOfDay(dateRange.to)) return false;
        }
      }

      return true;
    });
  }, [orders, searchQuery, orderStatusFilter, paymentStatusFilter, dateRange]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (orderStatusFilter !== 'all') count++;
    if (paymentStatusFilter !== 'all') count++;
    if (dateRange.from || dateRange.to) count++;
    return count;
  }, [searchQuery, orderStatusFilter, paymentStatusFilter, dateRange]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setOrderStatusFilter('all');
    setPaymentStatusFilter('all');
    setDateRange({ from: undefined, to: undefined });
  };

  const exportOrdersToCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('No orders to export');
      return;
    }

    const headers = [
      'Order Number',
      'Order Date',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Shipping Address',
      'Order Status',
      'Payment Status',
      'Subtotal (₹)',
      'Shipping Cost (₹)',
      'CGST (₹)',
      'SGST (₹)',
      'IGST (₹)',
      'Total Amount (₹)',
      'Razorpay Order ID',
      'Razorpay Payment ID',
      'GST Number',
      'Invoice Number',
      'Invoice Generated At'
    ];

    const csvRows = filteredOrders.map(order => [
      order.order_number,
      format(new Date(order.created_at), 'dd/MM/yyyy HH:mm'),
      order.customer_name,
      order.customer_email,
      order.customer_phone || '',
      (order.shipping_address || '').replace(/,/g, ';').replace(/\n/g, ' '),
      order.order_status || 'pending',
      order.payment_status || 'pending',
      order.subtotal.toFixed(2),
      (order.shipping_cost || 0).toFixed(2),
      (order.cgst_amount || 0).toFixed(2),
      (order.sgst_amount || 0).toFixed(2),
      (order.igst_amount || 0).toFixed(2),
      order.total_amount.toFixed(2),
      order.razorpay_order_id || '',
      order.razorpay_payment_id || '',
      order.buyer_gstin || '',
      order.invoice_number || '',
      order.invoice_generated_at ? format(new Date(order.invoice_generated_at), 'dd/MM/yyyy HH:mm') : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Generate filename with date range if applicable
    let filename = 'orders';
    if (dateRange.from && dateRange.to) {
      filename += `_${format(dateRange.from, 'dd-MMM-yyyy')}_to_${format(dateRange.to, 'dd-MMM-yyyy')}`;
    } else if (dateRange.from) {
      filename += `_from_${format(dateRange.from, 'dd-MMM-yyyy')}`;
    } else if (dateRange.to) {
      filename += `_until_${format(dateRange.to, 'dd-MMM-yyyy')}`;
    } else {
      filename += `_${format(new Date(), 'dd-MMM-yyyy')}`;
    }
    filename += '.csv';

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredOrders.length} orders to CSV`);
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated');
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      // First delete order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);
      if (itemsError) throw itemsError;
      
      // Then delete the order
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
      if (orderError) throw orderError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order deleted successfully');
      setIsDeleteDialogOpen(false);
      setDeleteOrderId(null);
    },
    onError: (error) => {
      toast.error('Failed to delete order: ' + error.message);
    },
  });

  const handleDeleteOrder = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteOrderId(orderId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteOrder = () => {
    if (deleteOrderId) {
      deleteOrderMutation.mutate(deleteOrderId);
    }
  };

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);
    if (!error && data) {
      setOrderItems(data);
    }
    setIsDialogOpen(true);
  };

  const handleGenerateInvoice = async (order: Order) => {
    if (!order.buyer_gstin) {
      toast.error('This order does not have GST details');
      return;
    }

    setGeneratingInvoice(order.id);
    try {
      const { data, error } = await supabase.functions.invoke('generate-gst-invoice', {
        body: { order_id: order.id },
      });

      if (error) throw error;

      if (data?.invoice_url) {
        window.open(data.invoice_url, '_blank');
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        toast.success('Invoice generated successfully');
      }
    } catch (error: any) {
      console.error('Invoice generation error:', error);
      toast.error('Failed to generate invoice: ' + error.message);
    } finally {
      setGeneratingInvoice(null);
    }
  };

  const getStatusConfig = (status: string | null) => {
    const statusMap: Record<string, { 
      label: string;
      icon: React.ReactNode;
      className: string;
    }> = {
      pending: { 
        label: 'Order: Pending', 
        icon: <Clock className="h-3 w-3" />,
        className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
      },
      confirmed: { 
        label: 'Order: Confirmed', 
        icon: <CheckCircle2 className="h-3 w-3" />,
        className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
      },
      shipped: { 
        label: 'Order: Shipped', 
        icon: <Truck className="h-3 w-3" />,
        className: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400'
      },
      delivered: { 
        label: 'Order: Delivered', 
        icon: <Package className="h-3 w-3" />,
        className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400'
      },
      cancelled: { 
        label: 'Order: Cancelled', 
        icon: <XCircle className="h-3 w-3" />,
        className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'
      },
    };
    return statusMap[status || 'pending'] || statusMap.pending;
  };

  const getPaymentConfig = (status: string | null) => {
    if (status === 'paid') {
      return {
        label: 'Payment: Received',
        icon: <CheckCircle2 className="h-3 w-3" />,
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
      };
    }
    return {
      label: 'Payment: Pending',
      icon: <AlertCircle className="h-3 w-3" />,
      className: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400'
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-semibold">Orders</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and track customer orders
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={exportOrdersToCSV}
                  disabled={filteredOrders.length === 0}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="hidden sm:inline">Export CSV</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Export {filteredOrders.length} filtered orders to CSV
              </TooltipContent>
            </Tooltip>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs px-2 py-1">
                {filteredOrders.length} of {orders?.length || 0}
              </Badge>
            )}
            <Badge variant="outline" className="text-sm px-3 py-1.5 gap-1.5">
              <Package className="h-3.5 w-3.5" />
              {orders?.length || 0} Orders
            </Badge>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-card border border-border/60 rounded-xl p-4 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number, customer name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filters:</span>
            </div>

            {/* Order Status Filter */}
            <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
              <SelectTrigger className="h-9 w-[180px] text-xs">
                <div className="flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Order:</span>
                  {orderStatusFilter === 'all' ? (
                    <span>All</span>
                  ) : orderStatusFilter === 'pending' ? (
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <Clock className="h-3 w-3" /> Awaiting
                    </span>
                  ) : orderStatusFilter === 'confirmed' ? (
                    <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <CheckCircle2 className="h-3 w-3" /> Confirmed
                    </span>
                  ) : orderStatusFilter === 'shipped' ? (
                    <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                      <Truck className="h-3 w-3" /> In Transit
                    </span>
                  ) : orderStatusFilter === 'delivered' ? (
                    <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                      <Package className="h-3 w-3" /> Delivered
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                      <XCircle className="h-3 w-3" /> Cancelled
                    </span>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    All Order Statuses
                  </span>
                </SelectItem>
                <SelectItem value="pending">
                  <span className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span>Awaiting Confirmation</span>
                  </span>
                </SelectItem>
                <SelectItem value="confirmed">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                    <span>Order Confirmed</span>
                  </span>
                </SelectItem>
                <SelectItem value="shipped">
                  <span className="flex items-center gap-2">
                    <Truck className="h-3.5 w-3.5 text-purple-500" />
                    <span>Shipped / In Transit</span>
                  </span>
                </SelectItem>
                <SelectItem value="delivered">
                  <span className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-green-500" />
                    <span>Successfully Delivered</span>
                  </span>
                </SelectItem>
                <SelectItem value="cancelled">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                    <span>Order Cancelled</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Payment Status Filter */}
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger className="h-9 w-[180px] text-xs">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Payment:</span>
                  {paymentStatusFilter === 'all' ? (
                    <span>All</span>
                  ) : paymentStatusFilter === 'paid' ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Received
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                      <AlertCircle className="h-3 w-3" /> Awaiting
                    </span>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                    All Payment Statuses
                  </span>
                </SelectItem>
                <SelectItem value="paid">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Payment Received</span>
                  </span>
                </SelectItem>
                <SelectItem value="pending">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                    <span>Awaiting Payment</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`h-9 text-xs gap-2 ${dateRange.from || dateRange.to ? 'border-primary text-primary' : ''}`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'dd MMM')} - {format(dateRange.to, 'dd MMM')}
                      </>
                    ) : (
                      format(dateRange.from, 'dd MMM yyyy')
                    )
                  ) : (
                    'Date Range'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                  disabled={{ after: new Date() }}
                />
                {(dateRange.from || dateRange.to) && (
                  <div className="p-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setDateRange({ from: undefined, to: undefined })}
                    >
                      Clear dates
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Clear All Filters */}
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={clearAllFilters}
              >
                <X className="h-3.5 w-3.5" />
                Clear all ({activeFiltersCount})
              </Button>
            )}
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const statusConfig = getStatusConfig(order.order_status);
            const paymentConfig = getPaymentConfig(order.payment_status);
            
            return (
              <div 
                key={order.id} 
                className="group relative bg-card border border-border/60 rounded-xl p-4 hover:shadow-lg hover:border-primary/20 transition-all duration-200 cursor-pointer"
                onClick={() => handleViewOrder(order)}
              >
                {/* Delete button on hover */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDeleteOrder(order.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete order</TooltipContent>
                </Tooltip>

                {/* Top Row - Order Number & Amount */}
                <div className="flex items-start justify-between mb-3 pr-8">
                  <div>
                    <p className="font-semibold text-sm">{order.order_number}</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 cursor-default">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        {format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a')}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-base flex items-center justify-end">
                      <IndianRupee className="h-3.5 w-3.5" />
                      {order.total_amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="mb-3 space-y-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-sm font-medium truncate flex items-center gap-1.5 cursor-default">
                        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {order.customer_name}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>Customer Name</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5 cursor-default">
                        <Mail className="h-3 w-3 shrink-0" />
                        {order.customer_email}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>Email: {order.customer_email}</TooltipContent>
                  </Tooltip>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className={`gap-1 text-[10px] px-2 py-0.5 ${paymentConfig.className}`}>
                        {paymentConfig.icon}
                        {paymentConfig.label}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Payment Status</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className={`gap-1 text-[10px] px-2 py-0.5 ${statusConfig.className}`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Order Status</TooltipContent>
                  </Tooltip>
                  {order.buyer_gstin && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="gap-1 text-[10px] px-2 py-0.5">
                          <FileText className="h-2.5 w-2.5" />
                          GST
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        GST: {order.buyer_gstin}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {order.razorpay_payment_id && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="gap-1 text-[10px] px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
                          <IndianRupee className="h-2.5 w-2.5" />
                          Paid
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        Payment ID: {order.razorpay_payment_id}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* Status Selector & Actions */}
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={order.order_status || 'pending'}
                    onValueChange={(value) => updateStatusMutation.mutate({ id: order.id, status: value })}
                  >
                    <SelectTrigger className="h-8 text-xs flex-1 bg-muted/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <span className="flex items-center gap-2 text-xs">
                          <Clock className="h-3 w-3 text-amber-500" />
                          Pending
                        </span>
                      </SelectItem>
                      <SelectItem value="confirmed">
                        <span className="flex items-center gap-2 text-xs">
                          <CheckCircle2 className="h-3 w-3 text-blue-500" />
                          Confirmed
                        </span>
                      </SelectItem>
                      <SelectItem value="shipped">
                        <span className="flex items-center gap-2 text-xs">
                          <Truck className="h-3 w-3 text-purple-500" />
                          Shipped
                        </span>
                      </SelectItem>
                      <SelectItem value="delivered">
                        <span className="flex items-center gap-2 text-xs">
                          <Package className="h-3 w-3 text-green-500" />
                          Delivered
                        </span>
                      </SelectItem>
                      <SelectItem value="cancelled">
                        <span className="flex items-center gap-2 text-xs">
                          <XCircle className="h-3 w-3 text-red-500" />
                          Cancelled
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>


                  {order.buyer_gstin && (
                    <DropdownMenu>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>More actions</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="end">
                        {order.invoice_url ? (
                          <>
                            <DropdownMenuItem onClick={() => window.open(order.invoice_url!, '_blank')}>
                              <Download className="h-4 w-4 mr-2" />
                              Download Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleGenerateInvoice(order)}
                              disabled={generatingInvoice === order.id}
                            >
                              {generatingInvoice === order.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                              )}
                              Regenerate Invoice
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => handleGenerateInvoice(order)}
                            disabled={generatingInvoice === order.id}
                          >
                            {generatingInvoice === order.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <FileText className="h-4 w-4 mr-2" />
                            )}
                            Generate Invoice
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          })}

          {filteredOrders.length === 0 && orders && orders.length > 0 && (
            <div className="col-span-full">
              <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed border-border">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
                <p className="text-lg font-medium text-muted-foreground">No orders match your filters</p>
                <p className="text-sm text-muted-foreground/60 mb-4">Try adjusting your search or filter criteria</p>
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  Clear all filters
                </Button>
              </div>
            </div>
          )}

          {orders?.length === 0 && (
            <div className="col-span-full">
              <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed border-border">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
                <p className="text-lg font-medium text-muted-foreground">No orders yet</p>
                <p className="text-sm text-muted-foreground/60">Orders will appear here once customers start placing them.</p>
              </div>
            </div>
          )}
        </div>

        {/* Order Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Details - {selectedOrder?.order_number}
              </DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Meta */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(selectedOrder.created_at), 'dd MMMM yyyy, hh:mm a')}
                  </div>
                  <Badge className={getPaymentConfig(selectedOrder.payment_status).className}>
                    {getPaymentConfig(selectedOrder.payment_status).label}
                  </Badge>
                  <Badge className={getStatusConfig(selectedOrder.order_status).className}>
                    {getStatusConfig(selectedOrder.order_status).label}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
                      <User className="h-4 w-4" />
                      Customer
                    </h4>
                    <p className="font-medium">{selectedOrder.customer_name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Mail className="h-3.5 w-3.5" />
                      {selectedOrder.customer_email}
                    </p>
                    {selectedOrder.customer_phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Phone className="h-3.5 w-3.5" />
                        {selectedOrder.customer_phone}
                      </p>
                    )}
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      Shipping Address
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {selectedOrder.shipping_address || 'Not provided'}
                    </p>
                  </div>
                </div>

                {selectedOrder.buyer_gstin && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4" />
                      GST Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">GSTIN:</span>
                        <span className="ml-2 font-medium">{selectedOrder.buyer_gstin}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">State:</span>
                        <span className="ml-2">{selectedOrder.buyer_state} ({selectedOrder.buyer_state_code})</span>
                      </div>
                      {(selectedOrder.cgst_amount || 0) > 0 && (
                        <>
                          <div>
                            <span className="text-muted-foreground">CGST (9%):</span>
                            <span className="ml-2">₹{(selectedOrder.cgst_amount || 0).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">SGST (9%):</span>
                            <span className="ml-2">₹{(selectedOrder.sgst_amount || 0).toLocaleString()}</span>
                          </div>
                        </>
                      )}
                      {(selectedOrder.igst_amount || 0) > 0 && (
                        <div>
                          <span className="text-muted-foreground">IGST (18%):</span>
                          <span className="ml-2">₹{(selectedOrder.igst_amount || 0).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex gap-2">
                      {selectedOrder.invoice_url ? (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.open(selectedOrder.invoice_url!, '_blank')}
                                className="gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Download Invoice
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Download GST Invoice PDF</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleGenerateInvoice(selectedOrder)}
                                disabled={generatingInvoice === selectedOrder.id}
                                className="gap-2"
                              >
                                {generatingInvoice === selectedOrder.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                                Regenerate
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Regenerate Invoice with latest data</TooltipContent>
                          </Tooltip>
                        </>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              size="sm" 
                              onClick={() => handleGenerateInvoice(selectedOrder)}
                              disabled={generatingInvoice === selectedOrder.id}
                              className="gap-2"
                            >
                              {generatingInvoice === selectedOrder.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                              Generate Invoice
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Generate GST Invoice PDF</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4" />
                    Order Items
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.item_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize text-xs">
                              {item.item_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">₹{item.unit_price.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium">₹{item.total_price.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{selectedOrder.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>₹{(selectedOrder.shipping_cost || 0).toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg pt-2">
                    <span>Total</span>
                    <span className="flex items-center gap-1">
                      <IndianRupee className="h-4 w-4" />
                      {selectedOrder.total_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Order</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this order? This action cannot be undone.
                All order items associated with this order will also be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteOrderId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteOrder}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteOrderMutation.isPending}
              >
                {deleteOrderMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Order'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default AdminOrders;
