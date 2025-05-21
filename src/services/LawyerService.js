import { db, initDatabase, getDatabase, executeQuery } from '../database/database';

export const LawyerService = {
  // Get lawyer profile by user ID
  getLawyerProfile: (userId) => {
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            `SELECT l.*, u.username, u.email, u.phone 
             FROM lawyers l
             JOIN users u ON l.user_id = u.id
             WHERE l.user_id = ?`,
            [userId],
            (_, { rows }) => {
              if (rows.length > 0) {
                resolve(rows.item(0));
              } else {
                reject('Lawyer profile not found');
              }
            },
            (_, error) => {
              reject(error);
            }
          );
        }
      );
    });
  },

  // Update lawyer profile
  updateLawyerProfile: (userId, profileData) => {
    const { specialization, experience, price_range, bio, city, address } = profileData;
    
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            `UPDATE lawyers 
             SET specialization = ?, 
                 experience = ?, 
                 price_range = ?, 
                 bio = ?, 
                 city = ?, 
                 address = ?
             WHERE user_id = ?`,
            [specialization, experience, price_range, bio, city, address, userId],
            (_, { rowsAffected }) => {
              if (rowsAffected > 0) {
                resolve('Profile updated successfully');
              } else {
                reject('Failed to update profile');
              }
            },
            (_, error) => {
              reject(error);
            }
          );
        }
      );
    });
  },

  // Get all lawyers with filters
  getLawyers: async (filters = {}) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Make sure we have a valid db instance
        await getDatabase();
        
        let query = `
          SELECT l.id, l.user_id, l.specialization, l.experience, l.price_range, l.bio, l.rating, l.city, l.address, 
                 u.username, u.email, u.phone
          FROM lawyers l
          JOIN users u ON l.user_id = u.id
          WHERE 1=1
        `;
        
        const queryParams = [];
        
        console.log('Filters applied:', JSON.stringify(filters));
        
        // Поиск по имени или специализации
        if (filters.query) {
          query += ` AND (u.username LIKE ? OR l.specialization LIKE ? OR l.bio LIKE ? OR l.city LIKE ?)`;
          const searchTerm = `%${filters.query}%`;
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
        
        query += ` ORDER BY l.rating DESC LIMIT 20`;
        
        console.log('SQL Query:', query);
        console.log('Query params:', queryParams);

        try {
          if (typeof db.transaction !== 'function') {
            // Fallback to direct query if transaction is not available
            console.log('Transaction not available, using direct query instead');
            const result = await executeQuery(query, queryParams);
            resolve(result || []);
            return;
          }
          
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
                  reject(`Error executing query: ${error.message || error}`);
                }
              );
            },
            (txError) => {
              console.error('Transaction error in getLawyers:', txError);
              reject(`Database transaction failed: ${txError.message || txError}`);
            }
          );
        } catch (e) {
          console.error('Exception in getLawyers:', e);
          reject(`Exception: ${e.message || e}`);
        }
      } catch (error) {
        console.error('Error checking lawyers count:', error);
        reject(`Exception: ${error.message || error}`);
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
  }
}; 