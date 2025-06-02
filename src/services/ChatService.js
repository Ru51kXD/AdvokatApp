import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../database/database';
import { LawyerService } from './LawyerService';

// Storage keys
const STORAGE_KEYS = {
  MESSAGES: 'chat_messages',
  CONVERSATIONS: 'chat_conversations',
  MESSAGE_ID_COUNTER: 'message_id_counter',
  CONVERSATION_ID_COUNTER: 'conversation_id_counter',
  LAWYERS: 'lawyers'
};

// Initialize chat storage if needed
const initChatStorage = async () => {
  try {
    // Check if messages exist
    const messagesExist = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (!messagesExist) {
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify([]));
    }
    
    // Check if conversations exist
    const conversationsExist = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!conversationsExist) {
      await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify([]));
    }
    
    // Check if ID counters exist
    const messageIdCounterExists = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGE_ID_COUNTER);
    if (!messageIdCounterExists) {
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGE_ID_COUNTER, '0');
    }
    
    const conversationIdCounterExists = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID_COUNTER);
    if (!conversationIdCounterExists) {
      await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATION_ID_COUNTER, '0');
    }
  } catch (error) {
    console.error('Error initializing chat storage:', error);
  }
};

// Get next ID
const getNextId = async (counterKey) => {
  try {
    const currentId = await AsyncStorage.getItem(counterKey);
    const nextId = parseInt(currentId) + 1;
    await AsyncStorage.setItem(counterKey, nextId.toString());
    return nextId;
  } catch (error) {
    console.error(`Error getting next ID for ${counterKey}:`, error);
    throw error;
  }
};

