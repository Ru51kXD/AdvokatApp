import { getDatabase, initDatabase } from '../database/database';

// Функция для добавления адвокатов напрямую в базу данных
export const addLawyersDirectly = async () => {
  try {
    // Инициализируем базу данных
    await initDatabase();
    const db = await getDatabase();
    
    console.log('Начинаем добавление адвокатов в базу данных...');
    
    // Реальные имена для адвокатов
    const lawyerRealNames = [
      'Ерлан Мирзоев', 'Айгуль Сатпаева', 'Нурлан Каримов', 'Данияр Алиев',
      'Гульназ Бекетова', 'Тимур Ахметов', 'Асель Нурлановна', 'Мурат Жумабаев',
      'Карлыгаш Исмагулова', 'Бахыт Каирбеков', 'Жанар Искакова', 'Аскар Нуржанов'
    ];
    
    // Адвокаты для каждой категории
    const lawyers = [
      // Адвокаты по уголовному праву
      {
        username: 'Адвокат1 Уголовное',
        name: lawyerRealNames[0],
        email: 'criminal1@example.com',
        password: 'password123',
        phone: '+77001112233',
        user_type: 'lawyer',
        specialization: 'Уголовное право',
        experience: 10,
        price_range: '15000-30000 тг',
        bio: 'Специализируюсь на уголовных делах различной сложности. 10 лет опыта, успешное представление интересов клиентов в суде.',
        city: 'Алматы',
        address: 'ул. Абая, 10, офис 101'
      },
      {
        username: 'Адвокат2 Уголовное',
        name: lawyerRealNames[1],
        email: 'criminal2@example.com',
        password: 'password123',
        phone: '+77001112244',
        user_type: 'lawyer',
        specialization: 'Уголовное право',
        experience: 15,
        price_range: '30000-50000 тг',
        bio: 'Бывший прокурор. Большой опыт по защите в сложных уголовных делах. Индивидуальный подход к каждому клиенту.',
        city: 'Астана',
        address: 'пр. Республики, 25, офис 303'
      },
      {
        username: 'Адвокат3 Уголовное',
        name: lawyerRealNames[2],
        email: 'criminal3@example.com',
        password: 'password123',
        phone: '+77001112255',
        user_type: 'lawyer',
        specialization: 'Уголовное право',
        experience: 8,
        price_range: '10000-20000 тг',
        bio: 'Специализируюсь на защите по делам средней тяжести. Имею большой опыт ведения дел с участием присяжных.',
        city: 'Караганда',
        address: 'ул. Бухар-Жырау, 55, офис 203'
      },
      
      // Адвокаты по гражданскому праву
      {
        username: 'Адвокат1 Гражданское',
        email: 'civil1@example.com',
        password: 'password123',
        phone: '+77002223344',
        user_type: 'lawyer',
        specialization: 'Гражданское право',
        experience: 12,
        price_range: '15000-30000 тг',
        bio: 'Эксперт в области гражданского права. Многолетний опыт ведения договорных споров, дел о наследстве и защите прав потребителей.',
        city: 'Алматы',
        address: 'пр. Достык, 100, офис 505'
      },
      {
        username: 'Адвокат2 Гражданское',
        email: 'civil2@example.com',
        password: 'password123',
        phone: '+77002223355',
        user_type: 'lawyer',
        specialization: 'Гражданское право',
        experience: 9,
        price_range: '10000-20000 тг',
        bio: 'Специализируюсь на имущественных спорах, взыскании долгов и защите интеллектуальной собственности.',
        city: 'Астана',
        address: 'ул. Кенесары, 50, офис 404'
      },
      {
        username: 'Адвокат3 Гражданское',
        email: 'civil3@example.com',
        password: 'password123',
        phone: '+77002223366',
        user_type: 'lawyer',
        specialization: 'Гражданское право',
        experience: 18,
        price_range: '30000-50000 тг',
        bio: 'Более 18 лет опыта в гражданском праве. Высокий процент выигранных дел. Индивидуальный подход к каждому клиенту.',
        city: 'Шымкент',
        address: 'пр. Тауке хана, 10, офис 210'
      },
      
      // Адвокаты по семейному праву
      {
        username: 'Адвокат1 Семейное',
        email: 'family1@example.com',
        password: 'password123',
        phone: '+77003334455',
        user_type: 'lawyer',
        specialization: 'Семейное право',
        experience: 8,
        price_range: '10000-20000 тг',
        bio: 'Помогаю в решении семейных споров, включая развод, раздел имущества и алименты. Всегда на стороне клиента.',
        city: 'Алматы',
        address: 'ул. Жибек Жолы, 50, офис 305'
      },
      {
        username: 'Адвокат2 Семейное',
        email: 'family2@example.com',
        password: 'password123',
        phone: '+77003334466',
        user_type: 'lawyer',
        specialization: 'Семейное право',
        experience: 15,
        price_range: '20000-35000 тг',
        bio: 'Специализируюсь на сложных бракоразводных процессах и определении места жительства детей. Имею психологическое образование.',
        city: 'Астана',
        address: 'ул. Сарыарка, 30, офис 102'
      },
      {
        username: 'Адвокат3 Семейное',
        email: 'family3@example.com',
        password: 'password123',
        phone: '+77003334477',
        user_type: 'lawyer',
        specialization: 'Семейное право',
        experience: 10,
        price_range: '15000-30000 тг',
        bio: 'Адвокат с 10-летним стажем работы в сфере семейного права. Помогу в вопросах усыновления, опеки и семейных конфликтов.',
        city: 'Павлодар',
        address: 'ул. Лермонтова, 44, офис 201'
      },
      
      // Адвокаты по налоговому праву
      {
        username: 'Адвокат1 Налоговое',
        email: 'tax1@example.com',
        password: 'password123',
        phone: '+77004445566',
        user_type: 'lawyer',
        specialization: 'Налоговое право',
        experience: 11,
        price_range: '25000-40000 тг',
        bio: 'Бывший сотрудник налоговой службы. Помогаю в разрешении налоговых споров, оптимизации налогообложения и представлении интересов в налоговых органах.',
        city: 'Алматы',
        address: 'ул. Фурманова, 101, офис 707'
      },
      {
        username: 'Адвокат2 Налоговое',
        email: 'tax2@example.com',
        password: 'password123',
        phone: '+77004445577',
        user_type: 'lawyer',
        specialization: 'Налоговое право',
        experience: 9,
        price_range: '20000-35000 тг',
        bio: 'Специалист по корпоративному и международному налогообложению. Помощь в оспаривании налоговых решений.',
        city: 'Астана',
        address: 'пр. Кабанбай батыра, 35, офис 405'
      },
      {
        username: 'Адвокат3 Налоговое',
        email: 'tax3@example.com',
        password: 'password123',
        phone: '+77004445588',
        user_type: 'lawyer',
        specialization: 'Налоговое право',
        experience: 7,
        price_range: '15000-30000 тг',
        bio: 'Консультирую по вопросам налогового законодательства. Представляю интересы клиентов при налоговых проверках и в суде.',
        city: 'Актобе',
        address: 'пр. Абилкайыр хана, 85, офис 304'
      },
      
      // Адвокаты по трудовому праву
      {
        username: 'Адвокат1 Трудовое',
        email: 'labor1@example.com',
        password: 'password123',
        phone: '+77005556677',
        user_type: 'lawyer',
        specialization: 'Трудовое право',
        experience: 10,
        price_range: '15000-25000 тг',
        bio: 'Специализируюсь на защите прав работников. Большой опыт в делах о незаконном увольнении и взыскании задолженности по заработной плате.',
        city: 'Алматы',
        address: 'ул. Толе би, 85, офис 406'
      },
      {
        username: 'Адвокат2 Трудовое',
        email: 'labor2@example.com',
        password: 'password123',
        phone: '+77005556688',
        user_type: 'lawyer',
        specialization: 'Трудовое право',
        experience: 12,
        price_range: '20000-35000 тг',
        bio: 'Консультирую работодателей по вопросам трудового законодательства. Помощь в составлении трудовых договоров и внутренних документов.',
        city: 'Астана',
        address: 'ул. Иманова, 20, офис 303'
      },
      {
        username: 'Адвокат3 Трудовое',
        email: 'labor3@example.com',
        password: 'password123',
        phone: '+77005556699',
        user_type: 'lawyer',
        specialization: 'Трудовое право',
        experience: 8,
        price_range: '10000-20000 тг',
        bio: 'Решаю трудовые споры любой сложности. Защищаю права как работников, так и работодателей. Большой опыт работы с иностранными компаниями.',
        city: 'Караганда',
        address: 'пр. Бухар Жырау, 30, офис 202'
      }
    ];
    
    // Выполним SQL-запросы напрямую для каждого адвоката
    for (const lawyer of lawyers) {
      try {
        // 1. Добавляем запись пользователя
        const userResult = await db.runAsync(
          `INSERT INTO users (username, email, password, phone, user_type) 
           VALUES (?, ?, ?, ?, ?)`,
          [lawyer.username, lawyer.email, lawyer.password, lawyer.phone, lawyer.user_type]
        );
        
        const userId = userResult.lastInsertRowId;
        console.log(`Создан пользователь (ID: ${userId}): ${lawyer.username}`);
        
        // 2. Добавляем запись адвоката с привязкой к пользователю
        await db.runAsync(
          `INSERT INTO lawyers (user_id, specialization, experience, price_range, bio, city, address)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userId, lawyer.specialization, lawyer.experience, lawyer.price_range, 
           lawyer.bio, lawyer.city, lawyer.address]
        );
        
        console.log(`Создан адвокат: ${lawyer.username}, специализация: ${lawyer.specialization}`);
      } catch (error) {
        console.error(`Ошибка при добавлении адвоката ${lawyer.username}:`, error);
      }
    }
    
    console.log('Адвокаты успешно добавлены в базу данных!');
    return { success: true, count: lawyers.length };
    
  } catch (error) {
    console.error('Ошибка при добавлении адвокатов:', error);
    return { success: false, error: error.message || String(error) };
  }
};

// Экспортируем функцию для использования в экранах приложения
export default {
  addLawyersDirectly
}; 
 
 
 