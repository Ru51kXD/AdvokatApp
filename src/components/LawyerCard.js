import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Card from './Card';
import { COLORS } from '../constants';
import ImageService from '../services/ImageService';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import ChatService from '../services/ChatService';

const LawyerCard = ({ lawyer, onPress }) => {
  const navigation = useNavigation();
  const { authState } = useAuth();
  const user = authState.user;

  if (!lawyer) {
    return null;
  }

  // Handle message button press
  const handleMessagePress = async () => {
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
        title: lawyer.username || lawyer.name || 'Адвокат',
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
    const initials = lawyer.username 
      ? ImageService.getInitials(lawyer.username)
      : '??';
      
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
            <Text style={styles.name}>{lawyer.username || 'Адвокат'}</Text>
            <Text style={styles.specialization}>
              {lawyer.specialization || 'Общая практика'}
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
          
          {lawyer.price_range && (
            <Card.Row>
              <Card.Label>Стоимость услуг:</Card.Label>
              <Card.Value>{lawyer.price_range}</Card.Value>
            </Card.Row>
          )}
          
          {lawyer.city && (
            <Card.Row>
              <Card.Label>Город:</Card.Label>
              <Card.Value>{lawyer.city}</Card.Value>
            </Card.Row>
          )}
        </Card.Content>
        
        {lawyer.bio && (
          <Text style={styles.bio} numberOfLines={2}>
            {lawyer.bio}
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
              
              <Text style={styles.contactInfo}>Подробнее</Text>
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