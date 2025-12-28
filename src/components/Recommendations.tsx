import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Droplets, 
  Zap, 
  Bug, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RecommendationsProps {
  appState: any;
}

const Recommendations = ({ appState }: RecommendationsProps) => {
  const { toast } = useToast();

  const handleTakeAction = (recommendationId: number) => {
    appState.completeRecommendation(recommendationId);
    toast({
      title: "Action Completed",
      description: "Recommendation has been marked as completed"
    });
  };

  const handleSendSMS = (recommendationId: number) => {
    appState.sendSMSAlert(recommendationId);
    toast({
      title: "SMS Alert Sent",
      description: "Notification has been sent to your mobile device"
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-800 border-red-200";
      case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Irrigation": return "bg-blue-50 text-blue-700";
      case "Fertilizer": return "bg-yellow-50 text-yellow-700";
      case "Pest Control": return "bg-red-50 text-red-700";
      case "Harvest": return "bg-green-50 text-green-700";
      default: return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Smart Recommendations
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered actionable insights to optimize your crop management and maximize yields
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {appState.recommendations.map((rec) => {
            const getIcon = (type: string) => {
              switch (type) {
                case "Irrigation": return Droplets;
                case "Fertilizer": return Zap;
                case "Pest Control": return Bug;
                case "Harvest": return Calendar;
                default: return AlertTriangle;
              }
            };
            
            const getColor = (type: string) => {
              switch (type) {
                case "Irrigation": return "text-blue-600";
                case "Fertilizer": return "text-yellow-600";
                case "Pest Control": return "text-red-600";
                case "Harvest": return "text-green-600";
                default: return "text-gray-600";
              }
            };
            
            const RecommendationIcon = getIcon(rec.type);
            const iconColor = getColor(rec.type);
            
            return (
              <Card key={rec.id} className="shadow-card hover:shadow-soft transition-all duration-300 border-0 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getTypeColor(rec.type)}`}>
                        <RecommendationIcon className={`w-6 h-6 ${iconColor}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getTypeColor(rec.type)} variant="secondary">
                            {rec.type}
                          </Badge>
                          <Badge className={getPriorityColor(rec.priority)} variant="outline">
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.field}</p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {rec.confidence}% sure
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {rec.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {rec.description}
                      </p>
                    </div>

                    <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Recommended Action</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rec.action}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {rec.timeframe}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        className={`flex-1 transition-all duration-300 ${
                          rec.completed 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow'
                        }`}
                        size="sm"
                        onClick={() => handleTakeAction(rec.id)}
                        disabled={rec.completed}
                      >
                        {rec.completed ? 'Completed' : 'Take Action'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSendSMS(rec.id)}
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        SMS Alert
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
  );
};

export default Recommendations;