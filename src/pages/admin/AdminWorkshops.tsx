import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, X, MapPin, Clock, Upload, Image as ImageIcon, CalendarDays, LayoutGrid, Copy, Users, IndianRupee, AlertCircle, CheckCircle2, Info, Eye } from 'lucide-react';
import { format } from 'date-fns';
import WorkshopBookingsCalendar from '@/components/admin/WorkshopBookingsCalendar';
import WorkshopBookingsDialog from '@/components/admin/WorkshopBookingsDialog';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Json } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface TimeSlot {
  time: string;
  max_spots: number;
  booked: number;
}

interface DateSlots {
  date: string;
  slots: TimeSlot[];
}

interface Workshop {
  id: string;
  title: string;
  description: string | null;
  tagline: string | null;
  price: number;
  workshop_type: string | null;
  duration: string | null;
  duration_days: number | null;
  max_participants: number | null;
  current_participants: number | null;
  workshop_date: string | null;
  image_url: string | null;
  is_active: boolean | null;
  location: string | null;
  maps_link: string | null;
  details: Json | null;
  time_slots: Json | null;
}

interface WorkshopFormData {
  title: string;
  description: string;
  tagline: string;
  price: string;
  workshop_type: string;
  duration: string;
  duration_days: string;
  image_url: string;
  is_active: boolean;
  location: string;
  maps_link: string;
  details: string[];
  date_slots: DateSlots[];
}

interface ValidationErrors {
  title?: string;
  price?: string;
  date_slots?: string;
  slots?: { [key: string]: string };
}

const defaultFormData: WorkshopFormData = {
  title: '',
  description: '',
  tagline: '',
  price: '',
  workshop_type: 'group',
  duration: '2 hours',
  duration_days: '1',
  image_url: '',
  is_active: true,
  location: '',
  maps_link: '',
  details: [''],
  date_slots: [{ date: '', slots: [{ time: '10:00 AM', max_spots: 10, booked: 0 }] }],
};

