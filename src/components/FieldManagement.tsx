import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Edit, Trash2, Wheat, Sprout, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AddFieldModal from "@/components/modals/AddFieldModal";
import ViewFieldModal from "@/components/modals/ViewFieldModal";
import { Field } from "@/hooks/useAppState";

interface FieldManagementProps {
  appState: any;
}

const FieldManagement = ({ appState }: FieldManagementProps) => {
  const { toast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedField, setSelectedField] = useState<Field | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Growing": return "bg-primary/20 text-primary";
      case "Flowering": return "bg-accent/20 text-accent-foreground";
      case "Vegetative": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "Excellent": return "text-primary";
      case "Good": return "text-accent-foreground";
      case "Fair": return "text-orange-600";
      default: return "text-muted-foreground";
    }
  };

  const handleViewField = (field: Field) => {
    setSelectedField(field);
    setShowViewModal(true);
  };

  const handleEditField = (field: Field) => {
    toast({
      title: "Edit Field",
      description: `Opening editor for ${field.name}`
    });
  };

  const handleDeleteField = (field: Field) => {
    appState.deleteField(field.id);
    toast({
      title: "Field Deleted",
      description: `${field.name} has been removed from your farm.`
    });
  };

  return (
    <>
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Field Management
              </h2>
              <p className="text-lg text-muted-foreground">
                Monitor and manage all your agricultural fields in one place
              </p>
            </div>
            <Button 
              className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Field
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appState.fields.map((field) => {
              const CropIcon = field.crop === 'Wheat' ? Wheat : Sprout;
              return (
                <Card key={field.id} className="shadow-card hover:shadow-soft transition-all duration-300 border-0 bg-card/80 backdrop-blur-sm group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <CropIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold">
                            {field.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{field.crop}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(field.status)}>
                        {field.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Area</p>
                          <p className="font-medium">{field.area} acres</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Soil Type</p>
                          <p className="font-medium">{field.soilType}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Soil Health</p>
                          <p className={`font-medium ${getHealthColor(field.soilHealth)}`}>
                            {field.soilHealth}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Planted</p>
                          <p className="font-medium">{field.plantingDate}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
                        <MapPin className="w-3 h-3" />
                        {field.coordinates}
                      </div>

                      <div className="flex gap-2 pt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleViewField(field)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleEditField(field)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteField(field)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <AddFieldModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={appState.addField}
      />

      <ViewFieldModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        field={selectedField}
      />
    </>
  );
};

export default FieldManagement;