import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  Thermometer, 
  Droplets, 
  Wind, 
  Eye,
  Sunrise,
  Sunset
} from "lucide-react";

const WeatherDashboard = () => {
  const currentWeather = {
    temperature: 24,
    condition: "Partly Cloudy",
    humidity: 68,
    windSpeed: 12,
    visibility: 10,
    uvIndex: 6,
    sunrise: "6:42 AM",
    sunset: "7:18 PM",
    icon: Cloud
  };

  const forecast = [
    { day: "Today", high: 26, low: 18, condition: "Partly Cloudy", icon: Cloud, rain: 20 },
    { day: "Tomorrow", high: 28, low: 20, condition: "Sunny", icon: Sun, rain: 5 },
    { day: "Thursday", high: 25, low: 19, condition: "Light Rain", icon: CloudRain, rain: 80 },
    { day: "Friday", high: 23, low: 17, condition: "Rainy", icon: CloudRain, rain: 90 },
    { day: "Saturday", high: 27, low: 19, condition: "Sunny", icon: Sun, rain: 10 },
  ];

  const WeatherIcon = currentWeather.icon;

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Weather Monitoring
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time weather data and forecasts to help you make informed farming decisions
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Current Weather */}
          <Card className="lg:col-span-2 shadow-card hover:shadow-soft transition-all duration-300 border-0 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <WeatherIcon className="w-5 h-5 text-primary" />
                Current Weather
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-4xl font-bold text-foreground mb-1">
                    {currentWeather.temperature}°C
                  </div>
                  <div className="text-lg text-muted-foreground">
                    {currentWeather.condition}
                  </div>
                </div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <WeatherIcon className="w-8 h-8 text-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Droplets className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground">Humidity</div>
                  <div className="font-semibold">{currentWeather.humidity}%</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Wind className="w-5 h-5 text-gray-500 mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground">Wind</div>
                  <div className="font-semibold">{currentWeather.windSpeed} km/h</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Eye className="w-5 h-5 text-purple-500 mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground">Visibility</div>
                  <div className="font-semibold">{currentWeather.visibility} km</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Sun className="w-5 h-5 text-yellow-500 mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground">UV Index</div>
                  <div className="font-semibold">{currentWeather.uvIndex}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sun Times */}
          <Card className="shadow-card hover:shadow-soft transition-all duration-300 border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sunrise className="w-5 h-5 text-primary" />
                Sun Times
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Sunrise className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Sunrise</span>
                </div>
                <span className="font-semibold">{currentWeather.sunrise}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Sunset className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Sunset</span>
                </div>
                <span className="font-semibold">{currentWeather.sunset}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 5-Day Forecast */}
        <Card className="shadow-card hover:shadow-soft transition-all duration-300 border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>5-Day Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {forecast.map((day, index) => {
                const DayIcon = day.icon;
                return (
                  <div key={index} className="text-center p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors duration-200">
                    <div className="text-sm text-muted-foreground mb-2">{day.day}</div>
                    <div className="w-10 h-10 mx-auto mb-2 bg-primary/10 rounded-full flex items-center justify-center">
                      <DayIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">{day.condition}</div>
                    <div className="flex justify-center gap-1 text-sm mb-2">
                      <span className="font-semibold">{day.high}°</span>
                      <span className="text-muted-foreground">{day.low}°</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-xs text-blue-600">
                      <Droplets className="w-3 h-3" />
                      {day.rain}%
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default WeatherDashboard;