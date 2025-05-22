import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Text, 
  ActivityIndicator, 
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  TextInput,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS, REQUEST_STATUS, LAW_AREAS, PRICE_RANGES } from '../../constants';
import RequestCard from '../../components/RequestCard';
import { RequestService } from '../../services/RequestService';
import { useAuth } from '../../contexts/AuthContext';

const LawyerRequestsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'open', 'responded'
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  // Advanced filter states
  const [selectedLawArea, setSelectedLawArea] = useState(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest'
  const [searchText, setSearchText] = useState('');

  // Stats for the dashboard
  const [stats, setStats] = useState({
    totalRequests: 0,
    newRequests: 0,
    respondedRequests: 0
  });

  // Немедленно загружаем тестовые данные при первом рендере
  useEffect(() => {
    if (initialLoading) {
      console.log('Инициализация экрана заявок...');
      
      // Проверяем, есть ли сохраненные заявки в AsyncStorage
      AsyncStorage.getItem('mock_requests')
        .then(savedRequests => {
          if (savedRequests) {
            try {
              // Если есть сохраненные заявки, загружаем их
              const parsedRequests = JSON.parse(savedRequests);
              console.log(`Загружено ${parsedRequests.length} заявок из AsyncStorage`);
              
              setRequests(parsedRequests);
              
              // Обновляем статистику
              const OPEN_STATUS = REQUEST_STATUS?.OPEN || 'open';
              const newRequestsCount = parsedRequests.filter(r => 
                r.status === OPEN_STATUS && 
                !r.hasResponded && 
                new Date(r.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
              ).length;
              
              const respondedRequestsCount = parsedRequests.filter(r => r.hasResponded).length;
              
              setStats({
                totalRequests: parsedRequests.length,
                newRequests: newRequestsCount,
                respondedRequests: respondedRequestsCount
              });
            } catch (error) {
              console.error('Ошибка при парсинге сохраненных заявок:', error);
              // Если ошибка при парсинге, сгенерируем новые заявки
              addTestRequests();
            }
          } else {
            // Если в хранилище нет заявок, автоматически создаем тестовые
            console.log('Заявки не найдены, автоматически создаем тестовые...');
            addTestRequests();
          }
          
          setInitialLoading(false);
        })
        .catch(error => {
          console.error('Ошибка при загрузке заявок:', error);
          addTestRequests();
          setInitialLoading(false);
        });
    }
  }, [initialLoading]);

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('Загружаем заявки для адвоката...');
      const availableRequests = await RequestService.getAvailableRequests(user.id);
      console.log(`Получено ${availableRequests.length} заявок`);
      
      // Даже если массив пуст, мы все равно устанавливаем его в состояние
      setRequests(availableRequests);
      
      // Безопасно проверяем статус REQUEST_STATUS.OPEN
      const OPEN_STATUS = REQUEST_STATUS?.OPEN || 'open';
      
      // Calculate stats for the dashboard safely
      const newRequestsCount = availableRequests.filter(r => 
        r.status === OPEN_STATUS && 
        !r.hasResponded && 
        new Date(r.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length;
      
      const respondedRequestsCount = availableRequests.filter(r => r.hasResponded).length;
      
      setStats({
        totalRequests: availableRequests.length,
        newRequests: newRequestsCount,
        respondedRequests: respondedRequestsCount
      });
      
      setError(null);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Не удалось загрузить список заявок.');
    } finally {
      // Устанавливаем loading в false, даже если произошла ошибка
      setLoading(false);
    }
  }, [user]);

  // Загружаем заявки при каждом фокусе на экране, но только если не идет начальная загрузка
  useFocusEffect(
    useCallback(() => {
      if (!initialLoading) {
        fetchRequests();
      }
    }, [fetchRequests, initialLoading])
  );

  const handleRequestPress = (request) => {
    navigation.navigate('RequestDetail', { requestId: request.id });
  };

  const addTestRequests = () => {
    setLoading(true);
    
    // Добавляем проверку наличия user и user.id
    const lawyerId = user?.id || 1001; // Если user.id не определен, используем дефолтное значение
    
    // Принудительно генерируем тестовые заявки и сразу отображаем их
    try {
      // Напрямую создаем тестовые заявки без использования RequestService
      const mockRequests = [];
      
      // Используем безопасный доступ к массивам констант
      const areas = Array.isArray(LAW_AREAS) && LAW_AREAS.length > 0 ? LAW_AREAS : [
        { value: 'family', label: 'Семейное право' },
        { value: 'criminal', label: 'Уголовное право' },
        { value: 'civil', label: 'Гражданское право' }
      ];
      
      const priceRanges = Array.isArray(PRICE_RANGES) && PRICE_RANGES.length > 0 ? PRICE_RANGES : [
        { value: 'free', label: 'Бесплатная консультация' },
        { value: 'low', label: 'До 5 000 ₸' },
        { value: 'medium', label: 'От 5 000 до 20 000 ₸' }
      ];
      
      const openStatus = REQUEST_STATUS?.OPEN || 'open';
      const inProgressStatus = REQUEST_STATUS?.IN_PROGRESS || 'in_progress';
      
      const clientNames = [
        'Александр Иванов', 'Елена Петрова', 'Михаил Сидоров', 'Ольга Кузнецова', 
        'Дмитрий Смирнов', 'Анна Васильева', 'Сергей Козлов', 'Наталья Морозова'
      ];
      
      const requestTitles = [
        'Консультация по семейному праву', 'Помощь в составлении договора аренды',
        'Юридическая помощь в суде', 'Консультация по налоговым вопросам',
        'Оформление наследства', 'Возмещение ущерба при ДТП',
        'Раздел имущества при разводе', 'Сопровождение сделки с недвижимостью'
      ];
      
      const requestDescriptions = [
        'Необходима консультация по вопросам семейного права в связи с предстоящим разводом и разделом имущества.',
        'Требуется помощь в составлении договора аренды коммерческого помещения с особыми условиями.',
        'Ищу адвоката для представления моих интересов в суде по гражданскому делу.',
        'Необходима консультация по оптимизации налогообложения для малого бизнеса.',
        'Требуется помощь в оформлении наследства после смерти родственника.'
      ];
      
      // Создаем 15 тестовых заявок
      for (let i = 0; i < 15; i++) {
        // Создаем разнообразные даты: часть новые, часть старые
        const randomDate = new Date();
        
        // Распределяем по датам
        let daysAgo;
        if (i < 5) {
          daysAgo = Math.floor(Math.random() * 3); // 0-2 дня
        } else if (i < 10) {
          daysAgo = 3 + Math.floor(Math.random() * 7); // 3-9 дней
        } else {
          daysAgo = 10 + Math.floor(Math.random() * 20); // 10-29 дней
        }
        
        randomDate.setDate(randomDate.getDate() - daysAgo);
        
        // Распределяем заявки по разным областям права
        const lawAreaIndex = i % areas.length;
        
        // Распределяем по ценовым диапазонам
        const priceRangeIndex = Math.floor(i / 3) % priceRanges.length;
        
        // Только одна заявка должна иметь статус "вы откликнулись"
        const hasResponded = i === 2; // Только третья заявка с откликом
        
        // Статус: большинство открытые, но несколько в работе
        const status = i % 7 === 0 ? inProgressStatus : openStatus;
        
        // Количество откликов разное для разных заявок
        const responseCount = Math.floor(Math.random() * 5); // От 0 до 4 откликов
        
        const clientNameIndex = i % clientNames.length;
        const titleIndex = i % requestTitles.length;
        const descriptionIndex = i % requestDescriptions.length;
        
        const request = {
          id: i + 1,
          client_id: i + 100,
          client_name: clientNames[clientNameIndex],
          title: requestTitles[titleIndex],
          description: requestDescriptions[descriptionIndex],
          law_area: areas[lawAreaIndex].value,
          price_range: priceRanges[priceRangeIndex].value,
          status: status,
          created_at: randomDate.toISOString(),
          hasResponded: hasResponded,
          response_count: responseCount,
          isUrgent: i % 4 === 0, // Каждая четвертая срочная
        };
        
        // Устанавливаем опыт для некоторых заявок
        if (i % 5 === 0) {
          request.experience_required = 5; // Высокий опыт
        } else if (i % 5 === 1) {
          request.experience_required = 3; // Средний опыт
        } else if (i % 5 === 2) {
          request.experience_required = 1; // Минимальный опыт
        }
        
        // Для совместимости с RequestCard, убедимся, что значения соответствуют ожидаемому формату
        if (areas[lawAreaIndex].value !== areas[lawAreaIndex].label) {
          // Если value и label разные (как ожидается в RequestCard)
          request.law_area = areas[lawAreaIndex].value;
        } else {
          // Если в константах value и label одинаковые, присваиваем только value
          request.law_area = areas[lawAreaIndex].value;
        }
        
        mockRequests.push(request);
      }
      
      // Сохраняем заявки в AsyncStorage
      AsyncStorage.setItem('mock_requests', JSON.stringify(mockRequests))
        .then(() => {
          console.log(`Сохранено ${mockRequests.length} заявок в AsyncStorage`);
          
          // Немедленно обновляем состояние UI
          setRequests(mockRequests);
          
          // Обновляем статистику
          const newRequestsCount = mockRequests.filter(r => 
            r.status === openStatus && 
            !r.hasResponded && 
            new Date(r.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
          ).length;
          
          const respondedRequestsCount = mockRequests.filter(r => r.hasResponded).length;
          
          setStats({
            totalRequests: mockRequests.length,
            newRequests: newRequestsCount,
            respondedRequests: respondedRequestsCount
          });
          
          setLoading(false);
          
          Alert.alert(
            "Заявки добавлены",
            `${mockRequests.length} тестовых заявок успешно добавлены и отображены.`,
            [{ text: "OK" }]
          );
        })
        .catch(error => {
          console.error('Ошибка при сохранении заявок:', error);
          setLoading(false);
          Alert.alert(
            "Ошибка",
            "Не удалось сохранить тестовые заявки. Пожалуйста, попробуйте еще раз.",
            [{ text: "OK" }]
          );
        });
    } catch (error) {
      console.error('Ошибка при создании тестовых заявок:', error);
      setLoading(false);
      Alert.alert(
        "Ошибка",
        "Произошла ошибка при создании тестовых заявок. Пожалуйста, попробуйте еще раз.",
        [{ text: "OK" }]
      );
    }
  };

  const filteredRequests = useCallback(() => {
    // Если массив requests пустой, возвращаем пустой массив
    if (!requests || requests.length === 0) {
      return [];
    }
    
    // Start with all requests
    let result = [...requests];
    
    // Безопасно проверяем статус REQUEST_STATUS.OPEN
    const OPEN_STATUS = REQUEST_STATUS?.OPEN || 'open';
    const IN_PROGRESS_STATUS = REQUEST_STATUS?.IN_PROGRESS || 'in_progress';
    
    // Apply status filter
    if (filter === 'open') {
      result = result.filter(r => r.status === OPEN_STATUS);
    } else if (filter === 'responded') {
      result = result.filter(r => r.hasResponded);
    } else if (filter === 'in_progress') {
      result = result.filter(r => r.status === IN_PROGRESS_STATUS);
    } else if (filter === 'urgent') {
      result = result.filter(r => r.isUrgent);
    }
    
    // Apply advanced filters
    if (selectedLawArea) {
      result = result.filter(r => r.law_area === selectedLawArea);
    }
    
    if (selectedPriceRange) {
      result = result.filter(r => r.price_range === selectedPriceRange);
    }
    
    // Apply search text
    if (searchText.trim() !== '') {
      const searchLower = searchText.toLowerCase();
      result = result.filter(r => 
        (r.title && r.title.toLowerCase().includes(searchLower)) || 
        (r.description && r.description.toLowerCase().includes(searchLower)) ||
        (r.client_name && r.client_name.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply sort
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === 'price_high') {
      // Сортировка по ценовому диапазону (от высокого к низкому)
      const priceOrder = { 'premium': 5, 'high': 4, 'medium': 3, 'low': 2, 'free': 1 };
      result.sort((a, b) => (priceOrder[b.price_range] || 0) - (priceOrder[a.price_range] || 0));
    } else if (sortBy === 'price_low') {
      // Сортировка по ценовому диапазону (от низкого к высокому)
      const priceOrder = { 'free': 1, 'low': 2, 'medium': 3, 'high': 4, 'premium': 5 };
      result.sort((a, b) => (priceOrder[a.price_range] || 0) - (priceOrder[b.price_range] || 0));
    } else if (sortBy === 'responses') {
      // Сортировка по количеству откликов
      result.sort((a, b) => (b.response_count || 0) - (a.response_count || 0));
    }
    
    return result;
  }, [requests, filter, selectedLawArea, selectedPriceRange, searchText, sortBy]);

  const resetFilters = () => {
    setFilter('all');
    setSelectedLawArea(null);
    setSelectedPriceRange(null);
    setSortBy('newest');
    setSearchText('');
    setFilterModalVisible(false);
  };

  const applyFilters = () => {
    setFilterModalVisible(false);
  };

  const renderItem = ({ item }) => (
    <RequestCard 
      request={item} 
      onPress={() => handleRequestPress(item)}
      showClientInfo={true}
    />
  );

  const renderFilterModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => {
          setFilterModalVisible(!filterModalVisible);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Фильтры заявок</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <Text style={styles.filterSectionTitle}>Поиск по ключевым словам</Text>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Введите ключевые слова"
                  value={searchText}
                  onChangeText={setSearchText}
                />
                {searchText ? (
                  <TouchableOpacity onPress={() => setSearchText('')}>
                    <Ionicons name="close-circle" size={20} color={COLORS.gray} />
                  </TouchableOpacity>
                ) : null}
              </View>
              
              <Text style={styles.filterSectionTitle}>Статус заявки</Text>
              <View style={styles.filterRow}>
                <TouchableOpacity 
                  style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
                  onPress={() => setFilter('all')}
                >
                  <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
                    Все заявки
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterChip, filter === 'open' && styles.filterChipActive]}
                  onPress={() => setFilter('open')}
                >
                  <Text style={[styles.filterChipText, filter === 'open' && styles.filterChipTextActive]}>
                    Только открытые
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterChip, filter === 'in_progress' && styles.filterChipActive]}
                  onPress={() => setFilter('in_progress')}
                >
                  <Text style={[styles.filterChipText, filter === 'in_progress' && styles.filterChipTextActive]}>
                    В работе
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterChip, filter === 'responded' && styles.filterChipActive]}
                  onPress={() => setFilter('responded')}
                >
                  <Text style={[styles.filterChipText, filter === 'responded' && styles.filterChipTextActive]}>
                    С моим откликом
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterChip, filter === 'urgent' && styles.filterChipActive]}
                  onPress={() => setFilter('urgent')}
                >
                  <Text style={[styles.filterChipText, filter === 'urgent' && styles.filterChipTextActive]}>
                    Срочные
                  </Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.filterSectionTitle}>Область права</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                {LAW_AREAS.map((area) => (
                  <TouchableOpacity 
                    key={area.value}
                    style={[
                      styles.filterChip, 
                      selectedLawArea === area.value && styles.filterChipActive
                    ]}
                    onPress={() => setSelectedLawArea(
                      selectedLawArea === area.value ? null : area.value
                    )}
                  >
                    <Text style={[
                      styles.filterChipText,
                      selectedLawArea === area.value && styles.filterChipTextActive
                    ]}>
                      {area.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <Text style={styles.filterSectionTitle}>Бюджет клиента</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                {PRICE_RANGES.map((price) => (
                  <TouchableOpacity 
                    key={price.value}
                    style={[
                      styles.filterChip, 
                      selectedPriceRange === price.value && styles.filterChipActive
                    ]}
                    onPress={() => setSelectedPriceRange(
                      selectedPriceRange === price.value ? null : price.value
                    )}
                  >
                    <Text style={[
                      styles.filterChipText,
                      selectedPriceRange === price.value && styles.filterChipTextActive
                    ]}>
                      {price.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <Text style={styles.filterSectionTitle}>Сортировка</Text>
              <View style={styles.filterRow}>
                <TouchableOpacity 
                  style={[styles.filterChip, sortBy === 'newest' && styles.filterChipActive]}
                  onPress={() => setSortBy('newest')}
                >
                  <Text style={[styles.filterChipText, sortBy === 'newest' && styles.filterChipTextActive]}>
                    Сначала новые
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterChip, sortBy === 'oldest' && styles.filterChipActive]}
                  onPress={() => setSortBy('oldest')}
                >
                  <Text style={[styles.filterChipText, sortBy === 'oldest' && styles.filterChipTextActive]}>
                    Сначала старые
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterChip, sortBy === 'price_high' && styles.filterChipActive]}
                  onPress={() => setSortBy('price_high')}
                >
                  <Text style={[styles.filterChipText, sortBy === 'price_high' && styles.filterChipTextActive]}>
                    Сначала дорогие
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterChip, sortBy === 'price_low' && styles.filterChipActive]}
                  onPress={() => setSortBy('price_low')}
                >
                  <Text style={[styles.filterChipText, sortBy === 'price_low' && styles.filterChipTextActive]}>
                    Сначала дешевые
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterChip, sortBy === 'responses' && styles.filterChipActive]}
                  onPress={() => setSortBy('responses')}
                >
                  <Text style={[styles.filterChipText, sortBy === 'responses' && styles.filterChipTextActive]}>
                    По количеству откликов
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.filterButton, styles.resetButton]}
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>Сбросить</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterButton, styles.applyButton]}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>Применить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderEmptyComponent = () => {
    // Во время начальной загрузки не показываем пустое состояние,
    // так как у нас есть тестовые данные
    if (initialLoading) return null;
    
    // Если есть запросы, но они отфильтрованы
    if (requests.length > 0 && filteredRequests().length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={COLORS.lightGrey} />
          <Text style={styles.emptyTitle}>Ничего не найдено</Text>
          <Text style={styles.emptySubtitle}>
            По заданным фильтрам заявки не найдены
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={resetFilters}
          >
            <Text style={styles.retryButtonText}>Сбросить фильтры</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.emptyTitle}>Загрузка заявок...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.emptyTitle}>Произошла ошибка</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchRequests}
          >
            <Text style={styles.retryButtonText}>Попробовать снова</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={64} color={COLORS.lightGrey} />
        <Text style={styles.emptyTitle}>Нет доступных заявок</Text>
        <Text style={styles.emptySubtitle}>
          Доступные для отклика заявки будут отображаться здесь
        </Text>
      </View>
    );
  };

  // Основной компонент возвращаем всегда, даже при загрузке, 
  // т.к. у нас есть мгновенно отображаемые тестовые данные
  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      {renderFilterModal()}
      
      <FlatList
        data={filteredRequests()}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>Заявки клиентов</Text>
              <TouchableOpacity 
                style={styles.filterIconButton}
                onPress={() => setFilterModalVisible(true)}
              >
                <Ionicons name="options-outline" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalRequests}</Text>
                <Text style={styles.statLabel}>Всего заявок</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.newRequests}</Text>
                <Text style={styles.statLabel}>Новых за 24ч</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.respondedRequests}</Text>
                <Text style={styles.statLabel}>С откликом</Text>
              </View>
            </View>

            <View style={styles.filterContainer}>
              <TouchableOpacity 
                style={[
                  styles.filterButton, 
                  filter === 'all' && styles.filterButtonActive
                ]}
                onPress={() => setFilter('all')}
              >
                <Text style={[
                  styles.filterText,
                  filter === 'all' && styles.filterTextActive
                ]}>
                  Все
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.filterButton, 
                  filter === 'open' && styles.filterButtonActive
                ]}
                onPress={() => setFilter('open')}
              >
                <Text style={[
                  styles.filterText,
                  filter === 'open' && styles.filterTextActive
                ]}>
                  Открытые
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.filterButton, 
                  filter === 'responded' && styles.filterButtonActive
                ]}
                onPress={() => setFilter('responded')}
              >
                <Text style={[
                  styles.filterText,
                  filter === 'responded' && styles.filterTextActive
                ]}>
                  С откликом
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.filterButton, 
                  filter === 'urgent' && styles.filterButtonActive
                ]}
                onPress={() => setFilter('urgent')}
              >
                <Text style={[
                  styles.filterText,
                  filter === 'urgent' && styles.filterTextActive
                ]}>
                  Срочные
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.sortContainer}>
              <Text style={styles.sortLabel}>Сортировка:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity 
                  style={[
                    styles.sortButton, 
                    sortBy === 'newest' && styles.sortButtonActive
                  ]}
                  onPress={() => setSortBy('newest')}
                >
                  <Text style={[
                    styles.sortText,
                    sortBy === 'newest' && styles.sortTextActive
                  ]}>
                    Новые
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.sortButton, 
                    sortBy === 'price_high' && styles.sortButtonActive
                  ]}
                  onPress={() => setSortBy('price_high')}
                >
                  <Text style={[
                    styles.sortText,
                    sortBy === 'price_high' && styles.sortTextActive
                  ]}>
                    Дорогие
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.sortButton, 
                    sortBy === 'responses' && styles.sortButtonActive
                  ]}
                  onPress={() => setSortBy('responses')}
                >
                  <Text style={[
                    styles.sortText,
                    sortBy === 'responses' && styles.sortTextActive
                  ]}>
                    Популярные
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
            
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                Найдено: {filteredRequests().length} {getResultCountLabel(filteredRequests().length)}
              </Text>
              <View style={styles.actionsContainer}>
                <TouchableOpacity 
                  style={styles.addTestButton}
                  onPress={addTestRequests}
                >
                  <Ionicons name="add-circle" size={18} color={COLORS.primary} />
                  <Text style={styles.addTestButtonText}>Добавить тестовые</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={fetchRequests}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Ionicons name="refresh" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
};

// Helper function to get the correct word form for count in Russian
const getResultCountLabel = (count) => {
  if (count === 0) return 'заявок';
  if (count === 1) return 'заявка';
  if (count >= 2 && count <= 4) return 'заявки';
  return 'заявок';
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
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  filterIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.text,
    fontWeight: '500',
    fontSize: 14,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 8,
  },
  sortButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
    marginRight: 4,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  sortTextActive: {
    color: COLORS.white,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    marginRight: 8,
  },
  addTestButtonText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    padding: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: '500',
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalView: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalContent: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  resetButton: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    marginRight: 8,
  },
  resetButtonText: {
    color: COLORS.text,
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  applyButtonText: {
    color: COLORS.white,
    fontWeight: '500',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: COLORS.text,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: COLORS.text,
  },
});

export default LawyerRequestsScreen; 