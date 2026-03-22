import { useState } from "react";
import { 
  Home, 
  Cloud, 
  Database, 
  Scan, 
  MessageCircle, 
  Calendar,
  Menu,
  X,
  Building,
  Radio
} from "lucide-react";
import { Button } from "@/components/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/sheet";
import { useTranslation } from "@/hooks/useTranslation";

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Navigation = ({ activeSection, onSectionChange }: NavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  const navItems = [
    { id: "home", label: t('navigation.dashboard', 'Dashboard'), icon: Home },
    { id: "iot", label: t('navigation.iot', 'Smart Farm IoT'), icon: Radio },
    { id: "weather", label: t('navigation.weather', 'Weather'), icon: Cloud },
    { id: "crops", label: t('navigation.crops', 'Crops'), icon: Database },
    { id: "detection", label: t('navigation.detection', 'Disease Detection'), icon: Scan },
    { id: "chat", label: t('navigation.chat', 'AI Assistant'), icon: MessageCircle },
    { id: "calendar", label: t('navigation.calendar', 'Crop Calendar'), icon: Calendar },
    { id: "business", label: t('navigation.business', 'Business Model'), icon: Building },
  ];

  const handleNavClick = (section: string) => {
    onSectionChange(section);
    setIsOpen(false);
  };

  const NavContent = () => (
    <div className="space-y-2 p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground bg-gradient-primary bg-clip-text text-transparent">
          {t('app.title')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('app.tagline')}
        </p>
      </div>
      
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        
        return (
          <Button
            key={item.id}
            variant="ghost"
            className={`w-full justify-start h-12 ${
              isActive 
                ? "bg-gradient-primary text-primary-foreground shadow-soft" 
                : "hover:bg-muted text-foreground"
            }`}
            onClick={() => handleNavClick(item.id)}
          >
            <Icon className="h-5 w-5 mr-3" />
            {item.label}
          </Button>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:block w-72 h-screen bg-background border-r border-border fixed left-0 top-0 overflow-y-auto">
        <NavContent />
      </div>
    </>
  );
};

export default Navigation;