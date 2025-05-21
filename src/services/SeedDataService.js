import { db, getDatabase } from '../database/database';

export const SeedDataService = {
  seedData: async () => {
    try {
      console.log('Starting to seed database...');
      const database = await getDatabase();
      
      // Проверка, существуют ли уже данные
      const result = await database.getAllAsync('SELECT COUNT(*) as count FROM users');
      const existingCount = result[0].count;
      
      if (existingCount > 0) {
        console.log('Database already has data, skipping seed operation');
        return;
      }
      
      // Создание пользователей: клиентов и адвокатов
      await seedUsers();
      
      // Создание профилей адвокатов
      await seedLawyers();
      
      // Создание отзывов
      await seedReviews();
      
      // Создание заявок от клиентов
      await seedRequests();
      
      // Создание откликов на заявки
      await seedResponses();
      
      // Создание чатов и сообщений
      await seedChats();
      
      console.log('Database seeded successfully');
    } catch (error) {
      console.error('Error seeding database:', error);
      throw error;
    }
  },
};

// Вспомогательные функции для заполнения данных
const seedUsers = async () => {
  console.log('Seeding users...');
  
  try {
    const users = [
      // Клиенты
      { 
        username: 'Айнур Сатпаев', 
        email: 'ainur@example.com', 
        password: 'password123', 
        phone: '+7 707 123 4567', 
        user_type: 'client'
      },
      { 
        username: 'Динара Касымова', 
        email: 'dinara@example.com', 
        password: 'password123', 
        phone: '+7 707 987 6543', 
        user_type: 'client'
      },
      { 
        username: 'Бауыржан Оспанов', 
        email: 'bauyrzhan@example.com', 
        password: 'password123', 
        phone: '+7 701 555 7777', 
        user_type: 'client'
      },
      
      // Адвокаты - Уголовное право
      { 
        username: 'Асхат Нуржанов', 
        email: 'askhat@example.com', 
        password: 'password123', 
        phone: '+7 702 333 1111', 
        user_type: 'lawyer'
      },
      { 
        username: 'Ержан Касымбеков', 
        email: 'yerzhan@example.com', 
        password: 'password123', 
        phone: '+7 777 111 0000', 
        user_type: 'lawyer'
      },
      { 
        username: 'Серик Алимжанов', 
        email: 'serik@example.com', 
        password: 'password123', 
        phone: '+7 707 222 3344', 
        user_type: 'lawyer'
      },
      
      // Адвокаты - Семейное право
      { 
        username: 'Гульнара Сарсенова', 
        email: 'gulnara@example.com', 
        password: 'password123', 
        phone: '+7 777 444 5555', 
        user_type: 'lawyer'
      },
      { 
        username: 'Жанар Тулегенова', 
        email: 'zhanar@example.com', 
        password: 'password123', 
        phone: '+7 708 444 1212', 
        user_type: 'lawyer'
      },
      { 
        username: 'Айгуль Кенжебаева', 
        email: 'aigul@example.com', 
        password: 'password123', 
        phone: '+7 747 456 7890', 
        user_type: 'lawyer'
      },
      
      // Адвокаты - Гражданское право
      { 
        username: 'Даулет Исламов', 
        email: 'daulet@example.com', 
        password: 'password123', 
        phone: '+7 705 888 9999', 
        user_type: 'lawyer'
      },
      { 
        username: 'Алия Бекова', 
        email: 'aliya@example.com', 
        password: 'password123', 
        phone: '+7 701 222 3333', 
        user_type: 'lawyer'
      },
      { 
        username: 'Руслан Ахметов', 
        email: 'ruslan@example.com', 
        password: 'password123', 
        phone: '+7 702 777 8888', 
        user_type: 'lawyer'
      },
      
      // Адвокаты - Налоговое право
      { 
        username: 'Тимур Сагатов', 
        email: 'timur@example.com', 
        password: 'password123', 
        phone: '+7 707 123 7890', 
        user_type: 'lawyer'
      },
      { 
        username: 'Диана Нурлыбаева', 
        email: 'diana@example.com', 
        password: 'password123', 
        phone: '+7 708 222 1234', 
        user_type: 'lawyer'
      },
      { 
        username: 'Арман Калиев', 
        email: 'arman@example.com', 
        password: 'password123', 
        phone: '+7 701 456 2345', 
        user_type: 'lawyer'
      },
      
      // Адвокаты - Трудовое право
      { 
        username: 'Максат Жумагулов', 
        email: 'maksat@example.com', 
        password: 'password123', 
        phone: '+7 777 555 6677', 
        user_type: 'lawyer'
      },
      { 
        username: 'Сауле Касенова', 
        email: 'saule@example.com', 
        password: 'password123', 
        phone: '+7 747 333 2211', 
        user_type: 'lawyer'
      },
      { 
        username: 'Ержан Тулеутаев', 
        email: 'erzhan.t@example.com', 
        password: 'password123', 
        phone: '+7 702 444 5566', 
        user_type: 'lawyer'
      },
    ];
    
    const database = await getDatabase();
    
    for (const user of users) {
      await database.runAsync(
        `INSERT INTO users (username, email, password, phone, user_type) VALUES (?, ?, ?, ?, ?)`,
        [user.username, user.email, user.password, user.phone, user.user_type]
      );
    }
    
    console.log(`Added ${users.length} users`);
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};

const seedLawyers = async () => {
  console.log('Seeding lawyers...');
  
  try {
    const database = await getDatabase();
    
    // Получаем пользователей-адвокатов
    const lawyerUsers = await database.getAllAsync(
      `SELECT id FROM users WHERE user_type = 'lawyer'`
    );
    
    const lawyerProfiles = [
      // Уголовное право - 3 адвоката
      {
        specialization: 'Уголовное право',
        experience: 15,
        price_range: '30000-50000 ₸',
        bio: 'Адвокат с обширным опытом ведения уголовных дел. Специализируюсь на защите прав обвиняемых в уголовном процессе. Бывший прокурор с глубокими знаниями уголовно-процессуального законодательства РК.',
        city: 'Алматы',
        address: 'ул. Толе би, 101, офис 309',
        rating: 4.8
      },
      {
        specialization: 'Уголовное право',
        experience: 10,
        price_range: '25000-45000 ₸',
        bio: 'Специализируюсь на сложных уголовных делах, включая экономические преступления и должностные правонарушения. Имею опыт успешной защиты клиентов в суде присяжных.',
        city: 'Астана',
        address: 'пр. Кабанбай батыра, 53, БЦ "Орион", офис 204',
        rating: 4.5
      },
      {
        specialization: 'Уголовное право',
        experience: 8,
        price_range: '20000-40000 ₸',
        bio: 'Специализируюсь на защите по делам о наркотиках, мошенничестве и кражах. Оказываю юридическую помощь на всех стадиях уголовного процесса, от задержания до кассационного обжалования.',
        city: 'Шымкент',
        address: 'ул. Байтурсынова, 18, офис 45',
        rating: 4.3
      },
      
      // Семейное право - 3 адвоката
      {
        specialization: 'Семейное право',
        experience: 12,
        price_range: '15000-30000 ₸',
        bio: 'Специализируюсь на бракоразводных процессах, вопросах опеки над детьми и разделе имущества. Всегда нахожу компромиссное решение даже в самых сложных семейных спорах.',
        city: 'Астана',
        address: 'пр. Республики 58, БЦ "Центральный", офис 505',
        rating: 4.9
      },
      {
        specialization: 'Семейное право',
        experience: 9,
        price_range: '15000-25000 ₸',
        bio: 'Помогаю в решении всех вопросов семейного права: развод, алименты, раздел имущества, определение места жительства детей. Особый подход к каждому клиенту и его ситуации.',
        city: 'Караганда',
        address: 'ул. Ержанова, 18, офис 203',
        rating: 4.7
      },
      {
        specialization: 'Семейное право',
        experience: 7,
        price_range: '12000-22000 ₸',
        bio: 'Специализируюсь на защите интересов женщин и детей в семейных спорах. Имею опыт работы с международными семейными делами, включая споры о детях с иностранным элементом.',
        city: 'Алматы',
        address: 'ул. Фурманова, 248, офис 401',
        rating: 4.6
      },
      
      // Гражданское право - 3 адвоката
      {
        specialization: 'Гражданское право',
        experience: 14,
        price_range: '20000-40000 ₸',
        bio: 'Адвокат с опытом работы в сфере защиты прав потребителей, жилищных споров и имущественных отношений. Более 100 успешно разрешенных дел, связанных с договорными спорами.',
        city: 'Алматы',
        address: 'ул. Абылай хана 15, БЦ "Империя", офис 710',
        rating: 4.7
      },
      {
        specialization: 'Гражданское право',
        experience: 9,
        price_range: '18000-35000 ₸',
        bio: 'Специалист по делам о защите чести, достоинства и деловой репутации, а также по спорам в сфере недвижимости. Опыт успешной работы в арбитражных судах различных инстанций.',
        city: 'Актобе',
        address: 'пр. Абилкайыр хана, 85, офис 222',
        rating: 4.4
      },
      {
        specialization: 'Гражданское право',
        experience: 11,
        price_range: '20000-38000 ₸',
        bio: 'Профессиональный юрист с большим опытом в гражданском праве. Специализируюсь на делах о взыскании задолженности, страховых спорах и возмещении вреда здоровью.',
        city: 'Павлодар',
        address: 'ул. Лермонтова, 90, офис 415',
        rating: 4.5
      },
      
      // Налоговое право - 3 адвоката
      {
        specialization: 'Налоговое право',
        experience: 10,
        price_range: '25000-60000 ₸',
        bio: 'Бывший сотрудник налоговой службы РК. Помогаю клиентам в спорах с налоговыми органами, консультирую по оптимизации налогообложения и представляю интересы в судах по налоговым делам.',
        city: 'Астана',
        address: 'ул. Сыганак 25, БЦ "Евразия", офис 210',
        rating: 4.9
      },
      {
        specialization: 'Налоговое право',
        experience: 8,
        price_range: '20000-50000 ₸',
        bio: 'Специалист по налоговому планированию и консультированию. Помогаю снизить налоговые риски и оптимизировать налоговую нагрузку законными методами. Опыт успешного представления интересов клиентов в налоговых спорах.',
        city: 'Алматы',
        address: 'пр. Достык, 180, БЦ "Коктем", офис 508',
        rating: 4.6
      },
      {
        specialization: 'Налоговое право',
        experience: 12,
        price_range: '30000-70000 ₸',
        bio: 'Эксперт в области международного налогообложения и двойного налогообложения. Помогаю компаниям и частным лицам с налоговым планированием, аудитом и разрешением налоговых споров.',
        city: 'Атырау',
        address: 'ул. Сатпаева, 19А, офис 301',
        rating: 4.8
      },
      
      // Трудовое право - 3 адвоката
      {
        specialization: 'Трудовое право',
        experience: 8,
        price_range: '10000-25000 ₸',
        bio: 'Специализируюсь на защите прав работников, разрешении трудовых споров, взыскании задолженностей по заработной плате и восстановлении на работе. Помогаю составить трудовые договоры и внутренние документы для работодателей.',
        city: 'Шымкент',
        address: 'ул. Тауке хана 5, офис 12',
        rating: 4.5
      },
      {
        specialization: 'Трудовое право',
        experience: 6,
        price_range: '8000-20000 ₸',
        bio: 'Предоставляю полный спектр услуг в области трудового права как для работодателей, так и для сотрудников. Большой опыт в урегулировании коллективных трудовых споров и конфликтов.',
        city: 'Усть-Каменогорск',
        address: 'пр. Победы, 6, офис 203',
        rating: 4.2
      },
      {
        specialization: 'Трудовое право',
        experience: 9,
        price_range: '12000-28000 ₸',
        bio: 'Эксперт в области трудового законодательства РК. Консультирую по вопросам охраны труда, помогаю при незаконных увольнениях и дискриминации на рабочем месте. Имею опыт работы с международными компаниями.',
        city: 'Астана',
        address: 'ул. Кунаева, 33, офис 607',
        rating: 4.7
      },
    ];
    
    // Назначаем каждому адвокату соответствующий профиль по специализации
    for (let i = 0; i < lawyerUsers.length; i++) {
      // Определяем специализацию на основе индекса
      // 0-2: Уголовное право, 3-5: Семейное право, 6-8: Гражданское право, 9-11: Налоговое право, 12-14: Трудовое право
      const profileIndex = Math.floor(i / 3) < 5 ? Math.floor(i / 3) * 3 + (i % 3) : i % lawyerProfiles.length;
      const profile = lawyerProfiles[profileIndex];
      
      await database.runAsync(
        `INSERT INTO lawyers (user_id, specialization, experience, price_range, bio, rating, city, address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [lawyerUsers[i].id, profile.specialization, profile.experience, profile.price_range, profile.bio, profile.rating, profile.city, profile.address]
      );
    }
    
    console.log(`Added ${lawyerUsers.length} lawyer profiles`);
  } catch (error) {
    console.error('Error seeding lawyers:', error);
    throw error;
  }
};

const seedReviews = async () => {
  console.log('Seeding reviews...');
  
  try {
    const database = await getDatabase();
    
    // Получаем адвокатов
    const lawyers = await database.getAllAsync(`SELECT id FROM lawyers`);
    
    // Получаем клиентов
    const clients = await database.getAllAsync(`SELECT id FROM users WHERE user_type = 'client'`);
    
    const reviewsData = [
      {
        rating: 5,
        comment: 'Отличный юрист! Помог мне выиграть сложное дело по разделу имущества. Всегда на связи, подробно объясняет все юридические нюансы.'
      },
      {
        rating: 4,
        comment: 'Хороший специалист, грамотно защитил мои права в суде. Единственный минус - иногда приходилось долго ждать ответа.'
      },
      {
        rating: 5,
        comment: 'Очень благодарна за профессиональную помощь в решении моего жилищного вопроса. Подход к делу был очень тщательный и внимательный.'
      },
      {
        rating: 3,
        comment: 'В целом неплохо, но цена услуг оказалась выше, чем изначально обговаривалось. Дело было решено, но осадок остался.'
      },
      {
        rating: 4,
        comment: 'Консультация была очень полезной, получил четкий план действий по своему вопросу. Буду обращаться снова.'
      },
      {
        rating: 5,
        comment: 'Исключительно профессиональный подход! Адвокат быстро вник в суть проблемы и нашел оптимальное решение. Рекомендую!'
      },
    ];
    
    // Добавляем по несколько отзывов для каждого адвоката
    for (const lawyer of lawyers) {
      // Случайное количество отзывов для каждого адвоката
      const reviewCount = Math.floor(Math.random() * 4) + 2;
      
      for (let i = 0; i < reviewCount; i++) {
        // Берем случайного клиента
        const client = clients[Math.floor(Math.random() * clients.length)];
        // Берем случайный отзыв
        const review = reviewsData[Math.floor(Math.random() * reviewsData.length)];
        
        await database.runAsync(
          `INSERT INTO reviews (lawyer_id, client_id, rating, comment)
           VALUES (?, ?, ?, ?)`,
          [lawyer.id, client.id, review.rating, review.comment]
        );
      }
    }
    
    console.log('Added reviews for lawyers');
  } catch (error) {
    console.error('Error seeding reviews:', error);
    throw error;
  }
};

const seedRequests = async () => {
  console.log('Seeding client requests...');
  
  try {
    const database = await getDatabase();
    
    // Получаем клиентов
    const clients = await database.getAllAsync(`SELECT id FROM users WHERE user_type = 'client'`);
    
    const requestsData = [
      {
        title: 'Помощь в обжаловании штрафа',
        description: 'Получил штраф за парковку, считаю что неправомерно. Нужна помощь в обжаловании. Инспектор не составил протокол по всем правилам, есть основания для отмены. Штраф получен 15.05.2023 в размере 15000 тенге.',
        law_area: 'Административное право',
        price_range: '10000-15000 ₸',
        experience_required: 2,
        status: 'open'
      },
      {
        title: 'Консультация по бракоразводному процессу',
        description: 'Планирую развод, нужна консультация по разделу имущества и определению места жительства ребенка. В браке 7 лет, есть двое несовершеннолетних детей (4 и 6 лет). Имеется совместно нажитая квартира в ипотеке и автомобиль.',
        law_area: 'Семейное право',
        price_range: '15000-20000 ₸',
        experience_required: 5,
        status: 'open'
      },
      {
        title: 'Взыскание долга с контрагента',
        description: 'Контрагент не выплатил сумму по договору в размере 1,2 млн тенге. Нужна помощь во взыскании. Договор был заключен в письменной форме 10.01.2023. Срок исполнения обязательств истек 10.04.2023. Все документы и доказательства имеются.',
        law_area: 'Гражданское право',
        price_range: '25000-40000 ₸',
        experience_required: 3,
        status: 'open'
      },
      {
        title: 'Помощь с оформлением наследства',
        description: 'Требуется помощь в оформлении наследства после смерти родственника. Есть другие претенденты. Наследство включает квартиру, дачный участок и банковские счета. Дата смерти наследодателя - 3 месяца назад.',
        law_area: 'Наследственное право',
        price_range: '20000-30000 ₸',
        experience_required: 4,
        status: 'open'
      },
      {
        title: 'Консультация по налоговым вычетам',
        description: 'Нужна консультация по возможности получения налоговых вычетов при покупке жилья. Квартира приобретена в ипотеку в январе 2023 года. Интересуют все возможные способы налоговой оптимизации и возврата подоходного налога.',
        law_area: 'Налоговое право',
        price_range: '15000-25000 ₸',
        experience_required: 3,
        status: 'pending'
      },
      {
        title: 'Защита по делу о ДТП',
        description: 'Попал в ДТП, нужен адвокат для представления интересов в суде. Есть видеозаписи и показания свидетелей. ДТП произошло на перекрестке, другой водитель проехал на красный свет. В результате аварии есть пострадавшие с легкими телесными повреждениями.',
        law_area: 'Уголовное право',
        price_range: '40000-60000 ₸',
        experience_required: 7,
        status: 'accepted'
      },
      {
        title: 'Регистрация товарного знака',
        description: 'Необходима помощь в регистрации товарного знака для новой линейки косметических продуктов. Компания работает на рынке уже 3 года. Нужна проверка на возможные конфликты с существующими брендами и полное сопровождение процесса регистрации.',
        law_area: 'Интеллектуальная собственность',
        price_range: '25000-50000 ₸',
        experience_required: 4,
        status: 'open'
      },
      {
        title: 'Консультация по трудовому спору',
        description: 'Работодатель уволил без соблюдения процедуры и выплаты компенсации. Необходима консультация о возможности восстановления на работе и получения компенсации. Стаж работы в компании 4 года, должность - менеджер по продажам.',
        law_area: 'Трудовое право',
        price_range: '15000-30000 ₸',
        experience_required: 3,
        status: 'open'
      },
      {
        title: 'Юридическое сопровождение сделки с недвижимостью',
        description: 'Планирую покупку коммерческой недвижимости, требуется полная юридическая проверка объекта и сопровождение сделки. Бюджет сделки - около 50 млн тенге. Объект представляет собой помещение на первом этаже жилого дома, используемое как магазин.',
        law_area: 'Гражданское право',
        price_range: '30000-50000 ₸',
        experience_required: 5,
        status: 'open'
      },
      {
        title: 'Обжалование решения банка по кредиту',
        description: 'Банк увеличил процентную ставку по кредиту в одностороннем порядке. Нужна помощь в обжаловании этого решения. Кредит получен 2 года назад под 13%, сейчас банк поднял ставку до 16%, ссылаясь на пункт договора об изменении условий.',
        law_area: 'Гражданское право',
        price_range: '20000-35000 ₸',
        experience_required: 4,
        status: 'open'
      }
    ];
    
    // Добавляем по несколько заявок для каждого клиента
    for (const client of clients) {
      // Случайное количество заявок для каждого клиента
      const requestCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < requestCount; i++) {
        // Берем случайную заявку
        const request = requestsData[Math.floor(Math.random() * requestsData.length)];
        
        await database.runAsync(
          `INSERT INTO requests (client_id, title, description, law_area, price_range, experience_required, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [client.id, request.title, request.description, request.law_area, request.price_range, request.experience_required, request.status]
        );
      }
    }
    
    console.log('Added client requests');
  } catch (error) {
    console.error('Error seeding requests:', error);
    throw error;
  }
};

const seedResponses = async () => {
  console.log('Seeding lawyer responses...');
  
  try {
    const database = await getDatabase();
    
    // Получаем открытые заявки
    const requests = await database.getAllAsync(
      `SELECT id FROM requests WHERE status IN ('open', 'pending')`
    );
    
    // Получаем адвокатов
    const lawyers = await database.getAllAsync(`SELECT id FROM lawyers`);
    
    const responseMessages = [
      'Здравствуйте! Готов(а) взяться за Ваше дело. Имею богатый опыт в подобных ситуациях. Давайте обсудим детали? Я уже работал с подобными случаями и знаю, как добиться положительного результата.',
      'Добрый день! Ознакомился(ась) с Вашей заявкой. Могу помочь решить Вашу проблему в кратчайшие сроки. Свяжитесь со мной для обсуждения деталей. Моя специализация как раз включает подобные вопросы.',
      'Приветствую! Специализируюсь именно на таких делах. Предлагаю первую консультацию бесплатно, чтобы детально обсудить стратегию. У меня большой опыт ведения аналогичных дел с положительным исходом.',
      'Здравствуйте! Заинтересован(а) в сотрудничестве по Вашему вопросу. Могу предложить несколько решений, давайте обсудим? Я специализируюсь на этой отрасли права уже много лет и знаю все нюансы.',
      'Добрый день! Имею положительный опыт в решении подобных вопросов. Могу предложить оптимальное соотношение цены и качества услуг. Предлагаю встретиться для первичной консультации и обсуждения стратегии ведения дела.'
    ];
    
    // Для каждой открытой заявки добавляем несколько откликов от адвокатов
    for (const request of requests) {
      // Определяем случайное количество откликов (1-3)
      const responseCount = Math.floor(Math.random() * 3) + 1;
      
      // Выбираем случайных адвокатов для откликов
      const selectedLawyers = [];
      while (selectedLawyers.length < responseCount && selectedLawyers.length < lawyers.length) {
        const randomIndex = Math.floor(Math.random() * lawyers.length);
        const lawyerId = lawyers[randomIndex].id;
        
        if (!selectedLawyers.includes(lawyerId)) {
          selectedLawyers.push(lawyerId);
          
          // Выбираем случайное сообщение
          const message = responseMessages[Math.floor(Math.random() * responseMessages.length)];
          
          await database.runAsync(
            `INSERT INTO responses (request_id, lawyer_id, message, status)
             VALUES (?, ?, ?, ?)`,
            [request.id, lawyerId, message, 'pending']
          );
        }
      }
    }
    
    console.log('Added lawyer responses');
  } catch (error) {
    console.error('Error seeding responses:', error);
    throw error;
  }
};

const seedChats = async () => {
  console.log('Seeding chats and messages...');
  
  try {
    const database = await getDatabase();
    
    // Получаем клиентов
    const clients = await database.getAllAsync(`SELECT id FROM users WHERE user_type = 'client'`);
    
    // Получаем адвокатов
    const lawyerUsers = await database.getAllAsync(`
      SELECT u.id, l.id as lawyer_id 
      FROM users u
      JOIN lawyers l ON u.id = l.user_id
      WHERE u.user_type = 'lawyer'
    `);
    
    // Получаем отклики на заявки
    const responses = await database.getAllAsync(`
      SELECT r.id, r.lawyer_id, r.request_id, r.message, req.client_id
      FROM responses r
      JOIN requests req ON r.request_id = req.id
      LIMIT 5
    `);
    
    // Создаем беседы и сообщения на основе откликов
    for (const response of responses) {
      // Находим пользователя-адвоката по ID адвоката
      const lawyerUser = lawyerUsers.find(l => l.lawyer_id === response.lawyer_id);
      
      if (!lawyerUser) continue;
      
      // Создаем первое сообщение от адвоката
      const messageResult = await database.runAsync(`
        INSERT INTO chat_messages (sender_id, receiver_id, request_id, message, read, created_at)
        VALUES (?, ?, ?, ?, 0, datetime('now', '-3 days'))
      `, [lawyerUser.id, response.client_id, response.request_id, response.message]);
      
      const messageId = messageResult.lastInsertRowId;
      
      // Создаем беседу
      const conversationResult = await database.runAsync(`
        INSERT INTO chat_conversations (client_id, lawyer_id, request_id, last_message_id, unread_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, datetime('now', '-3 days'), datetime('now', '-3 days'))
      `, [response.client_id, lawyerUser.id, response.request_id, messageId]);
      
      const conversationId = conversationResult.lastInsertRowId;
      
      // Добавляем ответ клиента
      const clientResponses = [
        'Спасибо за отклик! Меня интересует ваш опыт в подобных делах. Можете рассказать о предыдущих кейсах?',
        'Здравствуйте! Какие документы мне нужно подготовить для первой консультации?',
        'Добрый день! Сколько примерно времени займет решение моего вопроса?',
        'Спасибо за ответ! У вас есть возможность для встречи на этой неделе?',
        'Здравствуйте! Какова вероятность положительного решения по моему делу?'
      ];
      
      const clientResponse = clientResponses[Math.floor(Math.random() * clientResponses.length)];
      
      const clientMessageResult = await database.runAsync(`
        INSERT INTO chat_messages (sender_id, receiver_id, request_id, message, read, created_at)
        VALUES (?, ?, ?, ?, 0, datetime('now', '-2 days'))
      `, [response.client_id, lawyerUser.id, response.request_id, clientResponse]);
      
      const clientMessageId = clientMessageResult.lastInsertRowId;
      
      // Обновляем беседу с новым сообщением
      await database.runAsync(`
        UPDATE chat_conversations
        SET last_message_id = ?,
            unread_count = 1,
            updated_at = datetime('now', '-2 days')
        WHERE id = ?
      `, [clientMessageId, conversationId]);
      
      // Добавляем второе сообщение от адвоката
      const lawyerSecondResponses = [
        'С удовольствием расскажу о моем опыте! За последние 3 года я успешно вел более 30 подобных дел. В 85% случаев мы добились положительного результата. Могу прислать вам примеры без указания личных данных клиентов.',
        'Для первой консультации вам понадобятся: документ, удостоверяющий личность, документы, имеющие отношение к вашему делу (договоры, переписка, квитанции и т.д.). Я проведу предварительный анализ и составлю план действий.',
        'Срок решения зависит от сложности дела и загруженности судов. По моему опыту, подобные вопросы обычно решаются в течение 2-3 месяцев. Я сделаю все возможное, чтобы ускорить процесс.',
        'Да, у меня есть свободное время для встречи. Могу предложить четверг в 15:00 или пятницу в 10:00. Что вам больше подходит?',
        'Исходя из представленной информации и моего опыта, вероятность положительного исхода достаточно высока - около 75%. Но для более точной оценки мне нужно ознакомиться со всеми документами и деталями.'
      ];
      
      const lawyerResponse = lawyerSecondResponses[Math.floor(Math.random() * lawyerSecondResponses.length)];
      
      const lawyerSecondMessageResult = await database.runAsync(`
        INSERT INTO chat_messages (sender_id, receiver_id, request_id, message, read, created_at)
        VALUES (?, ?, ?, ?, 0, datetime('now', '-1 day'))
      `, [lawyerUser.id, response.client_id, response.request_id, lawyerResponse]);
      
      const lawyerSecondMessageId = lawyerSecondMessageResult.lastInsertRowId;
      
      // Обновляем беседу с новым сообщением
      await database.runAsync(`
        UPDATE chat_conversations
        SET last_message_id = ?,
            unread_count = 1,
            updated_at = datetime('now', '-1 day')
        WHERE id = ?
      `, [lawyerSecondMessageId, conversationId]);
    }
    
    // Создаем дополнительные случайные беседы между клиентами и адвокатами
    const chatMessages = [
      'Здравствуйте! У меня есть вопрос по вашей специализации.',
      'Добрый день! Можно узнать о вашем опыте работы в этой сфере?',
      'Приветствую! Нужна консультация по конкретному вопросу.',
      'Здравствуйте! Интересуют ваши услуги и стоимость консультации.',
      'Добрый день! Подскажите, работаете ли вы с подобными делами?'
    ];
    
    // Создаем несколько бесед без привязки к заявкам
    for (let i = 0; i < 3; i++) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const lawyerUser = lawyerUsers[Math.floor(Math.random() * lawyerUsers.length)];
      
      // Выбираем сообщение для начала беседы
      const message = chatMessages[Math.floor(Math.random() * chatMessages.length)];
      
      // Создаем первое сообщение от клиента
      const messageResult = await database.runAsync(`
        INSERT INTO chat_messages (sender_id, receiver_id, message, read, created_at)
        VALUES (?, ?, ?, 0, datetime('now', '-' || ? || ' hours'))
      `, [client.id, lawyerUser.id, message, Math.floor(Math.random() * 72)]);
      
      const messageId = messageResult.lastInsertRowId;
      
      // Создаем беседу
      await database.runAsync(`
        INSERT INTO chat_conversations (client_id, lawyer_id, last_message_id, unread_count, created_at, updated_at)
        VALUES (?, ?, ?, 1, datetime('now', '-' || ? || ' hours'), datetime('now', '-' || ? || ' hours'))
      `, [client.id, lawyerUser.id, messageId, Math.floor(Math.random() * 72), Math.floor(Math.random() * 72)]);
    }
    
    console.log('Added chats and messages');
  } catch (error) {
    console.error('Error seeding chats:', error);
    throw error;
  }
};

export default SeedDataService; 