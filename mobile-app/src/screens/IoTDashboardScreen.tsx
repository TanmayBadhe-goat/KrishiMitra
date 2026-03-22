import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Thermometer,
  Droplets,
  Wind,
  Beaker,
  Radio,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Sprout,
} from 'lucide-react-native';
import { cropService } from '../api/cropService';

const { width } = Dimensions.get('window');

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
  sensor_data: SensorData | null;
  alerts: Alert[];
  prediction: Prediction | null;
  is_live?: boolean;
  status?: string;
  message?: string;
}

const IoTDashboardScreen: React.FC = () => {
  const [iotData, setIoTData] = useState<IoTResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const fetchIoTData = async () => {
    setIsLoading(true);
    try {
      const response = await cropService.getIoTLiveData();
      setIoTData(response);
      setIsLive(response.is_live || false);
    } catch (error) {
      console.error('Error fetching IoT data:', error);
      setIoTData({
        success: false,
        sensor_data: null,
        alerts: [],
        prediction: null,
        message: 'Unable to connect to server'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIoTData();
    const interval = setInterval(fetchIoTData, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return '#22C55E';
      case 'stale': return '#EAB308';
      default: return '#6B7280';
    }
  };

  const getMoistureColor = (moisture: number) => {
    if (moisture < 30) return '#EF4444';
    if (moisture < 50) return '#EAB308';
    return '#22C55E';
  };

  const getTemperatureColor = (temp: number) => {
    if (temp > 35) return '#EF4444';
    if (temp < 15) return '#3B82F6';
    return '#22C55E';
  };

  const getPHColor = (ph: number) => {
    if (ph < 5.5 || ph > 7.5) return '#EAB308';
    return '#22C55E';
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'warning': return { bg: '#FEF3C7', border: '#FCD34D' };
      case 'success': return { bg: '#D1FAE5', border: '#6EE7B7' };
      default: return { bg: '#DBEAFE', border: '#93C5FD' };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return { bg: '#FEE2E2', text: '#DC2626' };
      case 'medium': return { bg: '#FEF3C7', text: '#D97706' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const SensorCard = ({ 
    icon: Icon, 
    value, 
    unit, 
    label, 
    color = '#22C55E' 
  }: { 
    icon: any; 
    value: string | number; 
    unit: string; 
    label: string; 
    color?: string;
  }) => (
    <View style={[styles.sensorCard, { borderColor: color }]}>
      <Icon color={color} size={28} />
      <Text style={[styles.sensorValue, { color }]}>
        {value}{unit}
      </Text>
      <Text style={styles.sensorLabel}>{label}</Text>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={fetchIoTData} />
      }
    >
      {/* Header with Live Status */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Radio color="#22C55E" size={24} />
          <Text style={styles.headerTitle}>Smart Farm Dashboard</Text>
        </View>
        <View style={styles.liveIndicator}>
          <View style={[styles.liveDot, { backgroundColor: isLive ? '#22C55E' : '#6B7280' }]} />
          <Text style={styles.liveText}>{isLive ? 'LIVE' : 'OFFLINE'}</Text>
        </View>
      </View>

      {/* Sensor Cards Grid */}
      <View style={styles.sensorsGrid}>
        <SensorCard
          icon={Thermometer}
          value={iotData?.sensor_data?.temperature?.toFixed(1) || '--'}
          unit="°C"
          label="Temperature"
          color={iotData?.sensor_data ? getTemperatureColor(iotData.sensor_data.temperature) : '#6B7280'}
        />
        <SensorCard
          icon={Wind}
          value={iotData?.sensor_data?.humidity?.toFixed(1) || '--'}
          unit="%"
          label="Humidity"
          color="#3B82F6"
        />
        <SensorCard
          icon={Droplets}
          value={iotData?.sensor_data?.moisture?.toFixed(1) || '--'}
          unit="%"
          label="Soil Moisture"
          color={iotData?.sensor_data ? getMoistureColor(iotData.sensor_data.moisture) : '#6B7280'}
        />
        <SensorCard
          icon={Beaker}
          value={iotData?.sensor_data?.ph?.toFixed(1) || '--'}
          unit=""
          label="pH Level"
          color={iotData?.sensor_data ? getPHColor(iotData.sensor_data.ph) : '#6B7280'}
        />
      </View>

      {/* Smart Alerts */}
      {iotData?.alerts && iotData.alerts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle color="#EAB308" size={20} />
            <Text style={styles.sectionTitle}>Smart Alerts</Text>
          </View>
          <View style={styles.alertsContainer}>
            {iotData.alerts.map((alert, index) => (
              <View 
                key={index}
                style={[
                  styles.alertCard,
                  { 
                    backgroundColor: getAlertStyle(alert.type).bg,
                    borderLeftColor: getAlertStyle(alert.type).border
                  }
                ]}
              >
                <Text style={styles.alertIcon}>{alert.icon}</Text>
                <View style={styles.alertContent}>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  <View style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityBadge(alert.priority).bg }
                  ]}>
                    <Text style={[
                      styles.priorityText,
                      { color: getPriorityBadge(alert.priority).text }
                    ]}>
                      {alert.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* AI Crop Prediction */}
      {iotData?.prediction && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sprout color="#22C55E" size={20} />
            <Text style={styles.sectionTitle}>AI Recommendation</Text>
          </View>
          <View style={styles.predictionCard}>
            <View style={styles.predictionHeader}>
              <Text style={styles.predictionEmoji}>{iotData.prediction.emoji}</Text>
              <View>
                <Text style={styles.predictionCrop}>{iotData.prediction.crop}</Text>
                <Text style={styles.predictionConfidence}>
                  {iotData.prediction.confidence}% confidence
                </Text>
              </View>
            </View>
            
            <View style={styles.predictionDetails}>
              <View style={styles.predictionDetail}>
                <Text style={styles.detailLabel}>Season</Text>
                <Text style={styles.detailValue}>{iotData.prediction.season}</Text>
              </View>
              <View style={styles.predictionDetail}>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>{iotData.prediction.duration}</Text>
              </View>
            </View>

            <View style={styles.tipsContainer}>
              <Text style={styles.tipsLabel}>Farming Tips</Text>
              <Text style={styles.tipsText}>{iotData.prediction.tips}</Text>
            </View>
          </View>
        </View>
      )}

      {/* No Data State */}
      {!iotData?.sensor_data && (
        <View style={styles.noDataContainer}>
          <Radio color="#6B7280" size={48} />
          <Text style={styles.noDataTitle}>Waiting for Sensor Data</Text>
          <Text style={styles.noDataText}>
            Connect your ESP32 IoT device to start receiving real-time sensor data.
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchIoTData}>
            <RefreshCw color="#22C55E" size={20} />
            <Text style={styles.refreshButtonText}>Check Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Last Updated */}
      {iotData?.sensor_data?.timestamp && (
        <Text style={styles.lastUpdated}>
          Last updated: {new Date(iotData.sensor_data.timestamp).toLocaleString()}
        </Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  sensorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  sensorCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sensorValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  sensorLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  alertsContainer: {
    gap: 10,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  alertIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  predictionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  predictionEmoji: {
    fontSize: 40,
  },
  predictionCrop: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#166534',
  },
  predictionConfidence: {
    fontSize: 14,
    color: '#6B7280',
  },
  predictionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  predictionDetail: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
  },
  tipsContainer: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
  },
  tipsLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 18,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 20,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  noDataText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
  },
  lastUpdated: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 20,
    marginBottom: 40,
  },
});

export default IoTDashboardScreen;
