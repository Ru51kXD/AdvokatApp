const { getDatabase, initDatabase } = require('../src/database/database');

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

// Helper function to get random item from array
const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// Helper function to generate random years of experience (3-30)
const getRandomExperience = () => {
  return Math.floor(Math.random() * 28) + 3;
};

// Generate lawyer data
const generateLawyers = () => {
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
  
  return lawyers;
};

// Insert lawyers into the database
const populateLawyers = async () => {
  try {
    // Initialize database first
    await initDatabase();
    console.log('Database initialized successfully');
    
    const lawyers = generateLawyers();
    const db = await getDatabase();
    
    console.log(`Inserting ${lawyers.length} lawyers into the database...`);
    
    for (const lawyer of lawyers) {
      // 1. Insert user record
      const userResult = await db.runAsync(
        `INSERT INTO users (username, email, password, phone, user_type) 
         VALUES (?, ?, ?, ?, ?)`,
        [lawyer.username, lawyer.email, lawyer.password, lawyer.phone, lawyer.user_type]
      );
      
      const userId = userResult.lastInsertRowId;
      
      // 2. Insert lawyer record
      await db.runAsync(
        `INSERT INTO lawyers (user_id, specialization, experience, price_range, bio, city, address)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, lawyer.specialization, lawyer.experience, lawyer.price_range, lawyer.bio, lawyer.city, lawyer.address]
      );
      
      console.log(`Created lawyer: ${lawyer.username}, specialization: ${lawyer.specialization}`);
    }
    
    console.log('Successfully added all lawyers!');
  } catch (error) {
    console.error('Error populating lawyers:', error);
  }
};

// Run the script
populateLawyers().then(() => {
  console.log('Done!');
}).catch(err => {
  console.error('Failed:', err);
}); 