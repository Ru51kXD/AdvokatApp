import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ChatMessage from '../../components/ChatMessage';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import ChatService from '../../services/ChatService';
import { pickDocument, pickImage } from '../../utils/permissions';

const ChatScreen = ({ route, navigation }) => {
  const { conversationId, title, guestId } = route.params;
  const { authState } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const flatListRef = useRef();
  const typingTimeoutRef = useRef(null);

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
        // Если не указан conversationId, но есть requestId, lawyerId или другие данные для идентификации,
        // попробуем найти или создать беседу
        const { requestId, lawyerId } = route.params;
        
        // Проверяем, есть ли lawyerId - это значит, что переход происходит после принятия отклика
        if (lawyerId && userId) {
          console.log('ChatScreen: No conversationId, but have lawyerId. Creating or finding conversation with lawyer', lawyerId);
          setLoading(true);
          
          // Определяем ID клиента (текущий пользователь) и адвоката (из параметров)
          const clientId = userId;
          
          // Ищем существующую беседу для этого юриста и клиента
          const conversations = await ChatService.getConversations(userId);
          let existingConversation = conversations.find(c => 
            (c.client_id === clientId && c.lawyer_id === lawyerId) ||
            (requestId && c.request_id === requestId)
          );
          
          if (existingConversation) {
            console.log('ChatScreen: Found existing conversation', existingConversation.id);
            // Используем найденную беседу
            navigation.setParams({ conversationId: existingConversation.id });
            const result = await ChatService.getMessages(existingConversation.id);
            setMessages(result.messages);
            setConversation(result.conversation);
            
            // Отмечаем сообщения как прочитанные
            if (authState.user && !isGuest) {
              await ChatService.markMessagesAsRead(existingConversation.id, authState.user.id);
            }
          } else {
            console.log('ChatScreen: No existing conversation found, creating a new one');
            // Создаем "пустую" беседу и показываем чат без сообщений
            setMessages([]);
            setConversation({
              client_id: clientId,
              lawyer_id: lawyerId,
              request_id: requestId
            });
            setError(null);
          }
          
          setLoading(false);
          return;
        }
        
        // Проверяем, есть ли requestId - для создания чата по заявке
        else if (requestId && userId) {
          console.log('ChatScreen: No conversationId, but have requestId. Trying to find or create conversation for request', requestId);
          setLoading(true);
          
          // Проверяем, является ли пользователь клиентом или адвокатом
          const isLawyer = authState.user?.user_type === 'lawyer';
          
          // Получаем данные заявки, чтобы узнать ID клиента и адвоката
          const { RequestService } = await import('../../services/RequestService');
          const requestData = await RequestService.getRequestById(requestId);
          
          if (!requestData) {
            throw new Error('Заявка не найдена');
          }
          
          // Определяем ID клиента и адвоката
          const clientId = isLawyer ? requestData.client_id : userId;
          const lawyerId = isLawyer ? userId : requestData.lawyer_id;
          
          // Ищем существующую беседу для этой заявки
          const conversations = await ChatService.getConversations(userId);
          let existingConversation = conversations.find(c => 
            c.request_id === requestId || 
            (c.client_id === clientId && c.lawyer_id === lawyerId)
          );
          
          if (existingConversation) {
            console.log('ChatScreen: Found existing conversation', existingConversation.id);
            // Используем найденную беседу
            navigation.setParams({ conversationId: existingConversation.id });
            const result = await ChatService.getMessages(existingConversation.id);
            setMessages(result.messages);
            setConversation(result.conversation);
            
            // Отмечаем сообщения как прочитанные
            if (authState.user && !isGuest) {
              await ChatService.markMessagesAsRead(existingConversation.id, authState.user.id);
            }
          } else {
            console.log('ChatScreen: No existing conversation found, creating a new one');
            // Создаем "пустую" беседу и показываем чат без сообщений
            setMessages([]);
            setConversation({
              client_id: clientId,
              lawyer_id: lawyerId,
              request_id: requestId,
              request_title: `Заявка №${requestId}`
            });
            setError(null);
          }
          
          setLoading(false);
          return;
        }
        
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
  }, [conversationId, route.params, userId, authState.user, isGuest, navigation]);

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
      // Определяем имя адвоката или собеседника для заголовка
      let updatedTitle = title;
      
      // Для клиента (или гостя) показываем имя адвоката
      if (isGuest || (authState.user && authState.user.user_type === 'client')) {
        updatedTitle = conversation.lawyer_name || title || 'Адвокат';
        console.log(`Setting chat title to lawyer name: ${updatedTitle}`);
      } 
      // Для адвоката показываем имя клиента
      else if (authState.user && authState.user.user_type === 'lawyer') {
        updatedTitle = conversation.client_name || title || 'Клиент';
        console.log(`Setting chat title to client name: ${updatedTitle}`);
      }
      
      // Обновляем заголовок в навигации
      navigation.setOptions({
        title: updatedTitle,
        headerRight: () => (
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleShowProfile}
          >
            <Ionicons name="person-circle-outline" size={24} color={COLORS.white} />
          </TouchableOpacity>
        )
      });
    }
  }, [conversation, navigation, title, isGuest, authState.user]);

  // Имитация "печатает..." при вводе сообщения
  useEffect(() => {
    if (newMessage.length > 0 && !isTyping) {
      setIsTyping(true);
      // Оповещаем сервер, что пользователь печатает
      ChatService.setUserTyping(conversationId, userId, true);
    }
    
    // Сбрасываем таймер при каждом вводе
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Устанавливаем новый таймер для сброса статуса печатания
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        // Оповещаем сервер, что пользователь перестал печатать
        ChatService.setUserTyping(conversationId, userId, false);
      }
    }, 3000);
    
    // Очистка таймера при размонтировании
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [newMessage, isTyping, conversationId, userId]);

  // Переход к профилю собеседника
  const handleShowProfile = () => {
    if (!conversation) return;
    
    const userType = authState.user?.user_type;
    const otherUserId = userType === 'client' ? conversation.lawyer_id : conversation.client_id;
    
    if (userType === 'client') {
      navigation.navigate('LawyerDetail', { 
        lawyerId: otherUserId, 
        lawyerName: conversation.lawyer_name 
      });
    } else {
      // Для юриста - переход к профилю клиента (если такая функция есть)
      Alert.alert('Информация', 'Профиль клиента недоступен');
    }
  };

  // Отправка сообщения
  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !attachment && !imagePreview)) {
      console.log('ChatScreen: Cannot send message', { 
        hasMessage: Boolean(newMessage.trim()), 
        hasAttachment: Boolean(attachment),
        hasImage: Boolean(imagePreview),
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
      
      // Определяем получателя
      let receiverId;
      const { requestId, lawyerId } = route.params;
      
      if (conversation) {
        // Если у нас уже есть информация о беседе
        receiverId = isGuest || (authState.user && authState.user.id === conversation.client_id)
          ? conversation.lawyer_id 
          : conversation.client_id;
      } else if (lawyerId) {
        // Если у нас есть ID юриста (после принятия отклика)
        receiverId = lawyerId;
      } else if (requestId) {
        // Если у нас нет беседы, но есть requestId
        const { RequestService } = await import('../../services/RequestService');
        const requestData = await RequestService.getRequestById(requestId);
        
        if (!requestData) {
          throw new Error('Заявка не найдена');
        }
        
        // Определяем ID клиента и адвоката
        const isLawyer = authState.user?.user_type === 'lawyer';
        receiverId = isLawyer ? requestData.client_id : requestData.lawyer_id;
      } else {
        throw new Error('Не удалось определить получателя сообщения');
      }
      
      console.log('ChatScreen: Sending message to', receiverId, 'from', userId);
      
      // Отправляем сообщение
      const result = await ChatService.sendMessage(
        userId,
        receiverId,
        newMessage.trim(),
        requestId,
        attachment,
        imagePreview
      );
      
      // Если нет conversationId, обновляем его после создания беседы
      if (!conversationId && result.conversation) {
        navigation.setParams({ conversationId: result.conversation.id });
        setConversation(result.conversation);
      }
      
      setNewMessage('');
      setAttachment(null);
      setImagePreview(null);
      loadMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Не удалось отправить сообщение: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  // Обработка выбора изображения
  const handlePickImage = async () => {
    setShowAttachmentOptions(false);
    
    try {
      const result = await pickImage();
      if (result) {
        setImagePreview(result.uri);
        setAttachment(null);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Ошибка', 'Не удалось выбрать изображение');
    }
  };

  // Обработка выбора файла
  const handlePickDocument = async () => {
    setShowAttachmentOptions(false);
    
    try {
      const result = await pickDocument();
      if (result) {
        setAttachment({
          uri: result.uri,
          name: result.name,
          type: result.mimeType,
        });
        setImagePreview(null);
      }
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Ошибка', 'Не удалось выбрать файл');
    }
  };

  // Очистка вложений
  const handleClearAttachment = () => {
    setAttachment(null);
    setImagePreview(null);
  };

  // Обработка нажатия на вложение в сообщении
  const handleAttachmentPress = (message) => {
    if (message.image) {
      setSelectedImage(message.image);
    } else if (message.attachment) {
      // Здесь можно добавить логику для открытия/скачивания файла
      Alert.alert('Скачивание', 'Функция скачивания файлов находится в разработке');
    }
  };

  // Рендер отдельного сообщения
  const renderMessage = ({ item }) => {
    const isOwn = item.sender_id === userId;
    return (
      <ChatMessage 
        message={item} 
        isOwn={isOwn} 
        onPressAttachment={handleAttachmentPress}
      />
    );
  };

  // Рендер индикатора "печатает..."
  const renderTypingIndicator = () => {
    // Здесь можно добавить имитацию, что собеседник печатает
    const isOtherUserTyping = Math.random() < 0.3; // Случайная вероятность для демонстрации
    
    if (!isOtherUserTyping) return null;
    
    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <View style={styles.typingDot} />
          <View style={[styles.typingDot, { animationDelay: '0.2s' }]} />
          <View style={[styles.typingDot, { animationDelay: '0.4s' }]} />
        </View>
        <Text style={styles.typingText}>печатает...</Text>
      </View>
    );
  };

  // Рендер предпросмотра вложения
  const renderAttachmentPreview = () => {
    if (imagePreview) {
      return (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imagePreview }} style={styles.imagePreview} />
          <TouchableOpacity 
            style={styles.removeAttachmentButton}
            onPress={handleClearAttachment}
          >
            <Ionicons name="close-circle" size={24} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      );
    }
    
    if (attachment) {
      return (
        <View style={styles.filePreviewContainer}>
          <Ionicons name="document-outline" size={24} color={COLORS.primary} />
          <Text style={styles.filePreviewName} numberOfLines={1} ellipsizeMode="middle">
            {attachment.name}
          </Text>
          <TouchableOpacity 
            style={styles.removeAttachmentButton}
            onPress={handleClearAttachment}
          >
            <Ionicons name="close-circle" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      );
    }
    
    return null;
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
            ListFooterComponent={renderTypingIndicator}
          />
          
          {renderAttachmentPreview()}
          
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => setShowAttachmentOptions(true)}
            >
              <Ionicons name="attach" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            
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
                (!newMessage.trim() && !attachment && !imagePreview || sending) && styles.disabledButton
              ]}
              onPress={handleSendMessage}
              disabled={(!newMessage.trim() && !attachment && !imagePreview) || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={newMessage.trim() || attachment || imagePreview ? COLORS.white : COLORS.lightGrey} 
                />
              )}
            </TouchableOpacity>
          </View>
          
          {/* Модальное окно выбора вложения */}
          <Modal
            transparent
            visible={showAttachmentOptions}
            animationType="fade"
            onRequestClose={() => setShowAttachmentOptions(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowAttachmentOptions(false)}
            >
              <View style={styles.attachmentOptionsContainer}>
                <TouchableOpacity 
                  style={styles.attachmentOption}
                  onPress={handlePickImage}
                >
                  <Ionicons name="image-outline" size={28} color={COLORS.primary} />
                  <Text style={styles.attachmentOptionText}>Изображение</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.attachmentOption}
                  onPress={handlePickDocument}
                >
                  <Ionicons name="document-outline" size={28} color={COLORS.primary} />
                  <Text style={styles.attachmentOptionText}>Документ</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.attachmentOption, styles.cancelOption]}
                  onPress={() => setShowAttachmentOptions(false)}
                >
                  <Text style={styles.cancelText}>Отмена</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
          
          {/* Модальное окно просмотра изображения */}
          <Modal
            transparent
            visible={selectedImage !== null}
            animationType="fade"
            onRequestClose={() => setSelectedImage(null)}
          >
            <TouchableOpacity 
              style={styles.imageViewerContainer}
              activeOpacity={1}
              onPress={() => setSelectedImage(null)}
            >
              <TouchableOpacity 
                style={styles.closeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close-circle" size={32} color={COLORS.white} />
              </TouchableOpacity>
              
              {selectedImage && (
                <Image 
                  source={{ uri: selectedImage }} 
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>
          </Modal>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get('window');

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
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: '500',
  },
  messagesList: {
    padding: 8,
    paddingBottom: 16,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGrey,
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
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
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginLeft: 16,
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGrey,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textSecondary,
    marginHorizontal: 2,
    opacity: 0.5,
  },
  typingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  attachmentOptionsContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  attachmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  attachmentOptionText: {
    fontSize: 16,
    marginLeft: 16,
    color: COLORS.text,
  },
  cancelOption: {
    justifyContent: 'center',
    borderBottomWidth: 0,
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    fontWeight: '500',
  },
  previewContainer: {
    margin: 8,
    marginTop: 0,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  filePreviewContainer: {
    margin: 8,
    marginTop: 0,
    padding: 8,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
  },
  filePreviewName: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    color: COLORS.text,
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 2,
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: width,
    height: height * 0.7,
  },
  closeImageButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  headerButton: {
    paddingHorizontal: 16,
  },
});

export default ChatScreen; 