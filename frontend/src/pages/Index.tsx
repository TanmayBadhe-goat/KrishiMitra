import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import Navigation from "@/components/Navigation";
import Dashboard from "@/components/Dashboard";
import WeatherCard from "@/components/WeatherCard";
import CropCategories from "@/components/CropCategories";
import DiseaseDetection from "@/components/DiseaseDetection";
import AIChat from "@/components/AIChat";
import CropCalendar from "@/components/CropCalendar";
import CropPrediction from "@/components/CropPrediction";
import BusinessModel from "@/components/BusinessModel";
import LanguageSelector from "@/components/LanguageSelector";
import IoTDashboard from "@/components/IoTDashboard";

const Index = () => {
  const [activeSection, setActiveSection] = useState("home");

  const { t } = useTranslation();

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return <Dashboard />;
      case "iot":
        return <IoTDashboard />;
      case "weather":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">{t('weather.title')}</h2>
            <WeatherCard />
          </div>
        );
      case "crops":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">{t('cropPrediction.title')}</h2>
            <CropPrediction />
            <CropCategories />
          </div>
        );
      case "detection":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">{t('diseaseDetection.title')}</h2>
            <DiseaseDetection />
          </div>
        );
      case "chat":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">{t('chat.title')}</h2>
            <AIChat />
          </div>
        );
      case "calendar":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">{t('calendar.title')}</h2>
            <CropCalendar />
          </div>
        );
    case "business":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">{t('business.title')}</h2>
            <BusinessModel />
          </div>
        );
      default:
        return (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-foreground mb-4">{t('common.comingSoon')}</h2>
            <p className="text-muted-foreground">{t('common.underDevelopment')}</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <main className="md:ml-72 p-4 md:p-6 pt-16 md:pt-6">
        <div className="max-w-6xl mx-auto">
          {/* Language Selector */}
          <div className="flex justify-end mb-4">
            <LanguageSelector />
          </div>
          
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Index;
