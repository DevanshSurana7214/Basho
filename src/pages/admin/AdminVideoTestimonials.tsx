import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Star, CheckCircle, XCircle, Video, Loader2, Play } from 'lucide-react';
import { format } from 'date-fns';

interface VideoTestimonial {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  customer_name: string | null;
  experience_type: string | null;
  is_approved: boolean | null;
  is_featured: boolean | null;
  duration_seconds: number | null;
  created_at: string;
}

const AdminVideoTestimonials = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: testimonials, isLoading } = useQuery({
    queryKey: ['admin-video-testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VideoTestimonial[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<VideoTestimonial> }) => {
      const { error } = await supabase
        .from('video_testimonials')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-video-testimonials'] });
      toast({ title: 'Testimonial updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating testimonial', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('video_testimonials')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-video-testimonials'] });
      toast({ title: 'Testimonial deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting testimonial', description: error.message, variant: 'destructive' });
    },
  });

  const handleToggleApproved = (id: string, currentValue: boolean | null) => {
    updateMutation.mutate({ id, updates: { is_approved: !currentValue } });
  };

  const handleToggleFeatured = (id: string, currentValue: boolean | null) => {
    updateMutation.mutate({ id, updates: { is_featured: !currentValue } });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this testimonial?')) {
      deleteMutation.mutate(id);
    }
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
        <div>
          <h2 className="font-serif text-xl">Video Testimonials</h2>
          <p className="text-sm text-muted-foreground">
            Manage customer video testimonials for the media page
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Testimonial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Video Testimonial</DialogTitle>
            </DialogHeader>
            <AddTestimonialForm 
              onSuccess={() => {
                setIsAddDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['admin-video-testimonials'] });
              }}
              uploading={uploading}
              setUploading={setUploading}
            />
          </DialogContent>
        </Dialog>
      </div>

      {testimonials && testimonials.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Preview</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead className="text-center">Approved</TableHead>
                <TableHead className="text-center">Featured</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testimonials.map((testimonial) => (
                <TableRow key={testimonial.id}>
                  <TableCell>
                    <button
                      onClick={() => setPreviewVideo(testimonial.video_url)}
                      className="relative group w-16 h-12 rounded overflow-hidden bg-muted flex items-center justify-center"
                    >
                      {testimonial.thumbnail_url ? (
                        <img 
                          src={testimonial.thumbnail_url} 
                          alt={testimonial.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Video className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="h-4 w-4 text-white" />
                      </div>
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">{testimonial.title}</TableCell>
                  <TableCell>{testimonial.customer_name || '-'}</TableCell>
                  <TableCell>
                    {testimonial.experience_type && (
                      <Badge variant="secondary" className="capitalize">
                        {testimonial.experience_type}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={testimonial.is_approved || false}
                      onCheckedChange={() => handleToggleApproved(testimonial.id, testimonial.is_approved)}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={testimonial.is_featured || false}
                      onCheckedChange={() => handleToggleFeatured(testimonial.id, testimonial.is_featured)}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(testimonial.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(testimonial.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">No video testimonials yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first video testimonial to display on the media page
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Testimonial
          </Button>
        </div>
      )}

      {/* Video Preview Dialog */}
      <Dialog open={!!previewVideo} onOpenChange={() => setPreviewVideo(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <video
            src={previewVideo || ''}
            controls
            autoPlay
            className="w-full aspect-video"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface AddTestimonialFormProps {
  onSuccess: () => void;
  uploading: boolean;
  setUploading: (uploading: boolean) => void;
}

const AddTestimonialForm = ({ onSuccess, uploading, setUploading }: AddTestimonialFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [experienceType, setExperienceType] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isApproved, setIsApproved] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !videoFile) {
      toast({ title: 'Please fill in required fields', variant: 'destructive' });
      return;
    }

    setUploading(true);

    try {
      // Upload video to storage
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('video-testimonials')
        .upload(fileName, videoFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('video-testimonials')
        .getPublicUrl(fileName);

      // Insert testimonial record
      const { error: insertError } = await supabase
        .from('video_testimonials')
        .insert({
          title,
          description: description || null,
          customer_name: customerName || null,
          experience_type: experienceType || null,
          video_url: publicUrl,
          is_approved: isApproved,
          is_featured: isFeatured,
        });

      if (insertError) throw insertError;

      toast({ title: 'Testimonial added successfully' });
      onSuccess();
    } catch (error: any) {
      toast({ 
        title: 'Error adding testimonial', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Amazing pottery experience"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the testimonial"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customerName">Customer Name</Label>
          <Input
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g., John Doe"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="experienceType">Experience Type</Label>
          <Select value={experienceType} onValueChange={setExperienceType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wheel">Wheel Throwing</SelectItem>
              <SelectItem value="handbuilding">Handbuilding</SelectItem>
              <SelectItem value="date-night">Date Night</SelectItem>
              <SelectItem value="kids">Kids Workshop</SelectItem>
              <SelectItem value="corporate">Corporate Event</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="video">Video File *</Label>
        <Input
          id="video"
          type="file"
          accept="video/*"
          onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Supported formats: MP4, MOV, WebM (max 50MB)
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch
            id="approved"
            checked={isApproved}
            onCheckedChange={setIsApproved}
          />
          <Label htmlFor="approved" className="text-sm">Approved</Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="featured"
            checked={isFeatured}
            onCheckedChange={setIsFeatured}
          />
          <Label htmlFor="featured" className="text-sm">Featured</Label>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={uploading}>
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Add Testimonial
          </>
        )}
      </Button>
    </form>
  );
};

export default AdminVideoTestimonials;
