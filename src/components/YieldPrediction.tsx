import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, MapPin, Thermometer, Droplets, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface YieldPredictionProps {
  appState: any;
}

const YieldPrediction = ({ appState }: YieldPredictionProps) => {
  const { toast } = useToast();
  
  const handleRunPrediction = async () => {
    toast({
      title: "AI Analysis Started",
      description: "Running advanced crop yield predictions..."
    });
    await appState.runPrediction();
    toast({
      title: "Predictions Updated",
      description: "New yield forecasts are now available"
    });
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            AI Yield Predictions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get accurate crop yield forecasts based on historical data, weather patterns, 
            and soil conditions to make informed farming decisions.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <Button 
            onClick={handleRunPrediction}
            disabled={appState.isLoading}
            className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300"
          >
            {appState.isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Data...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Run New Prediction
              </>
            )}
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {appState.predictions.map((prediction, index) => (
            <Card key={index} className="shadow-card hover:shadow-soft transition-all duration-300 border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold mb-1">
                      {prediction.field}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {prediction.location}
                    </div>
                  </div>
                  <Badge variant={prediction.confidence > 85 ? "default" : "secondary"}>
                    {prediction.confidence}% confidence
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Yield</p>
                      <p className="text-2xl font-bold">{prediction.currentYield} t/ha</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Predicted Yield</p>
                      <p className={`text-2xl font-bold ${
                        prediction.predictedYield > prediction.currentYield 
                          ? 'text-primary' 
                          : 'text-destructive'
                      }`}>
                        {prediction.predictedYield} t/ha
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Expected harvest: {prediction.harvest}
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Key Factors:</p>
                    <div className="flex flex-wrap gap-2">
                      {prediction.factors.map((factor, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default YieldPrediction;