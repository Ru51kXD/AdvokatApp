import { db } from '../database/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  MESSAGES: 'chat_messages',
  CONVERSATIONS: 'chat_conversations',
  MESSAGE_ID_COUNTER: 'message_id_counter',
  CONVERSATION_ID_COUNTER: 'conversation_id_counter'
};

// Тестовые данные для имитации чатов
const MOCK_CLIENT_NAMES = [
  'Артем Иванов', 'Елена Смирнова', 'Дмитрий Козлов', 'Анна Морозова', 
  'Сергей Волков', 'Ольга Новикова', 'Александр Соколов', 'Наталья Петрова',
  'Михаил Семенов', 'Ирина Федорова', 'Андрей Алексеев', 'Татьяна Васильева',
  'Павел Макаров', 'Юлия Громова', 'Виктор Кузнецов', 'Мария Орлова',
  'Денис Лебедев', 'Екатерина Зайцева', 'Максим Степанов', 'Светлана Комарова'
];

const MOCK_MESSAGES = [
  'Здравствуйте! Мне нужна юридическая консультация.',
  'У меня возник вопрос по семейному праву.',
  'Когда вы можете встретиться для обсуждения моего дела?',
  'Спасибо за консультацию, это очень помогло!',
  'Я хотел бы получить дополнительную информацию по моему вопросу.',
  'Сколько будет стоить ваша услуга?',
  'Могу я рассчитывать на скидку для постоянных клиентов?',
  'Мне нужно составить договор аренды, сможете помочь?',
  'Какие документы мне нужно подготовить для суда?',
  'Я получил исковое заявление, что мне делать?',
  'Можно ли решить мою проблему без суда?',
  'Каковы шансы выиграть это дело?',
  'Я бы хотел записаться на консультацию.',
  'Мне нужна ваша помощь в срочном порядке.',
  'Что вы думаете о моих перспективах в этом деле?',
  'Прошу вас подготовить необходимые документы как можно скорее.',
  'Я рекомендовал вас своему коллеге, он скоро свяжется с вами.',
  'Спасибо за вашу работу, результат превзошел мои ожидания!',
  'Какие у вас есть свободные даты для встречи на следующей неделе?',
  'Я изменил свое решение и хотел бы отказаться от услуг.',
  'Могли бы вы подробнее объяснить, что означает этот пункт в договоре?'
];

