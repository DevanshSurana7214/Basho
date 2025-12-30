import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  Users, 
  RefreshCw, 
  IndianRupee, 
  Search, 
  Trash2,
  User,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  X,
  Mail,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

interface UserProfile {
  full_name: string | null;
  phone: string | null;
  user_id: string;
}

interface ExperienceBooking {
  id: string;
  user_id: string;
  experience_type: string;
  booking_date: string;
  time_slot: string;
  guests: number;
  notes: string | null;
  total_amount: number;
  payment_status: string;
  booking_status: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: UserProfile;
  user_email?: string;
}

const experienceNames: Record<string, string> = {
  couple: 'Couple Pottery Dates',
  birthday: 'Birthday Sessions',
  farm: 'Farm & Garden Mini Parties',
  studio: 'Studio-Based Experiences'
};

const AdminExperiences = () => {
  const [bookings, setBookings] = useState<ExperienceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<ExperienceBooking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteBookingId, setDeleteBookingId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    
    await supabase.rpc('update_expired_experience_bookings');
    
    // Fetch bookings
    const { data: bookingsData, error } = await supabase
      .from('experience_bookings')
      .select('*')
      .order('booking_date', { ascending: true });

    if (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
      setLoading(false);
      return;
    }

    // Fetch all user profiles for the bookings
    const userIds = [...new Set((bookingsData || []).map(b => b.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name, phone')
      .in('user_id', userIds);

    // Create a map of user_id to profile
    const profilesMap = new Map(
      (profilesData || []).map(p => [p.user_id, p])
    );

    // Combine bookings with profiles
    const bookingsWithProfiles = (bookingsData || []).map(booking => ({
      ...booking,
      profiles: profilesMap.get(booking.user_id) || null
    }));

    setBookings(bookingsWithProfiles as ExperienceBooking[]);
    setLoading(false);
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Filter logic
      if (filter === 'upcoming' && !(b.booking_status === 'confirmed' && new Date(b.booking_date) >= new Date())) return false;
      if (filter === 'completed' && b.booking_status !== 'completed') return false;
      if (filter === 'paid' && b.payment_status !== 'paid') return false;
      if (filter === 'pending' && b.payment_status !== 'pending') return false;

      // Search logic
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const experienceName = experienceNames[b.experience_type]?.toLowerCase() || b.experience_type.toLowerCase();
        if (!experienceName.includes(query) && !b.time_slot.toLowerCase().includes(query)) return false;
      }

      return true;
    });
  }, [bookings, filter, searchQuery]);

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    const { error } = await supabase
      .from('experience_bookings')
      .update({ booking_status: newStatus })
      .eq('id', bookingId);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Status updated');
      fetchBookings();
    }
  };

  const handleDeleteBooking = (bookingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteBookingId(bookingId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteBooking = async () => {
    if (!deleteBookingId) return;
    
    const { error } = await supabase
      .from('experience_bookings')
      .delete()
      .eq('id', deleteBookingId);

    if (error) {
      toast.error('Failed to delete booking');
    } else {
      toast.success('Booking deleted successfully');
      fetchBookings();
    }
    setIsDeleteDialogOpen(false);
    setDeleteBookingId(null);
  };

  const handleViewBooking = (booking: ExperienceBooking) => {
    setSelectedBooking(booking);
    setIsDialogOpen(true);
  };

  const getPaymentConfig = (status: string) => {
    if (status === 'paid') {
      return {
        label: 'Payment: Received',
        icon: <CheckCircle2 className="h-3 w-3" />,
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
      };
    }
    if (status === 'failed') {
      return {
        label: 'Payment: Failed',
        icon: <XCircle className="h-3 w-3" />,
        className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'
      };
    }
    return {
      label: 'Payment: Pending',
      icon: <AlertCircle className="h-3 w-3" />,
      className: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400'
    };
  };

  const getBookingStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          label: 'Confirmed',
          icon: <CheckCircle2 className="h-3 w-3" />,
          className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
        };
      case 'completed':
        return {
          label: 'Completed',
          icon: <CheckCircle2 className="h-3 w-3" />,
          className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400'
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          icon: <XCircle className="h-3 w-3" />,
          className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'
        };
      default:
        return {
          label: status,
          icon: <Clock className="h-3 w-3" />,
          className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400'
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-semibold">Experience Bookings</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage pottery experience reservations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm px-3 py-1.5 gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {bookings.length} Bookings
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-card border border-border/60 rounded-xl p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by experience type or time slot..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40 h-9 text-xs">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bookings</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Payment Pending</SelectItem>
              </SelectContent>
            </Select>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={fetchBookings}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh bookings</TooltipContent>
            </Tooltip>

            {(filter !== 'all' || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => { setFilter('all'); setSearchQuery(''); }}
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </Button>
            )}

            {filteredBookings.length !== bookings.length && (
              <Badge variant="secondary" className="text-xs px-2 py-1">
                {filteredBookings.length} of {bookings.length}
              </Badge>
            )}
          </div>
        </div>

        {/* Bookings Grid */}
        {filteredBookings.length === 0 ? (
          <div className="bg-card border border-border/60 rounded-xl p-12 text-center text-muted-foreground">
            No bookings found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredBookings.map((booking) => {
              const paymentConfig = getPaymentConfig(booking.payment_status);
              const statusConfig = getBookingStatusConfig(booking.booking_status);

              return (
                <div
                  key={booking.id}
                  className="group relative bg-card border border-border/60 rounded-xl p-4 hover:shadow-lg hover:border-primary/20 transition-all duration-200 cursor-pointer"
                  onClick={() => handleViewBooking(booking)}
                >
                  {/* Delete button on hover */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleDeleteBooking(booking.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete booking</TooltipContent>
                  </Tooltip>

                  {/* Top Row - Experience Type & Amount */}
                  <div className="flex items-start justify-between mb-3 pr-8">
                    <div>
                      <p className="font-semibold text-sm">
                        {experienceNames[booking.experience_type] || booking.experience_type}
                      </p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 cursor-default">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          Booked on {format(new Date(booking.created_at), 'dd MMM yyyy, hh:mm a')}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-base flex items-center justify-end">
                        <IndianRupee className="h-3.5 w-3.5" />
                        {booking.total_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="mb-3 space-y-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm font-medium truncate flex items-center gap-1.5 cursor-default">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {format(new Date(booking.booking_date), 'PPP')}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>Booking Date</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5 cursor-default">
                          <Clock className="h-3 w-3 shrink-0" />
                          {booking.time_slot}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>Time Slot</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5 cursor-default">
                          <Users className="h-3 w-3 shrink-0" />
                          {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>Number of Guests</TooltipContent>
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
                      <TooltipContent>Booking Status</TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Status Selector */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={booking.booking_status}
                      onValueChange={(value) => updateBookingStatus(booking.id, value)}
                    >
                      <SelectTrigger className="h-8 text-xs bg-muted/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">
                          <span className="flex items-center gap-2 text-xs">
                            <CheckCircle2 className="h-3 w-3 text-blue-500" />
                            Confirmed
                          </span>
                        </SelectItem>
                        <SelectItem value="completed">
                          <span className="flex items-center gap-2 text-xs">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            Completed
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
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">
                {selectedBooking && (experienceNames[selectedBooking.experience_type] || selectedBooking.experience_type)}
              </DialogTitle>
            </DialogHeader>
            
            {selectedBooking && (
              <div className="space-y-4">
                {/* Customer Information Section */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Customer Information</p>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      {selectedBooking.profiles?.full_name || 'Name not provided'}
                    </p>
                    {selectedBooking.profiles?.phone && (
                      <a 
                        href={`tel:${selectedBooking.profiles.phone}`}
                        className="text-sm flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {selectedBooking.profiles.phone}
                      </a>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="font-mono">User ID: {selectedBooking.user_id.slice(0, 8)}...</span>
                    </p>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Booking Date</p>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {format(new Date(selectedBooking.booking_date), 'PPP')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Time Slot</p>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {selectedBooking.time_slot}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Guests</p>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {selectedBooking.guests} {selectedBooking.guests === 1 ? 'guest' : 'guests'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                    <p className="text-sm font-bold flex items-center gap-1">
                      <IndianRupee className="h-3.5 w-3.5" />
                      {selectedBooking.total_amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getPaymentConfig(selectedBooking.payment_status).className}>
                      {getPaymentConfig(selectedBooking.payment_status).icon}
                      <span className="ml-1">{getPaymentConfig(selectedBooking.payment_status).label}</span>
                    </Badge>
                    <Badge className={getBookingStatusConfig(selectedBooking.booking_status).className}>
                      {getBookingStatusConfig(selectedBooking.booking_status).icon}
                      <span className="ml-1">{getBookingStatusConfig(selectedBooking.booking_status).label}</span>
                    </Badge>
                  </div>

                  {selectedBooking.notes && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedBooking.notes}</p>
                    </div>
                  )}

                  {selectedBooking.razorpay_payment_id && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Payment ID</p>
                      <p className="text-xs font-mono bg-muted/50 p-2 rounded">{selectedBooking.razorpay_payment_id}</p>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Booked on {format(new Date(selectedBooking.created_at), 'PPp')}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm font-medium">Update Status</p>
                  <Select
                    value={selectedBooking.booking_status}
                    onValueChange={(value) => {
                      updateBookingStatus(selectedBooking.id, value);
                      setSelectedBooking({ ...selectedBooking, booking_status: value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Experience Booking</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this booking? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteBooking}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default AdminExperiences;
