import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TimeSlot {
  time: string;
  max_spots: number;
  booked: number;
}

interface Workshop {
  id: string;
  title: string;
  workshop_date: string | null;
  time_slots: unknown;
  location: string | null;
  is_active: boolean | null;
  price: number;
}

interface DayWorkshops {
  date: Date;
  workshops: Workshop[];
  totalBookings: number;
}

const WorkshopBookingsCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayWorkshops | null>(null);

  const { data: workshops, isLoading } = useQuery({
    queryKey: ['admin-workshops-calendar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workshops')
        .select('id, title, workshop_date, time_slots, location, is_active, price')
        .not('workshop_date', 'is', null)
        .order('workshop_date', { ascending: true });
      if (error) throw error;
      return data as Workshop[];
    },
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the day of week for the first day (0 = Sunday)
  const startDayOfWeek = monthStart.getDay();
  
  // Create padding for days before the month starts
  const paddingDays = Array.from({ length: startDayOfWeek }, (_, i) => null);

  const getBookingsForDay = (date: Date): DayWorkshops => {
    const dayWorkshops = workshops?.filter(workshop => {
      if (!workshop.workshop_date) return false;
      return isSameDay(new Date(workshop.workshop_date), date);
    }) || [];

    const totalBookings = dayWorkshops.reduce((sum, workshop) => {
      if (!workshop.time_slots || !Array.isArray(workshop.time_slots)) return sum;
      return sum + (workshop.time_slots as TimeSlot[]).reduce((slotSum, slot) => slotSum + (slot.booked || 0), 0);
    }, 0);

    return { date, workshops: dayWorkshops, totalBookings };
  };

  const calendarData = useMemo(() => {
    return daysInMonth.map(day => getBookingsForDay(day));
  }, [daysInMonth, workshops]);

  const getTotalSpotsForWorkshop = (workshop: Workshop): number => {
    if (!workshop.time_slots || !Array.isArray(workshop.time_slots)) return 0;
    return (workshop.time_slots as TimeSlot[]).reduce((sum, slot) => sum + (slot.max_spots || 0), 0);
  };

  const getTotalBookingsForWorkshop = (workshop: Workshop): number => {
    if (!workshop.time_slots || !Array.isArray(workshop.time_slots)) return 0;
    return (workshop.time_slots as TimeSlot[]).reduce((sum, slot) => sum + (slot.booked || 0), 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg">{format(currentMonth, 'MMMM yyyy')}</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-border rounded-lg overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-muted">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-b border-border">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {/* Padding for days before month starts */}
          {paddingDays.map((_, index) => (
            <div key={`padding-${index}`} className="min-h-[100px] p-2 bg-muted/30 border-b border-r border-border" />
          ))}
          
          {/* Actual days */}
          {calendarData.map((dayData, index) => (
            <div
              key={index}
              onClick={() => dayData.workshops.length > 0 && setSelectedDay(dayData)}
              className={cn(
                "min-h-[100px] p-2 border-b border-r border-border transition-colors",
                dayData.workshops.length > 0 && "cursor-pointer hover:bg-muted/50",
                isToday(dayData.date) && "bg-primary/5"
              )}
            >
              <div className={cn(
                "text-sm mb-1",
                isToday(dayData.date) && "font-bold text-primary"
              )}>
                {format(dayData.date, 'd')}
              </div>
              
              {dayData.workshops.length > 0 && (
                <div className="space-y-1">
                  {dayData.workshops.slice(0, 2).map((workshop, wIndex) => (
                    <div
                      key={wIndex}
                      className={cn(
                        "text-xs p-1 rounded truncate",
                        workshop.is_active 
                          ? "bg-primary/10 text-primary" 
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {workshop.title}
                    </div>
                  ))}
                  {dayData.workshops.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayData.workshops.length - 2} more
                    </div>
                  )}
                  {dayData.totalBookings > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {dayData.totalBookings}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Day Detail Dialog */}
      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Workshops on {selectedDay && format(selectedDay.date, 'MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {selectedDay?.workshops.map((workshop) => (
                <div key={workshop.id} className="p-4 border border-border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{workshop.title}</h4>
                      {workshop.location && (
                        <p className="text-sm text-muted-foreground">{workshop.location}</p>
                      )}
                    </div>
                    <Badge variant={workshop.is_active ? "default" : "secondary"}>
                      {workshop.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {getTotalBookingsForWorkshop(workshop)}/{getTotalSpotsForWorkshop(workshop)} booked
                    </span>
                    <span className="text-primary font-medium">₹{workshop.price.toLocaleString()}</span>
                  </div>

                  {/* Time Slots */}
                  {workshop.time_slots && Array.isArray(workshop.time_slots) && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Time Slots</p>
                      <div className="flex flex-wrap gap-2">
                        {(workshop.time_slots as TimeSlot[]).map((slot, index) => (
                          <div key={index} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                            <Clock className="h-3 w-3" />
                            {slot.time}
                            <Badge variant="outline" className="text-xs ml-1">
                              {slot.booked}/{slot.max_spots}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkshopBookingsCalendar;
