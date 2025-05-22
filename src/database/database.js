import AsyncStorage from '@react-native-async-storage/async-storage';

// Database instance
export let db = null;

// Initialize and get database connection
export const getDatabase = async () => {
  try {
    // First initialize the database structure
    await initDatabase();
    
    // Return a mock db object for compatibility with code expecting SQLite
    if (!db) {
      db = {
        transaction: (callback) => {
          // Create a mock transaction object that can be used by old SQLite code
          const tx = {
            executeSql: async (query, params, successCallback, errorCallback) => {
              try {
                // Parse the query to determine what operation to perform
                const result = await executeQuery(query, params);
                // Call success callback with rows object that mimics SQLite result
                successCallback(null, { 
                  rows: {
                    length: result.length,
                    item: (index) => result[index],
                    _array: result
                  },
                  rowsAffected: result.rowsAffected || 0,
                  insertId: result.insertId || null
                });
              } catch (error) {
                console.error('Error executing SQL:', error);
                if (errorCallback) errorCallback(null, error);
              }
            }
          };
          
          try {
            callback(tx);
          } catch (error) {
            console.error('Transaction error:', error);
          }
        }
      };
    }
    
    return db;
  } catch (error) {
    console.error('Error getting database:', error);
    throw error;
  }
};

// Execute query on AsyncStorage (mock SQL functionality)
export const executeQuery = async (query, params = []) => {
  try {
    // Parse query to determine operation type (SELECT, INSERT, UPDATE, DELETE)
    const queryLower = query.toLowerCase().trim();
    
    if (queryLower.startsWith('select')) {
      return await handleSelectQuery(query, params);
    } else if (queryLower.startsWith('insert')) {
      return await handleInsertQuery(query, params);
    } else if (queryLower.startsWith('update')) {
      return await handleUpdateQuery(query, params);
    } else if (queryLower.startsWith('delete')) {
      return await handleDeleteQuery(query, params);
    } else {
      console.warn('Unsupported query type:', query);
      return [];
    }
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};

// Helper functions for query execution
const handleSelectQuery = async (query, params) => {
  // This is a very basic implementation that returns data from AsyncStorage
  // In a real app, you would parse the SQL query properly
  
  if (query.includes('COUNT(*)')) {
    // Handle count queries
    if (query.includes('lawyers')) {
      const lawyers = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.LAWYERS)) || [];
      return [{ count: lawyers.length }];
    } else if (query.includes('users')) {
      const users = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.USERS)) || [];
      return [{ count: users.length }];
    } else if (query.includes('reviews')) {
      const reviews = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.REVIEWS)) || [];
      return [{ count: reviews.length }];
    }
  }
  
  // For "FROM lawyers" queries
  if (query.includes('FROM lawyers')) {
    const lawyers = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.LAWYERS)) || [];
    return lawyers;
  }
  
  // For "FROM users" queries
  if (query.includes('FROM users')) {
    const users = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.USERS)) || [];
    return users;
  }
  
  // Default fallback
  return [];
};

const handleInsertQuery = async (query, params) => {
  // Basic implementation for insert queries
  return { rowsAffected: 1, insertId: Date.now() };
};

const handleUpdateQuery = async (query, params) => {
  // Basic implementation for update queries
  return { rowsAffected: 1 };
};

const handleDeleteQuery = async (query, params) => {
  // Basic implementation for delete queries
  return { rowsAffected: 1 };
};

// Ключи для хранения данных
const STORAGE_KEYS = {
  USERS: 'users',
  LAWYERS: 'lawyers',
  REVIEWS: 'reviews',
  REQUESTS: 'requests',
  ID_COUNTER: 'id_counter'
};

