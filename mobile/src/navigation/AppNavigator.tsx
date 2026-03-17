import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/app';
import { useAuth } from '../context/AuthContext';
import { lectureQAApi } from '../api/lectureQAApi';
import { subscribeToStudentQuestions } from '../services/realtimeService';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import NewsScreen from '../screens/NewsScreen';
import QRScanScreen from '../screens/QRScanScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LectureDetailScreen from '../screens/LectureDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabBadge = ({ count }: { count: number }) => {
  if (count <= 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
};

const HomeTabs = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const mountedRef = useRef(true);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const count = await lectureQAApi.getStudentUnreadCount(user.id);
      if (mountedRef.current) setUnreadCount(count);
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => {
    mountedRef.current = true;
    if (!user) return;

    fetchUnreadCount();

    const channelName = 'mobile-tab-badge-' + user.id;
    const sub = subscribeToStudentQuestions(user.id, channelName, () => {
      if (mountedRef.current) fetchUnreadCount();
    });

    const poll = setInterval(() => {
      if (mountedRef.current) fetchUnreadCount();
    }, 10000);

    return () => {
      mountedRef.current = false;
      sub.unsubscribe();
      clearInterval(poll);
    };
  }, [user, fetchUnreadCount]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = 'home';

          switch (route.name) {
            case 'Home': iconName = focused ? 'home' : 'home-outline'; break;
            case 'News': iconName = focused ? 'sparkles' : 'sparkles-outline'; break;
            case 'QRScan': iconName = 'qr-code'; break;
            case 'Chat': iconName = focused ? 'chatbubbles' : 'chatbubbles-outline'; break;
            case 'Profile': iconName = focused ? 'person' : 'person-outline'; break;
          }

          if (route.name === 'QRScan') {
            return (
              <View style={styles.qrTabIcon}>
                <Ionicons name={iconName as any} size={22} color={COLORS.primary[600]} />
              </View>
            );
          }

          return (
            <View>
              <Ionicons name={iconName as any} size={size} color={color} />
              {route.name === 'Chat' && <TabBadge count={unreadCount} />}
            </View>
          );
        },
        tabBarActiveTintColor: COLORS.primary[600],
        tabBarInactiveTintColor: COLORS.slate[400],
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="News" component={NewsScreen} options={{ tabBarLabel: 'News' }} />
      <Tab.Screen
        name="QRScan"
        component={QRScanScreen}
        options={{
          tabBarLabel: 'Scan',
          tabBarLabelStyle: [styles.tabBarLabel, { color: COLORS.primary[600], fontWeight: '700' }],
        }}
      />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ tabBarLabel: 'Chat' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={HomeTabs} />
      <Stack.Screen
        name="LectureDetail"
        component={LectureDetailScreen}
        options={({ route }: any) => ({
          headerShown: true,
          headerTitle: 'Lecture',
          headerTintColor: COLORS.primary[600],
          headerStyle: { backgroundColor: COLORS.white },
          headerShadowVisible: false,
          headerBackTitle: 'Back',
        })}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate[200],
    height: 56,
    paddingBottom: 4,
    paddingTop: 4,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  qrTabIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.rose[500],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.white,
  },
});

export default AppNavigator;