const ChatService = {
  // Получить все беседы пользователя
  getConversations: async (userId) => {
    try {
      await initChatStorage();
      
      // Get user info
      const users = JSON.parse(await AsyncStorage.getItem('users')) || [];
      const lawyers = JSON.parse(await AsyncStorage.getItem('lawyers')) || [];
      const user = users.find(u => u.id === userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Get conversations
      const allConversations = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS)) || [];
      console.log('Total conversations in storage:', allConversations.length);
      
      let conversations;
      
      if (user.user_type === 'client') {
        // For client - get conversations where they are the client
        conversations = allConversations.filter(c => c.client_id === userId);
      } else {
        // For lawyer - get conversations where they are the lawyer
        conversations = allConversations.filter(c => c.lawyer_id === userId);
      }
      
      console.log(`Found ${conversations.length} conversations for user ${userId} (${user.user_type})`);
      
      // Get messages to get last message
      const allMessages = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES)) || [];
      
      // Enrich conversations with additional info
      const enrichedConversations = conversations.map(conversation => {
        // Get the other user in the conversation
        const otherUserId = user.user_type === 'client' 
          ? conversation.lawyer_id 
          : conversation.client_id;
        
        // Check if this is a guest conversation
        const isGuestConversation = conversation.has_guest || otherUserId.toString().startsWith('guest_');
        
        // For guest conversations, we don't have a user object
        let otherUserName = 'Гость';
        
        if (!isGuestConversation) {
          const otherUser = users.find(u => u.id === otherUserId);
          otherUserName = otherUser?.username || conversation.client_name || 'Unknown';
        }
        
        // Get better lawyer name when available
        let lawyerName = user.name || user.username;
        if (user.user_type === 'client') {
          // The client is talking to a lawyer - get better lawyer info
          const lawyerUser = users.find(u => u.id === conversation.lawyer_id);
          const lawyerInfo = lawyers.find(l => l.user_id === conversation.lawyer_id);
          
          // Приоритет: name из профиля адвоката
          lawyerName = lawyerInfo?.name || lawyerUser?.username || 'Адвокат';
          console.log(`Lawyer name in conversation ${conversation.id}:`, lawyerName);
        } else if (user.user_type === 'lawyer') {
          // Этот пользователь и есть адвокат
          const lawyerInfo = lawyers.find(l => l.user_id === userId);
          lawyerName = lawyerInfo?.name || user.username || 'Адвокат';
        }
        
        // Get last message
        const lastMessage = allMessages.find(m => m.id === conversation.last_message_id);
        
        // Check if we need to update the conversation in storage with the correct lawyer name
        if (conversation.lawyer_name !== lawyerName && lawyerName !== 'Адвокат') {
          console.log(`Updating conversation ${conversation.id} with correct lawyer name: ${lawyerName}`);
          // Find and update in the original array
          const conversationIndex = allConversations.findIndex(c => c.id === conversation.id);
          if (conversationIndex !== -1) {
            allConversations[conversationIndex].lawyer_name = lawyerName;
          }
        }
        
        return {
          ...conversation,
          lawyer_name: lawyerName,
          client_name: isGuestConversation ? 'Гость' : otherUserName,
          last_message: lastMessage?.message || '',
          last_message_time: lastMessage?.created_at || conversation.updated_at,
          has_guest: isGuestConversation
        };
      });
      
      // Sort by most recent first
      enrichedConversations.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      
      // Save the updated conversations back to storage if we made any changes
      await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(allConversations));
      
      return enrichedConversations;
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  },
  
  // Get conversations for a client
  getConversationsByClientId: (clientId) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT c.*, 
            COALESCE(l.name, u.username) as lawyer_name,
            m.message as last_message,
            m.created_at as last_message_time
           FROM chat_conversations c
           JOIN users u ON c.lawyer_id = u.id
           LEFT JOIN lawyers l ON c.lawyer_id = l.user_id
           LEFT JOIN chat_messages m ON c.last_message_id = m.id
           WHERE c.client_id = ?
           ORDER BY c.updated_at DESC`,
          [clientId],
          (_, { rows }) => {
            const conversations = [];
            for (let i = 0; i < rows.length; i++) {
              conversations.push(rows.item(i));
            }
            resolve(conversations);
          },
          (_, error) => {
            console.error('Error getting conversations:', error);
            reject(error);
          }
        );
      });
    });
  },

  // Get conversations for a lawyer
  getConversationsByLawyerId: (lawyerId) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT c.*, 
            u.username as client_name,
            m.message as last_message,
            m.created_at as last_message_time
           FROM chat_conversations c
           JOIN users u ON c.client_id = u.id
           LEFT JOIN chat_messages m ON c.last_message_id = m.id
           WHERE c.lawyer_id = ?
           ORDER BY c.updated_at DESC`,
          [lawyerId],
          (_, { rows }) => {
            const conversations = [];
            for (let i = 0; i < rows.length; i++) {
              conversations.push(rows.item(i));
            }
            resolve(conversations);
          },
          (_, error) => {
            console.error('Error getting conversations:', error);
            reject(error);
          }
        );
      });
    });
  },
  
  // Получить сообщения для конкретного разговора
  getMessages: async (conversationId) => {
    try {
      await initChatStorage();
      
      // Get conversation
      const conversations = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS)) || [];
      const conversation = conversations.find(c => c.id === conversationId);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }
      
      // Get messages for this conversation
      const allMessages = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES)) || [];
      const messages = allMessages.filter(m => 
        (m.sender_id === conversation.client_id && m.receiver_id === conversation.lawyer_id) ||
        (m.sender_id === conversation.lawyer_id && m.receiver_id === conversation.client_id)
      );
      
      // Get user details
      const users = JSON.parse(await AsyncStorage.getItem('users')) || [];
      const lawyers = JSON.parse(await AsyncStorage.getItem('lawyers')) || [];
      
      // Find the lawyer user
      const lawyerUser = users.find(u => u.id === conversation.lawyer_id);
      
      // Find additional lawyer info if available
      const lawyerInfo = lawyers.find(l => l.user_id === conversation.lawyer_id);
      
      // Determine lawyer name (with prioritization)
      const lawyerName = lawyerInfo?.name || lawyerUser?.name || lawyerUser?.username || 'Адвокат';
      
      // Enrich messages with sender information
      const enrichedMessages = messages.map(message => {
        // Determine if this is a guest message
        const isGuest = message.is_from_guest || message.sender_id.toString().startsWith('guest_');
        
        // Get sender user
        let sender;
        if (isGuest) {
          sender = { username: 'Гость', user_type: 'client' };
        } else {
          sender = users.find(u => u.id === message.sender_id);
        }
        
        // Determine sender name
        const senderName = message.sender_id === conversation.lawyer_id 
          ? lawyerName 
          : (sender?.username || conversation.client_name || 'Гость');

        return {
          ...message,
          sender_name: senderName,
          sender_type: sender ? sender.user_type : 'unknown'
        };
      });
      
      // Sort messages by date
      enrichedMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      
      // Add the lawyer name to the conversation object
      const enrichedConversation = {
        ...conversation,
        lawyer_name: lawyerName
      };
      
      return { conversation: enrichedConversation, messages: enrichedMessages };
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  },

  // Get messages for a conversation
  getMessagesByConversationId: (conversationId) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        // First get the conversation details to get client_id and lawyer_id
        tx.executeSql(
          `SELECT client_id, lawyer_id FROM chat_conversations WHERE id = ?`,
          [conversationId],
          (_, { rows }) => {
            if (rows.length === 0) {
              reject('Conversation not found');
              return;
            }
            
            const conversation = rows.item(0);
            
            // Now get all messages for this conversation
            tx.executeSql(
              `SELECT m.*, 
                CASE 
                  WHEN m.sender_id = ? THEN 'client'
                  WHEN m.sender_id = ? THEN 'lawyer'
                  ELSE 'unknown'
                END as sender_type
               FROM chat_messages m
               WHERE (m.sender_id = ? AND m.receiver_id = ?) OR
                     (m.sender_id = ? AND m.receiver_id = ?)
               ORDER BY m.created_at ASC`,
              [
                conversation.client_id, conversation.lawyer_id,
                conversation.client_id, conversation.lawyer_id,
                conversation.lawyer_id, conversation.client_id
              ],
              (_, { rows: messageRows }) => {
                const messages = [];
                for (let i = 0; i < messageRows.length; i++) {
                  messages.push(messageRows.item(i));
                }
                resolve(messages);
              },
              (_, error) => {
                console.error('Error getting messages:', error);
                reject(error);
              }
            );
          },
          (_, error) => {
            console.error('Error getting conversation:', error);
            reject(error);
          }
        );
      });
    });
  },
  
  // Отправка нового сообщения с поддержкой AsyncStorage
  sendMessage: async (senderId, receiverId, text, requestId, attachment, image) => {
    try {
      console.log('Sending message:', { senderId, receiverId, text, requestId, hasAttachment: !!attachment, hasImage: !!image });
      
      // Инициализируем хранилище, если нужно
      await initChatStorage();
      
      // Получаем текущие сообщения и беседы
      const messagesJson = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
      const conversationsJson = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      
      const messages = JSON.parse(messagesJson) || [];
      const conversations = JSON.parse(conversationsJson) || [];
      
      console.log('Current state:', {
        totalMessages: messages.length,
        totalConversations: conversations.length
      });
      
      // Получаем следующий ID сообщения
      const messageId = await getNextId(STORAGE_KEYS.MESSAGE_ID_COUNTER);
      
      // Определяем, кто клиент, а кто адвокат
      let clientId, lawyerId, clientName, lawyerName;
      
      // Проверяем, существует ли беседа для этих пользователей
      let conversation = conversations.find(c => 
        (c.client_id === senderId && c.lawyer_id === receiverId) || 
        (c.client_id === receiverId && c.lawyer_id === senderId)
      );
      
      console.log('Existing conversation:', conversation ? {
        id: conversation.id,
        client_id: conversation.client_id,
        lawyer_id: conversation.lawyer_id
      } : 'Not found');
      
      // Получаем информацию о пользователях
      try {
        // Проверяем, это гостевое сообщение или от зарегистрированного пользователя
        const isGuestSender = String(senderId).startsWith('guest_');
        const isGuestReceiver = String(receiverId).startsWith('guest_');
        
        if (isGuestSender) {
          // Если отправитель гость, то получатель должен быть адвокатом
          clientId = senderId;
          lawyerId = receiverId;
          clientName = 'Гость';
          
          // Пытаемся получить имя адвоката
          const lawyerInfo = await LawyerService.getLawyerProfile(receiverId);
          // Приоритет: name из профиля адвоката
          lawyerName = lawyerInfo?.name || lawyerInfo?.username || 'Адвокат';
          console.log('Lawyer name set from profile:', lawyerName);
        } else if (isGuestReceiver) {
          // Если получатель гость, то отправитель должен быть адвокатом
          clientId = receiverId;
          lawyerId = senderId;
          clientName = 'Гость';
          
          // Пытаемся получить имя адвоката
          const lawyerInfo = await LawyerService.getLawyerProfile(senderId);
          // Приоритет: name из профиля адвоката
          lawyerName = lawyerInfo?.name || lawyerInfo?.username || 'Адвокат';
          console.log('Lawyer name set from profile:', lawyerName);
        } else {
          // Проверяем, кто клиент, а кто адвокат из AsyncStorage данных
          const users = JSON.parse(await AsyncStorage.getItem('users')) || [];
          const senderUser = users.find(u => u.id === senderId);
          const receiverUser = users.find(u => u.id === receiverId);
          
          if (senderUser && senderUser.user_type === 'client') {
            clientId = senderId;
            lawyerId = receiverId;
            clientName = senderUser.name || senderUser.username || 'Клиент';
            
            // Получаем имя адвоката с приоритетом поля name
            const lawyerInfo = await LawyerService.getLawyerProfile(receiverId);
            lawyerName = lawyerInfo?.name || receiverUser?.username || 'Адвокат';
            console.log('Lawyer name set from client-to-lawyer chat:', lawyerName);
          } else if (senderUser && senderUser.user_type === 'lawyer') {
            clientId = receiverId;
            lawyerId = senderId;
            // Получаем имя адвоката из профиля с приоритетом поля name
            const lawyerInfo = await LawyerService.getLawyerProfile(senderId);
            lawyerName = lawyerInfo?.name || senderUser.username || 'Адвокат';
            console.log('Lawyer name set from lawyer-to-client chat:', lawyerName);
            
            // Получаем имя клиента
            if (receiverUser) {
              clientName = receiverUser.username || 'Клиент';
            } else {
              clientName = 'Клиент';
            }
          } else {
            // Fallback: используем данные по умолчанию
            clientId = senderId;
            lawyerId = receiverId;
            clientName = senderUser?.name || senderUser?.username || 'Клиент';
            
            // Пытаемся получить информацию об адвокате
            try {
              const lawyerInfo = await LawyerService.getLawyerProfile(lawyerId);
              lawyerName = lawyerInfo?.name || receiverUser?.username || 'Адвокат';
              console.log('Lawyer name set from fallback:', lawyerName);
            } catch (e) {
              console.error('Error getting lawyer profile in fallback:', e);
              lawyerName = receiverUser?.name || receiverUser?.username || 'Адвокат';
            }
          }
        }
      } catch (err) {
        console.error('Error getting user information:', err);
        // Используем данные по умолчанию
        if (String(senderId).startsWith('guest_') || String(receiverId).startsWith('guest_')) {
          // Если один из пользователей гость
          const isGuestSender = String(senderId).startsWith('guest_');
          clientId = isGuestSender ? senderId : receiverId;
          lawyerId = isGuestSender ? receiverId : senderId;
          clientName = 'Гость';
          lawyerName = 'Адвокат';
        } else {
          // По умолчанию предполагаем, что отправитель - клиент
          clientId = senderId;
          lawyerId = receiverId;
          clientName = 'Клиент';
          lawyerName = 'Адвокат';
        }
      }
      
      // Проверяем, существует ли беседа между этими пользователями
      if (!conversation) {
        // Создаем новую беседу
        const conversationId = await getNextId(STORAGE_KEYS.CONVERSATION_ID_COUNTER);
        
        // Получаем дополнительную информацию о профиле адвоката, если не получена ранее
        if (!lawyerName || lawyerName === 'Адвокат') {
          try {
            const lawyersArray = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.LAWYERS)) || [];
            const lawyerProfile = lawyersArray.find(l => l.user_id === lawyerId);
            if (lawyerProfile && lawyerProfile.name) {
              lawyerName = lawyerProfile.name;
              console.log(`Updated lawyer name from lawyer profile: ${lawyerName}`);
            }
          } catch (err) {
            console.error('Error getting lawyer profile for name:', err);
          }
        }
        
        conversation = {
          id: conversationId,
          client_id: clientId,
          lawyer_id: lawyerId,
          client_name: clientName,
          lawyer_name: lawyerName,
          last_message_id: messageId,
          unread_count: 1, // У получателя будет 1 непрочитанное сообщение
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          has_guest: String(clientId).startsWith('guest_'),
          request_id: requestId || null,
          request_title: requestId ? 'Заявка №' + requestId : null
        };
        
        conversations.push(conversation);
      } else {
        // Обновляем существующую беседу
        conversation.last_message_id = messageId;
        conversation.updated_at = new Date().toISOString();
        
        // Увеличиваем счетчик непрочитанных для получателя
        if (receiverId !== senderId) {
          conversation.unread_count = (conversation.unread_count || 0) + 1;
        }
        
        // Обновляем беседу в массиве
        const conversationIndex = conversations.findIndex(c => c.id === conversation.id);
        if (conversationIndex !== -1) {
          conversations[conversationIndex] = conversation;
        }
      }
      
      // Создаем новое сообщение
      const newMessage = {
        id: messageId,
        conversation_id: conversation.id,
        sender_id: senderId,
        receiver_id: receiverId,
        message: text || '',
        read: false,
        delivered: true, // Сообщение доставлено, но не прочитано
        created_at: new Date().toISOString(),
        is_from_guest: String(senderId).startsWith('guest_')
      };
      
      // Добавляем вложения, если они есть
      if (attachment) {
        newMessage.attachment = typeof attachment === 'string' 
          ? attachment 
          : attachment.uri || attachment.name || 'file';
        
        if (attachment.type) {
          newMessage.attachment_type = attachment.type;
        }
        
        if (attachment.name) {
          newMessage.attachment_name = attachment.name;
        }
      }
      
      if (image) {
        newMessage.image = image;
      }
      
      // Добавляем сообщение в массив
      messages.push(newMessage);
      
      // Сохраняем обновленные данные
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
      await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
      
      console.log('Chat saved successfully:', {
        conversationId: conversation.id,
        messageId: newMessage.id,
        totalConversations: conversations.length,
        totalMessages: messages.length
      });
      
      return { message: newMessage, conversation };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },
  
  // Create a new conversation between client and lawyer
  createConversation: (clientId, lawyerId, requestId = null) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        // Check if conversation already exists
        tx.executeSql(
          "SELECT id FROM chat_conversations WHERE client_id = ? AND lawyer_id = ?",
          [clientId, lawyerId],
          (_, { rows }) => {
            if (rows.length > 0) {
              // Conversation already exists, return its ID
              resolve(rows.item(0).id);
            } else {
              // Create new conversation
              tx.executeSql(
                "INSERT INTO chat_conversations (client_id, lawyer_id, request_id, unread_count, created_at, updated_at) VALUES (?, ?, ?, 0, datetime('now'), datetime('now'))",
                [clientId, lawyerId, requestId],
                (_, { insertId }) => {
                  resolve(insertId);
                },
                (_, error) => {
                  console.error('Error creating conversation:', error);
                  reject(error);
                }
              );
            }
          },
          (_, error) => {
            console.error('Error checking existing conversation:', error);
            reject(error);
          }
        );
      });
    });
  },
  
  // Отметить сообщения как прочитанные
  markMessagesAsRead: async (conversationId, userId) => {
    try {
      // Получаем текущие сообщения
      const messagesJson = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
      const messages = JSON.parse(messagesJson) || [];
      
      // Получаем беседы
      const conversationsJson = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      const conversations = JSON.parse(conversationsJson) || [];
      
      // Находим беседу
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) {
        return false;
      }
      
      // Обновляем непрочитанные сообщения
      let unreadCount = 0;
      const updatedMessages = messages.map(msg => {
        // Если сообщение из этой беседы, адресовано текущему пользователю и не прочитано
        if (
          (msg.conversation_id === conversationId || 
          (msg.sender_id === conversation.client_id && msg.receiver_id === conversation.lawyer_id) || 
          (msg.sender_id === conversation.lawyer_id && msg.receiver_id === conversation.client_id)) && 
          msg.receiver_id === userId && 
          !msg.read
        ) {
          return { ...msg, read: true, delivered: true };
        }
        
        // Считаем оставшиеся непрочитанные сообщения
        if (
          (msg.conversation_id === conversationId || 
          (msg.sender_id === conversation.client_id && msg.receiver_id === conversation.lawyer_id) || 
          (msg.sender_id === conversation.lawyer_id && msg.receiver_id === conversation.client_id)) && 
          msg.receiver_id === userId && 
          !msg.read
        ) {
          unreadCount++;
        }
        
        return msg;
      });
      
      // Обновляем счетчик непрочитанных в беседе
      const updatedConversations = conversations.map(c => {
        if (c.id === conversationId) {
          return { ...c, unread_count: 0 };
        }
        return c;
      });
      
      // Сохраняем обновленные данные
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(updatedMessages));
      await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(updatedConversations));
      
      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  },
  
  // Получить всех пользователей, с которыми можно начать беседу
  getPotentialChatPartners: async (userId) => {
    try {
      // Get user info
      const users = JSON.parse(await AsyncStorage.getItem('users')) || [];
      const lawyers = JSON.parse(await AsyncStorage.getItem('lawyers')) || [];
      const currentUser = users.find(u => u.id === userId);
      
      if (!currentUser) {
        throw new Error('User not found');
      }
      
      // For clients, return all lawyers
      if (currentUser.user_type === 'client') {
        // Join lawyers with their user info
        return lawyers.map(lawyer => {
          const userInfo = users.find(u => u.id === lawyer.user_id);
          return {
            id: userInfo.id,
            username: userInfo.username,
            name: lawyer.name || userInfo.username || 'Адвокат',
            specialization: lawyer.specialization,
            experience: lawyer.experience,
            city: lawyer.city,
            rating: lawyer.rating
          };
        });
      } 
      // For lawyers, return clients with active requests
      else {
        return users.filter(u => 
          u.user_type === 'client' && u.id !== userId
        ).map(client => ({
          id: client.id,
          username: client.username,
          request_count: 0 // In a real app, you would count active requests
        }));
      }
    } catch (error) {
      console.error('Error getting potential chat partners:', error);
      throw error;
    }
  },

  // Установка статуса "печатает"
  setUserTyping: async (conversationId, userId, isTyping) => {
    try {
      // В реальном приложении здесь был бы API-запрос
      console.log(`User ${userId} is ${isTyping ? 'typing' : 'not typing'} in conversation ${conversationId}`);
      
      // Получаем текущие беседы
      const conversationsJson = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      const conversations = JSON.parse(conversationsJson) || [];
      
      // Находим беседу
      const conversationIndex = conversations.findIndex(c => c.id === conversationId);
      if (conversationIndex === -1) {
        return false;
      }
      
      // Обновляем статус печатания
      const conversation = conversations[conversationIndex];
      if (userId === conversation.client_id) {
        conversation.client_typing = isTyping;
      } else if (userId === conversation.lawyer_id) {
        conversation.lawyer_typing = isTyping;
      }
      
      // Сохраняем обновленные данные
      conversations[conversationIndex] = conversation;
      await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
      
      return true;
    } catch (error) {
      console.error('Error setting typing status:', error);
      return false;
    }
  },

  // Получение статуса "печатает" для собеседника
  getTypingStatus: async (conversationId, userId) => {
    try {
      // Получаем текущие беседы
      const conversationsJson = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      const conversations = JSON.parse(conversationsJson) || [];
      
      // Находим беседу
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) {
        return false;
      }
      
      // Определяем, кто собеседник
      if (userId === conversation.client_id) {
        return conversation.lawyer_typing || false;
      } else if (userId === conversation.lawyer_id) {
        return conversation.client_typing || false;
      }
      
      return false;
    } catch (error) {
      console.error('Error getting typing status:', error);
      return false;
    }
  }
};

export default ChatService;