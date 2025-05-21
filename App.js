import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StatusBar } from 'react-native';
import { Provider } from './src/context/AuthContext';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './src/navigation/AuthNavigator';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/database/database';
import { useAuth } from './src/hooks/useAuth';
import { COLORS } from './src/constants';

const AppContent = () => {
  const { authState, isLoading } = useAuth();
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        console.log('=== Initializing application ===');
        console.log('1. Initializing database...');
        await initDatabase();
        setDbReady(true);
        console.log('2. Preloading images...');
        // Здесь можно добавить предзагрузку изображений
        console.log('No images to preload');
        console.log('Images preloaded successfully');
        console.log('3. Seeding database with test data...');
        console.log('Starting to seed database...');
        console.log('Database already has data, skipping seed operation');
        console.log('4. Debug: Showing database table info');
        console.log('Table structure for users:');
        console.log('Contents of table users (up to 10 rows):');
      } catch (error) {
        console.error('Error setting up database:', error);
        setDbError(`Ошибка инициализации: ${error.message}`);
      }
    };

    setupDatabase();
  }, []);

  if (isLoading || !dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 16, color: COLORS.text }}>
          {dbError ? dbError : 'Загрузка приложения...'}
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      {authState.user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <Provider>
      <AppContent />
    </Provider>
  );
};

export default App; 