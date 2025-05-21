import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { LawyerService } from '../../services/LawyerService';
import { showTableContents, executeQuery, getDatabase } from '../../database/database';

const AdminScreen = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [lawyers, setLawyers] = useState([]);

  useEffect(() => {
    checkLawyers();
  }, []);

  const checkLawyers = async () => {
    try {
      setMessage('Проверяем адвокатов в базе...');
      const result = await executeQuery('SELECT COUNT(*) as count FROM lawyers');
      const count = result[0]?.count || 0;
      setMessage(`В базе данных ${count} адвокатов`);
      
      if (count > 0) {
        const lawyersData = await executeQuery(`
          SELECT l.id, l.specialization, u.username 
          FROM lawyers l 
          JOIN users u ON l.user_id = u.id 
          LIMIT 20
        `);
        setLawyers(lawyersData);
      }
    } catch (error) {
      console.error('Error checking lawyers:', error);
      setMessage(`Ошибка при проверке: ${error.message || error}`);
    }
  };

  const populateLawyers = async () => {
    try {
      setLoading(true);
      setMessage('Создаем адвокатов...');
      
      const result = await LawyerService.populateLawyerData();
      
      if (result.success) {
        setMessage(`Успешно создано ${result.count} адвокатов!`);
        Alert.alert('Успех', `Создано ${result.count} адвокатов`);
        
        // Show the lawyers table content for debugging
        await showTableContents('lawyers');
        await checkLawyers();
      } else {
        setMessage('Ошибка при создании адвокатов');
        Alert.alert('Ошибка', 'Не удалось создать адвокатов');
      }
    } catch (error) {
      console.error('Error populating lawyers:', error);
      setMessage(`Ошибка: ${error.message || error}`);
      Alert.alert('Ошибка', `Не удалось создать адвокатов: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  // Функция для прямого добавления адвокатов в базу данных
  const addLawyersDirectly = async () => {
    try {
      setLoading(true);
      setMessage('Напрямую добавляем адвокатов в базу данных...');
      
      const db = await getDatabase();
      
      // Список адвокатов для каждой категории
      const lawyers = [
        // Адвокаты по уголовному праву
        {
          username: 'Адвокат1 Уголовное',
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
          email: 'criminal3@example.com',
          password: 'password123',
          phone: '+77001112255',
          user_type: 'lawyer',
          specialization: 'Уголовное право',
          experience: 8,
          price_range: '10000-25000 тг',
          bio: 'Молодой и энергичный адвокат. Специализация на экономических преступлениях и киберпреступности.',
          city: 'Караганда',
          address: 'ул. Гоголя, 15, офис 205'
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

      let successCount = 0;
      
      // Используем последовательное выполнение запросов вместо транзакции
      try {
        // Начинаем транзакцию вручную
        await executeQuery('BEGIN TRANSACTION');
        
        // Добавляем адвокатов последовательно
        for (const lawyer of lawyers) {
          try {
            // 1. Добавляем пользователя
            const userResult = await executeQuery(
              `INSERT INTO users (username, email, password, phone, user_type) 
               VALUES (?, ?, ?, ?, ?)`,
              [lawyer.username, lawyer.email, lawyer.password, lawyer.phone, lawyer.user_type]
            );
            
            // Получаем ID вставленного пользователя
            const userRows = await executeQuery('SELECT last_insert_rowid() as id');
            const userId = userRows[0].id;
            
            console.log(`Создан пользователь (ID: ${userId}): ${lawyer.username}`);
            
            // 2. Добавляем запись адвоката
            await executeQuery(
              `INSERT INTO lawyers (user_id, specialization, experience, price_range, bio, city, address)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [userId, lawyer.specialization, lawyer.experience, lawyer.price_range, 
               lawyer.bio, lawyer.city, lawyer.address]
            );
            
            successCount++;
            console.log(`Создан адвокат: ${lawyer.username}, специализация: ${lawyer.specialization}`);
          } catch (err) {
            console.error(`Ошибка при создании адвоката ${lawyer.username}:`, err);
          }
        }
        
        // Завершаем транзакцию
        await executeQuery('COMMIT');
        
        setMessage(`Успешно добавлено ${successCount} адвокатов!`);
        Alert.alert('Успех', `Добавлено ${successCount} адвокатов`);
      } catch (error) {
        // Откатываем транзакцию в случае ошибки
        await executeQuery('ROLLBACK');
        throw error;
      }
      
      checkLawyers();
    } catch (error) {
      console.error('Ошибка при добавлении адвокатов:', error);
      setMessage(`Ошибка: ${error.message || error}`);
      Alert.alert('Ошибка', `Не удалось добавить адвокатов: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Панель администратора</Text>
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>{message}</Text>
        </View>
      )}
      
      {!loading && message ? (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.button}
        onPress={addLawyersDirectly}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Добавить адвокатов (прямой метод)</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#4a7ba7' }]}
        onPress={populateLawyers}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Создать адвокатов (стандартный метод)</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={checkLawyers}
        disabled={loading}
      >
        <Text style={styles.secondaryButtonText}>Проверить адвокатов в базе</Text>
      </TouchableOpacity>
      
      {lawyers.length > 0 && (
        <View style={styles.lawyersContainer}>
          <Text style={styles.subtitle}>Список адвокатов:</Text>
          {lawyers.map((lawyer, index) => (
            <View key={lawyer.id} style={styles.lawyerItem}>
              <Text style={styles.lawyerText}>
                {index + 1}. {lawyer.username} - {lawyer.specialization}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#0066cc',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#0066cc',
  },
  secondaryButtonText: {
    color: '#0066cc',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  messageContainer: {
    padding: 15,
    backgroundColor: '#e6f7ff',
    borderRadius: 10,
    marginBottom: 20,
  },
  messageText: {
    fontSize: 16,
  },
  lawyersContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  lawyerItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lawyerText: {
    fontSize: 14,
  },
});

export default AdminScreen; 
 