import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import ChatService from '../services/ChatService';

const LawyerProfileScreen = ({ route, navigation }) => {
  const { lawyer } = route.params;
  const { authState } = useAuth();
  const [sending, setSending] = useState(false);

  const handleCall = () => {
    // Если у адвоката нет номера телефона, используем резервный номер
    const phoneNumber = lawyer.phone || '+7 777 123 45 67';
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleWhatsApp = () => {
    // Используем тот же резервный номер для WhatsApp
    const phoneNumber = lawyer.phone || '+7 777 123 45 67';
    Linking.openURL(`whatsapp://send?phone=${phoneNumber.replace(/\D/g, '')}`);
  };

  const handleWriteMessage = async () => {
    try {
      // Показываем индикатор отправки
      setSending(true);
      
      // Определяем ID адвоката - сначала проверяем user_id, затем id
      const lawyerId = lawyer.user_id || lawyer.id;
      
      // Если пользователь не авторизован, создаем временный ID для гостя
      const guestId = "guest_" + Math.floor(Math.random() * 1000000);
      const senderId = authState.isAuthenticated && authState.user ? authState.user.id : guestId;
      
      console.log('Starting conversation with lawyer:', {
        senderId,
        lawyerId,
        isAuthenticated: authState.isAuthenticated
      });
      
      // Отправляем первое сообщение и создаем чат
      const firstMessage = "Здравствуйте! Меня интересует консультация по юридическому вопросу.";
      const result = await ChatService.sendMessage(
        senderId, 
        lawyerId,
        firstMessage
      );
      
      // Выбираем наилучший вариант отображаемого имени адвоката
      const lawyerName = lawyer.name || lawyer.username || 'Адвокат';
      
      // Переходим к экрану чата
      navigation.navigate('ChatScreen', {
        conversationId: result.conversationId,
        title: lawyerName,
        guestId: !authState.isAuthenticated ? senderId : null
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      
      if (!authState.isAuthenticated) {
        // Если пользователь не авторизован, предлагаем войти
        Alert.alert(
          "Требуется авторизация", 
          "Для отправки сообщений адвокату необходимо войти в систему. Хотите войти?",
          [
            {
              text: "Отмена",
              style: "cancel"
            },
            { 
              text: "Войти", 
              onPress: () => navigation.navigate('LoginScreen')
            }
          ]
        );
      } else {
        Alert.alert("Ошибка", "Не удалось начать беседу с адвокатом. " + error.message);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: lawyer.avatar || 'https://via.placeholder.com/150' }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{lawyer.name}</Text>
        <Text style={styles.specialization}>{lawyer.specialization}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={20} color={COLORS.primary} />
          <Text style={styles.rating}>{lawyer.rating}</Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>{lawyer.city}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="briefcase-outline" size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>Опыт работы: {lawyer.experience} лет</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="cash-outline" size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>Стоимость: {lawyer.price_range}</Text>
        </View>
      </View>

      <View style={styles.bioContainer}>
        <Text style={styles.sectionTitle}>О себе</Text>
        <Text style={styles.bioText}>{lawyer.bio}</Text>
      </View>

      <View style={styles.contactContainer}>
        <Text style={styles.sectionTitle}>Связаться</Text>
        <View style={styles.contactButtons}>
          <TouchableOpacity style={[styles.contactButton, { flex: 0.32 }]} onPress={handleCall}>
            <Ionicons name="call" size={22} color={COLORS.white} />
            <Text style={styles.contactButtonText}>Позвонить</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.contactButton, { flex: 0.32 }]} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={22} color={COLORS.white} />
            <Text style={styles.contactButtonText}>WhatsApp</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.contactButton, { flex: 0.32 }]} 
            onPress={handleWriteMessage}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="chatbubble-outline" size={22} color={COLORS.white} />
                <Text style={styles.contactButtonText}>Написать</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.reviewsContainer}>
        <Text style={styles.sectionTitle}>Отзывы</Text>
        {lawyer.reviews?.map((review, index) => (
          <View key={index} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewerName}>{review.reviewer_name}</Text>
              <View style={styles.reviewRating}>
                <Ionicons name="star" size={16} color={COLORS.primary} />
                <Text style={styles.reviewRatingText}>{review.rating}</Text>
              </View>
            </View>
            <Text style={styles.reviewText}>{review.text}</Text>
            <Text style={styles.reviewDate}>{review.date}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: SIZES.padding,
  },
  name: {
    ...FONTS.h2,
    color: COLORS.text,
    marginBottom: SIZES.base,
  },
  specialization: {
    ...FONTS.body3,
    color: COLORS.primary,
    marginBottom: SIZES.base,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    ...FONTS.body3,
    color: COLORS.text,
    marginLeft: SIZES.base,
  },
  infoContainer: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    marginTop: SIZES.padding,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  infoText: {
    ...FONTS.body3,
    color: COLORS.text,
    marginLeft: SIZES.base,
  },
  bioContainer: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    marginTop: SIZES.padding,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  bioText: {
    ...FONTS.body3,
    color: COLORS.text,
    lineHeight: 24,
  },
  contactContainer: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    marginTop: SIZES.padding,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: SIZES.base * 1.5,
    borderRadius: SIZES.radius,
    marginHorizontal: SIZES.base / 2,
  },
  contactButtonText: {
    ...FONTS.body3,
    color: COLORS.white,
    marginLeft: SIZES.base,
  },
  reviewsContainer: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    marginTop: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  reviewCard: {
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  reviewerName: {
    ...FONTS.body3,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewRatingText: {
    ...FONTS.body4,
    color: COLORS.text,
    marginLeft: SIZES.base,
  },
  reviewText: {
    ...FONTS.body3,
    color: COLORS.text,
    marginBottom: SIZES.base,
  },
  reviewDate: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
});

export default LawyerProfileScreen; 