import { Leaf, Menu, User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  appState: any;
}

const Header = ({ appState }: HeaderProps) => {
  const { toast } = useToast();

  const handleNavigation = (section: string) => {
    appState.setActiveSection(section);
    toast({
      title: "Navigation",
      description: `Switched to ${section.charAt(0).toUpperCase() + section.slice(1)} section`
    });
  };

  const handleNotifications = () => {
    toast({
      title: "Notifications",
      description: "3 new recommendations available for your fields"
    });
  };
  return (
    <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center shadow-glow">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">AI-AgriSense</h1>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Button 
            variant={appState.activeSection === 'dashboard' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => handleNavigation('dashboard')}
          >
            Dashboard
          </Button>
          <Button 
            variant={appState.activeSection === 'fields' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => handleNavigation('fields')}
          >
            Fields
          </Button>
          <Button 
            variant={appState.activeSection === 'predictions' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => handleNavigation('predictions')}
          >
            Predictions
          </Button>
          <Button 
            variant={appState.activeSection === 'recommendations' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => handleNavigation('recommendations')}
          >
            Reports
          </Button>
        </nav>

        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={handleNotifications}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full"></span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast({ title: "Profile", description: "Opening user profile..." })}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast({ title: "Settings", description: "Opening settings..." })}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast({ title: "Logout", description: "Logging out..." })}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;