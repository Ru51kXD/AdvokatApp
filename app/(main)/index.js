import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Импортируем наше основное приложение и контекст авторизации
import AppNavigation from '../../src/navigation';
import { AuthProvider } from '../../src/contexts/AuthContext';

// Импортируем инициализацию базы данных и тестовые данные
import { initDatabase, showTableStructure, showTableContents } from '../../src/database/database';
import SeedDataService from '../../src/services/SeedDataService';
import ImageService from '../../src/services/ImageService';

import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { COLORS } from '../../src/constants';

export default function MainAppScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log("=== Initializing application ===");
        
        // Initialize database
        console.log("1. Initializing database...");
        await initDatabase();
        console.log("Database initialized successfully");
        
        // Предзагрузка изображений
        console.log("2. Preloading images...");
        try {
          await ImageService.preloadImages();
          console.log("Images preloaded successfully");
        } catch (imageError) {
          console.error('Error preloading images (non-critical):', imageError);
        }
        
        // Заполнение БД тестовыми данными
        console.log("3. Seeding database with test data...");
        try {
          await SeedDataService.seedData();
        } catch (seedError) {
          console.error('Error while seeding database:', seedError);
          // Продолжаем выполнение, даже если не удалось заполнить БД тестовыми данными
        }
        
        // Попытка вывести информацию о таблицах для отладки
        try {
          console.log("4. Debug: Showing database table info");
          await showTableStructure('users');
          await showTableContents('users');
        } catch (debugError) {
          console.log("Debug info error (not critical):", debugError);
        }
        
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
        <AppNavigation />
        <StatusBar style="auto" />
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