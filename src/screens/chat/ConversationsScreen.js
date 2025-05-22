import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Platform,
  TextInput,
  Image,
  Alert,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { format, formatDistanceToNow } from 'date-fns';
import ru from 'date-fns/locale/ru';

import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import ChatService from '../../services/ChatService';
import ImageService from '../../services/ImageService';

// Тестовые данные для немедленного отображения
const MOCK_CONVERSATIONS = [
  {
    id: 1,
    client_name: 'Артем Иванов',
    lawyer_name: 'Адвокат',
    last_message: 'Здравствуйте! Мне нужна юридическая консультация.',
    updated_at: new Date().toISOString(),
    unread_count: 2,
    online: true,
    has_guest: false
  },
  {
    id: 2,
    client_name: 'Елена Смирнова',
    lawyer_name: 'Адвокат',
    last_message: 'Спасибо за консультацию, очень помогло!',
    updated_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    unread_count: 0,
    online: false,
    has_guest: false
  },
  {
    id: 3,
    client_name: 'Дмитрий Козлов',
    lawyer_name: 'Адвокат',
    last_message: 'Когда мы можем встретиться для обсуждения моего дела?',
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    unread_count: 1,
    online: true,
    has_guest: false
  }
];

const ConversationsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'unread', 'client', 'guest'
  const [showSearch, setShowSearch] = useState(false);
  
  const searchInputAnim = new Animated.Value(0);

  // Функция для переключения поиска
  const toggleSearch = () => {
    if (showSearch) {
      Animated.timing(searchInputAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false
      }).start();
      setSearchQuery('');
      setTimeout(() => setShowSearch(false), 300);
    } else {
      setShowSearch(true);
      Animated.timing(searchInputAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false
      }).start();
    }
  };

  // Инициализация с помощью тестовых данных для мгновенного отображения
  useEffect(() => {
    if (initialLoading && user) {
      const mockData = MOCK_CONVERSATIONS.map(conv => ({
        ...conv,
        client_id: user.userType === 'client' ? user.id : 1000 + Math.floor(Math.random() * 100),
        lawyer_id: user.userType === 'lawyer' ? user.id : 2000 + Math.floor(Math.random() * 100),
        // Добавим вероятность наличия картинки или документа
        has_image: Math.random() > 0.7,
        has_document: Math.random() > 0.8,
        // Добавим случайный статус печати
        typing: Math.random() > 0.8
      }));
      setConversations(mockData);
      setFilteredConversations(mockData);
      setInitialLoading(false);
      
      // Загружаем реальные данные асинхронно
      loadConversations();
    }
  }, [user, initialLoading]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('Загружаем чаты...');
      
      // Генерируем тестовые чаты для адвоката
      if (user.userType === 'lawyer') {
        await ChatService.generateMockChatsForLawyer(user.id);
      }
      
      const data = await ChatService.getConversations(user.id);
      console.log(`Загружено ${data.length} чатов`);
      
      if (data && data.length > 0) {
        // Добавим дополнительные данные для UI
        const enhancedData = data.map(conv => ({
          ...conv,
          // Добавим вероятность наличия картинки или документа
          has_image: Math.random() > 0.7,
          has_document: Math.random() > 0.8,
          // Добавим случайный статус печати
          typing: Math.random() > 0.8
        }));
        setConversations(enhancedData);
        applyFilters(enhancedData, searchQuery, activeFilter);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Не удалось загрузить список бесед');
      // Оставляем тестовые данные, если загрузка не удалась
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, searchQuery, activeFilter]);

  const applyFilters = useCallback((data, query, filter) => {
    let result = [...data];
    
    // Apply search filter
    if (query) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(conv => {
        const clientName = conv.client_name ? conv.client_name.toLowerCase() : '';
        const lawyerName = conv.lawyer_name ? conv.lawyer_name.toLowerCase() : '';
        const message = conv.last_message ? conv.last_message.toLowerCase() : '';
        const requestTitle = conv.request_title ? conv.request_title.toLowerCase() : '';
        
        return clientName.includes(lowerQuery) || 
               lawyerName.includes(lowerQuery) || 
               message.includes(lowerQuery) ||
               requestTitle.includes(lowerQuery);
      });
    }
    
    // Apply type filter
    if (filter === 'unread') {
      result = result.filter(conv => conv.unread_count > 0);
    } else if (filter === 'client') {
      result = result.filter(conv => !conv.has_guest);
    } else if (filter === 'guest') {
      result = result.filter(conv => conv.has_guest);
    }
    
    setFilteredConversations(result);
  }, []);

  // Update filtered conversations when search query or filter changes
  useEffect(() => {
    applyFilters(conversations, searchQuery, activeFilter);
  }, [conversations, searchQuery, activeFilter, applyFilters]);

  // Загружаем беседы при фокусе на экране, но только если уже были инициализированы
  useFocusEffect(
    useCallback(() => {
      if (!initialLoading) {
        loadConversations();
      }
    }, [loadConversations, initialLoading])
  );

  // Обработчик обновления списка бесед
  const handleRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  // Переход к экрану беседы
  const handleConversationPress = (conversation) => {
    const title = user.userType === 'client' ? conversation.lawyer_name : conversation.client_name;
    
    // For lawyers viewing a guest conversation, we need to determine the guest ID
    let guestId = null;
    if (user.userType === 'lawyer' && conversation.has_guest) {
      guestId = conversation.client_id;
    }
    
    navigation.navigate('ChatScreen', { 
      conversationId: conversation.id,
      title,
      guestId
    });
  };

  // Переход к экрану создания новой беседы
  const handleNewChat = () => {
    navigation.navigate('NewChatScreen');
  };

  // Удаление чата
  const handleDeleteChat = (conversation) => {
    Alert.alert(
      'Удаление чата',
      'Вы уверены, что хотите удалить этот чат? Это действие нельзя отменить.',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive',
          onPress: () => {
            // В реальном приложении здесь должен быть запрос к серверу
            // Для демонстрации просто удаляем из локального состояния
            const updatedConversations = conversations.filter(c => c.id !== conversation.id);
            setConversations(updatedConversations);
            applyFilters(updatedConversations, searchQuery, activeFilter);
            
            Alert.alert('Успешно', 'Чат был удален');
          }
        }
      ]
    );
  };

  // Форматирование даты последнего сообщения
  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const isToday = date.getDate() === now.getDate() && 
                     date.getMonth() === now.getMonth() && 
                     date.getFullYear() === now.getFullYear();
      
      if (isToday) {
        return format(date, 'HH:mm');
      } else {
        // Используем относительное форматирование
        return formatDistanceToNow(date, { addSuffix: true, locale: ru });
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Отображение аватара в зависимости от типа пользователя
  const renderAvatar = (conversation) => {
    const name = user.userType === 'client' ? conversation.lawyer_name : conversation.client_name;
    const id = user.userType === 'client' ? conversation.lawyer_id : conversation.client_id;
    const color = user.userType === 'client' 
      ? ImageService.getLawyerAvatarColor(id)
      : ImageService.getClientAvatarColor(id);
    const initials = ImageService.getInitials(name);
    
    return (
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <Text style={styles.avatarText}>{initials}</Text>
        {conversation.online && (
          <View style={styles.onlineIndicator} />
        )}
      </View>
    );
  };

  // Отображение элемента беседы
  const renderConversationItem = ({ item }) => {
    const name = user.userType === 'client' ? item.lawyer_name : item.client_name;
    const isGuestConversation = item.has_guest;
    const hasAttachment = item.has_image || item.has_document;
    
    // Randomly set some conversations as "online" to make the app look more alive
    item.online = item.online === undefined ? Math.random() > 0.7 : item.online;
    
    return (
      <TouchableOpacity 
        style={[
          styles.conversationItem, 
          item.unread_count > 0 && styles.unreadConversation
        ]}
        onPress={() => handleConversationPress(item)}
        onLongPress={() => handleDeleteChat(item)}
      >
        {renderAvatar(item)}
        
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <View style={styles.nameContainer}>
              <Text style={[
                styles.name, 
                item.unread_count > 0 && styles.unreadName
              ]} numberOfLines={1}>
                {name}
              </Text>
              {isGuestConversation && (
                <View style={styles.guestBadge}>
                  <Text style={styles.guestText}>Гость</Text>
                </View>
              )}
            </View>
            <Text style={styles.time}>{formatLastMessageTime(item.updated_at)}</Text>
          </View>
          
          <View style={styles.messageContainer}>
            <View style={styles.messageContent}>
              {item.typing ? (
                <Text style={styles.typingText}>печатает...</Text>
              ) : (
                <Text style={[
                  styles.message, 
                  item.unread_count > 0 && styles.unreadMessage
                ]} numberOfLines={1}>
                  {item.last_message}
                </Text>
              )}
              {hasAttachment && (
                <View style={styles.attachmentIndicator}>
                  <Ionicons 
                    name={item.has_image ? "image-outline" : "document-outline"} 
                    size={14} 
                    color={COLORS.textSecondary} 
                  />
                </View>
              )}
            </View>
            
            {item.unread_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unread_count}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Отображение пустого списка
  const renderEmptyList = () => {
    if (loading && conversations.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.emptyText}>Загрузка чатов...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={[styles.emptyText, styles.errorText]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadConversations}>
            <Text style={styles.retryButtonText}>Повторить</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // Если это фильтрованный пустой список
    if (conversations.length > 0 && filteredConversations.length === 0) {
      let message;
      if (searchQuery) {
        message = `Нет чатов, соответствующих запросу "${searchQuery}"`;
      } else if (activeFilter === 'unread') {
        message = 'Нет непрочитанных сообщений';
      } else if (activeFilter === 'client') {
        message = 'Нет чатов с клиентами';
      } else if (activeFilter === 'guest') {
        message = 'Нет чатов с гостями';
      } else {
        message = 'Нет доступных чатов';
      }
      
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>{message}</Text>
          {(searchQuery || activeFilter !== 'all') && (
            <TouchableOpacity 
              style={styles.resetFilterButton}
              onPress={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
            >
              <Text style={styles.resetFilterText}>Сбросить фильтры</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    
    // Пустой список чатов
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubble-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.emptyText}>У вас пока нет чатов</Text>
        <TouchableOpacity style={styles.startChatButton} onPress={handleNewChat}>
          <Text style={styles.startChatText}>Начать новый чат</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Отображение заголовка списка с фильтрами
  const renderListHeader = () => {
    return (
      <View style={styles.listHeader}>
        {showSearch ? (
          <Animated.View style={[
            styles.searchInputContainer,
            {
              width: searchInputAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              }),
              opacity: searchInputAnim
            }
          ]}>
            <Ionicons name="search" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Поиск чатов..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity onPress={toggleSearch}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={styles.filterContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContent}
            >
              <TouchableOpacity 
                style={[styles.filterButton, activeFilter === 'all' && styles.activeFilterButton]}
                onPress={() => setActiveFilter('all')}
              >
                <Text style={[
                  styles.filterText, 
                  activeFilter === 'all' && styles.activeFilterText
                ]}>
                  Все
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.filterButton, activeFilter === 'unread' && styles.activeFilterButton]}
                onPress={() => setActiveFilter('unread')}
              >
                <Text style={[
                  styles.filterText, 
                  activeFilter === 'unread' && styles.activeFilterText
                ]}>
                  Непрочитанные
                </Text>
              </TouchableOpacity>
              
              {user?.userType === 'lawyer' && (
                <>
                  <TouchableOpacity 
                    style={[styles.filterButton, activeFilter === 'client' && styles.activeFilterButton]}
                    onPress={() => setActiveFilter('client')}
                  >
                    <Text style={[
                      styles.filterText, 
                      activeFilter === 'client' && styles.activeFilterText
                    ]}>
                      Клиенты
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.filterButton, activeFilter === 'guest' && styles.activeFilterButton]}
                    onPress={() => setActiveFilter('guest')}
                  >
                    <Text style={[
                      styles.filterText, 
                      activeFilter === 'guest' && styles.activeFilterText
                    ]}>
                      Гости
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
            
            <TouchableOpacity style={styles.searchButton} onPress={toggleSearch}>
              <Ionicons name="search" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.conversationCount}>
          <Text style={styles.conversationCountText}>
            {getConversationCountText(filteredConversations.length)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <FlatList
        data={filteredConversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmptyList}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />

      <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
        <Ionicons name="chatbubble-ellipses" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// Получение текста о количестве бесед
const getConversationCountText = (count) => {
  if (count === 0) return 'Нет чатов';
  
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return `${count} чатов`;
  } else if (lastDigit === 1) {
    return `${count} чат`;
  } else if (lastDigit >= 2 && lastDigit <= 4) {
    return `${count} чата`;
  } else {
    return `${count} чатов`;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 80, // Учитываем плавающую кнопку
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  unreadConversation: {
    backgroundColor: COLORS.primary + '05',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginRight: 8,
  },
  unreadName: {
    fontWeight: 'bold',
  },
  guestBadge: {
    backgroundColor: COLORS.lightGrey,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  guestText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  time: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  messageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  unreadMessage: {
    color: COLORS.text,
    fontWeight: '500',
  },
  typingText: {
    fontSize: 14,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  attachmentIndicator: {
    marginLeft: 4,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  errorText: {
    color: COLORS.error,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: '500',
  },
  startChatButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  startChatText: {
    color: COLORS.white,
    fontWeight: '500',
  },
  resetFilterButton: {
    padding: 8,
  },
  resetFilterText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  listHeader: {
    backgroundColor: COLORS.white,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  filterScrollContent: {
    paddingRight: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: COLORS.background,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.text,
  },
  activeFilterText: {
    color: COLORS.white,
    fontWeight: '500',
  },
  searchButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    paddingVertical: 4,
  },
  conversationCount: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  conversationCountText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  newChatButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

export default ConversationsScreen; 