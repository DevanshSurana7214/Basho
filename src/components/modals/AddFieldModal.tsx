import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Field } from "@/hooks/useAppState";

interface AddFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (field: Omit<Field, 'id'>) => void;
}

const AddFieldModal = ({ isOpen, onClose, onAdd }: AddFieldModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    crop: "",
    area: "",
    soilType: "",
    soilHealth: "",
    plantingDate: "",
    status: "Planning",
    coordinates: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.crop || !formData.area) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    onAdd({
      name: formData.name,
      crop: formData.crop,
      area: parseFloat(formData.area),
      soilType: formData.soilType,
      soilHealth: formData.soilHealth,
      plantingDate: formData.plantingDate,
      status: formData.status,
      coordinates: formData.coordinates
    });

    toast({
      title: "Field Added",
      description: `${formData.name} has been successfully added to your farm.`
    });

    // Reset form
    setFormData({
      name: "",
      crop: "",
      area: "",
      soilType: "",
      soilHealth: "",
      plantingDate: "",
      status: "Planning",
      coordinates: ""
    });

    onClose();
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Field</DialogTitle>
          <DialogDescription>
            Add a new field to your farm management system.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Field Name *</Label>
            <Input
              id="name"
              placeholder="e.g., North Field"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="crop">Crop Type *</Label>
            <Select value={formData.crop} onValueChange={(value) => handleChange('crop', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select crop type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Wheat">Wheat</SelectItem>
                <SelectItem value="Corn">Corn</SelectItem>
                <SelectItem value="Rice">Rice</SelectItem>
                <SelectItem value="Soybeans">Soybeans</SelectItem>
                <SelectItem value="Barley">Barley</SelectItem>
                <SelectItem value="Oats">Oats</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">Area (acres) *</Label>
            <Input
              id="area"
              type="number"
              step="0.1"
              placeholder="e.g., 12.5"
              value={formData.area}
              onChange={(e) => handleChange('area', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="soilType">Soil Type</Label>
            <Select value={formData.soilType} onValueChange={(value) => handleChange('soilType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select soil type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Clay">Clay</SelectItem>
                <SelectItem value="Sandy">Sandy</SelectItem>
                <SelectItem value="Loam">Loam</SelectItem>
                <SelectItem value="Clay Loam">Clay Loam</SelectItem>
                <SelectItem value="Sandy Loam">Sandy Loam</SelectItem>
                <SelectItem value="Silt">Silt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="soilHealth">Soil Health</Label>
            <Select value={formData.soilHealth} onValueChange={(value) => handleChange('soilHealth', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select soil health" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Excellent">Excellent</SelectItem>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Fair">Fair</SelectItem>
                <SelectItem value="Poor">Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plantingDate">Planting Date</Label>
            <Input
              id="plantingDate"
              type="date"
              value={formData.plantingDate}
              onChange={(e) => handleChange('plantingDate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coordinates">Coordinates</Label>
            <Input
              id="coordinates"
              placeholder="e.g., 40.7128°N, 74.0060°W"
              value={formData.coordinates}
              onChange={(e) => handleChange('coordinates', e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-primary to-primary-glow">
              Add Field
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFieldModal;