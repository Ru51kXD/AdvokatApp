import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Импортируем наше основное приложение и контекст авторизации
import AppNavigation from '../../src/navigation';
import { AuthProvider } from '../../src/contexts/AuthContext';
import { PermissionsProvider } from '../../src/contexts/PermissionsContext';

// Импортируем инициализацию базы данных и тестовые данные
import { initDatabase, showTableStructure, showTableContents } from '../../src/database/database';
import SeedDataService from '../../src/services/SeedDataService';
import ImageService from '../../src/services/ImageService';
import { RequestService } from '../../src/services/RequestService';

import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { COLORS } from '../../src/constants';

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        
        // Инициализируем базу данных
        await initDatabase();
        console.log('Database initialized');
        
        // Проверяем структуру таблиц (для отладки)
        await showTableStructure('users');
        await showTableStructure('lawyers');
        
        // Инициализируем тестовые данные, если нужно
        await SeedDataService.seedInitialData();
        console.log('Initial data seeded');
        
        // Проверяем содержимое таблиц (для отладки)
        await showTableContents('users');
        await showTableContents('lawyers');
        
        // Инициализируем сервис изображений
        await ImageService.init();
        
        // Инициализируем демо-данные
        await RequestService.initDemoData();
        console.log('Demo data initialized');
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing app:', err);
        setError(`Ошибка инициализации приложения: ${err.message}`);
        setIsLoading(false);
        
        // Показываем расширенное сообщение об ошибке для отладки
        Alert.alert(
          "Ошибка инициализации", 
          `${err.message}\n\nStacktrace: ${err.stack}`, 
          [{ text: "OK" }]
        );
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Загрузка приложения...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PermissionsProvider>
          <AppNavigation />
          <StatusBar style="auto" />
        </PermissionsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.white,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
  }
}); 