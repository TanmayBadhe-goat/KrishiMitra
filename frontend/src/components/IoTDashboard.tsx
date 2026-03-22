import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { Button } from "@/components/button";
import { Badge } from "@/components/badge";
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Beaker, 
  CloudRain,
  Radio,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Sprout
} from "lucide-react";
import { api } from "@/lib/utils";
import { useToast } from "@/lib/use-toast";

interface SensorData {
  temperature: number;
  humidity: number;
  moisture: number;
  ph: number;
  rainfall: number;
  timestamp: string;
}

interface Alert {
  type: 'warning' | 'success' | 'info';
  icon: string;
  message: string;
  priority: string;
}

interface Prediction {
  crop: string;
  confidence: number;
  emoji: string;
  season: string;
  duration: string;
  tips: string;
}

interface IoTResponse {
  success: boolean;
  sensor_data: SensorData;
  alerts: Alert[];
  prediction: Prediction | null;
  is_live?: boolean;
  status?: string;
}

const IoTDashboard = () => {
  const [iotData, setIoTData] = useState<IoTResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const { toast } = useToast();

  const fetchIoTData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/iot-live');
      if (response.success) {
        setIoTData(response);
        setIsLive(response.is_live || false);
      } else {
        toast({
          title: "No Sensor Data",
          description: response.message || "Waiting for IoT device to transmit data...",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error fetching IoT data:', error);
      toast({
        title: "Connection Error",
        description: "Unable to fetch sensor data. Check backend connection.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIoTData();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchIoTData, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-500';
      case 'stale': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getMoistureColor = (moisture: number) => {
    if (moisture < 30) return 'text-red-500';
    if (moisture < 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getTemperatureColor = (temp: number) => {
    if (temp > 35) return 'text-red-500';
    if (temp < 15) return 'text-blue-500';
    return 'text-green-500';
  };

  const getPHColor = (ph: number) => {
    if (ph < 5.5 || ph > 7.5) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Live Status */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              Smart Farm Dashboard
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm text-muted-foreground">
                {isLive ? 'Live' : 'Offline'}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchIoTData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Sensor Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Temperature */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Thermometer className={`h-8 w-8 mb-2 ${iotData?.sensor_data ? getTemperatureColor(iotData.sensor_data.temperature) : 'text-gray-400'}`} />
              <p className="text-2xl font-bold">
                {iotData?.sensor_data?.temperature?.toFixed(1) || '--'}°C
              </p>
              <p className="text-xs text-muted-foreground mt-1">Temperature</p>
            </div>
          </CardContent>
        </Card>

        {/* Humidity */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Wind className="h-8 w-8 mb-2 text-blue-500" />
              <p className="text-2xl font-bold">
                {iotData?.sensor_data?.humidity?.toFixed(1) || '--'}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Humidity</p>
            </div>
          </CardContent>
        </Card>

        {/* Soil Moisture */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Droplets className={`h-8 w-8 mb-2 ${iotData?.sensor_data ? getMoistureColor(iotData.sensor_data.moisture) : 'text-gray-400'}`} />
              <p className="text-2xl font-bold">
                {iotData?.sensor_data?.moisture?.toFixed(1) || '--'}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Soil Moisture</p>
            </div>
          </CardContent>
        </Card>

        {/* pH Level */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Beaker className={`h-8 w-8 mb-2 ${iotData?.sensor_data ? getPHColor(iotData.sensor_data.ph) : 'text-gray-400'}`} />
              <p className="text-2xl font-bold">
                {iotData?.sensor_data?.ph?.toFixed(1) || '--'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">pH Level</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Alerts */}
      {iotData?.alerts && iotData.alerts.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Smart Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {iotData.alerts.map((alert, index) => (
                <div 
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                    alert.type === 'success' ? 'bg-green-50 border border-green-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <span className="text-xl">{alert.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{alert.message}</p>
                    <Badge variant={
                      alert.priority === 'high' ? 'destructive' :
                      alert.priority === 'medium' ? 'default' : 'secondary'
                    } className="mt-1 text-xs">
                      {alert.priority} priority
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Crop Prediction */}
      {iotData?.prediction && (
        <Card className="shadow-card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sprout className="h-5 w-5 text-green-600" />
              AI Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl">{iotData.prediction.emoji}</span>
              <div>
                <h3 className="text-2xl font-bold text-green-700">
                  {iotData.prediction.crop}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {iotData.prediction.confidence}% confidence
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground">Season</p>
                <p className="font-medium">{iotData.prediction.season}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-medium">{iotData.prediction.duration}</p>
              </div>
            </div>

            <div className="bg-white/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Farming Tips</p>
              <p className="text-sm">{iotData.prediction.tips}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!iotData?.sensor_data && (
        <Card className="shadow-card">
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <Radio className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Waiting for Sensor Data</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Connect your ESP32 IoT device to start receiving real-time sensor data. 
                The device will transmit temperature, humidity, soil moisture, and pH readings.
              </p>
              <Button onClick={fetchIoTData} className="mt-4" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Check Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      {iotData?.sensor_data?.timestamp && (
        <p className="text-xs text-center text-muted-foreground">
          Last updated: {new Date(iotData.sensor_data.timestamp).toLocaleString()}
        </p>
      )}
    </div>
  );
};

export default IoTDashboard;
