import { getDatabase } from './database';

// Функция для проверки наличия адвокатов в базе и добавления их, если их нет
export const ensureLawyersExist = async () => {
  try {
    // Get db instance
    const db = await getDatabase();
    
    // Проверяем количество адвокатов
    try {
      const result = await db.getFirstAsync('SELECT COUNT(*) as count FROM lawyers');
      const count = result?.count || 0;
      
      console.log(`В базе данных ${count} адвокатов`);
      
      // Если адвокатов мало, добавим их
      if (count < 30) {
        console.log('Очистка существующих данных...');
        await clearExistingData(db);
        
        console.log('Добавление новых адвокатов...');
        const lawyerResult = await addOptimizedLawyerSet(db);
        
        console.log('Добавление отзывов для адвокатов...');
        await addReviewsForLawyers(db);
        
        return lawyerResult;
      }
      
      // Проверяем количество отзывов
      const reviewsResult = await db.getFirstAsync('SELECT COUNT(*) as count FROM reviews');
      const reviewsCount = reviewsResult?.count || 0;
      
      if (reviewsCount < count * 5) {
        console.log('Добавление отзывов для адвокатов...');
        await db.execAsync('DELETE FROM reviews');
        await addReviewsForLawyers(db);
      }
      
      return { success: true, count };
    } catch (error) {
      // Если ошибка при запросе, значит таблицы могли не создаться
      console.error('Ошибка при проверке адвокатов:', error);
      console.log('Пробуем добавить адвокатов заново...');
      await clearExistingData(db);
      const result = await addOptimizedLawyerSet(db);
      await addReviewsForLawyers(db);
      return result;
    }
  } catch (error) {
    console.error('Error in ensureLawyersExist:', error);
    return { success: false, error: String(error) };
  }
};

// Очищаем существующие данные
const clearExistingData = async (db) => {
  try {
    await db.execAsync('DELETE FROM reviews');
    await db.execAsync('DELETE FROM lawyers');
    await db.execAsync('DELETE FROM users WHERE user_type = "lawyer"');
    console.log('Данные очищены');
  } catch (error) {
    console.error('Ошибка при очистке данных:', error);
  }
};

