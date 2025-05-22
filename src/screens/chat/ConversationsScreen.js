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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
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

  // Инициализация с помощью тестовых данных для мгновенного отображения
  useEffect(() => {
    if (initialLoading && user) {
      const mockData = MOCK_CONVERSATIONS.map(conv => ({
        ...conv,
        client_id: user.userType === 'client' ? user.id : 1000 + Math.floor(Math.random() * 100),
        lawyer_id: user.userType === 'lawyer' ? user.id : 2000 + Math.floor(Math.random() * 100)
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
        setConversations(data);
        applyFilters(data, searchQuery, activeFilter);
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

  // Форматирование даты последнего сообщения
  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.setHours(0, 0, 0, 0) === now.setHours(0, 0, 0, 0);
    
    if (isToday) {
      return format(date, 'HH:mm');
    } else {
      return format(date, 'd MMM', { locale: ru });
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
    
    // Randomly set some conversations as "online" to make the app look more alive
    item.online = item.online === undefined ? Math.random() > 0.7 : item.online;
    
    return (
      <TouchableOpacity 
        style={[
          styles.conversationItem, 
          item.unread_count > 0 && styles.unreadConversation
        ]}
        onPress={() => handleConversationPress(item)}
      >
        {renderAvatar(item)}
        
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <View style={styles.nameContainer}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              {isGuestConversation && (
                <View style={styles.guestBadge}>
                  <Text style={styles.guestText}>Гость</Text>
                </View>
              )}
              {item.online && (
                <Text style={styles.onlineText}>В сети</Text>
              )}
            </View>
            <Text style={styles.time}>
              {formatLastMessageTime(item.updated_at)}
            </Text>
          </View>
          
          <View style={styles.messageRow}>
            {item.request_title && (
              <Text style={styles.requestTitle} numberOfLines={1}>
                По заявке: {item.request_title}
              </Text>
            )}
          </View>
          
          <Text 
            style={[
              styles.message, 
              item.unread_count > 0 && styles.unreadMessage
            ]} 
            numberOfLines={1}
          >
            {item.last_message || 'Нет сообщений'}
          </Text>
          
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {item.unread_count}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Отображение пустого списка
  const renderEmptyList = () => {
    // Показываем индикатор загрузки только при инициальной загрузке,
    // но не во время обновления списка
    if (loading && initialLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.emptyTitle}>Загрузка бесед...</Text>
        </View>
      );
    }
    
    if (error && filteredConversations.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.emptyTitle}>Произошла ошибка</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadConversations}
          >
            <Text style={styles.retryButtonText}>Повторить</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // Проверяем, связано ли отсутствие бесед с фильтрацией
    if (conversations.length > 0 && filteredConversations.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={COLORS.lightGrey} />
          <Text style={styles.emptyTitle}>Ничего не найдено</Text>
          <Text style={styles.emptyText}>
            По вашему запросу не найдено бесед
          </Text>
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={() => {
              setSearchQuery('');
              setActiveFilter('all');
            }}
          >
            <Text style={styles.resetButtonText}>Сбросить фильтры</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubble-ellipses-outline" size={64} color={COLORS.lightGrey} />
        <Text style={styles.emptyTitle}>У вас пока нет бесед</Text>
        <Text style={styles.emptyText}>
          Начните общение с клиентами или коллегами
        </Text>
        <TouchableOpacity 
          style={styles.newChatButton}
          onPress={handleNewChat}
        >
          <Text style={styles.newChatButtonText}>Начать беседу</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render header with search and filters
  const renderListHeader = () => {
    return (
      <View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск по сообщениям"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.gray}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <View style={styles.filtersContainer}>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === 'all' && styles.activeFilterButton]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>
              Все
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === 'unread' && styles.activeFilterButton]}
            onPress={() => setActiveFilter('unread')}
          >
            <Text style={[styles.filterText, activeFilter === 'unread' && styles.activeFilterText]}>
              Непрочитанные
            </Text>
          </TouchableOpacity>
          {user?.userType === 'lawyer' && (
            <>
              <TouchableOpacity 
                style={[styles.filterButton, activeFilter === 'client' && styles.activeFilterButton]}
                onPress={() => setActiveFilter('client')}
              >
                <Text style={[styles.filterText, activeFilter === 'client' && styles.activeFilterText]}>
                  Клиенты
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterButton, activeFilter === 'guest' && styles.activeFilterButton]}
                onPress={() => setActiveFilter('guest')}
              >
                <Text style={[styles.filterText, activeFilter === 'guest' && styles.activeFilterText]}>
                  Гости
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {filteredConversations.length} {getConversationCountText(filteredConversations.length)}
          </Text>
          {searchQuery && (
            <Text style={styles.searchResultText}>
              по запросу "{searchQuery}"
            </Text>
          )}
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
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
      />
      
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleNewChat}
      >
        <Ionicons name="chatbubbles" size={22} color={COLORS.white} />
        <Text style={styles.floatingButtonText}>Написать</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// Helper function to get the correct word form for count in Russian
const getConversationCountText = (count) => {
  if (count === 0) return 'бесед';
  if (count === 1) return 'беседа';
  if (count >= 2 && count <= 4) return 'беседы';
  return 'бесед';
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: '500',
    fontSize: 16,
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginTop: 12,
  },
  resetButtonText: {
    color: COLORS.white,
    fontWeight: '500',
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: COLORS.text,
    fontSize: 15,
  },
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
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
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  searchResultText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginLeft: 4,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  unreadConversation: {
    backgroundColor: 'rgba(46, 91, 255, 0.05)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  conversationInfo: {
    flex: 1,
    position: 'relative',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 8,
  },
  onlineText: {
    fontSize: 12,
    color: '#34C759',
    marginLeft: 4,
  },
  guestBadge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  guestText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '500',
  },
  time: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  messageRow: {
    marginBottom: 2,
  },
  requestTitle: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  unreadMessage: {
    color: COLORS.text,
    fontWeight: '500',
  },
  unreadBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  newChatButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  newChatButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  floatingButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  floatingButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ConversationsScreen; 