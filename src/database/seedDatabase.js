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
      if (count < 5) {
        console.log('Очистка существующих данных...');
        await clearExistingData(db);
        
        console.log('Добавление новых адвокатов...');
        return await addSampleLawyers(db);
      }
      
      return { success: true, count };
    } catch (error) {
      // Если ошибка при запросе, значит таблицы могли не создаться
      console.error('Ошибка при проверке адвокатов:', error);
      console.log('Пробуем добавить адвокатов заново...');
      await clearExistingData(db);
      return await addSampleLawyers(db);
    }
  } catch (error) {
    console.error('Error in ensureLawyersExist:', error);
    return { success: false, error: String(error) };
  }
};

// Очищаем существующие данные
const clearExistingData = async (db) => {
  try {
    await db.execAsync('DELETE FROM lawyers');
    await db.execAsync('DELETE FROM users WHERE user_type = "lawyer"');
    console.log('Данные очищены');
  } catch (error) {
    console.error('Ошибка при очистке данных:', error);
  }
};

// Добавляем примеры адвокатов для каждой специализации
const addSampleLawyers = async (db) => {
  // Специализации
  const specializations = [
    'Уголовное право',
    'Гражданское право',
    'Семейное право',
    'Налоговое право',
    'Трудовое право'
  ];
  
  // Данные для образцовых адвокатов
  const lawyersData = [
    {
      name: 'Азат Ахметов',
      email: 'azat.akhmetov@advokaty.kz',
      phone: '+77011234567',
      experience: 12,
      city: 'Алматы',
      price: '20000-40000 тг',
      address: 'ул. Абая, 52, офис 305',
      rating: 4.8
    },
    {
      name: 'Динара Нурланова',
      email: 'dinara.nurlanova@advokaty.kz',
      phone: '+77057654321',
      experience: 8,
      city: 'Астана',
      price: '30000-60000 тг',
      address: 'пр. Кабанбай батыра, 45, офис 404',
      rating: 4.9
    },
    {
      name: 'Руслан Сериков',
      email: 'ruslan.serikov@advokaty.kz',
      phone: '+77075557777',
      experience: 15,
      city: 'Алматы',
      price: '50000-100000 тг',
      address: 'ул. Фурманова, 127, офис 7',
      rating: 5.0
    },
    {
      name: 'Айжан Бектурова',
      email: 'aizhan.bekturova@advokaty.kz',
      phone: '+77021112233',
      experience: 10,
      city: 'Шымкент',
      price: '20000-40000 тг',
      address: 'ул. Тауке хана, 15, офис 212',
      rating: 4.7
    },
    {
      name: 'Марат Джумабаев',
      email: 'marat.jumabayev@advokaty.kz',
      phone: '+77013334455',
      experience: 7,
      city: 'Караганда',
      price: '15000-30000 тг',
      address: 'пр. Бухар-Жырау, 68, офис 115',
      rating: 4.6
    }
  ];
  
  let addedCount = 0;
  
  // Добавляем по одному адвокату для каждой специализации
  for (let i = 0; i < specializations.length; i++) {
    const lawyer = lawyersData[i];
    const specialization = specializations[i];
    
    try {
      // Вставляем данные пользователя
      const userInsertQuery = `
        INSERT INTO users (username, email, password, phone, user_type) 
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const userResult = await db.runAsync(
        userInsertQuery,
        [lawyer.name, lawyer.email, 'password123', lawyer.phone, 'lawyer']
      );
      
      const userId = userResult.lastInsertRowId;
      
      // Вставляем данные адвоката
      const bio = `Профессиональный адвокат по ${specialization.toLowerCase()}. ${lawyer.experience} лет опыта работы. Специализируюсь на сложных делах, требующих индивидуального подхода.`;
      
      const lawyerInsertQuery = `
        INSERT INTO lawyers (user_id, specialization, experience, price_range, bio, city, address, rating) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await db.runAsync(
        lawyerInsertQuery,
        [userId, specialization, lawyer.experience, lawyer.price, bio, lawyer.city, lawyer.address, lawyer.rating]
      );
      
      addedCount++;
      console.log(`Создан адвокат ${lawyer.name} (${specialization})`);
    } catch (error) {
      console.error(`Ошибка при создании адвоката для ${specialization}:`, error);
    }
  }
  
  console.log(`Успешно добавлено ${addedCount} адвокатов`);
  return { success: true, count: addedCount };
};

export default {
  ensureLawyersExist
}; 