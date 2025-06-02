import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import ChatService from '../services/ChatService';
import ImageService from '../services/ImageService';
import Card from './Card';

// Helper function to safely extract text from possibly nested objects
const safeText = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    if (value.hasOwnProperty('label')) return value.label;
    if (value.hasOwnProperty('name')) return value.name;
    if (value.hasOwnProperty('value')) return value.value;
    if (value.hasOwnProperty('id')) return value.id;
    return JSON.stringify(value);
  }
  return String(value);
};

const LawyerCard = ({ lawyer, onPress }) => {
  const navigation = useNavigation();
  const { authState } = useAuth();
  const user = authState.user;

  if (!lawyer) {
    return null;
  }

  // Debug output for lawyer data
  console.log('LawyerCard received lawyer:', {
    id: lawyer.id,
    name: lawyer.name,
    username: lawyer.username,
    keys: Object.keys(lawyer)
  });

  // Extract values from possibly nested objects
  const specialization = safeText(lawyer.specialization);
  const priceRange = safeText(lawyer.price_range);
  const city = safeText(lawyer.city);
  
  // More robust handling of lawyer name
  let username;
  if (lawyer.name) {
    username = lawyer.name;
    console.log(`Using lawyer.name: ${username}`);
  } else if (lawyer.username) {
    username = lawyer.username;
    console.log(`Using lawyer.username: ${username}`);
  } else if (lawyer.specialization) {
    // Fallback to specialization-based name if all else fails
    username = `Адвокат (${lawyer.specialization})`;
    console.log(`Using fallback name: ${username}`);
  } else {
    username = 'Адвокат';
    console.log('Using default name: Адвокат');
  }

  // Handle message button press
  const handleMessagePress = async (e) => {
    e.stopPropagation(); // Prevent triggering parent onPress
    
    if (!lawyer || !lawyer.user_id) {
      Alert.alert(
        'Ошибка',
        'Не удалось определить адвоката для отправки сообщения',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      // Определяем ID адвоката
      const lawyerId = lawyer.user_id;
      
      // Если пользователь не авторизован, создаем временный ID для гостя
      const guestId = "guest_" + Math.floor(Math.random() * 1000000);
      const senderId = user ? user.id : guestId;
      
      // Получаем полное имя адвоката для чата
      const lawyerName = lawyer.name || lawyer.username || 'Адвокат';
      console.log(`Starting chat with lawyer: ${lawyerName} (ID: ${lawyerId})`);
      
      // Отправляем первое сообщение и создаем чат
      const firstMessage = "Здравствуйте! Меня интересует консультация по юридическому вопросу.";
      const result = await ChatService.sendMessage(
        senderId, 
        lawyerId,
        firstMessage
      );
      
      // Переходим к экрану чата
      navigation.navigate('ChatScreen', {
        conversationId: result.conversation.id,
        title: lawyerName,
        lawyerId: lawyer.user_id,
        guestId: !user ? senderId : null
      });
    } catch (err) {
      console.error('Error creating chat:', err);
      Alert.alert(
        'Ошибка',
        'Не удалось создать чат. Пожалуйста, попробуйте позже: ' + err.message,
        [{ text: 'OK' }]
      );
    }
  };

  // Generate star rating display
  const renderRating = (rating) => {
    if (!rating || rating <= 0) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push('★');
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push('⯨');
      } else {
        stars.push('☆');
      }
    }
    
    return (
      <Text style={styles.ratingStars}>
        {stars.join('')} <Text style={styles.ratingNumber}>({rating.toFixed(1)})</Text>
      </Text>
    );
  };
  
  // Рендер аватара с инициалами
  const renderAvatar = () => {
    const color = lawyer.id 
      ? ImageService.getLawyerAvatarColor(lawyer.id) 
      : '#cccccc';
    
    // Get lawyer initials - directly compute if needed
    let initials;
    const displayName = lawyer.name || lawyer.username;
    if (typeof displayName === 'string' && displayName.trim() !== '') {
      const name = displayName.trim();
      const parts = name.split(' ');
      if (parts.length > 1) {
        initials = parts[0].charAt(0) + parts[1].charAt(0);
      } else {
        initials = name.substring(0, 2);
      }
      initials = initials.toUpperCase();
    } else {
      initials = 'АД';
    }
      
    return (
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
    );
  };
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Card>
        <View style={styles.header}>
          {renderAvatar()}
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{username}</Text>
            <Text style={styles.specialization}>
              {specialization || 'Общая практика'}
            </Text>
            {renderRating(lawyer.rating)}
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </View>
        
        <Card.Content>
          {lawyer.experience > 0 && (
            <Card.Row>
              <Card.Label>Опыт работы:</Card.Label>
              <Card.Value>
                {lawyer.experience} {getExperienceLabel(lawyer.experience)}
              </Card.Value>
            </Card.Row>
          )}
          
          {priceRange && (
            <Card.Row>
              <Card.Label>Стоимость услуг:</Card.Label>
              <Card.Value>{priceRange}</Card.Value>
            </Card.Row>
          )}
          
          {city && (
            <Card.Row>
              <Card.Label>Город:</Card.Label>
              <Card.Value>{city}</Card.Value>
            </Card.Row>
          )}
        </Card.Content>
        
        {lawyer.bio && (
          <Text style={styles.bio} numberOfLines={2}>
            {safeText(lawyer.bio)}
          </Text>
        )}
        
        <Card.Footer>
          <View style={styles.footerContent}>
            <Card.Badge 
              text={lawyer.experience > 5 ? 'Опытный адвокат' : 'Адвокат'}
              type={lawyer.rating >= 4 ? 'success' : 'default'}
            />
            
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={styles.messageButton} 
                onPress={handleMessagePress}
              >
                <Ionicons name="chatbubble-outline" size={16} color={COLORS.primary} />
                <Text style={styles.messageButtonText}>Написать</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={onPress}>
                <Text style={styles.contactInfo}>Подробнее</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card.Footer>
      </Card>
    </TouchableOpacity>
  );
};

// Helper function to get correct year form in Russian
const getExperienceLabel = (years) => {
  if (years === 1) return 'год';
  if (years > 1 && years < 5) return 'года';
  return 'лет';
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerInfo: {
    justifyContent: 'center',
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  specialization: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  ratingStars: {
    color: '#FFC107',
    fontSize: 14,
  },
  ratingNumber: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  bio: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 16,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  messageButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  contactInfo: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LawyerCard; 