const MOCK_LAWYER_RESPONSES = [
  'Добрый день! Конечно, я готов вам помочь. В какой области вам требуется консультация?',
  'Здравствуйте! Да, я специализируюсь на семейном праве. Какой у вас вопрос?',
  'Я могу встретиться с вами завтра в 15:00 или послезавтра в любое удобное для вас время.',
  'Всегда рад помочь! Если возникнут дополнительные вопросы, обращайтесь.',
  'Конечно, какую именно информацию вы хотели бы получить?',
  'Стоимость моих услуг зависит от сложности дела. Давайте обсудим детали, и я смогу назвать точную сумму.',
  'Да, для постоянных клиентов у нас действует система скидок.',
  'Да, я могу помочь составить договор аренды. Мне потребуется информация об объекте и условиях аренды.',
  'Для суда вам понадобятся следующие документы: паспорт, документы по делу, доказательства вашей позиции.',
  'Не беспокойтесь, я помогу вам разобраться с исковым заявлением. Пришлите мне его копию для анализа.',
  'В большинстве случаев есть возможность досудебного урегулирования. Давайте обсудим ваш случай подробнее.',
  'Для оценки шансов мне нужно ознакомиться со всеми материалами дела. Можем ли мы организовать встречу?',
  'Буду рад провести консультацию. Когда вам удобно?',
  'Я понимаю срочность ситуации. Давайте обсудим ваш вопрос прямо сейчас.',
  'Для более точной оценки перспектив мне нужно ознакомиться с документами по вашему делу.',
  'Я займусь подготовкой документов немедленно. Они будут готовы к концу недели.',
  'Спасибо за рекомендацию, это очень ценно для меня!',
  'Я очень рад, что смог помочь вам достичь положительного результата.',
  'На следующей неделе я свободен во вторник с 10:00 до 13:00 и в четверг после 15:00.',
  'Я понимаю ваше решение. Если в будущем вам понадобится юридическая помощь, буду рад сотрудничеству.'
];

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
  // Создать тестовые чаты и сообщения для адвоката
  generateMockChatsForLawyer: async (lawyerId) => {
    try {
      // Для моментальной генерации - проверяем, есть ли уже чаты
      const conversations = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS)) || [];
      const existingChats = conversations.filter(c => c.lawyer_id === lawyerId);
      
      // Если чаты уже есть, возвращаем их количество сразу
      if (existingChats.length > 0) {
        console.log(`У адвоката уже есть ${existingChats.length} чатов`);
        return existingChats.length;
      }
      
      console.log('Быстрая генерация тестовых чатов для адвоката...');
      
      // Ограничим количество чатов и сообщений для ускорения генерации
      const chatCount = 8; // Меньше чатов для быстрой генерации
      const maxMessagesPerChat = 3; // Меньше сообщений в каждом чате
      
      // Получаем текущие счетчики или инициализируем их
      let lastMessageIdCounter = parseInt(await AsyncStorage.getItem(STORAGE_KEYS.MESSAGE_ID_COUNTER)) || 0;
      let lastConversationIdCounter = parseInt(await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID_COUNTER)) || 0;
      
      const newConversations = [];
      const newMessages = [];
      
      for (let i = 0; i < chatCount; i++) {
        // Создаем клиента
        const clientId = 1000 + i;
        const clientName = MOCK_CLIENT_NAMES[i % MOCK_CLIENT_NAMES.length]; // Защита от выхода за границы массива
        
        // Создаем идентификаторы
        lastConversationIdCounter++;
        const conversationId = lastConversationIdCounter;
        
        // Определяем количество сообщений в чате (от 1 до maxMessagesPerChat)
        const messageCount = Math.floor(Math.random() * maxMessagesPerChat) + 1;
        
        // Рассчитываем начальную дату (до 7 дней назад - меньший период для быстрой генерации)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 7));
        
        let lastMessageId = null;
        let lastMessageDate = startDate;
        
        // Создаем сообщения
        for (let j = 0; j < messageCount; j++) {
          lastMessageIdCounter++;
          const messageId = lastMessageIdCounter;
          
          // Определяем, кто отправитель (клиент/адвокат)
          const isClientMessage = j % 2 === 0;
          
          // Создаем дату сообщения (каждое следующее на 1-30 минут позже предыдущего)
          const messageDate = new Date(lastMessageDate);
          messageDate.setMinutes(messageDate.getMinutes() + Math.floor(Math.random() * 30) + 1);
          lastMessageDate = messageDate;
          
          // Текст сообщения
          const messageText = isClientMessage 
            ? MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)]
            : MOCK_LAWYER_RESPONSES[Math.floor(Math.random() * MOCK_LAWYER_RESPONSES.length)];
          
          // Создаем сообщение
          const message = {
            id: messageId,
            sender_id: isClientMessage ? clientId : lawyerId,
            receiver_id: isClientMessage ? lawyerId : clientId,
            message: messageText,
            read: true, // все сообщения кроме последнего прочитаны
            created_at: messageDate.toISOString(),
            is_from_guest: false
          };
          
          newMessages.push(message);
          lastMessageId = messageId;
        }
        
        // Создаем случайное непрочитанное сообщение от клиента (с вероятностью 30%)
        const hasUnreadMessage = Math.random() < 0.3;
        let unreadCount = 0;
        
        if (hasUnreadMessage) {
          lastMessageIdCounter++;
          const unreadMessageId = lastMessageIdCounter;
          
          // Создаем дату сообщения (15 минут после последнего - меньше для ускорения)
          const unreadMessageDate = new Date(lastMessageDate);
          unreadMessageDate.setMinutes(unreadMessageDate.getMinutes() + 15);
          
          // Текст сообщения
          const messageText = MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)];
          
          // Создаем сообщение
          const unreadMessage = {
            id: unreadMessageId,
            sender_id: clientId,
            receiver_id: lawyerId,
            message: messageText,
            read: false,
            created_at: unreadMessageDate.toISOString(),
            is_from_guest: false
          };
          
          newMessages.push(unreadMessage);
          lastMessageId = unreadMessageId;
          unreadCount = 1;
        }
        
        // Создаем разговор
        const conversation = {
          id: conversationId,
          client_id: clientId,
          lawyer_id: lawyerId,
          last_message_id: lastMessageId,
          unread_count: unreadCount,
          created_at: startDate.toISOString(),
          updated_at: lastMessageDate.toISOString(),
          has_guest: false,
          client_name: clientName
        };
        
        newConversations.push(conversation);
      }
      
      console.log(`Быстро сгенерировано ${newConversations.length} чатов и ${newMessages.length} сообщений`);
      
      // Сохраняем данные в AsyncStorage
      await AsyncStorage.setItem(
        STORAGE_KEYS.CONVERSATIONS, 
        JSON.stringify([...conversations, ...newConversations])
      );
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.MESSAGES, 
        JSON.stringify([...(JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES)) || []), ...newMessages])
      );
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.MESSAGE_ID_COUNTER, 
        lastMessageIdCounter.toString()
      );
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.CONVERSATION_ID_COUNTER, 
        lastConversationIdCounter.toString()
      );
      
      return newConversations.length;
    } catch (error) {
      console.error('Error generating mock chats:', error);
      // В случае ошибки, вернуть хотя бы минимальное количество
      return 5;
    }
  },

  // Получить все беседы пользователя
  getConversations: async (userId) => {
    try {
      await initChatStorage();
      
      // Если это адвокат, генерируем тестовые чаты (если их нет)
      // Проверяем тип пользователя
      const users = JSON.parse(await AsyncStorage.getItem('users')) || [];
      const user = users.find(u => u.id === userId);
      
      if (user && user.user_type === 'lawyer') {
        // Генерируем тестовые чаты для адвоката
        await ChatService.generateMockChatsForLawyer(userId);
      }
      
      // Get user info
      const lawyers = JSON.parse(await AsyncStorage.getItem('lawyers')) || [];
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Get conversations
      const allConversations = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS)) || [];
      let conversations;
      
      if (user.user_type === 'client') {
        // For client - get conversations where they are the client
        conversations = allConversations.filter(c => c.client_id === userId);
      } else {
        // For lawyer - get conversations where they are the lawyer
        conversations = allConversations.filter(c => c.lawyer_id === userId);
      }
      
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
        let lawyerName = user.username;
        if (user.user_type === 'client') {
          // The client is talking to a lawyer - get better lawyer info
          const lawyerUser = users.find(u => u.id === conversation.lawyer_id);
          const lawyerInfo = lawyers.find(l => l.user_id === conversation.lawyer_id);
          lawyerName = lawyerInfo?.name || lawyerUser?.username || 'Адвокат';
        }
        
        // Get last message
        const lastMessage = allMessages.find(m => m.id === conversation.last_message_id);
        
        return {
          ...conversation,
          lawyer_name: user.user_type === 'client' ? lawyerName : user.username,
          client_name: user.user_type === 'lawyer' ? (isGuestConversation ? 'Гость' : otherUserName) : user.username,
          last_message: lastMessage?.message || '',
          last_message_time: lastMessage?.created_at || conversation.updated_at,
          has_guest: isGuestConversation
        };
      });
      
      // Sort by most recent first
      enrichedConversations.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      
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
            u.username as lawyer_name,
            m.message as last_message,
            m.created_at as last_message_time
           FROM chat_conversations c
           JOIN users u ON c.lawyer_id = u.id
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
      const lawyerName = lawyerInfo?.name || lawyerUser?.username || 'Адвокат';
      
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
  sendMessage: async (senderId, receiverId, message, requestId = null) => {
    try {
      console.log('ChatService.sendMessage - Starting with:', { senderId, receiverId, message });
      
      // Initialize storage if needed
      await initChatStorage();
      
      // Проверка, является ли отправитель гостем
      const isGuestSender = senderId.toString().startsWith('guest_');
      
      // Get users to determine their types
      const users = JSON.parse(await AsyncStorage.getItem('users')) || [];
      console.log('ChatService.sendMessage - Found users:', users.length);
      
      // Если отправитель гость, создаем для него временный объект пользователя
      let sender, receiver;
      
      if (isGuestSender) {
        sender = {
          id: senderId,
          username: 'Гость',
          user_type: 'client',
          is_guest: true
        };
      } else {
        sender = users.find(u => u.id === senderId);
      }
      
      receiver = users.find(u => u.id === receiverId);
      
      console.log('ChatService.sendMessage - Users:', { 
        sender: sender ? { id: sender.id, type: sender.user_type, isGuest: isGuestSender } : null, 
        receiver: receiver ? { id: receiver.id, type: receiver.user_type } : null 
      });
      
      if (!sender) {
        const error = `Sender not found (senderId: ${senderId})`;
        console.error(error);
        throw new Error(error);
      }
      
      if (!receiver) {
        const error = `Receiver not found (receiverId: ${receiverId})`;
        console.error(error);
        throw new Error(error);
      }
      
      // Determine who is client and who is lawyer
      let clientId, lawyerId;
      if (sender.user_type === 'client') {
        clientId = senderId;
        lawyerId = receiverId;
      } else {
        clientId = receiverId;
        lawyerId = senderId;
      }
      
      console.log('ChatService.sendMessage - Determined roles:', { clientId, lawyerId });
      
      // Create message
      const messageId = await getNextId(STORAGE_KEYS.MESSAGE_ID_COUNTER);
      const newMessage = {
        id: messageId,
        sender_id: senderId,
        receiver_id: receiverId,
        request_id: requestId,
        message: message,
        read: false,
        created_at: new Date().toISOString(),
        is_from_guest: isGuestSender
      };
      
      // Save message
      const messages = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES)) || [];
      messages.push(newMessage);
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
      
      // Check if conversation exists
      const conversations = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS)) || [];
      let conversation = conversations.find(c => 
        c.client_id === clientId && c.lawyer_id === lawyerId
      );
      
      let conversationId;
      
      if (conversation) {
        // Update existing conversation
        console.log('ChatService.sendMessage - Updating existing conversation:', conversation.id);
        conversationId = conversation.id;
        conversation.last_message_id = messageId;
        conversation.unread_count = (conversation.unread_count || 0) + 1;
        conversation.updated_at = new Date().toISOString();
        conversation.has_guest = isGuestSender || conversation.has_guest;
        
        // Save updated conversations
        await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
      } else {
        // Create new conversation
        conversationId = await getNextId(STORAGE_KEYS.CONVERSATION_ID_COUNTER);
        console.log('ChatService.sendMessage - Creating new conversation:', conversationId);
        
        const newConversation = {
          id: conversationId,
          client_id: clientId,
          lawyer_id: lawyerId,
          request_id: requestId,
          last_message_id: messageId,
          unread_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          has_guest: isGuestSender
        };
        
        conversations.push(newConversation);
        await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
      }
      
      console.log('ChatService.sendMessage - Success:', { messageId, conversationId });
      return { messageId, conversationId };
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
      await initChatStorage();
      
      // Get conversation
      const conversations = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS)) || [];
      const conversationIndex = conversations.findIndex(c => c.id === conversationId);
      
      if (conversationIndex === -1) {
        throw new Error('Conversation not found');
      }
      
      const conversation = conversations[conversationIndex];
      const otherUserId = conversation.client_id === userId ? 
        conversation.lawyer_id : conversation.client_id;
      
      // Mark messages as read
      const messages = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES)) || [];
      let messagesUpdated = false;
      
      messages.forEach(message => {
        if (message.sender_id === otherUserId && message.receiver_id === userId && !message.read) {
          message.read = true;
          messagesUpdated = true;
        }
      });
      
      if (messagesUpdated) {
        await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
      }
      
      // Update conversation unread count
      if (conversations[conversationIndex].unread_count > 0) {
        conversations[conversationIndex].unread_count = 0;
        await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
      }
      
      return messagesUpdated ? 1 : 0;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
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
            name: lawyer.name,
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
  }
};

export default ChatService;