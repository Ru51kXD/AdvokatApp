import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import ChatService from '../../services/ChatService';
import ChatMessage from '../../components/ChatMessage';

const ChatScreen = ({ route, navigation }) => {
  const { conversationId, title, guestId } = route.params;
  const { authState } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef();

  // Определяем ID пользователя (авторизованный пользователь или гость)
  const userId = guestId || (authState.user ? authState.user.id : null);
  const isGuest = Boolean(guestId);

  console.log('ChatScreen: Initialized with', { 
    conversationId, 
    title,
    userId,
    isGuest,
    authUser: authState.user ? { id: authState.user.id, type: authState.user.user_type } : null 
  });

  // Проверяем ID пользователя
  useEffect(() => {
    if (!userId) {
      setError('Не удалось определить ID пользователя. Пожалуйста, войдите в систему или перезапустите чат.');
      setLoading(false);
    }
  }, [userId]);

  // Загрузка сообщений
  const loadMessages = useCallback(async () => {
    try {
      if (!conversationId) {
        setError('ID беседы не указан');
        setLoading(false);
        return;
      }

      console.log('ChatScreen: Loading messages for conversation', conversationId);
      setLoading(true);
      setError(null);
      const result = await ChatService.getMessages(conversationId);
      console.log('ChatScreen: Loaded messages', { 
        count: result.messages.length,
        conversation: result.conversation?.id
      });
      
      setMessages(result.messages);
      setConversation(result.conversation);
      
      // Отмечаем сообщения как прочитанные только для авторизованных пользователей
      if (authState.user && !isGuest) {
        await ChatService.markMessagesAsRead(conversationId, authState.user.id);
      } else {
        console.log('ChatScreen: Cannot mark messages as read - user is guest or not authenticated');
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Не удалось загрузить сообщения: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [conversationId, authState.user, isGuest]);

  // Загружаем сообщения при входе на экран
  useFocusEffect(
    useCallback(() => {
      loadMessages();
      
      // Настраиваем интервал для периодической проверки новых сообщений
      const intervalId = setInterval(loadMessages, 10000);
      
      return () => clearInterval(intervalId);
    }, [loadMessages])
  );

  // Прокрутка к последнему сообщению
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);

  // Обновляем заголовок экрана, когда загружены данные разговора
  useEffect(() => {
    if (conversation) {
      // Получаем более точное имя из данных разговора
      const updatedTitle = isGuest ? conversation.lawyer_name || title : title;
      
      // Обновляем заголовок в навигации
      navigation.setOptions({
        title: updatedTitle
      });
    }
  }, [conversation, navigation, title, isGuest]);

  // Отправка сообщения
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation) {
      console.log('ChatScreen: Cannot send message', { 
        hasMessage: Boolean(newMessage.trim()), 
        hasConversation: Boolean(conversation)
      });
      return;
    }
    
    try {
      console.log('ChatScreen: Sending message as', isGuest ? 'guest' : 'authenticated user');
      setSending(true);
      
      if (!userId) {
        console.error('ChatScreen: Cannot send message - no user ID available');
        alert('Необходимо войти в систему или перезапустить чат');
        return;
      }
      
      const receiverId = isGuest || (authState.user && authState.user.id === conversation.client_id)
        ? conversation.lawyer_id 
        : conversation.client_id;
      
      console.log('ChatScreen: Sending message to', receiverId, 'from', userId);
      
      await ChatService.sendMessage(
        userId,
        receiverId,
        newMessage.trim(),
        conversation.request_id
      );
      
      setNewMessage('');
      loadMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Не удалось отправить сообщение: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  // Рендер отдельного сообщения
  const renderMessage = ({ item }) => {
    const isOwn = item.sender_id === userId;
    return <ChatMessage message={item} isOwn={isOwn} />;
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      {loading && messages.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadMessages}
          >
            <Text style={styles.retryText}>Повторить</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Нет сообщений</Text>
              </View>
            }
          />
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Введите сообщение..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              editable={!sending}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newMessage.trim() || sending) && styles.disabledButton
              ]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={newMessage.trim() ? COLORS.white : COLORS.lightGrey} 
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoid: {
    flex: 1,
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
  messagesList: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 16,
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
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGrey,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.lightGrey,
  },
});

export default ChatScreen; 