import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

// Импорт цветовой схемы
import { COLORS } from '../../src/constants';

export default function HomeScreen() {
  const router = useRouter();

  useEffect(() => {
    // Перенаправляем на основное приложение сразу
    // Эта задержка нужна только для уверенности, что все загрузится
    const timer = setTimeout(() => {
      // Закрываем текущий стек навигации и открываем основное приложение
      router.replace('/(main)');
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Загрузка приложения...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
});
