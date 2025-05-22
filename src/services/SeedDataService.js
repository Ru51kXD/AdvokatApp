import {
  createUser,
  createLawyer,
  createReview,
  getUsers,
  getLawyers
} from '../database/database';
import { KAZAKHSTAN_CITIES, LAW_AREAS, PRICE_RANGES } from '../constants';

const SeedDataService = {
  seedData: async () => {
    try {
      console.log('Checking for existing data...');
      
      // Проверяем, есть ли уже данные
      const existingUsers = await getUsers();
      const existingLawyers = await getLawyers();
      
      if (existingUsers.length > 0 && existingLawyers.length > 0) {
        console.log('Data already exists, skipping seed operation');
        return;
      }
      
      console.log('Starting to seed database with test data...');
      
      // Создаем тестовых пользователей
      const users = await SeedDataService.createTestUsers();
      console.log(`Created ${users.length} test users`);
      
      // Создаем тестовых адвокатов
      const lawyers = await SeedDataService.createTestLawyers();
      console.log(`Created ${lawyers.length} test lawyers`);
      
      // Создаем тестовые отзывы
      const reviews = await SeedDataService.createTestReviews(lawyers, users);
      console.log(`Created ${reviews.length} test reviews`);
      
      console.log('Database seeded successfully');
    } catch (error) {
      console.error('Error seeding database:', error);
      throw error;
    }
  },
  
  createTestUsers: async () => {
    const users = [];
    
    // Создаем 10 обычных пользователей
    for (let i = 1; i <= 10; i++) {
      const user = await createUser({
        username: `Клиент ${i}`,
        email: `client${i}@example.com`,
        password: 'password123',
        phone: `+7777${String(1000000 + i).padStart(7, '0')}`,
        user_type: 'client'
      });
      users.push(user);
    }
    
    return users;
  },
  
  createTestLawyers: async () => {
    const lawyers = [];
    const specializations = LAW_AREAS;
    const cities = KAZAKHSTAN_CITIES;
    const priceRanges = PRICE_RANGES;
    
    // Создаем 20 адвокатов с разными специализациями
    for (let i = 1; i <= 20; i++) {
      // Создаем пользователя для адвоката
      const user = await createUser({
        username: `Адвокат ${i}`,
        email: `lawyer${i}@example.com`,
        password: 'password123',
        phone: `+7707${String(1000000 + i).padStart(7, '0')}`,
        user_type: 'lawyer'
      });
      
      // Выбираем случайные значения для полей
      const specialization = specializations[Math.floor(Math.random() * specializations.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const priceRange = priceRanges[Math.floor(Math.random() * priceRanges.length)];
      const experience = Math.floor(Math.random() * 20) + 1; // От 1 до 20 лет
      
      // Создаем профиль адвоката
      const lawyer = await createLawyer({
        user_id: user.id,
        specialization,
        experience,
        price_range: priceRange,
        bio: `Я профессиональный адвокат с опытом работы ${experience} лет в области ${specialization}. Готов помочь вам решить любые юридические вопросы.`,
        city,
        address: `ул. Абая, ${Math.floor(Math.random() * 100) + 1}, офис ${Math.floor(Math.random() * 100) + 1}`,
        avatar: `https://i.pravatar.cc/150?img=${20 + i}`
      });
      
      lawyers.push({
        ...lawyer,
        name: user.username,
        phone: user.phone,
        email: user.email
      });
    }
    
    return lawyers;
  },
  
  createTestReviews: async (lawyers, users) => {
    const reviews = [];
    const reviewTexts = [
      'Отличный специалист, очень помог в моем деле!',
      'Профессиональный подход к решению проблемы.',
      'Рекомендую этого адвоката всем своим знакомым.',
      'Очень грамотный юрист, спасибо за помощь!',
      'Разрешил мою ситуацию быстро и эффективно.',
      'Хороший специалист, но немного затянул сроки.',
      'В целом, доволен результатом работы.',
      'Могло быть и лучше, но в общем нормально.',
      'Не очень понравилась работа, ожидал большего.',
      'Отлично справился с моим делом!'
    ];
    
    // Для каждого адвоката создаем несколько отзывов
    for (const lawyer of lawyers) {
      // От 3 до 7 отзывов для каждого адвоката
      const numReviews = Math.floor(Math.random() * 5) + 3;
      
      for (let i = 0; i < numReviews; i++) {
        // Выбираем случайного клиента из пользователей
        const clientIndex = Math.floor(Math.random() * users.length);
        const client = users[clientIndex];
        
        // Выбираем случайный текст отзыва
        const reviewTextIndex = Math.floor(Math.random() * reviewTexts.length);
        const text = reviewTexts[reviewTextIndex];
        
        // Генерируем рейтинг от 3 до 5
        const rating = Math.floor(Math.random() * 3) + 3;
        
        // Создаем отзыв
        const review = await createReview({
          lawyer_id: lawyer.id,
          reviewer_id: client.id,
          reviewer_name: client.username,
          rating,
          text
        });
        
        reviews.push(review);
      }
    }
    
    return reviews;
  }
};

export default SeedDataService; 