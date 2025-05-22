import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

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

// Help screen
import HelpScreen from '../screens/HelpScreen';

// New screens
import PrivacyAndSecurityScreen from '../screens/PrivacyAndSecurityScreen';
import BankDetailsScreen from '../screens/BankDetailsScreen';
import SupportScreen from '../screens/SupportScreen';

// Admin screen placeholder
const AdminScreen = ({ route }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Панель администратора (в разработке)</Text>
  </View>
);

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
        } else if (route.name === 'HelpTab') {
          iconName = focused ? 'help-circle' : 'help-circle-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.gray,
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
      name="HelpTab" 
      component={HelpScreen} 
      options={{ title: 'Помощь' }} 
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
      name="PrivacyAndSecurity" 
      component={PrivacyAndSecurityScreen} 
      options={{ headerShown: false }} 
    />
    <Stack.Screen 
      name="Support" 
      component={SupportScreen} 
      options={{ headerShown: false }} 
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
      tabBarInactiveTintColor: COLORS.gray,
      tabBarStyle: {
        backgroundColor: COLORS.white,
        elevation: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
        height: 60,
        paddingBottom: 8,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '500',
      },
    })}
  >
    <Tab.Screen 
      name="ChatsTab" 
      component={ChatScreenStack} 
      options={{ 
        headerShown: false, 
        title: 'Чаты',
        tabBarBadge: 3, // Demo badge to make app look alive
      }} 
    />
    <Tab.Screen 
      name="RequestsTab" 
      component={LawyerRequestsScreenStack} 
      options={{ 
        headerShown: false, 
        title: 'Заявки клиентов',
        tabBarBadge: 5, // Demo badge to make app look alive
      }} 
    />
    <Tab.Screen 
      name="ProfileTab" 
      component={LawyerProfileStack} 
      options={{ headerShown: false, title: 'Профиль' }} 
    />
  </Tab.Navigator>
);

// Lawyer profile stack
const LawyerProfileStack = () => (
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
      component={LawyerProfileScreen} 
      options={{ title: 'Профиль' }} 
    />
    <Stack.Screen 
      name="PrivacyAndSecurity" 
      component={PrivacyAndSecurityScreen} 
      options={{ headerShown: false }} 
    />
    <Stack.Screen 
      name="BankDetails" 
      component={BankDetailsScreen} 
      options={{ headerShown: false }} 
    />
    <Stack.Screen 
      name="Support" 
      component={SupportScreen} 
      options={{ headerShown: false }} 
    />
    <Stack.Screen 
      name="AdminScreen" 
      component={AdminScreen} 
      options={{ title: 'Панель администратора' }} 
    />
  </Stack.Navigator>
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
      options={({ route }) => ({ title: route.params?.title || 'Чат' })} 
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
      options={({ route }) => ({ title: route.params?.title || 'Чат' })} 
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
      options={({ route }) => ({ title: route.params?.title || 'Чат' })} 
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
      options={({ route }) => ({ title: route.params?.title || 'Чат' })} 
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

const AppNavigation = () => {
  const { authState, isLoading } = useAuth();
  
  if (isLoading) {
    return null; // Или компонент загрузки
  }

  // Возвращаем только нужный стек навигации без NavigationContainer
  return authState?.user ? (
    authState.user.user_type === 'lawyer' ? <LawyerTabs /> : <ClientTabs />
  ) : (
    <AuthStack />
  );
};

export default AppNavigation; 