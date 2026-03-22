import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl, Modal, Animated, Image } from 'react-native';
import { Card, Title, Paragraph, Text, Button, IconButton, ActivityIndicator, Avatar, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { cropService } from '../api/cropService';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSelector from '../components/LanguageSelector';

const { width } = Dimensions.get('window');

interface StatCard {
  title: string;
  value: string;
  percentage: string;
  icon: string;
  color: string;
}

interface FeatureCard {
  title: string;
  description: string;
  status: 'Available' | 'Coming Soon';
  icon: string;
}

const DashboardScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [stats, setStats] = useState<StatCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  const defaultStats: StatCard[] = [
    {
      title: 'AI Models',
      value: '3+',
      percentage: 'Active',
      icon: 'robot',
      color: '#4CAF50'
    },
    {
      title: 'Crop Database',
      value: '50+',
      percentage: 'Varieties',
      icon: 'database',
      color: '#FF9800'
    },
    {
      title: 'API Endpoints',
      value: '12',
      percentage: 'Ready',
      icon: 'api',
      color: '#2196F3'
    },
    {
      title: 'ML Accuracy',
      value: '94.2%',
      percentage: 'ML Model',
      icon: 'target',
      color: '#9C27B0'
    }
  ];

  const fetchDashboardStats = async () => {
    try {
      console.log('Fetching dashboard stats...');
      // Reduced timeout to prevent long waits
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 3000)
      );
      
      const response = await Promise.race([
        cropService.getDashboardStats(),
        timeoutPromise
      ]) as any;
      
      console.log('Dashboard stats response:', response);
      if (response && response.success) {
        const apiStats: StatCard[] = [
          {
            title: 'AI Models',
            value: response.stats.ai_models.value,
            percentage: response.stats.ai_models.growth,
            icon: 'robot',
            color: '#4CAF50'
          },
          {
            title: 'Crop Database',
            value: response.stats.crop_database.value,
            percentage: response.stats.crop_database.growth,
            icon: 'database',
            color: '#FF9800'
          },
          {
            title: 'API Endpoints',
            value: response.stats.api_endpoints.value,
            percentage: response.stats.api_endpoints.growth,
            icon: 'api',
            color: '#2196F3'
          },
          {
            title: 'ML Accuracy',
            value: response.stats.accuracy_rate.value,
            percentage: response.stats.accuracy_rate.growth,
            icon: 'target',
            color: '#9C27B0'
          }
        ];
        setStats(apiStats);
        setLastUpdated(new Date(response.last_updated).toLocaleTimeString());
      } else {
        setStats(defaultStats);
      }
      
      // Animate cards when data loads
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      // Silently use fallback stats - this is expected behavior when offline or server is slow
      console.log('Using default dashboard stats (server unavailable)');
      setStats(defaultStats);
      
      // Still animate even with fallback data
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Start with default stats immediately to avoid blank screen
    setStats(defaultStats);
    setLoading(false);
    
    // Animate the default stats
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Try to fetch real stats in background (non-blocking)
    // Use a small delay to let the UI render first
    setTimeout(() => {
      fetchDashboardStats();
    }, 1000);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardStats();
  };

  const features: FeatureCard[] = [
    {
      title: 'Smart Farm IoT',
      description: 'Real-time sensor monitoring for smart farming',
      status: 'Available',
      icon: 'access-point'
    },
    {
      title: t('dashboard.features.smartCropRecommendations.title'),
      description: t('dashboard.features.smartCropRecommendations.description'),
      status: 'Available',
      icon: 'brain'
    },
    {
      title: t('dashboard.features.diseaseDetection.title'),
      description: t('dashboard.features.diseaseDetection.description'),
      status: 'Available',
      icon: 'camera-plus'
    },
    {
      title: t('dashboard.features.weatherIntegration.title'),
      description: t('dashboard.features.weatherIntegration.description'),
      status: 'Available',
      icon: 'weather-cloudy'
    },
    {
      title: t('dashboard.features.voiceAssistant.title'),
      description: t('dashboard.features.voiceAssistant.description'),
      status: 'Available',
      icon: 'microphone'
    },
    {
      title: t('dashboard.features.offlineMode.title'),
      description: t('dashboard.features.offlineMode.description'),
      status: 'Coming Soon',
      icon: 'wifi-off'
    },
    {
      title: t('dashboard.features.expertConnect.title'),
      description: t('dashboard.features.expertConnect.description'),
      status: 'Coming Soon',
      icon: 'account-tie'
    }
  ];

  const quickStartSteps = [
    t('dashboard.quickStart.steps.0'),
    t('dashboard.quickStart.steps.1'), 
    t('dashboard.quickStart.steps.2'),
    t('dashboard.quickStart.steps.3')
  ];

  const navigateToFeature = (featureTitle: string) => {
    switch (featureTitle) {
      case 'Smart Farm IoT':
        navigation.navigate('IoT');
        break;
      case 'Smart Crop Recommendations':
        navigation.navigate('CropRecommendation');
        break;
      case 'Disease Detection':
        navigation.navigate('DiseaseDetection');
        break;
      case 'Weather Integration':
        navigation.navigate('WeatherInfo');
        break;
      case 'Voice Assistant':
        navigation.navigate('Chatbot');
        break;
      default:
        // For coming soon features, show a placeholder
        break;
    }
  };

  const renderSidebar = () => (
    <Modal
      visible={sidebarVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setSidebarVisible(false)}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouch} 
          activeOpacity={1} 
          onPress={() => setSidebarVisible(false)}
        />
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <MaterialCommunityIcons 
                  name="account" 
                  size={40} 
                  color="white" 
                />
              </View>
              <Text style={styles.profileName}>{t('app.title')}</Text>
              <Text style={styles.profileSubtitle}>{t('app.tagline')}</Text>
            </View>
          </View>
          
          <View style={styles.menuContainer}>
            {[
              { title: t('navigation.dashboard'), icon: 'view-dashboard', screen: 'Dashboard' },
              { title: 'Smart Farm IoT', icon: 'access-point', screen: 'IoT' },
              { title: t('navigation.weather'), icon: 'weather-cloudy', screen: 'WeatherInfo' },
              { title: t('navigation.cropPrediction'), icon: 'sprout', screen: 'CropRecommendation' },
              { title: t('navigation.diseaseDetection'), icon: 'camera-plus', screen: 'DiseaseDetection' },
              { title: t('navigation.aiAssistant'), icon: 'robot', screen: 'Chatbot' },
              { title: t('navigation.cropCalendar'), icon: 'calendar', screen: 'CropCalendar' },
              { title: t('navigation.community'), icon: 'account-group', screen: 'Community' },
              { title: t('navigation.settings'), icon: 'cog', screen: 'Settings' },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => {
                  setSidebarVisible(false);
                  if (item.screen !== 'Dashboard') {
                    navigation.navigate(item.screen);
                  }
                }}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={20}
                  color="#666"
                  style={styles.menuIcon}
                />
                <Text style={styles.menuText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
            
            {/* Language Selector */}
            <LanguageSelector />
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {renderSidebar()}
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => setSidebarVisible(true)}
            style={styles.menuButton}
          >
            <MaterialCommunityIcons name="menu" size={28} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Title style={styles.headerTitle}>{t('dashboard.welcomeTitle')}</Title>
            <Paragraph style={styles.headerSubtitle}>
              {t('dashboard.subtitle')}
            </Paragraph>
            {lastUpdated && (
              <Text style={styles.lastUpdated}>
                {t('dashboard.lastUpdated')}: {lastUpdated}
              </Text>
            )}
          </View>
        </View>

        {/* Statistics Cards */}
        <Animated.View 
          style={[
            styles.statsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {loading ? (
            // Loading state for statistics
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} style={styles.statCard}>
                <Card.Content style={styles.statContent}>
                  <ActivityIndicator size="small" color="#4CAF50" />
                  <Text style={styles.loadingText}>{t('common.loading')}</Text>
                </Card.Content>
              </Card>
            ))
          ) : (
            stats.map((stat, index) => (
              <Animated.View
                key={index}
                style={{
                  opacity: fadeAnim,
                  transform: [{ 
                    translateY: Animated.add(slideAnim, new Animated.Value(index * 10))
                  }]
                }}
              >
                <Card style={[styles.statCard, { borderLeftColor: stat.color }]}>
                  <Card.Content style={styles.statContent}>
                    <View style={styles.statHeader}>
                      <MaterialCommunityIcons 
                        name={stat.icon as any} 
                        size={24} 
                        color={stat.color} 
                      />
                      <Text style={[styles.statPercentage, { color: stat.color }]}>
                        {stat.percentage}
                      </Text>
                    </View>
                    <Title style={styles.statValue}>{stat.value}</Title>
                    <Text style={styles.statTitle}>{stat.title}</Text>
                  </Card.Content>
                </Card>
              </Animated.View>
            ))
          )}
        </Animated.View>

        {/* Platform Features */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>{t('dashboard.features.title')}</Title>
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.featureCard}
                  onPress={() => navigateToFeature(feature.title)}
                  disabled={feature.status === 'Coming Soon'}
                >
                  <View style={styles.featureHeader}>
                    <MaterialCommunityIcons 
                      name={feature.icon as any} 
                      size={24} 
                      color="#4CAF50" 
                    />
                    <View style={[
                      styles.statusBadge, 
                      { backgroundColor: feature.status === 'Available' ? '#4CAF50' : '#FF9800' }
                    ]}>
                      <Text style={styles.statusText}>
                        {feature.status === 'Available' ? t('common.available') : t('common.comingSoon')}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Quick Start Guide */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>{t('dashboard.quickStart.title')}</Title>
            <View style={styles.quickStartContainer}>
              {quickStartSteps.map((step, index) => (
                <View key={index} style={styles.quickStartStep}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  menuButton: {
    alignSelf: 'flex-start',
    marginBottom: 15,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  logoContainer: {
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 80,
    height: 80,
  },
  logoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    textAlign: 'center',
  },
  lastUpdated: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 20,
  },
  statCard: {
    width: (width - 48) / 2,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
  },
  statContent: {
    paddingVertical: 12,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statPercentage: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
  },
  loadingText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  sectionCard: {
    margin: 16,
    elevation: 2,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  quickStartContainer: {
    marginTop: 8,
  },
  quickStartStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 20,
  },
  // Sidebar styles
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouch: {
    flex: 1,
  },
  sidebar: {
    width: width * 0.8,
    maxWidth: 320,
    backgroundColor: 'white',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sidebarHeader: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  menuIcon: {
    marginRight: 20,
    width: 24,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
  },
});

export default DashboardScreen;
