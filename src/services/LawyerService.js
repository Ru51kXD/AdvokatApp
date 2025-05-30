import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, executeQuery, getDatabase, getLawyerByUserId, getUserById, initDatabase } from '../database/database';

export const LawyerService = {
  // Get lawyer profile by user ID
  getLawyerProfile: async (userId) => {
    try {
      await initDatabase();
      
      // Get lawyer profile
      const lawyer = await getLawyerByUserId(userId);
      
      if (!lawyer) {
        throw new Error('Lawyer profile not found');
      }
      
      // Get user data
      const user = await getUserById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Combine lawyer profile with user data
      return {
        ...lawyer,
        username: user.username,
        email: user.email,
        phone: user.phone
      };
    } catch (error) {
      console.error('Error in getLawyerProfile:', error);
      throw error;
    }
  },

  // Update lawyer profile
  updateLawyerProfile: async (userId, profileData) => {
    try {
      await initDatabase();
      
      // Get lawyers array
      const lawyers = JSON.parse(await AsyncStorage.getItem('lawyers')) || [];
      
      // Find lawyer index
      const lawyerIndex = lawyers.findIndex(l => l.user_id === userId);
      
      if (lawyerIndex === -1) {
        throw new Error('Lawyer profile not found');
      }
      
      // Update lawyer data
      lawyers[lawyerIndex] = {
        ...lawyers[lawyerIndex],
        ...profileData,
        updated_at: new Date().toISOString()
      };
      
      // Save updated lawyers array
      await AsyncStorage.setItem('lawyers', JSON.stringify(lawyers));
      
      return { success: true };
    } catch (error) {
      console.error('Error in updateLawyerProfile:', error);
      throw error;
    }
  },

  // Get all lawyers with filters
  getLawyers: async (filters = {}) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Make sure we have a valid db instance
        await getDatabase();
        
        // Сначала проверим и обновим имена адвокатов
        try {
          console.log('Проверяем имена адвокатов...');
          const checkResult = await executeQuery('SELECT u.username, COUNT(*) as count FROM lawyers l JOIN users u ON l.user_id = u.id WHERE u.user_type = "lawyer" GROUP BY u.username ORDER BY count DESC LIMIT 5');
          
          if (checkResult && checkResult.length > 0) {
            // Если есть имена, которые повторяются больше 1 раза, обновляем
            const duplicates = checkResult.filter(r => r.count > 1);
            if (duplicates.length > 0) {
              console.log('Найдены дублирующиеся имена адвокатов:', duplicates.map(d => `${d.username} (${d.count} раз)`));
              await LawyerService.updateLawyerNamesInDB();
            }
          }
        } catch (updateError) {
          console.log('Не удалось автоматически обновить имена адвокатов:', updateError);
        }
        
        let query = `
          SELECT l.id, l.user_id, l.specialization, l.experience, l.price_range, l.bio, l.rating, l.city, l.address, 
                 u.username as name, u.username, u.email, u.phone
          FROM lawyers l
          JOIN users u ON l.user_id = u.id
          WHERE 1=1
        `;
        
        const queryParams = [];
        
        console.log('Filters applied:', JSON.stringify(filters));
        
        // Поиск по имени или специализации
        if (filters.query && filters.query.trim() !== '') {
          const searchTerm = `%${filters.query.trim()}%`;
          query += ` AND (u.username LIKE ? OR l.specialization LIKE ? OR l.bio LIKE ? OR l.city LIKE ?)`;
          queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        // Поиск по категории (специализации из списка категорий)
        if (filters.category) {
          const categoryMap = {
            1: 'Уголовное право',
            2: 'Гражданское право',
            3: 'Семейное право',
            4: 'Налоговое право',
            5: 'Трудовое право'
          };
          
          const categoryValue = categoryMap[filters.category];
          if (categoryValue) {
            query += ` AND l.specialization = ?`;
            queryParams.push(categoryValue);
          }
        }
        
        // Фильтр по специализации
        if (filters.specialization) {
          query += ` AND l.specialization = ?`;
          queryParams.push(filters.specialization);
        }
        
        // Фильтр по опыту
        if (filters.minExperience) {
          query += ` AND l.experience >= ?`;
          queryParams.push(parseInt(filters.minExperience, 10) || 0);
        }
        
        // Фильтр по стоимости услуг
        if (filters.priceRange) {
          query += ` AND l.price_range = ?`;
          queryParams.push(filters.priceRange);
        }
        
        // Фильтр по рейтингу
        if (filters.minRating) {
          query += ` AND l.rating >= ?`;
          queryParams.push(parseFloat(filters.minRating) || 0);
        }
        
        // Фильтр по городу
        if (filters.city) {
          query += ` AND l.city = ?`;
          queryParams.push(filters.city);
        }
        
        // Дополнительные фильтры
        if (filters.additionalFilters && filters.additionalFilters.length > 0) {
          // Рейтинг > 4.5
          if (filters.additionalFilters.includes(1)) {
            query += ` AND l.rating >= 4.5`;
          }
          
          // Опыт > 5 лет
          if (filters.additionalFilters.includes(2)) {
            query += ` AND l.experience > 5`;
          }
        }
        
        // Увеличиваем лимит, чтобы гарантировать больше результатов
        query += ` ORDER BY l.rating DESC LIMIT 50`;
        
        console.log('SQL Query:', query);
        console.log('Query params:', queryParams);

        try {
          // Сначала попробуем прямой запрос для большей надежности
          const result = await executeQuery(query, queryParams);
          if (result && result.length > 0) {
            console.log(`Direct query returned ${result.length} lawyers`);
            resolve(result);
            return;
          }
          
          // Если прямой запрос не дал результатов или failed, пробуем transaction API
          if (typeof db.transaction === 'function') {
            db.transaction(
              (tx) => {
                tx.executeSql(
                  query,
                  queryParams,
                  (_, { rows }) => {
                    const lawyers = [];
                    console.log(`DB returned ${rows.length} rows`);
                    
                    for (let i = 0; i < rows.length; i++) {
                      const lawyer = rows.item(i);
                      console.log(`Processing lawyer ${i+1}:`, lawyer.id, lawyer.username);
                      lawyers.push({
                        id: lawyer.id,
                        user_id: lawyer.user_id,
                        username: lawyer.username,
                        specialization: lawyer.specialization,
                        experience: lawyer.experience,
                        price_range: lawyer.price_range,
                        bio: lawyer.bio,
                        rating: lawyer.rating,
                        city: lawyer.city,
                        address: lawyer.address,
                        email: lawyer.email,
                        phone: lawyer.phone
                      });
                    }
                    
                    console.log(`Returning ${lawyers.length} lawyers`);
                    resolve(lawyers);
                  },
                  (_, error) => {
                    console.error('SQL Error in getLawyers:', error);
                    // Если транзакция не удалась, возвращаем пустой массив вместо ошибки
                    console.log('Returning empty array after SQL error');
                    resolve([]);
                  }
                );
              },
              (txError) => {
                console.error('Transaction error in getLawyers:', txError);
                // Если транзакция не удалась, возвращаем пустой массив вместо ошибки
                console.log('Returning empty array after transaction error');
                resolve([]);
              }
            );
          } else {
            console.log('Transaction not available, but direct query returned no results');
            resolve([]);
          }
        } catch (e) {
          console.error('Exception in getLawyers:', e);
          // В случае ошибки возвращаем пустой массив
          resolve([]);
        }
      } catch (error) {
        console.error('Error checking lawyers count:', error);
        // В случае ошибки возвращаем пустой массив
        resolve([]);
      }
    });
  },

  // Get lawyer by ID (with reviews)
  getLawyerById: (lawyerId) => {
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          // Get lawyer details
          console.log('Fetching lawyer with ID:', lawyerId);
          tx.executeSql(
            `SELECT l.*, u.username, u.email, u.phone, u.id as user_id
             FROM lawyers l
             JOIN users u ON l.user_id = u.id
             WHERE l.id = ?`,
            [lawyerId],
            (_, { rows }) => {
              if (rows.length === 0) {
                console.error('Lawyer not found with ID:', lawyerId);
                reject('Lawyer not found');
                return;
              }
              
              const lawyer = rows.item(0);
              console.log('Found lawyer:', lawyer.username);
              
              // Get reviews for this lawyer
              tx.executeSql(
                `SELECT r.*, u.username as client_name
                 FROM reviews r
                 JOIN users u ON r.client_id = u.id
                 WHERE r.lawyer_id = ?
                 ORDER BY r.created_at DESC`,
                [lawyerId],
                (_, { rows: reviewRows }) => {
                  const reviews = [];
                  for (let i = 0; i < reviewRows.length; i++) {
                    reviews.push(reviewRows.item(i));
                  }
                  
                  // Return lawyer with reviews
                  resolve({
                    ...lawyer,
                    reviews
                  });
                },
                (_, error) => {
                  console.error('Error fetching reviews:', error);
                  reject(error);
                }
              );
            },
            (_, error) => {
              console.error('Error fetching lawyer details:', error);
              reject(error);
            }
          );
        },
        (error) => {
          console.error('Transaction error:', error);
          reject(error);
        }
      );
    });
  },
  
  // Add review for a lawyer
  addReview: (lawyerId, clientId, rating, comment) => {
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          // Insert the review
          tx.executeSql(
            `INSERT INTO reviews (lawyer_id, client_id, rating, comment)
             VALUES (?, ?, ?, ?)`,
            [lawyerId, clientId, rating, comment],
            (_, { insertId }) => {
              // Update lawyer's average rating
              tx.executeSql(
                `UPDATE lawyers 
                 SET rating = (
                    SELECT AVG(rating) FROM reviews WHERE lawyer_id = ?
                 )
                 WHERE id = ?`,
                [lawyerId, lawyerId],
                () => {
                  resolve(insertId);
                },
                (_, error) => {
                  reject(error);
                }
              );
            },
            (_, error) => {
              reject(error);
            }
          );
        }
      );
    });
  },

  // Populate the database with test lawyer data (3 lawyers for each specialization)
  populateLawyerData: () => {
    // Specializations
    const specializations = [
      'Уголовное право',  // Criminal law
      'Семейное право',   // Family law
      'Гражданское право', // Civil law
      'Налоговое право',  // Tax law
      'Трудовое право'    // Labor law
    ];
    
    // Cities in Kazakhstan
    const cities = ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе', 'Тараз', 'Павлодар', 'Усть-Каменогорск'];
    
    // Price ranges
    const priceRanges = ['5000-15000 тг', '15000-30000 тг', '30000-50000 тг', '50000-100000 тг'];
    
    // Helper functions
    const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];
    const getRandomExperience = () => Math.floor(Math.random() * 28) + 3;
    
    return new Promise((resolve, reject) => {
      try {
        // Generate lawyer data
        const lawyers = [];
        
        specializations.forEach(specialization => {
          // Create 3 lawyers for each specialization
          for (let i = 0; i < 3; i++) {
            const firstName = `Адвокат${lawyers.length + 1}`;
            const lastName = `${specialization.split(' ')[0]}`;
            const username = `${firstName}${lastName}`;
            
            const lawyer = {
              username: username,
              email: `${username.toLowerCase()}@example.com`,
              password: 'password123',
              phone: `+7${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
              user_type: 'lawyer',
              specialization: specialization,
              experience: getRandomExperience(),
              price_range: getRandomItem(priceRanges),
              bio: `Профессиональный адвокат по ${specialization.toLowerCase()}. ${getRandomExperience()} лет опыта работы с различными делами.`,
              city: getRandomItem(cities),
              address: `ул. ${specialization.split(' ')[0]}, д. ${Math.floor(Math.random() * 100) + 1}`
            };
            
            lawyers.push(lawyer);
          }
        });
        
        console.log(`Preparing to insert ${lawyers.length} lawyers into the database...`);
        
        db.transaction(
          (tx) => {
            lawyers.forEach(lawyer => {
              // 1. Insert user record
              tx.executeSql(
                `INSERT INTO users (username, email, password, phone, user_type) 
                 VALUES (?, ?, ?, ?, ?)`,
                [lawyer.username, lawyer.email, lawyer.password, lawyer.phone, lawyer.user_type],
                (_, { insertId }) => {
                  const userId = insertId;
                  
                  // 2. Insert lawyer record
                  tx.executeSql(
                    `INSERT INTO lawyers (user_id, specialization, experience, price_range, bio, city, address)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [userId, lawyer.specialization, lawyer.experience, lawyer.price_range, lawyer.bio, lawyer.city, lawyer.address],
                    (_, result) => {
                      console.log(`Created lawyer: ${lawyer.username}, specialization: ${lawyer.specialization}`);
                    },
                    (_, error) => {
                      console.error('Error creating lawyer record:', error);
                    }
                  );
                },
                (_, error) => {
                  console.error('Error creating user record:', error);
                }
              );
            });
          },
          (error) => {
            console.error('Transaction error:', error);
            reject(error);
          },
          () => {
            console.log('Successfully added all lawyers!');
            resolve({ success: true, count: lawyers.length });
          }
        );
      } catch (error) {
        console.error('Error populating lawyers:', error);
        reject(error);
      }
    });
  },

  // Функция для добавления уникальных адвокатов (с гарантированно уникальными email)
  addUniqueLawyers: async () => {
    try {
      console.log('Добавление уникальных адвокатов...');
      
      // Текущая метка времени для создания уникальных email
      const timestamp = new Date().getTime();
      
      // Специализации
      const specializations = [
        'Уголовное право',
        'Гражданское право',
        'Семейное право',
        'Налоговое право',
        'Трудовое право'
      ];
      
      // Города Казахстана
      const cities = ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Усть-Каменогорск', 'Актобе', 'Павлодар'];
      
      // Диапазоны цен
      const priceRanges = ['10000-20000 тг', '20000-40000 тг', '30000-60000 тг', '50000-100000 тг'];
      
      // Имена адвокатов
      const firstNames = ['Азат', 'Руслан', 'Динара', 'Аслан', 'Айжан', 'Самал', 'Марат', 'Асель', 'Ержан', 'Гульназ'];
      const lastNames = ['Ахметов', 'Касымов', 'Нурланова', 'Сериков', 'Бектурова', 'Сарсенов', 'Джумабаев', 'Искакова', 'Мусин', 'Алимова'];
      
      // Функция для получения случайного элемента массива
      const getRandomItem = (array) => {
        return array[Math.floor(Math.random() * array.length)];
      };
      
      // Функция для генерации случайного опыта работы
      const getRandomExperience = () => {
        return Math.floor(Math.random() * 20) + 3; // от 3 до 22 лет
      };
      
      // Функция для генерации случайного рейтинга
      const getRandomRating = () => {
        return (Math.random() * 1.5 + 3.5).toFixed(1); // от 3.5 до 5.0
      };
      
      let successCount = 0;
      const addedLawyers = [];
      
      return new Promise((resolve, reject) => {
        try {
          db.transaction(
            (tx) => {
              // Для каждой специализации создаем по 3 адвоката
              specializations.forEach((specialization, specIndex) => {
                for (let i = 0; i < 3; i++) {
                  const lawyerIndex = specIndex * 3 + i;
                  const firstName = getRandomItem(firstNames);
                  const lastName = getRandomItem(lastNames);
                  const username = `${firstName} ${lastName}`;
                  
                  // Уникальный email с меткой времени
                  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${timestamp + lawyerIndex}@example.com`;
                  
                  // Создаем пользователя и адвоката
                  tx.executeSql(
                    `INSERT INTO users (username, email, password, phone, user_type) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [username, email, 'password123', `+7${Math.floor(Math.random() * 10000000000)}`, 'lawyer'],
                    (_, { insertId }) => {
                      const userId = insertId;
                      const experience = getRandomExperience();
                      const city = getRandomItem(cities);
                      const priceRange = getRandomItem(priceRanges);
                      const bio = `Профессиональный адвокат по ${specialization.toLowerCase()}. ${experience} лет опыта работы. Специализируюсь на сложных делах, требующих индивидуального подхода.`;
                      const address = `ул. ${getRandomItem(['Абая', 'Фурманова', 'Достык', 'Жибек Жолы', 'Сатпаева', 'Толе би'])}, ${Math.floor(Math.random() * 200) + 1}, офис ${Math.floor(Math.random() * 500) + 1}`;
                      const rating = getRandomRating();
                      
                      // Добавляем запись адвоката
                      tx.executeSql(
                        `INSERT INTO lawyers (user_id, specialization, experience, price_range, bio, city, address, rating)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [userId, specialization, experience, priceRange, bio, city, address, rating],
                        (_, result) => {
                          successCount++;
                          addedLawyers.push({ username, specialization });
                          console.log(`Создан адвокат ${username} (${specialization})`);
                        },
                        (_, error) => {
                          console.error(`Ошибка при создании записи адвоката для ${username}:`, error);
                        }
                      );
                    },
                    (_, error) => {
                      console.error(`Ошибка при создании пользователя ${username}:`, error);
                    }
                  );
                }
              });
            },
            (error) => {
              console.error('Ошибка транзакции:', error);
              reject({ 
                success: false, 
                error: error.message || String(error)
              });
            },
            () => {
              console.log(`Успешно добавлено ${successCount} уникальных адвокатов`);
              resolve({
                success: true,
                count: successCount,
                addedLawyers: addedLawyers
              });
            }
          );
        } catch (error) {
          console.error('Ошибка при добавлении уникальных адвокатов:', error);
          reject({ 
            success: false, 
            error: error.message || String(error)
          });
        }
      });
    } catch (error) {
      console.error('Внешняя ошибка при добавлении уникальных адвокатов:', error);
      return { 
        success: false, 
        error: error.message || String(error)
      };
    }
  },

  // Функция для обновления имен адвокатов (чтобы у всех были разные имена)
  updateLawyerNames: async () => {
    try {
      console.log('Обновляем имена адвокатов...');
      
      // Список казахстанских имен для адвокатов
      const lawyerNames = [
        'Айдар Нурланов', 'Динара Касымова', 'Асель Сериков', 'Ержан Мусин',
        'Гульнара Алимова', 'Марат Джумабаев', 'Айжан Бектурова', 'Самал Сарсенов',
        'Руслан Ахметов', 'Зарина Искакова', 'Азат Токаев', 'Сауле Манапова',
        'Аслан Шамшиев', 'Гульназ Турсунов', 'Санжар Назаров', 'Айнур Громова',
        'Даулет Имангалиев', 'Ерлан Степанов', 'Бахыт Комарова', 'Алмас Орлова',
        'Жанар Кузнецов', 'Мейрам Лебедев', 'Анара Зайцева', 'Нуржан Федорова',
        'Кайрат Васильева', 'Арман Макаров', 'Лейла Петрова', 'Максат Соколов'
      ];
      
      // Получаем пользователей-адвокатов
      const users = JSON.parse(await AsyncStorage.getItem('users')) || [];
      const lawyers = JSON.parse(await AsyncStorage.getItem('lawyers')) || [];
      
      let updatedUsers = [...users];
      let updateCount = 0;
      
      // Обновляем имена адвокатов
      lawyers.forEach((lawyer, index) => {
        const userIndex = updatedUsers.findIndex(u => u.id === lawyer.user_id);
        if (userIndex !== -1 && updatedUsers[userIndex].user_type === 'lawyer') {
          const newName = lawyerNames[index % lawyerNames.length];
          if (updatedUsers[userIndex].username !== newName) {
            updatedUsers[userIndex].username = newName;
            updateCount++;
            console.log(`Обновлено имя адвоката ID ${lawyer.user_id}: ${newName}`);
          }
        }
      });
      
      // Сохраняем обновленных пользователей
      if (updateCount > 0) {
        await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
        console.log(`Успешно обновлено ${updateCount} имен адвокатов`);
      } else {
        console.log('Нет адвокатов для обновления имен');
      }
      
      return { success: true, updated: updateCount };
    } catch (error) {
      console.error('Ошибка при обновлении имен адвокатов:', error);
      throw error;
    }
  },

  // Функция для обновления имен адвокатов в базе данных
  updateLawyerNamesInDB: async () => {
    try {
      console.log('Обновляем имена адвокатов в базе данных...');
      
      // Список казахстанских имен для адвокатов
      const lawyerNames = [
        'Айдар Нурланов', 'Динара Касымова', 'Асель Сериков', 'Ержан Мусин',
        'Гульнара Алимова', 'Марат Джумабаев', 'Айжан Бектурова', 'Самал Сарсенов',
        'Руслан Ахметов', 'Зарина Искакова', 'Азат Токаев', 'Сауле Манапова',
        'Аслан Шамшиев', 'Гульназ Турсунов', 'Санжар Назаров', 'Айнур Громова',
        'Даулет Имангалиев', 'Ерлан Степанов', 'Бахыт Комарова', 'Алмас Орлова',
        'Жанар Кузнецов', 'Мейрам Лебедев', 'Анара Зайцева', 'Нуржан Федорова',
        'Кайрат Васильева', 'Арман Макаров', 'Лейла Петрова', 'Максат Соколов',
        'Болат Сатбаев', 'Айгуль Нурпеисова', 'Ерболат Калиев', 'Мадина Утегенова'
      ];
      
      // Получаем всех пользователей-адвокатов
      const lawyerUsers = await executeQuery('SELECT u.id, u.username FROM users u JOIN lawyers l ON u.id = l.user_id WHERE u.user_type = "lawyer"');
      
      if (!lawyerUsers || lawyerUsers.length === 0) {
        console.log('Адвокаты не найдены в базе данных');
        return { success: false, message: 'Адвокаты не найдены' };
      }
      
      let updateCount = 0;
      
      // Обновляем имена адвокатов
      for (let i = 0; i < lawyerUsers.length; i++) {
        const lawyerUser = lawyerUsers[i];
        const newName = lawyerNames[i % lawyerNames.length];
        
        if (lawyerUser.username !== newName) {
          try {
            await executeQuery('UPDATE users SET username = ? WHERE id = ?', [newName, lawyerUser.id]);
            updateCount++;
            console.log(`Обновлено имя адвоката ID ${lawyerUser.id}: ${lawyerUser.username} -> ${newName}`);
          } catch (updateError) {
            console.error(`Ошибка при обновлении адвоката ID ${lawyerUser.id}:`, updateError);
          }
        }
      }
      
      console.log(`Успешно обновлено ${updateCount} имен адвокатов`);
      return { success: true, updated: updateCount };
    } catch (error) {
      console.error('Ошибка при обновлении имен адвокатов в базе данных:', error);
      throw error;
    }
  }
}; 
 
 
 