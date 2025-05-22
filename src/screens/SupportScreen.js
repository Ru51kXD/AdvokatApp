import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const FAQData = [
  {
    id: '1',
    question: 'Как зарегистрироваться в качестве адвоката?',
    answer: 'Для регистрации в качестве адвоката необходимо пройти процедуру регистрации через приложение, указав лицензионные данные и загрузив необходимые документы для верификации.'
  },
  {
    id: '2',
    question: 'Как изменить данные профиля?',
    answer: 'Вы можете изменить данные профиля в разделе "Настройки профиля". Некоторые изменения могут потребовать повторной верификации вашего аккаунта.'
  },
  {
    id: '3',
    question: 'Как выводить средства?',
    answer: 'Для вывода средств необходимо указать банковские реквизиты в соответствующем разделе. Выплаты происходят еженедельно при накоплении минимальной суммы.'
  },
  {
    id: '4',
    question: 'Что делать, если я забыл пароль?',
    answer: 'На странице входа в приложение нажмите "Забыли пароль?" и следуйте инструкциям для восстановления доступа.'
  },
  {
    id: '5',
    question: 'Как получать больше заявок от клиентов?',
    answer: 'Заполните профиль полностью, укажите специализацию, опыт работы и достижения. Старайтесь быстро отвечать на заявки и поддерживать высокий рейтинг.'
  },
  {
    id: '6',
    question: 'Какая комиссия взимается с юристов?',
    answer: 'Комиссия составляет 10% от суммы оплаты услуг. Она автоматически удерживается при получении оплаты от клиента.'
  },
];

const SupportScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('contact');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const validateForm = () => {
    if (!subject.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, укажите тему обращения');
      return false;
    }
    if (!message.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, введите текст сообщения');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Ошибка', 'Пожалуйста, введите корректный email для обратной связи');
      return false;
    }
    return true;
  };

  const handleSendMessage = () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    // Имитация отправки сообщения
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Сообщение отправлено', 
        'Спасибо за обращение! Наши специалисты ответят вам в течение 24 часов.',
        [{ text: 'OK', onPress: () => {
          setSubject('');
          setMessage('');
        }}]
      );
    }, 1500);
  };

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const renderFAQItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.faqItem}
      onPress={() => toggleFAQ(item.id)}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{item.question}</Text>
        <Ionicons 
          name={expandedFAQ === item.id ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={COLORS.textSecondary} 
        />
      </View>
      
      {expandedFAQ === item.id && (
        <Text style={styles.faqAnswer}>{item.answer}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Поддержка</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'contact' && styles.activeTab]}
          onPress={() => setActiveTab('contact')}
        >
          <Text style={[styles.tabText, activeTab === 'contact' && styles.activeTabText]}>
            Обращение
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'faq' && styles.activeTab]}
          onPress={() => setActiveTab('faq')}
        >
          <Text style={[styles.tabText, activeTab === 'faq' && styles.activeTabText]}>
            Частые вопросы
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'contact' ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Служба поддержки</Text>
            <Text style={styles.description}>
              Если у вас возникли вопросы или проблемы с использованием приложения,
              пожалуйста, заполните форму ниже, и мы свяжемся с вами в ближайшее время.
            </Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Тема обращения *</Text>
              <TextInput
                style={styles.input}
                placeholder="Укажите тему вашего обращения"
                value={subject}
                onChangeText={setSubject}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Сообщение *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Опишите вашу проблему или вопрос детально"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email для связи *</Text>
              <TextInput
                style={styles.input}
                placeholder="Введите ваш email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSendMessage}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>Отправить сообщение</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Контактная информация</Text>
            
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
              <Text style={styles.contactText}>support@advokaty.kz</Text>
            </View>
            
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={20} color={COLORS.primary} />
              <Text style={styles.contactText}>+7 (777) 123-45-67</Text>
            </View>
            
            <View style={styles.contactItem}>
              <Ionicons name="time-outline" size={20} color={COLORS.primary} />
              <Text style={styles.contactText}>Пн-Пт, 9:00 - 18:00</Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={FAQData}
          renderItem={renderFAQItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.faqList}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 12,
  },
  faqList: {
    padding: 16,
  },
  faqItem: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
  },
  faqAnswer: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
    lineHeight: 20,
  },
});

export default SupportScreen; 