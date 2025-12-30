import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { 
  Trash2, 
  Mail, 
  Phone, 
  Calendar, 
  Ruler, 
  FileText, 
  Loader2, 
  MapPin, 
  Image, 
  X, 
  Send, 
  CreditCard, 
  Truck, 
  Package,
  IndianRupee,
  User,
  Search,
  Palette
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface EmailSent {
  type: string;
  sent_at: string;
}

interface CustomOrderRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  preferred_size: string;
  usage_description: string;
  notes: string | null;
  shipping_address: string | null;
  reference_images: string[] | null;
  status: string;
  admin_notes: string | null;
  estimated_price: number | null;
  estimated_delivery_date: string | null;
  created_at: string;
  emails_sent: EmailSent[] | null;
}

const statusOptions = [
  { value: "pending", label: "Pending", gradient: "from-amber-400 to-yellow-500", bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500", order: 0, className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "under_review", label: "Under Review", gradient: "from-blue-400 to-indigo-500", bg: "bg-blue-50", text: "text-blue-800", dot: "bg-blue-500", order: 1, className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "payment_pending", label: "Payment Pending", gradient: "from-orange-400 to-red-400", bg: "bg-orange-50", text: "text-orange-800", dot: "bg-orange-500", order: 2, className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400" },
  { value: "payment_done", label: "Payment Done", gradient: "from-emerald-400 to-teal-500", bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500", order: 3, className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { value: "in_progress", label: "In Progress", gradient: "from-violet-400 to-purple-500", bg: "bg-violet-50", text: "text-violet-800", dot: "bg-violet-500", order: 4, className: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400" },
  { value: "in_delivery", label: "In Delivery", gradient: "from-cyan-400 to-blue-500", bg: "bg-cyan-50", text: "text-cyan-800", dot: "bg-cyan-500", order: 5, className: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400" },
  { value: "delivered", label: "Delivered", gradient: "from-green-400 to-emerald-500", bg: "bg-green-50", text: "text-green-800", dot: "bg-green-500", order: 6, className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400" },
  { value: "rejected", label: "Rejected", gradient: "from-rose-400 to-red-500", bg: "bg-rose-50", text: "text-rose-800", dot: "bg-rose-500", order: 7, className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400" },
];

const getStatusOrder = (status: string) => {
  const option = statusOptions.find((o) => o.value === status);
  return option?.order ?? 0;
};

const canTransitionTo = (currentStatus: string, targetStatus: string) => {
  if (currentStatus === "rejected") return false;
  if (currentStatus === "delivered") return false;
  if (targetStatus === "rejected") return true;
  return getStatusOrder(targetStatus) > getStatusOrder(currentStatus);
};

const emailTemplates = [
  { value: "payment_request", label: "Request Payment", icon: CreditCard, description: "Send payment link to customer" },
  { value: "payment_confirmed", label: "Payment Confirmed", icon: Package, description: "Notify that production has started" },
  { value: "in_delivery", label: "Out for Delivery", icon: Truck, description: "Product is on its way" },
  { value: "delivered", label: "Delivered", icon: Package, description: "Order has been delivered" },
  { value: "custom", label: "Custom Message", icon: Mail, description: "Send a custom email" },
];

const AdminCustomOrders = () => {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<CustomOrderRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editData, setEditData] = useState({
    status: "",
    admin_notes: "",
    estimated_price: "",
    estimated_delivery_date: "",
  });
  const [emailType, setEmailType] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteRequestId, setDeleteRequestId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["custom-order-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_order_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as CustomOrderRequest[];
    },
  });

  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    return requests.filter((request) => {
      if (statusFilter !== "all" && request.status !== statusFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!request.name.toLowerCase().includes(query) && 
            !request.email.toLowerCase().includes(query) &&
            !request.usage_description.toLowerCase().includes(query)) return false;
      }
      return true;
    });
  }, [requests, statusFilter, searchQuery]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Omit<CustomOrderRequest, 'emails_sent'>> & { id: string }) => {
      const { id, ...data } = updates;
      const { error } = await supabase
        .from("custom_order_requests")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-order-requests"] });
      toast.success("Request updated successfully");
    },
    onError: () => {
      toast.error("Failed to update request");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("custom_order_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-order-requests"] });
      toast.success("Request deleted");
      setIsDeleteDialogOpen(false);
      setDeleteRequestId(null);
    },
    onError: () => {
      toast.error("Failed to delete request");
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async ({ requestId, imageUrl, allImages }: { requestId: string; imageUrl: string; allImages: string[] }) => {
      const urlParts = imageUrl.split('/custom-order-images/');
      if (urlParts.length < 2) throw new Error('Invalid image URL');
      const filePath = urlParts[1];

      const { error: storageError } = await supabase.storage
        .from('custom-order-images')
        .remove([filePath]);

      if (storageError) throw storageError;

      const updatedImages = allImages.filter(img => img !== imageUrl);
      const { error: dbError } = await supabase
        .from('custom_order_requests')
        .update({ reference_images: updatedImages })
        .eq('id', requestId);

      if (dbError) throw dbError;

      return { requestId, updatedImages };
    },
    onSuccess: ({ requestId, updatedImages }) => {
      queryClient.invalidateQueries({ queryKey: ["custom-order-requests"] });
      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest({ ...selectedRequest, reference_images: updatedImages });
      }
      toast.success("Image deleted");
    },
    onError: (error) => {
      console.error('Error deleting image:', error);
      toast.error("Failed to delete image");
    },
  });

  const handleDeleteRequest = (requestId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteRequestId(requestId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteRequest = () => {
    if (deleteRequestId) {
      deleteMutation.mutate(deleteRequestId);
    }
  };

  const handleInlineStatusChange = async (requestId: string, newStatus: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    updateMutation.mutate({ id: requestId, status: newStatus });
  };

  const sendEmail = async () => {
    if (!selectedRequest || !emailType) return;

    if (emailType === "payment_request" && !selectedRequest.estimated_price) {
      toast.error("Please set an estimated price before sending payment request");
      return;
    }

    if (emailType === "custom" && !customMessage.trim()) {
      toast.error("Please enter a custom message");
      return;
    }

    setIsSendingEmail(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://grdolasawzsrwuqhpheu.supabase.co/functions/v1/send-custom-order-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.session?.access_token}`,
          },
          body: JSON.stringify({
            customOrderId: selectedRequest.id,
            emailType,
            customMessage: emailType === "custom" ? customMessage : undefined,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send email");
      }

      toast.success("Email sent successfully");
      setEmailType("");
      setCustomMessage("");
      queryClient.invalidateQueries({ queryKey: ["custom-order-requests"] });
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send email");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const openDetail = (request: CustomOrderRequest) => {
    setSelectedRequest(request);
    setEditData({
      status: request.status,
      admin_notes: request.admin_notes || "",
      estimated_price: request.estimated_price?.toString() || "",
      estimated_delivery_date: request.estimated_delivery_date || "",
    });
    setEmailType("");
    setCustomMessage("");
    setIsDetailOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedRequest) return;

    updateMutation.mutate({
      id: selectedRequest.id,
      status: editData.status,
      admin_notes: editData.admin_notes || null,
      estimated_price: editData.estimated_price ? parseFloat(editData.estimated_price) : null,
      estimated_delivery_date: editData.estimated_delivery_date || null,
    });
    setIsDetailOpen(false);
  };

  const getStatusConfig = (status: string) => {
    const option = statusOptions.find((o) => o.value === status);
    return option || statusOptions[0];
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
            <h2 className="font-serif text-2xl font-semibold">Custom Order Requests</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage bespoke pottery requests from customers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm px-3 py-1.5 gap-1.5">
              <Palette className="h-3.5 w-3.5" />
              {requests?.length || 0} Requests
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Requests", value: requests?.length || 0 },
            { label: "Pending", value: requests?.filter((r) => r.status === "pending" || r.status === "under_review").length || 0 },
            { label: "In Progress", value: requests?.filter((r) => r.status === "in_progress" || r.status === "payment_done").length || 0 },
            { label: "Delivered", value: requests?.filter((r) => r.status === "delivered").length || 0 },
          ].map((stat) => (
            <div key={stat.label} className="bg-card p-4 rounded-xl border border-border/60">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-serif text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-card border border-border/60 rounded-xl p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer name, email, or description..."
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44 h-9 text-xs">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${option.dot}`} />
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(statusFilter !== 'all' || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => { setStatusFilter('all'); setSearchQuery(''); }}
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </Button>
            )}

            {filteredRequests.length !== (requests?.length || 0) && (
              <Badge variant="secondary" className="text-xs px-2 py-1">
                {filteredRequests.length} of {requests?.length || 0}
              </Badge>
            )}
          </div>
        </div>

        {/* Requests Grid */}
        {filteredRequests.length === 0 ? (
          <div className="bg-card border border-border/60 rounded-xl p-12 text-center text-muted-foreground">
            No custom order requests found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredRequests.map((request) => {
              const statusConfig = getStatusConfig(request.status);

              return (
                <div
                  key={request.id}
                  className="group relative bg-card border border-border/60 rounded-xl p-4 hover:shadow-lg hover:border-primary/20 transition-all duration-200 cursor-pointer"
                  onClick={() => openDetail(request)}
                >
                  {/* Delete button on hover */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleDeleteRequest(request.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete request</TooltipContent>
                  </Tooltip>

                  {/* Top Row - Customer & Price */}
                  <div className="flex items-start justify-between mb-3 pr-8">
                    <div>
                      <p className="font-semibold text-sm">{request.name}</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 cursor-default">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          Submitted on {format(new Date(request.created_at), 'dd MMM yyyy, hh:mm a')}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {request.estimated_price && (
                      <div className="text-right">
                        <p className="font-bold text-base flex items-center justify-end">
                          <IndianRupee className="h-3.5 w-3.5" />
                          {request.estimated_price.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Customer Details */}
                  <div className="mb-3 space-y-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5 cursor-default">
                          <Mail className="h-3 w-3 shrink-0" />
                          {request.email}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>Email: {request.email}</TooltipContent>
                    </Tooltip>
                    {request.phone && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5 cursor-default">
                            <Phone className="h-3 w-3 shrink-0" />
                            {request.phone}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>Phone: {request.phone}</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5 cursor-default">
                          <Ruler className="h-3 w-3 shrink-0" />
                          Size: {request.preferred_size}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>Preferred Size</TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Description Preview */}
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {request.usage_description}
                  </p>

                  {/* Status Badge & Images */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge className={`gap-1 text-[10px] px-2 py-0.5 ${statusConfig.className}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                      {statusConfig.label}
                    </Badge>
                    {request.reference_images && request.reference_images.length > 0 && (
                      <Badge variant="outline" className="gap-1 text-[10px] px-2 py-0.5">
                        <Image className="h-2.5 w-2.5" />
                        {request.reference_images.length} images
                      </Badge>
                    )}
                  </div>

                  {/* Status Selector */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={request.status}
                      onValueChange={(value) => handleInlineStatusChange(request.id, value)}
                    >
                      <SelectTrigger className="h-8 text-xs bg-muted/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => {
                          const isSelected = request.status === option.value;
                          const isDisabled = !canTransitionTo(request.status, option.value) && !isSelected;
                          return (
                            <SelectItem 
                              key={option.value} 
                              value={option.value}
                              disabled={isDisabled}
                            >
                              <span className={`flex items-center gap-2 text-xs ${isDisabled ? 'opacity-40' : ''}`}>
                                <span className={`w-2 h-2 rounded-full ${option.dot}`} />
                                {option.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Custom Order Request</DialogTitle>
            </DialogHeader>
            
            {selectedRequest && (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Customer Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{selectedRequest.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedRequest.email}</span>
                    </div>
                    {selectedRequest.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedRequest.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm capitalize">{selectedRequest.preferred_size} size</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Request Details */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Request Details</h3>
                  <div className="space-y-2">
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedRequest.usage_description}</p>
                    {selectedRequest.notes && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Additional Notes</p>
                        <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedRequest.notes}</p>
                      </div>
                    )}
                    {selectedRequest.shipping_address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-sm">{selectedRequest.shipping_address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reference Images */}
                {selectedRequest.reference_images && selectedRequest.reference_images.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Reference Images</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedRequest.reference_images.map((img, idx) => (
                          <div key={idx} className="relative group/img">
                            <img 
                              src={img} 
                              alt={`Reference ${idx + 1}`} 
                              className="w-full aspect-square object-cover rounded-lg"
                            />
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover/img:opacity-100 transition-opacity"
                              onClick={() => deleteImageMutation.mutate({
                                requestId: selectedRequest.id,
                                imageUrl: img,
                                allImages: selectedRequest.reference_images || []
                              })}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Admin Controls */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Admin Controls</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={editData.status} onValueChange={(value) => setEditData({ ...editData, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <span className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${option.dot}`} />
                                {option.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Estimated Price (₹)</Label>
                      <Input
                        type="number"
                        value={editData.estimated_price}
                        onChange={(e) => setEditData({ ...editData, estimated_price: e.target.value })}
                        placeholder="Enter price"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Estimated Delivery Date</Label>
                      <Input
                        type="date"
                        value={editData.estimated_delivery_date}
                        onChange={(e) => setEditData({ ...editData, estimated_delivery_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Admin Notes</Label>
                      <Textarea
                        value={editData.admin_notes}
                        onChange={(e) => setEditData({ ...editData, admin_notes: e.target.value })}
                        placeholder="Internal notes..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <Button onClick={handleUpdate} className="w-full">
                    Save Changes
                  </Button>
                </div>

                <Separator />

                {/* Email Actions */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Send Email</h3>
                  
                  <Select value={emailType} onValueChange={setEmailType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select email template" />
                    </SelectTrigger>
                    <SelectContent>
                      {emailTemplates.map((template) => (
                        <SelectItem key={template.value} value={template.value}>
                          <span className="flex items-center gap-2">
                            <template.icon className="h-4 w-4" />
                            {template.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {emailType === "custom" && (
                    <Textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Enter your custom message..."
                      rows={4}
                    />
                  )}

                  {emailType && (
                    <Button 
                      onClick={sendEmail} 
                      disabled={isSendingEmail}
                      className="w-full gap-2"
                    >
                      {isSendingEmail ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send Email
                    </Button>
                  )}

                  {/* Email History */}
                  {selectedRequest.emails_sent && selectedRequest.emails_sent.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Email History</p>
                      <div className="space-y-1">
                        {selectedRequest.emails_sent.map((email, idx) => (
                          <div key={idx} className="text-xs bg-muted/50 px-3 py-2 rounded flex justify-between">
                            <span className="capitalize">{email.type.replace(/_/g, ' ')}</span>
                            <span className="text-muted-foreground">{format(new Date(email.sent_at), 'dd MMM yyyy, HH:mm')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Custom Order Request</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this request? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteRequest}
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

export default AdminCustomOrders;
