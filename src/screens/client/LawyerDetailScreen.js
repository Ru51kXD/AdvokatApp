import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  Image, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../constants';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { LawyerService } from '../../services/LawyerService';
import { useAuth } from '../../contexts/AuthContext';
import ChatService from '../../services/ChatService';
import ImageService from '../../services/ImageService';

const LawyerDetailScreen = ({ route, navigation }) => {
  const { lawyerId, lawyer: initialLawyer } = route.params;
  const { user } = useAuth();
  
  const [lawyer, setLawyer] = useState(initialLawyer || null);
  const [loading, setLoading] = useState(!initialLawyer);
  const [error, setError] = useState(null);
  const [creatingChat, setCreatingChat] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const fetchLawyerDetails = useCallback(async () => {
    // Если у нас уже есть данные адвоката из навигации, не нужно их запрашивать
    if (initialLawyer) {
      console.log('Using provided lawyer data');
      setLawyer(initialLawyer);
      setLoading(false);
      return;
    }
    
    console.log('Fetching lawyer details with ID:', lawyerId);
    if (!lawyerId) {
      setError('Адвокат не найден');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const lawyerData = await LawyerService.getLawyerById(lawyerId);
      console.log('Lawyer data received:', lawyerData ? 'success' : 'null');
      
      if (lawyerData) {
        setLawyer(lawyerData);
      } else {
        setError('Адвокат не найден');
      }
    } catch (err) {
      console.error('Error fetching lawyer details:', err);
      setError('Не удалось загрузить информацию об адвокате.');
    } finally {
      setLoading(false);
    }
  }, [lawyerId, initialLawyer]);

  useEffect(() => {
    fetchLawyerDetails();
  }, [fetchLawyerDetails]);

  const handleCreateRequest = () => {
    navigation.navigate('Request', { lawyerId });
  };

  const handleCall = () => {
    if (lawyer?.phone) {
      Linking.openURL(`tel:${lawyer.phone}`);
    } else {
      Alert.alert(
        'Номер телефона недоступен',
        'К сожалению, номер телефона адвоката не указан. Создайте заявку, чтобы связаться.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSendMessage = async () => {
    try {
      setCreatingChat(true);
      
      if (!lawyer || !lawyer.user_id) {
        Alert.alert(
          'Ошибка',
          'Не удалось определить адвоката для отправки сообщения',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Определяем ID адвоката
      const lawyerId = lawyer.user_id;
      
      // Если пользователь не авторизован, создаем временный ID для гостя
      const guestId = "guest_" + Math.floor(Math.random() * 1000000);
      const senderId = user ? user.id : guestId;
      
      console.log('Creating chat with lawyer:', {
        senderId,
        lawyerId,
        isAuthenticated: Boolean(user)
      });
      
      // Отправляем первое сообщение и создаем чат
      const firstMessage = "Здравствуйте! Меня интересует консультация по юридическому вопросу.";
      const result = await ChatService.sendMessage(
        senderId, 
        lawyerId,
        firstMessage
      );
      
      // Переходим к экрану чата
      navigation.navigate('ChatScreen', {
        conversationId: result.conversationId,
        title: lawyer.username || 'Адвокат',
        guestId: !user ? senderId : null
      });
    } catch (err) {
      console.error('Error creating chat:', err);
      Alert.alert(
        'Ошибка',
        'Не удалось создать чат. Пожалуйста, попробуйте позже: ' + err.message,
        [{ text: 'OK' }]
      );
    } finally {
      setCreatingChat(false);
    }
  };

  const handleRetry = () => {
    fetchLawyerDetails();
  };

  // Generate star rating display
  const renderRating = (rating) => {
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
  
  // Render avatar with initials
  const renderAvatar = () => {
    const color = lawyer && lawyer.id 
      ? ImageService.getLawyerAvatarColor(lawyer.id) 
      : '#cccccc';
    const initials = lawyer && lawyer.username 
      ? ImageService.getInitials(lawyer.username)
      : '??';
      
    return (
      <View style={[styles.avatarContainer, { backgroundColor: color }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
    );
  };

  // Helper function to get correct year form in Russian
  const getExperienceLabel = (years) => {
    if (years === 1) return 'год';
    if (years > 1 && years < 5) return 'года';
    return 'лет';
  };

  // Rendering individual review
  const renderReview = (review, index) => (
    <Card key={review.id || index} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewAuthor}>{review.client_name || 'Клиент'}</Text>
        <Text style={styles.ratingStars}>
          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
        </Text>
      </View>
      {review.comment && (
        <Text style={styles.reviewText}>{review.comment}</Text>
      )}
      <Text style={styles.reviewDate}>
        {review.created_at ? new Date(review.created_at).toLocaleDateString('ru-RU') : 'Нет даты'}
      </Text>
    </Card>
  );

  // Toggle view all reviews
  const toggleAllReviews = () => {
    setShowAllReviews(!showAllReviews);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Загрузка информации...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Попробовать снова</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!lawyer) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="search-off" size={48} color={COLORS.textSecondary} />
        <Text style={styles.errorText}>Информация не найдена</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Вернуться назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          {renderAvatar()}
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{lawyer.username}</Text>
            <Text style={styles.specialization}>{lawyer.specialization || 'Юрист'}</Text>
            {lawyer.rating > 0 && renderRating(lawyer.rating)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Информация</Text>
          
          <Card>
            <Card.Content>
              {lawyer.experience > 0 && (
                <Card.Row>
                  <Card.Label>Опыт работы:</Card.Label>
                  <Card.Value>{lawyer.experience} {getExperienceLabel(lawyer.experience)}</Card.Value>
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
              
              {lawyer.address && (
                <Card.Row>
                  <Card.Label>Адрес:</Card.Label>
                  <Card.Value>{lawyer.address}</Card.Value>
                </Card.Row>
              )}
            </Card.Content>
          </Card>
        </View>

        {lawyer.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>О себе</Text>
            <Card>
              <Text style={styles.bioText}>{lawyer.bio}</Text>
            </Card>
          </View>
        )}

        {lawyer.reviews && lawyer.reviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Отзывы ({lawyer.reviews.length})</Text>
            
            {/* Показываем первые 3 отзыва или все, если включен режим "показать все" */}
            {(showAllReviews ? lawyer.reviews : lawyer.reviews.slice(0, 3)).map((review, index) => 
              renderReview(review, index)
            )}
            
            {/* Кнопка для показа всех отзывов */}
            {lawyer.reviews.length > 3 && (
              <TouchableOpacity 
                style={styles.moreReviews} 
                onPress={toggleAllReviews}
              >
                <Text style={styles.moreReviewsText}>
                  {showAllReviews 
                    ? "Скрыть отзывы" 
                    : `Показать все отзывы (${lawyer.reviews.length})`
                  }
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.actions}>
          <Button
            title="Создать заявку"
            onPress={handleCreateRequest}
            style={styles.actionButton}
          />
          <View style={styles.secondaryActions}>
            <Button
              title="Позвонить"
              onPress={handleCall}
              variant="outline"
              style={[styles.actionButton, styles.secondaryButton]}
              icon="call-outline"
            />
            <Button
              title="Написать"
              onPress={handleSendMessage}
              variant="outline"
              style={[styles.actionButton, styles.secondaryButton]}
              icon="chatbubble-outline"
              loading={creatingChat}
            />
          </View>
        </View>
      </ScrollView>
      
      {/* Модальное окно для всех отзывов (альтернативный вариант отображения) */}
      {/* <Modal
        visible={showAllReviews}
        animationType="slide"
        transparent={false}
        onRequestClose={toggleAllReviews}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Все отзывы ({lawyer?.reviews?.length || 0})</Text>
            <TouchableOpacity onPress={toggleAllReviews} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={lawyer?.reviews || []}
            keyExtractor={(item, index) => String(item.id || index)}
            renderItem={({ item, index }) => renderReview(item, index)}
            contentContainerStyle={styles.reviewsList}
          />
        </SafeAreaView>
      </Modal> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    fontSize: 16,
    marginVertical: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    backgroundColor: COLORS.white,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  specialization: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  ratingStars: {
    color: '#FFC107',
    fontSize: 16,
  },
  ratingNumber: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    padding: 8,
  },
  reviewCard: {
    marginBottom: 12,
    padding: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  reviewText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  moreReviews: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: COLORS.lightGrey,
    borderRadius: 8,
    marginTop: 8,
  },
  moreReviewsText: {
    color: COLORS.primary,
    fontWeight: '500',
    fontSize: 14,
  },
  actions: {
    padding: 16,
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    flex: 0.48,
    marginBottom: 0,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
    backgroundColor: COLORS.white,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  closeButton: {
    padding: 8,
  },
  reviewsList: {
    padding: 16,
  },
});

export default LawyerDetailScreen; 
 
 
 