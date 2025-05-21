import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
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

const ConversationsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await ChatService.getConversations(user.id);
      setConversations(data);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Не удалось загрузить список бесед');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Загружаем беседы при входе на экран
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  // Обработчик обновления списка бесед
  const handleRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  // Переход к экрану беседы
  const handleConversationPress = (conversation) => {
    navigation.navigate('ChatScreen', { 
      conversationId: conversation.id,
      title: user.userType === 'client' ? conversation.lawyer_name : conversation.client_name
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
      </View>
    );
  };

  // Отображение элемента беседы
  const renderConversationItem = ({ item }) => {
    const name = user.userType === 'client' ? item.lawyer_name : item.client_name;
    
    return (
      <TouchableOpacity 
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item)}
      >
        {renderAvatar(item)}
        
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
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
          
          <Text style={styles.message} numberOfLines={1}>
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
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubble-ellipses-outline" size={64} color={COLORS.lightGrey} />
        <Text style={styles.emptyText}>У вас пока нет бесед</Text>
        <TouchableOpacity 
          style={styles.newChatButton}
          onPress={handleNewChat}
        >
          <Text style={styles.newChatButtonText}>Начать беседу</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadConversations}
          >
            <Text style={styles.retryText}>Повторить</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id.toString()}
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
      )}
      
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleNewChat}
      >
        <Ionicons name="add" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
  listContent: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
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
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  messageRow: {
    marginBottom: 2,
  },
  requestTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  unreadBadge: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginVertical: 16,
  },
  newChatButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  newChatButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
  floatingButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
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