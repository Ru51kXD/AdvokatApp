import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Auth screens
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Client screens
import SearchScreen from '../screens/client/SearchScreen';
import LawyerListScreen from '../screens/client/LawyerListScreen';
import LawyerDetailScreen from '../screens/client/LawyerDetailScreen';
import RequestScreen from '../screens/client/RequestScreen';
import ClientProfileScreen from '../screens/client/ProfileScreen';
import ClientRequestsScreen from '../screens/client/RequestsScreen';
import RequestDetailScreen from '../screens/client/RequestDetailScreen';

// Lawyer screens
import LawyerProfileScreen from '../screens/lawyer/ProfileScreen';
import LawyerRequestsScreen from '../screens/lawyer/RequestsScreen';
import LawyerRequestDetailScreen from '../screens/lawyer/RequestDetailScreen';

// Chat screens
import ConversationsScreen from '../screens/chat/ConversationsScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import NewChatScreen from '../screens/chat/NewChatScreen';

// Admin screen
import AdminScreen from '../screens/admin/AdminScreen';

// Context
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Client bottom tabs
const ClientTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'SearchTab') {
          iconName = focused ? 'search' : 'search-outline';
        } else if (route.name === 'RequestsTab') {
          iconName = focused ? 'list' : 'list-outline';
        } else if (route.name === 'ChatsTab') {
          iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
        } else if (route.name === 'ProfileTab') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.grey,
    })}
  >
    <Tab.Screen 
      name="SearchTab" 
      component={SearchScreenStack} 
      options={{ headerShown: false, title: 'Поиск' }} 
    />
    <Tab.Screen 
      name="RequestsTab" 
      component={ClientRequestsScreenStack} 
      options={{ headerShown: false, title: 'Мои заявки' }} 
    />
    <Tab.Screen 
      name="ChatsTab" 
      component={ChatScreenStack} 
      options={{ headerShown: false, title: 'Чаты' }} 
    />
    <Tab.Screen 
      name="ProfileTab" 
      component={ClientProfileStack} 
      options={{ headerShown: false, title: 'Профиль' }} 
    />
  </Tab.Navigator>
);

// Client profile stack
const ClientProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.primary,
      },
      headerTintColor: COLORS.white,
    }}
  >
    <Stack.Screen 
      name="Profile" 
      component={ClientProfileScreen} 
      options={{ title: 'Профиль' }} 
    />
    <Stack.Screen 
      name="AdminScreen" 
      component={AdminScreen} 
      options={{ title: 'Панель администратора' }} 
    />
  </Stack.Navigator>
);

// Lawyer bottom tabs
const LawyerTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'RequestsTab') {
          iconName = focused ? 'briefcase' : 'briefcase-outline';
        } else if (route.name === 'ChatsTab') {
          iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
        } else if (route.name === 'ProfileTab') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.grey,
    })}
  >
    <Tab.Screen 
      name="RequestsTab" 
      component={LawyerRequestsScreenStack} 
      options={{ headerShown: false, title: 'Заявки' }} 
    />
    <Tab.Screen 
      name="ChatsTab" 
      component={ChatScreenStack} 
      options={{ headerShown: false, title: 'Чаты' }} 
    />
    <Tab.Screen 
      name="ProfileTab" 
      component={LawyerProfileScreen} 
      options={{ headerShown: false, title: 'Профиль' }} 
    />
  </Tab.Navigator>
);

// Chat screen stack (shared between client and lawyer)
const ChatScreenStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.primary,
      },
      headerTintColor: COLORS.white,
    }}
  >
    <Stack.Screen 
      name="Conversations" 
      component={ConversationsScreen} 
      options={{ title: 'Сообщения' }} 
    />
    <Stack.Screen 
      name="ChatScreen" 
      component={ChatScreen} 
      options={({ route }) => ({ title: route.params.title })} 
    />
    <Stack.Screen 
      name="NewChatScreen" 
      component={NewChatScreen} 
      options={{ title: 'Новый чат' }} 
    />
  </Stack.Navigator>
);

// Client search stack
const SearchScreenStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.primary,
      },
      headerTintColor: COLORS.white,
    }}
  >
    <Stack.Screen 
      name="Search" 
      component={SearchScreen} 
      options={{ title: 'Поиск адвокатов' }} 
    />
    <Stack.Screen 
      name="LawyerList" 
      component={LawyerListScreen} 
      options={{ title: 'Список адвокатов' }} 
    />
    <Stack.Screen 
      name="LawyerDetail" 
      component={LawyerDetailScreen} 
      options={{ title: 'Профиль адвоката' }} 
    />
    <Stack.Screen 
      name="Request" 
      component={RequestScreen} 
      options={{ title: 'Создать заявку' }} 
    />
    <Stack.Screen 
      name="ChatScreen" 
      component={ChatScreen} 
      options={({ route }) => ({ title: route.params.title })} 
    />
  </Stack.Navigator>
);

// Client requests stack
const ClientRequestsScreenStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.primary,
      },
      headerTintColor: COLORS.white,
    }}
  >
    <Stack.Screen 
      name="ClientRequests" 
      component={ClientRequestsScreen} 
      options={{ title: 'Мои заявки' }} 
    />
    <Stack.Screen 
      name="RequestDetail" 
      component={RequestDetailScreen} 
      options={{ title: 'Детали заявки' }} 
    />
    <Stack.Screen 
      name="LawyerDetail" 
      component={LawyerDetailScreen} 
      options={{ title: 'Профиль адвоката' }} 
    />
    <Stack.Screen 
      name="ChatScreen" 
      component={ChatScreen} 
      options={({ route }) => ({ title: route.params.title })} 
    />
  </Stack.Navigator>
);

// Lawyer requests stack
const LawyerRequestsScreenStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.primary,
      },
      headerTintColor: COLORS.white,
    }}
  >
    <Stack.Screen 
      name="LawyerRequests" 
      component={LawyerRequestsScreen} 
      options={{ title: 'Доступные заявки' }} 
    />
    <Stack.Screen 
      name="RequestDetail" 
      component={LawyerRequestDetailScreen} 
      options={{ title: 'Детали заявки' }} 
    />
    <Stack.Screen 
      name="ChatScreen" 
      component={ChatScreen} 
      options={({ route }) => ({ title: route.params.title })} 
    />
  </Stack.Navigator>
);

// Auth stack
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.primary,
      },
      headerTintColor: COLORS.white,
    }}
  >
    <Stack.Screen 
      name="Welcome" 
      component={WelcomeScreen} 
      options={{ headerShown: false }} 
    />
    <Stack.Screen 
      name="Login" 
      component={LoginScreen} 
      options={{ title: 'Вход' }} 
    />
    <Stack.Screen 
      name="Register" 
      component={RegisterScreen} 
      options={{ title: 'Регистрация' }} 
    />
  </Stack.Navigator>
);

export default function AppNavigation() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return null; // Or a loading component
  }

  // Возвращаем только нужный стек навигации без NavigationContainer
  return user ? (
    user.userType === 'lawyer' ? <LawyerTabs /> : <ClientTabs />
  ) : (
    <AuthStack />
  );
} 