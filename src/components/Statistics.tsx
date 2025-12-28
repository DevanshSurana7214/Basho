import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Activity,
  Target,
  Leaf,
  Droplets
} from "lucide-react";

const Statistics = () => {
  const stats = [
    {
      title: "Total Fields",
      value: "24",
      change: "+3 from last month",
      trend: "up",
      icon: BarChart3,
      color: "text-primary"
    },
    {
      title: "Average Yield",
      value: "4.8 t/ha",
      change: "+12% from last season",
      trend: "up", 
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Revenue",
      value: "$48,500",
      change: "+8% from last month",
      trend: "up",
      icon: DollarSign,
      color: "text-yellow-600"
    },
    {
      title: "Water Usage",
      value: "1,240 L",
      change: "-5% efficiency gain",
      trend: "down",
      icon: Droplets,
      color: "text-blue-600"
    }
  ];

  const achievements = [
    {
      title: "Yield Optimization",
      description: "Increased corn yield by 15% using AI recommendations",
      icon: Target,
      progress: 87,
      color: "text-green-600"
    },
    {
      title: "Water Conservation", 
      description: "Reduced irrigation costs by 20% with smart scheduling",
      icon: Droplets,
      progress: 94,
      color: "text-blue-600"
    },
    {
      title: "Sustainable Farming",
      description: "Lowered fertilizer usage by 10% while maintaining quality",
      icon: Leaf,
      progress: 76,
      color: "text-primary"
    }
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Farm Performance
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track your agricultural success with comprehensive analytics and insights
          </p>
        </div>

        {/* Key Statistics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => {
            const StatIcon = stat.icon;
            const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;
            return (
              <Card key={index} className="shadow-card hover:shadow-soft transition-all duration-300 border-0 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center`}>
                      <StatIcon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <TrendIcon className={`w-4 h-4 ${stat.trend === "up" ? "text-green-500" : "text-blue-500"}`} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className={`text-xs ${stat.trend === "up" ? "text-green-600" : "text-blue-600"}`}>
                      {stat.change}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Achievements */}
        <div className="grid md:grid-cols-3 gap-6">
          {achievements.map((achievement, index) => {
            const AchievementIcon = achievement.icon;
            return (
              <Card key={index} className="shadow-card hover:shadow-soft transition-all duration-300 border-0 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <AchievementIcon className={`w-6 h-6 ${achievement.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{achievement.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{achievement.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-primary to-primary-glow h-2 rounded-full transition-all duration-500"
                        style={{ width: `${achievement.progress}%` }}
                      ></div>
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

export default Statistics;