// Инициализация базы данных
export const initDatabase = async () => {
  try {
    console.log('Initializing database...');
    
    // Создаем структуру для хранения счетчиков ID
    const idCounterExists = await AsyncStorage.getItem(STORAGE_KEYS.ID_COUNTER);
    if (!idCounterExists) {
      await AsyncStorage.setItem(STORAGE_KEYS.ID_COUNTER, JSON.stringify({
        users: 0,
        lawyers: 0,
        reviews: 0,
        requests: 0
      }));
    }
    
    // Проверяем наличие основных коллекций
    const usersExist = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    if (!usersExist) {
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
    }
    
    const lawyersExist = await AsyncStorage.getItem(STORAGE_KEYS.LAWYERS);
    if (!lawyersExist) {
      await AsyncStorage.setItem(STORAGE_KEYS.LAWYERS, JSON.stringify([]));
    }
    
    const reviewsExist = await AsyncStorage.getItem(STORAGE_KEYS.REVIEWS);
    if (!reviewsExist) {
      await AsyncStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify([]));
    }
    
    const requestsExist = await AsyncStorage.getItem(STORAGE_KEYS.REQUESTS);
    if (!requestsExist) {
      await AsyncStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify([]));
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Получить следующий ID для коллекции
const getNextId = async (collectionName) => {
  try {
    const idCounterStr = await AsyncStorage.getItem(STORAGE_KEYS.ID_COUNTER);
    const idCounter = JSON.parse(idCounterStr);
    
    idCounter[collectionName]++;
    await AsyncStorage.setItem(STORAGE_KEYS.ID_COUNTER, JSON.stringify(idCounter));
    
    return idCounter[collectionName];
  } catch (error) {
    console.error(`Error getting next ID for ${collectionName}:`, error);
    throw error;
  }
};

// CRUD операции для пользователей
export const createUser = async (userData) => {
  try {
    const users = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.USERS)) || [];
    
    // Проверяем, существует ли пользователь с таким email
    const existingUser = users.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('Пользователь с таким email уже существует');
    }
    
    const id = await getNextId('users');
    const newUser = {
      id,
      ...userData,
      created_at: new Date().toISOString()
    };
    
    users.push(newUser);
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getUsers = async () => {
  try {
    const users = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.USERS)) || [];
    return users;
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const users = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.USERS)) || [];
    return users.find(u => u.id === userId);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const users = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.USERS)) || [];
    const index = users.findIndex(u => u.id === userId);
    
    if (index === -1) {
      throw new Error('Пользователь не найден');
    }
    
    users[index] = {
      ...users[index],
      ...userData
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return users[index];
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// CRUD операции для адвокатов
export const createLawyer = async (lawyerData) => {
  try {
    const lawyers = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.LAWYERS)) || [];
    
    const id = await getNextId('lawyers');
    const newLawyer = {
      id,
      ...lawyerData,
      rating: 0,
      created_at: new Date().toISOString()
    };
    
    lawyers.push(newLawyer);
    await AsyncStorage.setItem(STORAGE_KEYS.LAWYERS, JSON.stringify(lawyers));
    
    return newLawyer;
  } catch (error) {
    console.error('Error creating lawyer:', error);
    throw error;
  }
};

export const getLawyers = async () => {
  try {
    const lawyers = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.LAWYERS)) || [];
    return lawyers;
  } catch (error) {
    console.error('Error getting lawyers:', error);
    throw error;
  }
};

export const getLawyerById = async (lawyerId) => {
  try {
    const lawyers = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.LAWYERS)) || [];
    return lawyers.find(l => l.id === lawyerId);
  } catch (error) {
    console.error('Error getting lawyer by ID:', error);
    throw error;
  }
};

export const updateLawyer = async (lawyerId, lawyerData) => {
  try {
    const lawyers = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.LAWYERS)) || [];
    const index = lawyers.findIndex(l => l.id === lawyerId);
    
    if (index === -1) {
      throw new Error('Адвокат не найден');
    }
    
    lawyers[index] = {
      ...lawyers[index],
      ...lawyerData
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.LAWYERS, JSON.stringify(lawyers));
    return lawyers[index];
  } catch (error) {
    console.error('Error updating lawyer:', error);
    throw error;
  }
};

// CRUD операции для отзывов
export const createReview = async (reviewData) => {
  try {
    const reviews = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.REVIEWS)) || [];
    
    const id = await getNextId('reviews');
    const newReview = {
      id,
      ...reviewData,
      created_at: new Date().toISOString()
    };
    
    reviews.push(newReview);
    await AsyncStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    
    // Обновляем рейтинг адвоката
    await updateLawyerRating(reviewData.lawyer_id);
    
    return newReview;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

export const getReviews = async (lawyerId) => {
  try {
    const reviews = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.REVIEWS)) || [];
    if (lawyerId) {
      return reviews.filter(r => r.lawyer_id === lawyerId);
    }
    return reviews;
  } catch (error) {
    console.error('Error getting reviews:', error);
    throw error;
  }
};

