import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Объект для хранения подключения к базе данных
export let db = null;

// Функция для получения пути к базе данных
const getDatabasePath = async () => {
  if (Platform.OS === 'web') {
    return 'db.db';
  }
  
  const dbName = 'db.db';
  const dbAsset = require('../../assets/db.db');
  const dbUri = Asset.fromModule(dbAsset).uri;
  const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
  
  // Проверяем существует ли уже база данных
  const fileInfo = await FileSystem.getInfoAsync(dbPath);
  
  if (!fileInfo.exists) {
    console.log('Database does not exist, copying from assets...');
    
    // Создаем директорию для базы данных, если ее нет
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}SQLite`, { intermediates: true });
    
    // Копируем базу из ассетов в директорию документов
    await FileSystem.downloadAsync(dbUri, dbPath);
    console.log('Database copied successfully');
  } else {
    console.log('Database already exists');
  }
  
  return dbPath;
};

// Инициализация базы данных
export const initDatabase = async () => {
  try {
    console.log('Initializing database...');
    
    // Открываем или создаем базу данных
    const dbName = 'db.db';
    db = await SQLite.openDatabaseAsync(dbName);
    
    // Добавляем методы, но избегаем рекурсии
    const nativeGetFirstAsync = db.getFirstAsync.bind(db);
    const nativeRunAsync = db.runAsync.bind(db);
    const nativeExecAsync = db.execAsync.bind(db);
    
    // Add transaction method to support old API
    db.transaction = (callback, errorCallback, successCallback) => {
      const tx = {
        executeSql: (sql, params, onSuccess, onError) => {
          console.log('Executing SQL in transaction:', sql);
          
          // For read queries
          if (sql.trim().toLowerCase().startsWith('select')) {
            nativeGetFirstAsync(sql, params)
              .then(result => {
                if (onSuccess) {
                  // Format results to match the old API
                  const formattedResult = {
                    rows: {
                      length: result ? 1 : 0,
                      _array: result ? [result] : [],
                      item: (idx) => (result && idx === 0) ? result : null
                    }
                  };
                  onSuccess(tx, formattedResult);
                }
              })
              .catch(err => {
                console.error('Error executing SELECT query:', err);
                if (onError) onError(tx, err);
              });
          } 
          // For write queries
          else {
            nativeRunAsync(sql, params)
              .then(result => {
                if (onSuccess) {
                  // Format results to match the old API
                  const formattedResult = {
                    rowsAffected: result.changes || 0,
                    insertId: result.lastInsertRowId || null,
                    rows: { length: 0, _array: [], item: () => null }
                  };
                  onSuccess(tx, formattedResult);
                }
              })
              .catch(err => {
                console.error('Error executing write query:', err);
                if (onError) onError(tx, err);
              });
          }
        }
      };
      
      // Execute the callback with our transaction object
      try {
        callback(tx);
        if (successCallback) successCallback();
      } catch (error) {
        console.error('Error in transaction callback:', error);
        if (errorCallback) errorCallback(error);
      }
      
      return tx;
    };
    
    db.getAllAsync = async (sql, params = []) => {
      try {
        const result = await nativeGetFirstAsync(sql, params);
        return result ? [result] : [];
      } catch (error) {
        console.error('Error in getAllAsync:', error);
        return [];
      }
    };

    db.runAsync = async (sql, params = []) => {
      try {
        return await nativeRunAsync(sql, params);
      } catch (error) {
        console.error('Error in runAsync:', error);
        throw error;
      }
    };

    db.execAsync = async (sql) => {
      try {
        return await nativeExecAsync(sql);
      } catch (error) {
        console.error('Error in execAsync:', error);
        throw error;
      }
    };
    
    // Создаем необходимые таблицы
    await createTablesIfNeeded();
    
    // Import seedDatabase after db is initialized to avoid circular dependency
    const seedDatabaseUtils = require('./seedDatabase').default;
    
    try {
      // Проверяем и добавляем адвокатов, если их нет
      await seedDatabaseUtils.ensureLawyersExist();
      console.log('Database initialized successfully');
    } catch (seedError) {
      console.error('Error during database seeding:', seedError);
    }
    
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Создаем необходимые таблицы
const createTablesIfNeeded = async () => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        user_type TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS lawyers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        specialization TEXT NOT NULL,
        experience INTEGER,
        price_range TEXT,
        bio TEXT,
        city TEXT,
        address TEXT,
        rating REAL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
      
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lawyer_id INTEGER NOT NULL,
        client_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lawyer_id) REFERENCES lawyers (id),
        FOREIGN KEY (client_id) REFERENCES users (id)
      );
    `);
    console.log("Tables created successfully");
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  }
};

// Получить экземпляр базы данных
export const getDatabase = async () => {
  if (!db) {
    db = await initDatabase();
  }
  return db;
};

// Безопасное выполнение запроса, который возвращает результат
export const executeQuery = async (query, params = []) => {
  try {
    console.log('Executing query:', query);
    
    const database = await getDatabase();
    const result = await database.getAllAsync(query, params);
    
    console.log(`Query returned ${result.length} rows`);
    return result;
  } catch (error) {
    console.error('Error executing query:', error);
    return [];
  }
};

// Безопасное выполнение запроса типа INSERT, UPDATE, DELETE
export const executeUpdate = async (query, params = []) => {
  try {
    console.log('Executing update:', query);
    
    const database = await getDatabase();
    const result = await database.runAsync(query, params);
    
    console.log('Update result:', result);
    return result;
  } catch (error) {
    console.error('Error executing update:', error);
    throw error;
  }
};

// Экспортируем для обратной совместимости
export const dbCompat = {
  transaction: (callback) => {
    return new Promise(async (resolve, reject) => {
      try {
        const database = await getDatabase();
        await database.transaction(callback);
        resolve();
      } catch (error) {
        console.error('Transaction error:', error);
        reject(error);
      }
    });
  },
  exec: async (queries, callback) => {
    try {
      const database = await getDatabase();
      await database.execAsync(queries);
      if (callback && typeof callback === 'function') {
        callback(null);
      }
    } catch (error) {
      if (callback && typeof callback === 'function') {
        callback(error);
      } else {
        throw error;
      }
    }
  }
};

// Функция для вывода структуры таблицы
export const showTableStructure = async (tableName) => {
  try {
    const db = await getDatabase();
    console.log(`Table structure for ${tableName}:`);
    
    // Получение структуры таблицы
    const schema = await db.getAllAsync(`PRAGMA table_info(${tableName})`);
    console.table(schema);
    
    return schema;
  } catch (error) {
    console.error(`Error showing structure for table ${tableName}:`, error);
    throw error;
  }
};

// Функция для вывода содержимого таблицы
export const showTableContents = async (tableName, limit = 10) => {
  try {
    const db = await getDatabase();
    console.log(`Contents of table ${tableName} (up to ${limit} rows):`);
    
    // Получение данных из таблицы
    const rows = await db.getAllAsync(`SELECT * FROM ${tableName} LIMIT ${limit}`);
    console.table(rows);
    
    return rows;
  } catch (error) {
    console.error(`Error showing contents of table ${tableName}:`, error);
    throw error;
  }
}; 