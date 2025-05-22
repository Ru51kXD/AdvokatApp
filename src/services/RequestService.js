import { db, getDatabase } from '../database/database';
import { LAW_AREAS, PRICE_RANGES, REQUEST_STATUS } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Тестовые данные для 20 заявок клиентов
const mockClientNames = [
  'Александр Иванов', 'Елена Петрова', 'Михаил Сидоров', 'Ольга Кузнецова', 
  'Дмитрий Смирнов', 'Анна Васильева', 'Сергей Козлов', 'Наталья Морозова',
  'Андрей Новиков', 'Мария Соколова', 'Иван Федоров', 'Татьяна Волкова',
  'Николай Алексеев', 'Екатерина Лебедева', 'Юрий Семенов', 'Светлана Павлова',
  'Артем Голубев', 'Ирина Орлова', 'Виктор Комаров', 'Людмила Макарова'
];

const mockRequestTitles = [
  'Консультация по семейному праву', 'Помощь в составлении договора аренды',
  'Юридическая помощь в суде', 'Консультация по налоговым вопросам',
  'Оформление наследства', 'Возмещение ущерба при ДТП',
  'Раздел имущества при разводе', 'Сопровождение сделки с недвижимостью',
  'Проблемы с работодателем', 'Защита прав потребителя',
  'Обжалование штрафа', 'Проблемы с соседями',
  'Регистрация товарного знака', 'Вопрос по авторскому праву',
  'Оформление ИП', 'Вопрос по кредитному договору',
  'Помощь с визой', 'Проблемы с приставами',
  'Лишение водительских прав', 'Консультация по пенсионным вопросам'
];

const mockRequestDescriptions = [
  'Необходима консультация по вопросам семейного права в связи с предстоящим разводом и разделом имущества.',
  'Требуется помощь в составлении договора аренды коммерческого помещения с особыми условиями.',
  'Ищу адвоката для представления моих интересов в суде по гражданскому делу.',
  'Необходима консультация по оптимизации налогообложения для малого бизнеса.',
  'Требуется помощь в оформлении наследства после смерти родственника.',
  'Попал в ДТП, необходима помощь в получении компенсации от страховой компании.',
  'Нужна консультация по разделу имущества при разводе, есть несовершеннолетние дети.',
  'Требуется юридическое сопровождение сделки по покупке квартиры на вторичном рынке.',
  'Работодатель не выплачивает зарплату более 2 месяцев, нужна юридическая помощь.',
  'Купил бракованный товар, магазин отказывается возвращать деньги. Нужна консультация.',
  'Получил штраф, который считаю незаконным. Нужна помощь в обжаловании.',
  'Соседи затопили квартиру и отказываются компенсировать ущерб. Нужен юрист.',
  'Хочу зарегистрировать товарный знак для своего бизнеса. Нужна юридическая помощь.',
  'Мои фотографии используют без разрешения в рекламе. Нужна консультация по авторскому праву.',
  'Хочу оформить ИП. Нужна консультация по выбору налогового режима и оформлению документов.',
  'Банк начисляет скрытые комиссии по кредитному договору. Нужна юридическая помощь.',
  'Отказали в визе без объяснения причин. Нужна помощь юриста по миграционным вопросам.',
  'Приставы арестовали счет с детскими пособиями. Нужна срочная помощь.',
  'Лишили водительских прав, считаю процедуру незаконной. Нужен адвокат для обжалования.',
  'Необходима консультация по вопросам начисления пенсии и получения льгот.'
];

// Фиксированные данные для случаев, когда константы могут быть недоступны
const DEFAULT_LAW_AREAS = [
  { value: 'family', label: 'Семейное право' },
  { value: 'criminal', label: 'Уголовное право' },
  { value: 'civil', label: 'Гражданское право' },
  { value: 'business', label: 'Корпоративное право' },
  { value: 'tax', label: 'Налоговое право' }
];

const DEFAULT_PRICE_RANGES = [
  { value: 'free', label: 'Бесплатная консультация' },
  { value: 'low', label: 'До 5 000 ₸' },
  { value: 'medium', label: 'От 5 000 до 20 000 ₸' },
  { value: 'high', label: 'От 20 000 до 50 000 ₸' },
  { value: 'premium', label: 'От 50 000 ₸' }
];

