import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, Ruler, Beaker, Activity } from "lucide-react";
import { Field } from "@/hooks/useAppState";

interface ViewFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: Field | null;
}

const ViewFieldModal = ({ isOpen, onClose, field }: ViewFieldModalProps) => {
  if (!field) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Growing": return "bg-primary/20 text-primary";
      case "Flowering": return "bg-accent/20 text-accent-foreground";
      case "Vegetative": return "bg-muted text-muted-foreground";
      case "Planning": return "bg-blue-100 text-blue-800";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "Excellent": return "text-green-600";
      case "Good": return "text-blue-600";
      case "Fair": return "text-orange-600";
      case "Poor": return "text-red-600";
      default: return "text-muted-foreground";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {field.name}
            <Badge className={getStatusColor(field.status)}>
              {field.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Detailed information about this field
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card className="border-0 bg-muted/30">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Beaker className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Crop Type</p>
                      <p className="font-medium">{field.crop}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Area</p>
                      <p className="font-medium">{field.area} acres</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Soil Type</p>
                      <p className="font-medium">{field.soilType}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Soil Health</p>
                      <p className={`font-medium ${getHealthColor(field.soilHealth)}`}>
                        {field.soilHealth}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {field.plantingDate && (
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <Calendar className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Planting Date</p>
                <p className="font-medium">{field.plantingDate}</p>
              </div>
            </div>
          )}

          {field.coordinates && (
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <MapPin className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium text-sm">{field.coordinates}</p>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 rounded-lg">
            <h4 className="font-medium mb-2">AI Insights</h4>
            <p className="text-sm text-muted-foreground">
              Based on current conditions, this field shows optimal growth potential. 
              Consider monitoring soil moisture levels and adjusting irrigation schedule 
              for maximum yield efficiency.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button className="bg-gradient-to-r from-primary to-primary-glow">
              Generate Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewFieldModal;