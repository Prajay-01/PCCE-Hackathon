import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import InsightsScreen from '../screens/InsightsScreen';
import SchedulerScreen from '../screens/SchedulerScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ContentCreatorScreen from '../screens/ContentCreatorScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'Assistant') {
            iconName = focused ? 'chat' : 'chat-outline';
          } else if (route.name === 'Analyzer') {
            iconName = focused ? 'magnify' : 'magnify';
          } else if (route.name === 'Insights') {
            iconName = focused ? 'chart-bar' : 'chart-bar';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#00D9C0',
        tabBarInactiveTintColor: '#808080',
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#1a1a1a',
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ headerShown: false }} 
      />
      <Tab.Screen 
        name="Assistant" 
        component={ContentCreatorScreen} 
        options={{ 
          headerShown: false,
          tabBarLabel: 'Assistant',
        }} 
      />
      <Tab.Screen 
        name="Analyzer" 
        component={SchedulerScreen} 
        options={{ 
          headerShown: false,
          tabBarLabel: 'Analyzer',
        }} 
      />
      <Tab.Screen 
        name="Insights" 
        component={InsightsScreen} 
        options={{ 
          headerShown: false,
          tabBarLabel: 'Insights',
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ headerShown: false }} 
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
