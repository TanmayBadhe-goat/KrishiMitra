import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import your screens
import DashboardScreen from '../screens/DashboardScreen';
import CropRecommendationScreen from '../screens/CropRecommendationScreen';
import DiseaseDetectionScreen from '../screens/DiseaseDetectionScreen';
import WeatherInfoScreen from '../screens/WeatherInfoScreen';
import FarmAssistantScreen from '../screens/FarmAssistantScreen';
import CropCalendarScreen from '../screens/CropCalendarScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CommunityScreen from '../screens/CommunityScreen';
import IoTDashboardScreen from '../screens/IoTDashboardScreen';

// Define the parameter types for the stack navigator
export type RootStackParamList = {
  Dashboard: undefined;
  IoT: undefined;
  CropRecommendation: undefined;
  DiseaseDetection: undefined;
  WeatherInfo: undefined;
  FarmAssistant: undefined;
  Chatbot: undefined;
  CropCalendar: undefined;
  Community: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Main App Navigator
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerShown: false, // Hide headers since we have custom headers in screens
        }}
      >
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
        />
        <Stack.Screen 
          name="IoT" 
          component={IoTDashboardScreen} 
          options={{ 
            headerShown: true,
            title: 'Smart Farm IoT',
            headerStyle: { backgroundColor: '#4CAF50' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' }
          }}
        />
        <Stack.Screen 
          name="CropRecommendation" 
          component={CropRecommendationScreen} 
          options={{ 
            headerShown: true,
            title: 'Crop Recommendation',
            headerStyle: { backgroundColor: '#4CAF50' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' }
          }}
        />
        <Stack.Screen 
          name="DiseaseDetection" 
          component={DiseaseDetectionScreen} 
          options={{ 
            headerShown: true,
            title: 'Disease Detection',
            headerStyle: { backgroundColor: '#4CAF50' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' }
          }}
        />
        <Stack.Screen 
          name="WeatherInfo" 
          component={WeatherInfoScreen} 
          options={{ 
            headerShown: true,
            title: 'Weather Information',
            headerStyle: { backgroundColor: '#4CAF50' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' }
          }}
        />
        <Stack.Screen 
          name="FarmAssistant" 
          component={FarmAssistantScreen} 
          options={{ 
            headerShown: true,
            title: 'Farm Assistant',
            headerStyle: { backgroundColor: '#4CAF50' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' }
          }}
        />
        <Stack.Screen 
          name="Chatbot" 
          component={FarmAssistantScreen} 
          options={{ 
            headerShown: true,
            title: 'AI Assistant',
            headerStyle: { backgroundColor: '#4CAF50' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' }
          }}
        />
        <Stack.Screen 
          name="CropCalendar" 
          component={CropCalendarScreen} 
          options={{ 
            headerShown: true,
            title: 'Crop Calendar',
            headerStyle: { backgroundColor: '#4CAF50' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' }
          }}
        />
        <Stack.Screen 
          name="Community" 
          component={CommunityScreen} 
          options={{ 
            headerShown: true,
            title: 'Community',
            headerStyle: { backgroundColor: '#4CAF50' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' }
          }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ 
            headerShown: true,
            title: 'Settings',
            headerStyle: { backgroundColor: '#4CAF50' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' }
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