const AdminWorkshops = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [formData, setFormData] = useState<WorkshopFormData>(defaultFormData);
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isValidating, setIsValidating] = useState(false);
  const [selectedWorkshopForBookings, setSelectedWorkshopForBookings] = useState<Workshop | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Validation function
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Title validation
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
      isValid = false;
    } else if (formData.title.length < 3) {
      errors.title = 'Title must be at least 3 characters';
      isValid = false;
    } else if (formData.title.length > 100) {
      errors.title = 'Title must be less than 100 characters';
      isValid = false;
    }

    // Price validation
    const price = parseFloat(formData.price);
    if (!formData.price) {
      errors.price = 'Price is required';
      isValid = false;
    } else if (isNaN(price) || price < 0) {
      errors.price = 'Price must be a valid positive number';
      isValid = false;
    } else if (price > 1000000) {
      errors.price = 'Price seems too high';
      isValid = false;
    }

    // Date slots validation
    const slotErrors: { [key: string]: string } = {};
    let hasDateError = false;

    formData.date_slots.forEach((dateSlot, dateIndex) => {
      if (!dateSlot.date) {
        hasDateError = true;
      }
      
      dateSlot.slots.forEach((slot, slotIndex) => {
        const key = `${dateIndex}-${slotIndex}`;
        
        if (!slot.time.trim()) {
          slotErrors[`${key}-time`] = 'Time is required';
          isValid = false;
        }
        
        if (slot.max_spots < 1) {
          slotErrors[`${key}-max`] = 'Must be at least 1';
          isValid = false;
        }
        
        if (slot.booked < 0) {
          slotErrors[`${key}-booked`] = 'Cannot be negative';
          isValid = false;
        }
        
        if (slot.booked > slot.max_spots) {
          slotErrors[`${key}-booked`] = 'Booked cannot exceed max spots';
          isValid = false;
        }
      });
    });

    if (hasDateError) {
      errors.date_slots = 'All dates must be selected';
      isValid = false;
    }

    if (Object.keys(slotErrors).length > 0) {
      errors.slots = slotErrors;
    }

    setValidationErrors(errors);
    return isValid;
  };

  // Clear specific error when field changes
  const clearError = (field: keyof ValidationErrors) => {
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const clearSlotError = (key: string) => {
    if (validationErrors.slots?.[key]) {
      setValidationErrors(prev => {
        const newSlots = { ...prev.slots };
        delete newSlots[key];
        return { ...prev, slots: Object.keys(newSlots).length > 0 ? newSlots : undefined };
      });
    }
  };

  const { data: workshops, isLoading } = useQuery({
    queryKey: ['admin-workshops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Workshop[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: WorkshopFormData) => {
      // Get first date as the main workshop_date for backwards compatibility
      const firstDate = data.date_slots[0]?.date || null;
      // Flatten all slots with their dates for storage
      const flatTimeSlots = data.date_slots.flatMap(ds => 
        ds.slots.map(slot => ({ ...slot, date: ds.date }))
      );
      const { error } = await supabase.from('workshops').insert({
        title: data.title,
        description: data.description || null,
        tagline: data.tagline || null,
        price: parseFloat(data.price),
        workshop_type: data.workshop_type,
        duration: data.duration || null,
        duration_days: parseInt(data.duration_days) || 1,
        max_participants: flatTimeSlots.reduce((sum, s) => sum + s.max_spots, 0),
        workshop_date: firstDate,
        image_url: data.image_url || null,
        is_active: data.is_active,
        location: data.location || null,
        maps_link: data.maps_link || null,
        details: data.details.filter(d => d.trim() !== '') as unknown as Json,
        time_slots: flatTimeSlots as unknown as Json,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workshops'] });
      toast.success('Workshop created successfully');
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error('Failed to create workshop: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: WorkshopFormData }) => {
      // Get first date as the main workshop_date for backwards compatibility
      const firstDate = data.date_slots[0]?.date || null;
      // Flatten all slots with their dates for storage
      const flatTimeSlots = data.date_slots.flatMap(ds => 
        ds.slots.map(slot => ({ ...slot, date: ds.date }))
      );
      const { error } = await supabase
        .from('workshops')
        .update({
          title: data.title,
          description: data.description || null,
          tagline: data.tagline || null,
          price: parseFloat(data.price),
          workshop_type: data.workshop_type,
          duration: data.duration || null,
          duration_days: parseInt(data.duration_days) || 1,
          max_participants: flatTimeSlots.reduce((sum, s) => sum + s.max_spots, 0),
          workshop_date: firstDate,
          image_url: data.image_url || null,
          is_active: data.is_active,
          location: data.location || null,
          maps_link: data.maps_link || null,
          details: data.details.filter(d => d.trim() !== '') as unknown as Json,
          time_slots: flatTimeSlots as unknown as Json,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workshops'] });
      toast.success('Workshop updated successfully');
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error('Failed to update workshop: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workshops').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workshops'] });
      toast.success('Workshop deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete workshop: ' + error.message);
    },
  });

  const handleOpenCreate = () => {
    setEditingWorkshop(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (workshop: Workshop) => {
    setEditingWorkshop(workshop);
    
    // Parse details from JSON
    let details: string[] = [''];
    if (workshop.details) {
      if (Array.isArray(workshop.details)) {
        details = workshop.details.length > 0 ? workshop.details as string[] : [''];
      }
    }

    // Parse time_slots from JSON and group by date
    let dateSlots: DateSlots[] = [{ date: '', slots: [{ time: '10:00 AM', max_spots: 10, booked: 0 }] }];
    if (workshop.time_slots && Array.isArray(workshop.time_slots)) {
      const slotsWithDates = workshop.time_slots as unknown as (TimeSlot & { date?: string })[];
      const groupedByDate = new Map<string, TimeSlot[]>();
      
      slotsWithDates.forEach(slot => {
        const date = slot.date || workshop.workshop_date || '';
        if (!groupedByDate.has(date)) {
          groupedByDate.set(date, []);
        }
        groupedByDate.get(date)!.push({ time: slot.time, max_spots: slot.max_spots, booked: slot.booked });
      });

      if (groupedByDate.size > 0) {
        dateSlots = Array.from(groupedByDate.entries()).map(([date, slots]) => ({ date, slots }));
      }
    }

    const durationDays = workshop.duration_days || 1;
    // Ensure we have the correct number of date entries
    while (dateSlots.length < durationDays) {
      dateSlots.push({ date: '', slots: [{ time: '10:00 AM', max_spots: 10, booked: 0 }] });
    }

    setFormData({
      title: workshop.title,
      description: workshop.description || '',
      tagline: workshop.tagline || '',
      price: workshop.price.toString(),
      workshop_type: workshop.workshop_type || 'group',
      duration: workshop.duration || '2 hours',
      duration_days: durationDays.toString(),
      image_url: workshop.image_url || '',
      is_active: workshop.is_active ?? true,
      location: workshop.location || '',
      maps_link: workshop.maps_link || '',
      details,
      date_slots: dateSlots,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingWorkshop(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors before submitting');
      setIsValidating(false);
      return;
    }
    
    setIsValidating(false);
    if (editingWorkshop) {
      updateMutation.mutate({ id: editingWorkshop.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this workshop?')) {
      deleteMutation.mutate(id);
    }
  };

  // Details management
  const addDetail = () => {
    setFormData({ ...formData, details: [...formData.details, ''] });
  };

  const updateDetail = (index: number, value: string) => {
    const newDetails = [...formData.details];
    newDetails[index] = value;
    setFormData({ ...formData, details: newDetails });
  };

  const removeDetail = (index: number) => {
    const newDetails = formData.details.filter((_, i) => i !== index);
    setFormData({ ...formData, details: newDetails.length > 0 ? newDetails : [''] });
  };

  // Handle duration_days change - adjust number of date fields
  useEffect(() => {
    const numDays = parseInt(formData.duration_days) || 1;
    const currentDates = formData.date_slots;
    
    if (numDays > currentDates.length) {
      // Add more date entries
      const newDateSlots = [...currentDates];
      for (let i = currentDates.length; i < numDays; i++) {
        newDateSlots.push({ date: '', slots: [{ time: '10:00 AM', max_spots: 10, booked: 0 }] });
      }
      setFormData(prev => ({ ...prev, date_slots: newDateSlots }));
    } else if (numDays < currentDates.length) {
      // Remove extra date entries
      setFormData(prev => ({ ...prev, date_slots: currentDates.slice(0, numDays) }));
    }
  }, [formData.duration_days]);

  // Date slots management
  const updateDateSlotDate = (dateIndex: number, date: string) => {
    const newDateSlots = [...formData.date_slots];
    newDateSlots[dateIndex] = { ...newDateSlots[dateIndex], date };
    setFormData({ ...formData, date_slots: newDateSlots });
  };

  const addTimeSlotToDate = (dateIndex: number) => {
    const newDateSlots = [...formData.date_slots];
    newDateSlots[dateIndex] = {
      ...newDateSlots[dateIndex],
      slots: [...newDateSlots[dateIndex].slots, { time: '', max_spots: 10, booked: 0 }]
    };
    setFormData({ ...formData, date_slots: newDateSlots });
  };

  const updateTimeSlot = (dateIndex: number, slotIndex: number, field: keyof TimeSlot, value: string | number) => {
    const newDateSlots = [...formData.date_slots];
    const newSlots = [...newDateSlots[dateIndex].slots];
    newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
    newDateSlots[dateIndex] = { ...newDateSlots[dateIndex], slots: newSlots };
    setFormData({ ...formData, date_slots: newDateSlots });
  };

  const removeTimeSlot = (dateIndex: number, slotIndex: number) => {
    const newDateSlots = [...formData.date_slots];
    const newSlots = newDateSlots[dateIndex].slots.filter((_, i) => i !== slotIndex);
    newDateSlots[dateIndex] = { 
      ...newDateSlots[dateIndex], 
      slots: newSlots.length > 0 ? newSlots : [{ time: '10:00 AM', max_spots: 10, booked: 0 }] 
    };
    setFormData({ ...formData, date_slots: newDateSlots });
  };

  const copyFromPreviousDate = (dateIndex: number) => {
    if (dateIndex === 0) return;
    const newDateSlots = [...formData.date_slots];
    const previousSlots = newDateSlots[dateIndex - 1].slots.map(slot => ({ ...slot, booked: 0 }));
    newDateSlots[dateIndex] = { ...newDateSlots[dateIndex], slots: previousSlots };
    setFormData({ ...formData, date_slots: newDateSlots });
    toast.success('Slots copied from previous date');
  };

  const copyFromPreviousSlot = (dateIndex: number, slotIndex: number) => {
    if (slotIndex === 0) return;
    const newDateSlots = [...formData.date_slots];
    const previousSlot = newDateSlots[dateIndex].slots[slotIndex - 1];
    const newSlots = [...newDateSlots[dateIndex].slots];
    newSlots[slotIndex] = { ...previousSlot, booked: 0 };
    newDateSlots[dateIndex] = { ...newDateSlots[dateIndex], slots: newSlots };
    setFormData({ ...formData, date_slots: newDateSlots });
    toast.success('Slot copied from previous');
  };

  // Image upload handler
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `thumbnails/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('workshop-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('workshop-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image: ' + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image_url: '' });
  };

  // Calculate total bookings for display
  const getTotalBookings = (timeSlots: Json | null): number => {
    if (!timeSlots || !Array.isArray(timeSlots)) return 0;
    return (timeSlots as unknown as TimeSlot[]).reduce((sum, slot) => sum + (slot.booked || 0), 0);
  };

  const getTotalSpots = (timeSlots: Json | null): number => {
    if (!timeSlots || !Array.isArray(timeSlots)) return 0;
    return (timeSlots as unknown as TimeSlot[]).reduce((sum, slot) => sum + (slot.max_spots || 0), 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">Workshops</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              Calendar
            </Button>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Workshop
          </Button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <WorkshopBookingsCalendar />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workshops?.map((workshop) => {
            const totalBooked = getTotalBookings(workshop.time_slots);
            const totalSpots = getTotalSpots(workshop.time_slots);
            const bookingPercentage = totalSpots > 0 ? (totalBooked / totalSpots) * 100 : 0;
            
            return (
              <div
                key={workshop.id}
                className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-warm transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedWorkshopForBookings(workshop)}
              >
                {/* Image */}
                <div className="aspect-[16/10] relative overflow-hidden bg-muted">
                  {workshop.image_url ? (
                    <img
                      src={workshop.image_url}
                      alt={workshop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge 
                      variant={workshop.is_active ? "default" : "secondary"}
                      className={workshop.is_active ? "bg-primary/90 backdrop-blur-sm" : "bg-muted/90 backdrop-blur-sm"}
                    >
                      {workshop.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {/* Type Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm capitalize">
                      {workshop.workshop_type}
                    </Badge>
                  </div>

                  {/* Hover Actions - Edit & Delete */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button 
                      size="icon"
                      variant="secondary" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(workshop);
                      }}
                      className="h-8 w-8 bg-background/90 backdrop-blur-sm hover:bg-background"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon"
                      variant="destructive" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(workshop.id);
                      }}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Title & Tagline */}
                  <div>
                    {workshop.tagline && (
                      <span className="text-[10px] tracking-[0.15em] uppercase text-primary font-medium">
                        {workshop.tagline}
                      </span>
                    )}
                    <h3 className="font-serif text-lg text-foreground line-clamp-1">
                      {workshop.title}
                    </h3>
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <IndianRupee className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium text-foreground">{workshop.price.toLocaleString()}</span>
                      <span>per person</span>
                    </div>
                    {workshop.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {workshop.duration_days && workshop.duration_days > 1 
                            ? `${workshop.duration_days} days` 
                            : workshop.duration}
                        </span>
                      </div>
                    )}
                  </div>

                  {workshop.location && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{workshop.location}</span>
                    </div>
                  )}

                  {/* Booking Progress */}
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>Bookings</span>
                      </div>
                      <span className="font-medium text-foreground">
                        {totalBooked}/{totalSpots}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          bookingPercentage >= 90 
                            ? 'bg-destructive' 
                            : bookingPercentage >= 50 
                              ? 'bg-amber-500' 
                              : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(bookingPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {workshops?.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-12 bg-muted/30 rounded-xl border border-dashed border-border">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>No workshops found</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first workshop
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 px-6 py-5 border-b border-border">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl flex items-center gap-3">
                {editingWorkshop ? (
                  <>
                    <Pencil className="h-5 w-5 text-primary" />
                    Edit Workshop
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 text-primary" />
                    Create New Workshop
                  </>
                )}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {editingWorkshop 
                  ? 'Update the workshop details below' 
                  : 'Fill in the details to create a new workshop experience'}
              </p>
            </DialogHeader>
          </div>
          
          <ScrollArea className="max-h-[calc(90vh-180px)]">
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Basic Info Card */}
              <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 py-4">
                  <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="title" className="text-sm font-medium">
                        Workshop Title <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => {
                          setFormData({ ...formData, title: e.target.value });
                          clearError('title');
                        }}
                        placeholder="e.g., Beginner Pottery Workshop"
                        className={`h-11 ${validationErrors.title ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                      {validationErrors.title && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {validationErrors.title}
                        </p>
                      )}
                    </div>
                    
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="tagline" className="text-sm font-medium">Tagline</Label>
                      <Input
                        id="tagline"
                        value={formData.tagline}
                        onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                        placeholder="A short catchy phrase that appears above the title"
                        className="h-11"
                      />
                    </div>
                    
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe what participants will learn and experience..."
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing & Type Card */}
              <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 py-4">
                  <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" />
                    Pricing & Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-medium">
                        Price per Person (₹) <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="price"
                          type="number"
                          value={formData.price}
                          onChange={(e) => {
                            setFormData({ ...formData, price: e.target.value });
                            clearError('price');
                          }}
                          placeholder="2500"
                          className={`h-11 pl-9 ${validationErrors.price ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        />
                      </div>
                      {validationErrors.price && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {validationErrors.price}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="workshop_type" className="text-sm font-medium">Workshop Type</Label>
                      <Select
                        value={formData.workshop_type}
                        onValueChange={(value) => setFormData({ ...formData, workshop_type: value })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="group">
                            <span className="flex items-center gap-2">
                              <Users className="h-4 w-4" /> Group Workshop
                            </span>
                          </SelectItem>
                          <SelectItem value="private">
                            <span className="flex items-center gap-2">
                              <Users className="h-4 w-4" /> Private (One-on-One)
                            </span>
                          </SelectItem>
                          <SelectItem value="kids">
                            <span className="flex items-center gap-2">
                              <Users className="h-4 w-4" /> Kids Workshop
                            </span>
                          </SelectItem>
                          <SelectItem value="masterclass">
                            <span className="flex items-center gap-2">
                              <Users className="h-4 w-4" /> Masterclass
                            </span>
                          </SelectItem>
                          <SelectItem value="corporate">
                            <span className="flex items-center gap-2">
                              <Users className="h-4 w-4" /> Corporate
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Duration & Location Card */}
              <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 py-4">
                  <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Duration & Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-sm font-medium">Session Duration</Label>
                      <Input
                        id="duration"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="e.g., 2 hours"
                        className="h-11"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="duration_days" className="text-sm font-medium">Number of Days</Label>
                      <Input
                        id="duration_days"
                        type="number"
                        min="1"
                        max="30"
                        value={formData.duration_days}
                        onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                        className="h-11"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="e.g., Koramangala, Bangalore"
                          className="h-11 pl-9"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="maps_link" className="text-sm font-medium">Google Maps Link</Label>
                      <Input
                        id="maps_link"
                        value={formData.maps_link}
                        onChange={(e) => setFormData({ ...formData, maps_link: e.target.value })}
                        placeholder="e.g., https://maps.google.com/..."
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">Paste the Google Maps share link for the workshop location</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule & Time Slots Card */}
              <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 py-4">
                  <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Schedule & Time Slots
                  </CardTitle>
                  {validationErrors.date_slots && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-2">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.date_slots}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="p-5 space-y-6">
                  {formData.date_slots.map((dateSlot, dateIndex) => (
                    <div key={dateIndex} className="rounded-xl border border-border/60 bg-gradient-to-br from-muted/20 to-muted/5 overflow-hidden">
                      {/* Date Header */}
                      <div className="bg-muted/40 px-4 py-3 border-b border-border/40">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">{dateIndex + 1}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Day {dateIndex + 1}</p>
                              <p className="text-xs text-muted-foreground">
                                {dateSlot.date 
                                  ? format(new Date(dateSlot.date), 'EEEE, MMMM d, yyyy')
                                  : 'Select a date below'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {dateIndex > 0 && (
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => copyFromPreviousDate(dateIndex)}
                                className="text-xs h-8"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy Day {dateIndex}
                              </Button>
                            )}
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={() => addTimeSlotToDate(dateIndex)}
                              className="text-xs h-8"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Slot
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-4">
                        {/* Date Picker */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Select Date
                          </Label>
                          <Input
                            type="date"
                            value={dateSlot.date}
                            onChange={(e) => {
                              updateDateSlotDate(dateIndex, e.target.value);
                              clearError('date_slots');
                            }}
                            className="h-10 w-full md:w-64"
                          />
                        </div>
                        
                        <Separator className="my-4" />
                        
                        {/* Time Slots */}
                        <div className="space-y-3">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Time Slots
                          </Label>
                          
                          <div className="grid gap-3">
                            {dateSlot.slots.map((slot, slotIndex) => {
                              const slotKey = `${dateIndex}-${slotIndex}`;
                              const timeError = validationErrors.slots?.[`${slotKey}-time`];
                              const maxError = validationErrors.slots?.[`${slotKey}-max`];
                              const bookedError = validationErrors.slots?.[`${slotKey}-booked`];
                              const hasSlotError = timeError || maxError || bookedError;
                              
                              return (
                                <div 
                                  key={slotIndex} 
                                  className={`flex flex-wrap md:flex-nowrap gap-3 items-start p-4 rounded-lg border transition-colors ${
                                    hasSlotError 
                                      ? 'border-destructive/50 bg-destructive/5' 
                                      : 'border-border/40 bg-background/50 hover:border-primary/30'
                                  }`}
                                >
                                  <div className="flex-1 min-w-[140px] space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Time</Label>
                                    <Input
                                      value={slot.time}
                                      onChange={(e) => {
                                        updateTimeSlot(dateIndex, slotIndex, 'time', e.target.value);
                                        clearSlotError(`${slotKey}-time`);
                                      }}
                                      placeholder="e.g., 10:00 AM"
                                      className={`h-10 ${timeError ? 'border-destructive' : ''}`}
                                    />
                                    {timeError && (
                                      <p className="text-[10px] text-destructive">{timeError}</p>
                                    )}
                                  </div>
                                  
                                  <div className="w-28 space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Max Spots</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={slot.max_spots}
                                      onChange={(e) => {
                                        updateTimeSlot(dateIndex, slotIndex, 'max_spots', parseInt(e.target.value) || 0);
                                        clearSlotError(`${slotKey}-max`);
                                        clearSlotError(`${slotKey}-booked`);
                                      }}
                                      className={`h-10 ${maxError ? 'border-destructive' : ''}`}
                                    />
                                    {maxError && (
                                      <p className="text-[10px] text-destructive">{maxError}</p>
                                    )}
                                  </div>
                                  
                                  <div className="w-28 space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Booked</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      max={slot.max_spots}
                                      value={slot.booked}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value) || 0;
                                        updateTimeSlot(dateIndex, slotIndex, 'booked', val);
                                        clearSlotError(`${slotKey}-booked`);
                                      }}
                                      className={`h-10 ${bookedError ? 'border-destructive' : ''}`}
                                    />
                                    {bookedError && (
                                      <p className="text-[10px] text-destructive">{bookedError}</p>
                                    )}
                                  </div>
                                  
                                  {/* Availability indicator */}
                                  <div className="w-24 space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Available</Label>
                                    <div className={`h-10 rounded-md flex items-center justify-center text-sm font-medium ${
                                      slot.max_spots - slot.booked <= 0 
                                        ? 'bg-destructive/10 text-destructive' 
                                        : slot.max_spots - slot.booked <= 3 
                                          ? 'bg-amber-500/10 text-amber-600' 
                                          : 'bg-primary/10 text-primary'
                                    }`}>
                                      {Math.max(0, slot.max_spots - slot.booked)}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-end gap-1 pt-6">
                                    {slotIndex > 0 && (
                                      <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => copyFromPreviousSlot(dateIndex, slotIndex)}
                                        title="Copy from previous slot"
                                        className="h-10 w-10"
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    )}
                                    {dateSlot.slots.length > 1 && (
                                      <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => removeTimeSlot(dateIndex, slotIndex)}
                                        className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Additional Details Card */}
              <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 py-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      What's Included
                    </CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addDetail} className="h-8">
                      <Plus className="h-3 w-3 mr-1" />
                      Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="space-y-3">
                    {formData.details.map((detail, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <Input
                          value={detail}
                          onChange={(e) => updateDetail(index, e.target.value)}
                          placeholder={`e.g., All materials included`}
                          className="flex-1 h-10"
                        />
                        {formData.details.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeDetail(index)}
                            className="h-10 w-10 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Media & Status Card */}
              <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 py-4">
                  <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Media & Visibility
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  {/* Image Upload */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Workshop Thumbnail</Label>
                    
                    {formData.image_url ? (
                      <div className="relative group rounded-xl overflow-hidden border border-border">
                        <img 
                          src={formData.image_url} 
                          alt="Workshop thumbnail" 
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 bg-charcoal/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Replace
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={removeImage}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="border-2 border-dashed border-border/60 rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-all duration-300"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Uploading...</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3">
                            <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center">
                              <Upload className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Click to upload an image</p>
                              <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    
                    {/* URL Input */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Or enter image URL directly:</p>
                      <Input
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="https://..."
                        className="h-10"
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Active Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${formData.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                        {formData.is_active ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Workshop Visibility</p>
                        <p className="text-xs text-muted-foreground">
                          {formData.is_active ? 'This workshop is visible to users' : 'This workshop is hidden from users'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </form>
          </ScrollArea>
          
          {/* Fixed Footer */}
          <div className="border-t border-border bg-muted/30 px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                <span className="text-destructive">*</span> Required fields
              </p>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={handleCloseDialog} className="px-6">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending || isValidating}
                  className="px-8"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingWorkshop ? 'Update Workshop' : 'Create Workshop'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Workshop Bookings Dialog */}
      <WorkshopBookingsDialog
        workshop={selectedWorkshopForBookings}
        open={!!selectedWorkshopForBookings}
        onOpenChange={(open) => !open && setSelectedWorkshopForBookings(null)}
      />
    </div>
  );
};

export default AdminWorkshops;
