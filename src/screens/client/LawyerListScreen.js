import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Text, 
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../constants';
import LawyerCard from '../../components/LawyerCard';
import { LawyerService } from '../../services/LawyerService';
import { executeQuery } from '../../database/database';

const LawyerListScreen = ({ route, navigation }) => {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  
  const filters = route.params?.filters || {};

  const fetchLawyers = useCallback(async () => {
    console.log('Fetching lawyers with filters:', JSON.stringify(filters));
    setLoading(true);
    setError(null);
    
    try {
      // Для отладки: если это поиск по категории, выведем дополнительную информацию
      if (filters.category) {
        const categoryMap = {
          1: 'Уголовное право',
          2: 'Гражданское право',
          3: 'Семейное право',
          4: 'Налоговое право',
          5: 'Трудовое право'
        };
        const categoryName = categoryMap[filters.category] || 'Неизвестная категория';
        console.log(`Searching for lawyers in category: ${filters.category} (${categoryName})`);
        setDebugInfo(`Поиск по категории: ${categoryName}`);
      }

      // Получаем все специализации для отладки (без executeQuery)
      try {
        // Получаем все адвокаты через стандартный сервис
        const allLawyers = await LawyerService.getLawyers({});
        console.log(`Total lawyers found: ${allLawyers ? allLawyers.length : 0}`);
        
        // Выводим информацию о специализациях
        if (allLawyers && allLawyers.length > 0) {
          const specializations = {};
          allLawyers.forEach(lawyer => {
            if (!specializations[lawyer.specialization]) {
              specializations[lawyer.specialization] = 0;
            }
            specializations[lawyer.specialization]++;
          });
          
          console.log('Lawyers by specialization:', specializations);
          
          let debugText = `\nВсего адвокатов: ${allLawyers.length}\n`;
          Object.keys(specializations).forEach(spec => {
            debugText += `${spec}: ${specializations[spec]}\n`;
          });
          
          setDebugInfo(prev => prev + debugText);
        } else {
          setDebugInfo(prev => prev + '\nВ базе нет адвокатов');
        }
      } catch (err) {
        console.error('Error checking lawyers count:', err);
        setDebugInfo(prev => prev + '\nОшибка при проверке адвокатов: ' + err.message);
      }

      const lawyersList = await LawyerService.getLawyers(filters);
      console.log(`Received ${lawyersList ? lawyersList.length : 0} lawyers from service`);
      
      if (Array.isArray(lawyersList)) {
        setLawyers(lawyersList);
      } else {
        console.error('Expected array but got:', typeof lawyersList);
        setLawyers([]);
        setError('Неверный формат данных');
      }
    } catch (err) {
      console.error('Error fetching lawyers:', err);
      setLawyers([]);
      setError('Не удалось загрузить список адвокатов.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Use useFocusEffect to reload data when screen is focused
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      
      const loadData = async () => {
        try {
          await fetchLawyers();
        } catch (err) {
          if (isActive) {
            console.error('Error in useFocusEffect:', err);
            setError('Ошибка при загрузке данных');
            setLoading(false);
          }
        }
      };
      
      loadData();
      
      return () => {
        isActive = false;
      };
    }, [fetchLawyers])
  );

  const handleLawyerPress = useCallback((lawyer) => {
    if (!lawyer || !lawyer.id) {
      console.error('Invalid lawyer data:', lawyer);
      Alert.alert('Ошибка', 'Не удалось открыть профиль адвоката');
      return;
    }
    
    console.log('Selected lawyer:', lawyer.id);
    navigation.navigate('LawyerDetail', { lawyer: lawyer });
  }, [navigation]);

  const handleRetry = useCallback(() => {
    fetchLawyers();
  }, [fetchLawyers]);

  const renderLawyerItem = useCallback(({ item }) => {
    if (!item || !item.id) {
      console.log('Invalid lawyer item:', item);
      return null;
    }
    return (
      <LawyerCard 
        lawyer={item} 
        onPress={() => handleLawyerPress(item)} 
      />
    );
  }, [handleLawyerPress]);

  const keyExtractor = useCallback((item) => {
    return item && item.id ? item.id.toString() : Math.random().toString();
  }, []);

  const renderEmpty = useCallback(() => {
    if (loading) return null;
    
    const safeDebugInfo = typeof debugInfo === 'string' ? debugInfo : 
                          debugInfo ? JSON.stringify(debugInfo) : '';
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={48} color={COLORS.textSecondary} />
        <Text style={styles.emptyText}>
          Адвокатов не найдено.
        </Text>
        <Text style={styles.emptySubText}>
          Пожалуйста, измените параметры поиска или создайте заявку.
        </Text>
        {safeDebugInfo ? (
          <Text style={styles.debugText}>{safeDebugInfo}</Text>
        ) : null}
        <TouchableOpacity 
          style={styles.createRequestButton}
          onPress={() => navigation.navigate('Request')}
        >
          <Text style={styles.createRequestButtonText}>Создать заявку</Text>
        </TouchableOpacity>
      </View>
    );
  }, [loading, navigation, debugInfo]);

  // Компонент для отображения ошибок
  const ErrorDisplay = ({ message, onRetry }) => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color={COLORS.error || '#ff3b30'} />
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Попробовать снова</Text>
      </TouchableOpacity>
    </View>
  );

  if (error) {
    return (
      <ErrorDisplay message={error} onRetry={handleRetry} />
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Загрузка адвокатов...</Text>
        </View>
      ) : error ? (
        <ErrorDisplay message={error} onRetry={handleRetry} />
      ) : lawyers && lawyers.length > 0 ? (
        <FlatList
          data={lawyers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderLawyerItem}
          contentContainerStyle={styles.lawyersList}
          refreshControl={
            <RefreshControl 
              refreshing={loading} 
              onRefresh={fetchLawyers} 
              colors={[COLORS.primary]} 
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Адвокатов не найдено.</Text>
          <Text style={styles.emptyText}>
            Пожалуйста, измените параметры поиска или создайте заявку.
          </Text>
          {filters.category && (
            <Text style={styles.debugText}>
              Поиск по категории: {typeof filters.category === 'object' ? 
                (filters.category.id || filters.category.value || JSON.stringify(filters.category)) : 
                filters.category}
              {debugInfo && typeof debugInfo === 'string' ? `\n${debugInfo}` : ''}
            </Text>
          )}
          
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Request')}>
            <Text style={styles.buttonText}>Создать заявку</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

// Helper function to get correct results form in Russian
const getResultsCountText = (count) => {
  if (count === 0) return 'адвокатов';
  if (count === 1) return 'адвокат';
  if (count > 1 && count < 5) return 'адвоката';
  return 'адвокатов';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    fontSize: 16,
    marginVertical: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 16,
  },
  resultCount: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  createRequestButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  createRequestButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  debugText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  lawyersList: {
    padding: 16,
  },
  emptyTitle: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default LawyerListScreen; 
 
 
 