// Оптимизированная функция для создания адвокатов (без бесконечного количества комбинаций)
const addOptimizedLawyerSet = async (db) => {
  // Специализации
  const specializations = [
    'Уголовное право',
    'Гражданское право',
    'Семейное право',
    'Налоговое право',
    'Трудовое право'
  ];
  
  // Города для фильтрации
  const cities = [
    'Алматы',
    'Астана', 
    'Шымкент',
    'Караганда',
    'Актобе'
  ];
  
  // Ценовые диапазоны
  const priceRanges = [
    '5000-15000 тг',
    '15000-30000 тг', 
    '30000-50000 тг',
    '50000-100000 тг'
  ];
  
  // Вспомогательные функции
  const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];
  
  const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  const getRandomFloat = (min, max, decimals = 1) => {
    const value = Math.random() * (max - min) + min;
    return Number(value.toFixed(decimals));
  };
  
  // Имена и фамилии
  const maleFirstNames = ['Азат', 'Руслан', 'Марат', 'Ержан', 'Алишер', 'Бауржан', 'Канат', 'Данияр', 'Нурлан', 'Аслан', 'Тимур'];
  const femaleFirstNames = ['Динара', 'Айжан', 'Гульнара', 'Айгуль', 'Алия', 'Самал', 'Асель', 'Жанар', 'Мадина', 'Зарина'];
  const lastNames = ['Ахметов', 'Нурланов', 'Сериков', 'Бектуров', 'Джумабаев', 'Касымов', 'Мусин', 'Искаков', 'Алимов', 'Оспанов'];
  
  // Улицы для адресов
  const streets = ['Абая', 'Фурманова', 'Достык', 'Жибек Жолы', 'Сатпаева', 'Толе би', 'Назарбаева', 'Тимирязева'];
  
  const generatePhone = () => `+7${getRandomInt(700, 799)}${String(getRandomInt(1000000, 9999999)).padStart(7, '0')}`;
  
  const getFemaleName = () => {
    const firstName = getRandomItem(femaleFirstNames);
    let lastName = getRandomItem(lastNames);
    if (!lastName.endsWith('а')) {
      lastName = lastName.endsWith('в') ? `${lastName}а` : lastName;
    }
    return { firstName, lastName, fullName: `${firstName} ${lastName}` };
  };
  
  const getMaleName = () => {
    const firstName = getRandomItem(maleFirstNames);
    const lastName = getRandomItem(lastNames);
    return { firstName, lastName, fullName: `${firstName} ${lastName}` };
  };
  
  const getName = () => Math.random() > 0.5 ? getMaleName() : getFemaleName();
  
  const generateEmail = (firstName, lastName, index) => {
    const domain = getRandomItem(['advokaty.kz', 'lawyer.kz', 'legal.kz']);
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${index}@${domain}`;
  };
  
  const generateBio = (specialization, experience, city) => {
    const bioTemplates = [
      `Профессиональный адвокат по ${specialization.toLowerCase()}. ${experience} лет опыта работы. Специализируюсь на сложных делах в городе ${city}.`,
      `Адвокат по ${specialization.toLowerCase()} с опытом ${experience} лет. Работаю в ${city}. Индивидуальный подход к каждому клиенту.`,
      `${experience} лет успешной практики в ${specialization.toLowerCase()}. Оказываю квалифицированную юридическую помощь в городе ${city}.`,
      `Практикующий юрист по ${specialization.toLowerCase()}. Стаж работы: ${experience} лет. Основная практика в городе ${city}.`
    ];
    
    return getRandomItem(bioTemplates);
  };

  // Создаем структуру для распределения адвокатов по критериям
  const createLawyer = async (specialization, city, priceRange, experience, rating) => {
    try {
      const name = getName();
      const phone = generatePhone();
      const email = generateEmail(name.firstName, name.lastName, Date.now() + Math.floor(Math.random() * 10000));
      const address = `ул. ${getRandomItem(streets)}, д. ${getRandomInt(1, 200)}, офис ${getRandomInt(1, 500)}`;
      const bio = generateBio(specialization, experience, city);
      
      // Создаем пользователя для адвоката
      const userInsertQuery = `
        INSERT INTO users (username, email, password, phone, user_type) 
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const userResult = await db.runAsync(
        userInsertQuery,
        [name.fullName, email, 'password123', phone, 'lawyer']
      );
      
      const userId = userResult.lastInsertRowId;
      
      // Создаем запись адвоката
      const lawyerInsertQuery = `
        INSERT INTO lawyers (user_id, specialization, experience, price_range, bio, city, address, rating) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await db.runAsync(
        lawyerInsertQuery,
        [userId, specialization, experience, priceRange, bio, city, address, rating]
      );
      
      console.log(`Создан адвокат ${name.fullName} (${specialization}, ${city}, опыт: ${experience}, рейтинг: ${rating})`);
      return true;
    } catch (error) {
      console.error(`Ошибка при создании адвоката:`, error);
      return false;
    }
  };
  
  let addedCount = 0;
  
  // Создаем адвокатов по специализациям (по 5 разных городов для каждой)
  for (const specialization of specializations) {
    console.log(`Добавляем адвокатов для специализации: ${specialization}`);
    
    // По 3 адвоката в каждом из 3-х городов для каждой специализации
    for (let i = 0; i < 3; i++) {
      const city = cities[i % cities.length];
      
      // Адвокаты с разным опытом в этом городе
      if (await createLawyer(specialization, city, '15000-30000 тг', getRandomInt(3, 8), getRandomFloat(4.0, 4.7))) addedCount++;
      if (await createLawyer(specialization, city, '30000-50000 тг', getRandomInt(8, 15), getRandomFloat(4.5, 4.9))) addedCount++;
      if (await createLawyer(specialization, city, '50000-100000 тг', getRandomInt(15, 25), getRandomFloat(4.8, 5.0))) addedCount++;
    }
    
    // Добавим еще для разнообразия с разными ценами и опытом
    for (let j = 0; j < 2; j++) {
      const city = cities[j + 3];
      const priceRange = priceRanges[j % priceRanges.length];
      
      // Несколько адвокатов с разными рейтингами
      if (await createLawyer(specialization, city, priceRange, getRandomInt(2, 5), getRandomFloat(3.5, 4.0))) addedCount++;
      if (await createLawyer(specialization, city, priceRange, getRandomInt(5, 10), getRandomFloat(4.0, 4.5))) addedCount++;
    }
  }
  
  console.log(`Успешно добавлено ${addedCount} адвокатов`);
  return { success: true, count: addedCount };
};

// Функция для добавления отзывов для всех адвокатов (минимум 5 отзывов для каждого)
const addReviewsForLawyers = async (db) => {
  try {
    // Получаем список всех адвокатов
    const lawyers = await db.getAllAsync('SELECT id FROM lawyers');
    
    if (!lawyers || lawyers.length === 0) {
      console.log('Нет адвокатов для добавления отзывов');
      return { success: false, count: 0 };
    }
    
    // Получаем список существующих клиентов (не адвокатов)
    let clients = await db.getAllAsync('SELECT id FROM users WHERE user_type = "client" LIMIT 20');
    
    // Если клиентов мало, создаем новых с гарантированно уникальными email
    if (!clients || clients.length < 10) {
      // Имена для клиентов
      const firstNames = ['Алмас', 'Санжар', 'Даулет', 'Бахыт', 'Айдар', 'Зарина', 'Айнур', 'Сауле', 'Гульнара', 'Ерлан'];
      const lastNames = ['Назаров', 'Касымов', 'Сатыбалдиев', 'Бекбаев', 'Имангалиев', 'Токаева', 'Шамшиева', 'Манапова', 'Ахметова', 'Турсунов'];
      
      console.log('Создаем клиентов для отзывов...');
      
      // Уникальный идентификатор для email - текущее время + случайное число
      const uniqueId = Date.now();
      
      // Создаем 15 клиентов для отзывов
      for (let i = 0; i < 15; i++) {
        const gender = Math.random() > 0.5 ? 'male' : 'female';
        const firstName = gender === 'male' ? firstNames[i % 5] : firstNames[i % 5 + 5];
        const lastName = gender === 'male' ? lastNames[i % 5] : `${lastNames[i % 5 + 5]}${gender === 'female' ? 'а' : ''}`;
        const fullName = `${firstName} ${lastName}`;
        
        // Гарантированно уникальный email
        const email = `client.${firstName.toLowerCase()}.${uniqueId}${i}@example.com`;
        
        try {
          // Проверяем, существует ли пользователь с таким email
          const existingUser = await db.getFirstAsync('SELECT id FROM users WHERE email = ?', [email]);
          
          if (existingUser && existingUser.id) {
            console.log(`Клиент с email ${email} уже существует, пропускаем...`);
            continue;
          }
          
          const result = await db.runAsync(
            'INSERT INTO users (username, email, password, phone, user_type) VALUES (?, ?, ?, ?, ?)',
            [
              fullName, 
              email, 
              'password123', 
              `+7${700 + i}${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`, 
              'client'
            ]
          );
          console.log(`Создан клиент ${fullName} с email ${email}`);
        } catch (error) {
          console.error(`Ошибка при создании клиента ${fullName}:`, error);
        }
      }
      
      // Получаем созданных клиентов
      clients = await db.getAllAsync('SELECT id FROM users WHERE user_type = "client"');
      
      if (!clients || clients.length === 0) {
        console.error('Не удалось создать клиентов для отзывов');
        return { success: false, count: 0 };
      }
    }
    
    console.log(`Найдено ${clients.length} клиентов для отзывов`);
    
    // Примеры комментариев для отзывов
    const positiveComments = [
      'Отличный адвокат! Быстро и профессионально решил мой вопрос.',
      'Очень доволен результатом. Буду обращаться снова.',
      'Профессионал своего дела, всё объяснил и помог выиграть дело.',
      'Рекомендую всем, кто ищет квалифицированного юриста.',
      'Благодарен за качественную работу и внимательное отношение.',
      'Очень компетентный специалист, знает свое дело.',
      'Дело было решено в мою пользу, спасибо за помощь!',
      'Разобрался в сложной ситуации и нашел правильное решение.',
      'Помог защитить мои интересы в суде. Очень доволен сотрудничеством.',
      'Грамотный специалист, разъяснил все нюансы и помог решить проблему.'
    ];
    
    const neutralComments = [
      'В целом нормально, но можно было решить вопрос быстрее.',
      'Адвокат выполнил свою работу, но были некоторые задержки.',
      'Результат соответствует ожиданиям, но общение могло быть лучше.',
      'Справился с задачей, но цена за услуги немного завышена.',
      'Достаточно компетентный, но нужно было часто напоминать о деталях.'
    ];
    
    const negativeComments = [
      'Не очень доволен результатом, ожидал большего.',
      'Слишком долго решался вопрос, много бюрократии.',
      'Были проблемы с коммуникацией, не всегда отвечал на звонки.',
      'Сомнительная стратегия защиты, но дело всё же выиграли.'
    ];
    
    const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];
    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    
    // Сначала проверим, есть ли уже отзывы
    const existingReviewsCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM reviews');
    if (existingReviewsCount && existingReviewsCount.count > 0) {
      console.log(`В базе уже есть ${existingReviewsCount.count} отзывов, пропускаем...`);
      return { success: true, count: existingReviewsCount.count };
    }
    
    let addedReviewsCount = 0;
    
    // Для каждого адвоката добавляем минимум 5 отзывов
    for (const lawyer of lawyers) {
      const lawyerId = lawyer.id;
      
      // Случайное количество отзывов от 5 до 10
      const numReviews = getRandomInt(5, 10);
      console.log(`Добавляем ${numReviews} отзывов для адвоката ID: ${lawyerId}`);
      
      for (let i = 0; i < numReviews; i++) {
        try {
          // Выбираем случайного клиента
          const clientId = clients[getRandomInt(0, clients.length - 1)].id;
          
          // Проверяем, оставлял ли этот клиент уже отзыв данному адвокату
          const existingReview = await db.getFirstAsync(
            'SELECT id FROM reviews WHERE lawyer_id = ? AND client_id = ?',
            [lawyerId, clientId]
          );
          
          if (existingReview && existingReview.id) {
            // Если отзыв уже есть, пропускаем
            continue;
          }
          
          // Определяем рейтинг и комментарий
          let rating, comment;
          const rnd = Math.random();
          
          if (rnd > 0.8) {
            // 20% шанс на средний/отрицательный отзыв
            rating = getRandomInt(2, 4);
            comment = rnd > 0.9 ? getRandomItem(negativeComments) : getRandomItem(neutralComments);
          } else {
            // 80% шанс на положительный отзыв
            rating = getRandomInt(4, 5);
            comment = getRandomItem(positiveComments);
          }
          
          // Создаем дату отзыва (за последние 6 месяцев)
          const reviewDate = new Date();
          reviewDate.setMonth(reviewDate.getMonth() - getRandomInt(0, 6));
          const dateStr = reviewDate.toISOString();
          
          try {
            // Добавляем отзыв
            await db.runAsync(
              'INSERT INTO reviews (lawyer_id, client_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?)',
              [lawyerId, clientId, rating, comment, dateStr]
            );
            
            addedReviewsCount++;
          } catch (error) {
            console.error(`Ошибка при добавлении отзыва для адвоката ${lawyerId}:`, error);
          }
        } catch (error) {
          console.error(`Ошибка при обработке отзыва для адвоката ${lawyerId}:`, error);
        }
      }
      
      // Обновляем средний рейтинг адвоката
      try {
        const avgRating = await db.getFirstAsync(
          'SELECT AVG(rating) as avg_rating FROM reviews WHERE lawyer_id = ?',
          [lawyerId]
        );
        
        if (avgRating && avgRating.avg_rating) {
          await db.runAsync(
            'UPDATE lawyers SET rating = ? WHERE id = ?',
            [Number(avgRating.avg_rating).toFixed(1), lawyerId]
          );
          console.log(`Обновлен рейтинг для адвоката ID ${lawyerId}: ${Number(avgRating.avg_rating).toFixed(1)}`);
        }
      } catch (error) {
        console.error(`Ошибка при обновлении рейтинга для адвоката ${lawyerId}:`, error);
      }
    }
    
    console.log(`Успешно добавлено ${addedReviewsCount} отзывов`);
    return { success: true, count: addedReviewsCount };
  } catch (error) {
    console.error('Ошибка при добавлении отзывов:', error);
    return { success: false, error: String(error) };
  }
};

export default {
  ensureLawyersExist
}; 
 