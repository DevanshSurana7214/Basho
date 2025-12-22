import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { Loader2, Users, Calendar, Clock, Phone, Mail, IndianRupee, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WorkshopBooking {
  id: string;
  user_id: string;
  workshop_id: string;
  booking_date: string;
  time_slot: string;
  guests: number;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_status: string;
  booking_status: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
}

interface Workshop {
  id: string;
  title: string;
}

interface WorkshopBookingsDialogProps {
  workshop: Workshop | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WorkshopBookingsDialog = ({ workshop, open, onOpenChange }: WorkshopBookingsDialogProps) => {
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['workshop-bookings', workshop?.id],
    queryFn: async () => {
      if (!workshop?.id) return [];
      const { data, error } = await supabase
        .from('workshop_bookings')
        .select('*')
        .eq('workshop_id', workshop.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WorkshopBooking[];
    },
    enabled: open && !!workshop?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('workshop_bookings')
        .update({ booking_status: status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-bookings', workshop?.id] });
      toast.success('Booking status updated');
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
    },
  });

  const paidBookings = bookings?.filter(b => b.payment_status === 'paid') || [];
  const pendingBookings = bookings?.filter(b => b.payment_status === 'pending') || [];
  const totalRevenue = paidBookings.reduce((sum, b) => sum + b.total_amount, 0);
  const totalGuests = paidBookings.reduce((sum, b) => sum + b.guests, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/30">
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Registrations - {workshop?.title}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-2xl font-serif text-foreground">{paidBookings.length}</div>
                  <div className="text-xs text-muted-foreground">Confirmed Bookings</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-2xl font-serif text-foreground">{totalGuests}</div>
                  <div className="text-xs text-muted-foreground">Total Guests</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-2xl font-serif text-foreground">₹{totalRevenue.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Total Revenue</div>
                </div>
                <div className="bg-amber-500/10 rounded-lg p-4">
                  <div className="text-2xl font-serif text-amber-600">{pendingBookings.length}</div>
                  <div className="text-xs text-amber-600">Pending Payment</div>
                </div>
              </div>

              {/* Bookings Table */}
              {bookings && bookings.length > 0 ? (
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Customer</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead className="text-center">Guests</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-center">Payment</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-foreground">{booking.customer_name}</div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {booking.customer_email}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {booking.customer_phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3.5 w-3.5 text-primary" />
                                {format(parseISO(booking.booking_date), 'PPP')}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {booking.time_slot}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              {booking.guests}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 font-medium">
                              <IndianRupee className="h-3.5 w-3.5" />
                              {booking.total_amount.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}
                              className={booking.payment_status === 'paid' ? 'bg-primary' : 'bg-amber-500/20 text-amber-700'}
                            >
                              {booking.payment_status === 'paid' ? (
                                <><CheckCircle className="h-3 w-3 mr-1" /> Paid</>
                              ) : (
                                <><Clock className="h-3 w-3 mr-1" /> Pending</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant="outline"
                              className={
                                booking.booking_status === 'confirmed' 
                                  ? 'border-primary/30 text-primary' 
                                  : booking.booking_status === 'cancelled'
                                    ? 'border-destructive/30 text-destructive'
                                    : 'border-amber-500/30 text-amber-600'
                              }
                            >
                              {booking.booking_status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No registrations yet for this workshop</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WorkshopBookingsDialog;