// Вспомогательная функция для обновления рейтинга адвоката
const updateLawyerRating = async (lawyerId) => {
  try {
    const reviews = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.REVIEWS)) || [];
    const lawyerReviews = reviews.filter(r => r.lawyer_id === lawyerId);
    
    if (lawyerReviews.length === 0) return;
    
    const totalRating = lawyerReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / lawyerReviews.length;
    
    // Округляем до одной десятой
    const roundedRating = Math.round(averageRating * 10) / 10;
    
    await updateLawyer(lawyerId, { rating: roundedRating });
  } catch (error) {
    console.error('Error updating lawyer rating:', error);
  }
};

// CRUD операции для заявок
export const createRequest = async (requestData) => {
  try {
    const requests = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.REQUESTS)) || [];
    
    const id = await getNextId('requests');
    const newRequest = {
      id,
      ...requestData,
      status: requestData.status || 'open',
      created_at: new Date().toISOString()
    };
    
    requests.push(newRequest);
    await AsyncStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
    
    return newRequest;
  } catch (error) {
    console.error('Error creating request:', error);
    throw error;
  }
};

export const getRequests = async (params = {}) => {
  try {
    const requests = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.REQUESTS)) || [];
    
    // Фильтрация по параметрам
    return requests.filter(r => {
      let match = true;
      
      if (params.client_id !== undefined && r.client_id !== params.client_id) {
        match = false;
      }
      
      if (params.lawyer_id !== undefined && r.lawyer_id !== params.lawyer_id) {
        match = false;
      }
      
      if (params.status !== undefined && r.status !== params.status) {
        match = false;
      }
      
      return match;
    });
  } catch (error) {
    console.error('Error getting requests:', error);
    throw error;
  }
};

export const updateRequest = async (requestId, requestData) => {
  try {
    const requests = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.REQUESTS)) || [];
    const index = requests.findIndex(r => r.id === requestId);
    
    if (index === -1) {
      throw new Error('Заявка не найдена');
    }
    
    requests[index] = {
      ...requests[index],
      ...requestData
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
    return requests[index];
  } catch (error) {
    console.error('Error updating request:', error);
    throw error;
  }
};

// Отладочные функции
export const showTableStructure = async (tableName) => {
  try {
    if (!tableName) {
      console.log('Table name must be specified. Available tables:', Object.keys(STORAGE_KEYS));
      return;
    }
    
    const storageKey = STORAGE_KEYS[tableName.toUpperCase()];
    if (!storageKey) {
      console.log('Invalid table name:', tableName, 'Available tables:', Object.keys(STORAGE_KEYS));
      return;
    }
    
    const data = JSON.parse(await AsyncStorage.getItem(storageKey)) || [];
    
    if (data.length === 0) {
      console.log(`Table ${tableName} is empty`);
      return;
    }
    
    const structure = Object.keys(data[0]).map(key => ({
      name: key,
      type: typeof data[0][key]
    }));
    
    console.log(`Table structure for ${tableName}:`, structure);
  } catch (error) {
    console.error('Error showing table structure:', error);
  }
};

export const showTableContents = async (tableName) => {
  try {
    const data = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS[tableName.toUpperCase()])) || [];
    console.log(`Contents of table ${tableName} (${data.length} rows):`, data.slice(0, 10));
  } catch (error) {
    console.error('Error showing table contents:', error);
  }
};

// Вспомогательная функция для очистки всех данных (только для разработки)
export const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
    console.log('All data cleared');
    await initDatabase();
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};

export const getLawyerByUserId = async (userId) => {
  try {
    const lawyers = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.LAWYERS)) || [];
    return lawyers.find(l => l.user_id === userId);
  } catch (error) {
    console.error('Error getting lawyer by user ID:', error);
    throw error;
  }
};

// Функция для определения типа пользователя
export const getUserType = async (userId) => {
  try {
    // Проверяем, является ли пользователь гостем
    if (String(userId).startsWith('guest_')) {
      return 'guest';
    }
    
    // Получаем пользователя из базы данных
    const user = await getUserById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Возвращаем тип пользователя
    return user.user_type || 'client'; // По умолчанию считаем клиентом
  } catch (error) {
    console.error('Error getting user type:', error);
    return 'client'; // По умолчанию в случае ошибки
  }
}; 