export const RequestService = {
  // Create a new request
  createRequest: async (clientId, requestData) => {
    const { title, description, law_area, price_range, experience_required } = requestData;

    return new Promise(async (resolve, reject) => {
      try {
        console.log('Создание новой заявки:', { clientId, ...requestData });
        
        // Инициализируем базу данных перед использованием
        await getDatabase();
        
        const currentDate = new Date().toISOString();
        
        // Для демо-режима используем AsyncStorage
        const isDemoMode = true; // Для демонстрации
        
        if (isDemoMode) {
          try {
            // Получаем текущие заявки из AsyncStorage
            const savedRequestsStr = await AsyncStorage.getItem('user_requests') || '[]';
            const savedRequests = JSON.parse(savedRequestsStr);
            
            console.log('Существующие заявки:', savedRequests.length);
            
            // Генерируем ID для новой заявки
            const newId = savedRequests.length > 0 
              ? Math.max(...savedRequests.map(r => r.id)) + 1
              : 1;
            
            // Создаем объект новой заявки
            const newRequest = {
              id: newId,
              client_id: clientId,
              title,
              description,
              law_area,
              price_range,
              experience_required,
              created_at: currentDate,
              status: 'open',
              response_count: 0
            };
            
            // Добавляем новую заявку в массив
            savedRequests.push(newRequest);
            
            // Сохраняем обновленный массив
            await AsyncStorage.setItem('user_requests', JSON.stringify(savedRequests));
            
            console.log('Заявка успешно сохранена в AsyncStorage:', newRequest);
            resolve(newRequest);
            return;
          } catch (error) {
            console.error('Ошибка при сохранении заявки в AsyncStorage:', error);
            // В случае ошибки пробуем сохранить в SQLite
          }
        }
        
        // Если не демо-режим или сохранение в AsyncStorage не удалось, используем SQLite
        db.transaction(
          (tx) => {
            tx.executeSql(
              `INSERT INTO requests 
               (client_id, title, description, law_area, price_range, experience_required, created_at, status) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [clientId, title, description, law_area, price_range, experience_required, currentDate, 'open'],
              (_, { insertId }) => {
                // Вернем более подробную информацию о созданной заявке
                const newRequest = {
                  id: insertId,
                  client_id: clientId,
                  title,
                  description,
                  law_area,
                  price_range,
                  experience_required,
                  created_at: currentDate,
                  status: 'open',
                  response_count: 0
                };
                console.log('Заявка успешно сохранена в SQLite:', newRequest);
                resolve(newRequest);
              },
              (_, error) => {
                console.error('Ошибка при выполнении SQL-запроса:', error);
                reject(error);
              }
            );
          },
          (error) => {
            console.error('Ошибка транзакции:', error);
            reject(error);
          }
        );
      } catch (error) {
        console.error('Ошибка при создании заявки:', error);
        reject(error);
      }
    });
  },

  // Get requests by client ID
  getClientRequests: async (clientId) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Getting client requests for client ID:', clientId);
        
        // Для демо-режима используем AsyncStorage
        const isDemoMode = true; // Для демонстрации
        
        if (isDemoMode) {
          try {
            // Получаем сохраненные заявки пользователя из AsyncStorage
            const savedRequestsStr = await AsyncStorage.getItem('user_requests') || '[]';
            const savedRequests = JSON.parse(savedRequestsStr);
            
            // Фильтруем заявки по ID клиента
            const clientRequests = savedRequests.filter(request => request.client_id === clientId);
            
            console.log(`Найдено ${clientRequests.length} заявок для клиента ${clientId} в AsyncStorage`);
            
            // Сортируем по дате создания (новые сверху)
            clientRequests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            resolve(clientRequests);
            return;
          } catch (error) {
            console.error('Ошибка при чтении заявок из AsyncStorage:', error);
            // Если ошибка, пробуем получить из SQLite
          }
        }
        
        // Если не демо-режим или чтение из AsyncStorage не удалось, используем SQLite
        // Инициализируем базу данных перед использованием
        await getDatabase();
        
        db.transaction(
          (tx) => {
            tx.executeSql(
              `SELECT r.*, (SELECT COUNT(*) FROM responses WHERE request_id = r.id) as response_count
               FROM requests r 
               WHERE r.client_id = ? 
               ORDER BY r.created_at DESC`,
              [clientId],
              (_, { rows }) => {
                const requests = [];
                for (let i = 0; i < rows.length; i++) {
                  requests.push(rows.item(i));
                }
                
                console.log(`Found ${requests.length} requests in database for client ${clientId}`);
                
                // Не добавляем тестовые данные, возвращаем только реальные заявки
                resolve(requests);
              },
              (_, error) => {
                console.error('SQL error in getClientRequests:', error);
                reject(error);
              }
            );
          },
          (error) => {
            console.error('Transaction error in getClientRequests:', error);
            reject(error);
          }
        );
      } catch (error) {
        console.error('Exception in getClientRequests:', error);
        reject(error);
      }
    });
  },

  // Get open requests with filters (for lawyers to find work)
  getOpenRequests: async (filters = {}) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Инициализируем базу данных перед использованием
        await getDatabase();
        
        let query = `
          SELECT r.*, u.username as client_name 
          FROM requests r
          JOIN users u ON r.client_id = u.id
          WHERE r.status = 'open'
        `;
        
        const queryParams = [];
        
        if (filters.law_area) {
          query += ` AND r.law_area = ?`;
          queryParams.push(filters.law_area);
        }
        
        if (filters.price_range) {
          query += ` AND r.price_range = ?`;
          queryParams.push(filters.price_range);
        }
        
        if (filters.maxExperienceRequired) {
          query += ` AND (r.experience_required IS NULL OR r.experience_required <= ?)`;
          queryParams.push(filters.maxExperienceRequired);
        }
        
        query += ` ORDER BY r.created_at DESC`;
        
        db.transaction(
          (tx) => {
            tx.executeSql(
              query,
              queryParams,
              (_, { rows }) => {
                const requests = [];
                for (let i = 0; i < rows.length; i++) {
                  requests.push(rows.item(i));
                }
                resolve(requests);
              },
              (_, error) => {
                reject(error);
              }
            );
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  },

  // Get all available requests for lawyers (including demo data if needed)
  getAvailableRequests: async (lawyerId) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Загружаем заявки из AsyncStorage...');
        
        // Инициализируем базу данных перед использованием
        await getDatabase();
        
        // Сначала попробуем загрузить сохраненные заявки из AsyncStorage
        AsyncStorage.getItem('mock_requests').then(savedRequests => {
          if (savedRequests) {
            const requests = JSON.parse(savedRequests);
            console.log(`Успешно загружено ${requests.length} заявок из AsyncStorage`);
            resolve(requests);
            return;
          }
          
          // Если заявок в хранилище нет, генерируем новые
          console.log('Заявки в AsyncStorage не найдены, генерируем новые...');
          const mockRequests = RequestService.generateMockRequests(lawyerId);
          
          // Сохраняем в AsyncStorage для следующего использования
          AsyncStorage.setItem('mock_requests', JSON.stringify(mockRequests))
            .then(() => {
              console.log(`Сохранено ${mockRequests.length} заявок в AsyncStorage`);
            })
            .catch(err => {
              console.error('Ошибка при сохранении заявок в AsyncStorage:', err);
            });
          
          resolve(mockRequests);
        }).catch(error => {
          console.error('Ошибка при чтении из AsyncStorage:', error);
          
          // В случае ошибки генерируем новые заявки
          const mockRequests = RequestService.generateMockRequests(lawyerId);
          resolve(mockRequests);
        });
      } catch (error) {
        console.error("Ошибка при получении заявок:", error);
        // В случае ошибки также возвращаем заглушку, чтобы избежать зависания UI
        const fallbackRequests = [];
        for (let i = 0; i < 5; i++) {
          fallbackRequests.push({
            id: i + 1,
            client_id: i + 100,
            client_name: "Клиент " + (i + 1),
            title: "Тестовая заявка " + (i + 1),
            description: "Описание тестовой заявки",
            law_area: "family",
            price_range: "medium",
            status: "open",
            created_at: new Date().toISOString(),
            hasResponded: false,
            response_count: 0
          });
        }
        resolve(fallbackRequests);
      }
    });
  },

  // Генерирует 15 тестовых заявок
  generateMockRequests: (lawyerId) => {
    console.log('Генерируем 15 тестовых заявок...');
    
    // Создаем 15 разнообразных заявок для тестирования фильтров
    const mockRequests = [];
    
    // Используем безопасный доступ к массивам констант
    const areas = Array.isArray(LAW_AREAS) && LAW_AREAS.length > 0 ? LAW_AREAS : DEFAULT_LAW_AREAS;
    const priceRanges = Array.isArray(PRICE_RANGES) && PRICE_RANGES.length > 0 ? PRICE_RANGES : DEFAULT_PRICE_RANGES;
    const openStatus = REQUEST_STATUS?.OPEN || 'open';
    const inProgressStatus = REQUEST_STATUS?.IN_PROGRESS || 'in_progress';
    
    // Создаем заявки для разных областей права
    const requestCount = 15;
    
    for (let i = 0; i < requestCount; i++) {
      // Создаем разнообразные даты: часть новые, часть старые
      const randomDate = new Date();
      
      // Первые 5 заявок - недавние (до 3 дней)
      // Следующие 5 - средней давности (от 3 до 10 дней)
      // Последние 5 - старые (от 10 до 30 дней)
      let daysAgo;
      if (i < 5) {
        daysAgo = Math.floor(Math.random() * 3); // 0-2 дня
      } else if (i < 10) {
        daysAgo = 3 + Math.floor(Math.random() * 7); // 3-9 дней
      } else {
        daysAgo = 10 + Math.floor(Math.random() * 20); // 10-29 дней
      }
      
      randomDate.setDate(randomDate.getDate() - daysAgo);
      
      // Распределяем заявки по разным областям права
      const lawAreaIndex = i % areas.length;
      
      // Распределяем по ценовым диапазонам
      const priceRangeIndex = Math.floor(i / 3) % priceRanges.length;
      
      // Часть заявок с откликом, часть без
      const hasResponded = i % 3 === 0; // Каждая третья с откликом
      
      // Статус: большинство открытые, но несколько в работе
      const status = i % 7 === 0 ? inProgressStatus : openStatus;
      
      // Количество откликов разное для разных заявок
      const responseCount = Math.floor(Math.random() * 5); // От 0 до 4 откликов
      
      mockRequests.push({
        id: i + 1,
        client_id: i + 100,
        client_name: mockClientNames[i % mockClientNames.length],
        title: mockRequestTitles[i % mockRequestTitles.length],
        description: mockRequestDescriptions[i % mockRequestDescriptions.length],
        law_area: areas[lawAreaIndex].value,
        price_range: priceRanges[priceRangeIndex].value,
        status: status,
        created_at: randomDate.toISOString(),
        hasResponded: hasResponded,
        response_count: responseCount
      });
    }
    
    // Обогащаем заявки дополнительными данными
    mockRequests.forEach((request, index) => {
      // Добавляем метку срочности для некоторых заявок
      request.isUrgent = index % 4 === 0;
      
      // Устанавливаем опыт для некоторых заявок
      if (index % 5 === 0) {
        request.experience_required = 5; // Высокий опыт
      } else if (index % 5 === 1) {
        request.experience_required = 3; // Средний опыт
      } else if (index % 5 === 2) {
        request.experience_required = 1; // Минимальный опыт
      }
    });
    
    console.log(`Сгенерировано ${mockRequests.length} тестовых заявок`);
    return mockRequests;
  },
  
  // Очищает базу тестовых заявок
  clearMockRequests: () => {
    return AsyncStorage.removeItem('mock_requests')
      .then(() => {
        console.log('Тестовые заявки успешно удалены');
        return true;
      })
      .catch(error => {
        console.error('Ошибка при удалении тестовых заявок:', error);
        return false;
      });
  },

  // Get request details by ID (with responses)
  getRequestById: (requestId, userId = null, userType = null) => {
    return new Promise((resolve) => {
      console.log(`Запрос деталей заявки ID: ${requestId}`);
      
      // Всегда возвращаем тестовую заявку, не проверяя авторизацию
      setTimeout(() => {
        // Создаем несколько тестовых откликов на заявку
        const testResponses = [
          {
            id: 101,
            lawyer_id: 201,
            lawyer_name: "Сергей Павлов",
            specialization: "Семейное право, Гражданское право",
            experience: 7,
            rating: 4.8,
            message: "Имею большой опыт в разрешении семейных споров. Готов помочь с вашим делом.",
            status: "pending",
            created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            price: "От 15 000 ₸",
            response_time: "1-2 дня"
          },
          {
            id: 102,
            lawyer_id: 202,
            lawyer_name: "Анна Кузнецова",
            specialization: "Семейное право",
            experience: 5,
            rating: 4.5,
            message: "Специализируюсь на семейных спорах, особенно связанных с разделом имущества. Предлагаю первую консультацию бесплатно.",
            status: "pending",
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            price: "От 10 000 ₸",
            response_time: "В течение дня"
          },
          {
            id: 103,
            lawyer_id: 203,
            lawyer_name: "Дмитрий Соколов",
            specialization: "Гражданское право, Семейное право",
            experience: 10,
            rating: 4.9,
            message: "Более 10 лет опыта в семейных делах. Большинство дел решаю в досудебном порядке.",
            status: "pending",
            created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            price: "От 20 000 ₸",
            response_time: "В тот же день"
          }
        ];
        
        // Расширенная тестовая заявка с большим количеством деталей
        const testRequest = {
          id: parseInt(requestId) || 1,
          title: "Консультация по семейному праву при разводе",
          description: "Необходима консультация по вопросам семейного права в связи с предстоящим разводом и разделом имущества. Есть совместно нажитая квартира, автомобиль и дача. Брак длился 8 лет, есть несовершеннолетний ребенок. Также интересует вопрос об алиментах и определении места жительства ребенка.",
          law_area: "Семейное право",
          law_area_display: "Семейное право",
          price_range: "medium",
          price_range_display: "От 5 000 до 20 000 ₸",
          client_name: "Александр Иванов",
          client_phone: "+7 (777) 123-45-67",
          client_email: "client@example.com",
          status: "open",
          created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          // Фильтруем отклики - показываем только те, что не отклонены (status != 'rejected')
          responses: testResponses.filter(response => response.status !== 'rejected'),
          response_count: testResponses.length,
          experience_required: 3,
          isUrgent: requestId % 2 === 0,
          location: "г. Алматы",
          preferred_contact: "Телефон, WhatsApp",
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          additional_info: "Ищу адвоката, способного быстро реагировать на запросы. Предпочтительно с опытом ведения подобных дел.",
          documents: [
            { id: 1, name: "Свидетельство о браке", type: "pdf" },
            { id: 2, name: "Документы на недвижимость", type: "pdf" },
            { id: 3, name: "Свидетельство о рождении", type: "pdf" }
          ],
          // Дополнительные поля для отображения
          service_type: "Консультация и представительство в суде",
          case_complexity: "Средняя",
          estimated_duration: "1-3 месяца"
        };
        
        console.log(`Возвращаю тестовую заявку: ${testRequest.title} с ${testResponses.length} откликами`);
        resolve(testRequest);
      }, 500); // Небольшая задержка для имитации загрузки
    });
  },
  
  // Отправить отклик на заявку (работает без авторизации)
  createResponse: (responseData) => {
    return new Promise((resolve) => {
      console.log('Отправка отклика на заявку:', responseData);
      
      // Имитируем задержку для обработки запроса
      setTimeout(() => {
        // Текущая дата в ISO формате
        const currentDate = new Date().toISOString();
        
        // Создаем тестовый отклик с дополнительными полями для отображения
        const newResponse = {
          id: Math.floor(Math.random() * 1000) + 200,
          lawyer_id: responseData.lawyer_id || 999,
          request_id: responseData.request_id,
          message: responseData.message,
          status: 'pending',
          created_at: currentDate,
          lawyer_name: responseData.lawyer_name || 'Вы (Гость)',
          specialization: responseData.specialization || 'Юрист',
          experience: responseData.experience || 0,
          rating: responseData.rating || 5.0,
          // Дополнительные поля для лучшего отображения
          price: "По договоренности",
          response_time: "Сразу",
          isYourResponse: true // Метка, что это ваш отклик
        };
        
        console.log('Отклик успешно создан:', newResponse);
        resolve(newResponse);
      }, 800);
    });
  },
  
  // Submit a response to a request (lawyer)
  submitResponse: (requestId, lawyerId, message) => {
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          // Check if lawyer already responded
          tx.executeSql(
            'SELECT * FROM responses WHERE request_id = ? AND lawyer_id = ?',
            [requestId, lawyerId],
            (_, { rows }) => {
              if (rows.length > 0) {
                reject('You have already responded to this request');
                return;
              }
              
              // Insert response
              tx.executeSql(
                `INSERT INTO responses (request_id, lawyer_id, message)
                 VALUES (?, ?, ?)`,
                [requestId, lawyerId, message],
                (_, { insertId }) => {
                  // Add to history
                  tx.executeSql(
                    `INSERT INTO history 
                     (client_id, lawyer_id, request_id, interaction_type, details)
                     SELECT r.client_id, ?, r.id, 'response', 'Lawyer responded to request'
                     FROM requests r
                     WHERE r.id = ?`,
                    [lawyerId, requestId],
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
            },
            (_, error) => {
              reject(error);
            }
          );
        }
      );
    });
  },
  
  // Update response status (accept/reject by client)
  updateResponseStatus: (responseId, status) => {
    return new Promise((resolve, reject) => {
      try {
        console.log(`Обновление статуса отклика ID: ${responseId} на "${status}"`);
        
        // Проверяем, если это тестовая база - обновляем тестовые данные
        const isDemoMode = true; // Используем тестовый режим для демо
        
        if (isDemoMode) {
          // Эмулируем успешное обновление
          setTimeout(() => {
            console.log(`Статус отклика обновлен на "${status}"`);
            resolve('Response updated successfully');
          }, 300);
          return;
        }
        
        // Если это не демо режим, используем реальную БД
        db.transaction(
          (tx) => {
            tx.executeSql(
              `UPDATE responses SET status = ? WHERE id = ?`,
              [status, responseId],
              (_, { rowsAffected }) => {
                if (rowsAffected > 0) {
                  // Add to history and update request status if accepted
                  if (status === 'accepted') {
                    tx.executeSql(
                      `UPDATE requests r
                       SET r.status = 'in_progress'
                       WHERE r.id = (SELECT request_id FROM responses WHERE id = ?)`,
                      [responseId],
                      () => {
                        tx.executeSql(
                          `INSERT INTO history 
                           (client_id, lawyer_id, request_id, interaction_type, details)
                           SELECT r.client_id, resp.lawyer_id, r.id, 'accepted', 'Client accepted lawyer response'
                           FROM responses resp
                           JOIN requests r ON resp.request_id = r.id
                           WHERE resp.id = ?`,
                          [responseId],
                          () => {
                            resolve('Response updated successfully');
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
                  } else {
                    resolve('Response updated successfully');
                  }
                } else {
                  reject('Failed to update response');
                }
              },
              (_, error) => {
                reject(error);
              }
            );
          }
        );
      } catch (error) {
        console.error('Error updating response status:', error);
        reject(error);
      }
    });
  },

  // Инициализация демо-данных
  initDemoData: async () => {
    try {
      console.log('Initializing demo data for requests...');
      
      // Проверяем наличие тестовых заявок в AsyncStorage
      const savedRequests = await AsyncStorage.getItem('mock_requests');
      
      if (!savedRequests) {
        console.log('No mock requests found, generating new ones...');
        // Генерируем новые тестовые заявки
        const mockRequests = RequestService.generateMockRequests();
        
        // Сохраняем в AsyncStorage
        await AsyncStorage.setItem('mock_requests', JSON.stringify(mockRequests));
        console.log(`Saved ${mockRequests.length} mock requests to AsyncStorage`);
      } else {
        console.log('Mock requests already exist in AsyncStorage');
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing demo data:', error);
      return false;
    }
  },
}; 