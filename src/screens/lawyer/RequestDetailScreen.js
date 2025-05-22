import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, REQUEST_STATUS } from '../../constants';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { RequestService } from '../../services/RequestService';
import { useAuth } from '../../contexts/AuthContext';
import ChatService from '../../services/ChatService';
import { LawyerService } from '../../services/LawyerService';

const LawyerRequestDetailScreen = ({ route, navigation }) => {
  const { requestId } = route.params;
  const { user } = useAuth();
  
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [hasResponded, setHasResponded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [directMessage, setDirectMessage] = useState('');

  const fetchRequestDetails = useCallback(async () => {
    if (!requestId) {
      console.log('Нет requestId, прерываю загрузку');
      setError('Идентификатор заявки не указан');
      setLoading(false);
      return;
    }
    
    console.log(`Начинаю загрузку заявки ID=${requestId}`);
    setLoading(true);
    
    try {
      // Простой запрос без проверки авторизации
      const requestData = await RequestService.getRequestById(requestId, user?.id, user?.userType);
      
      console.log('Получены данные заявки:', requestData.id, requestData.title);
      
      if (!requestData) {
        throw new Error('Данные заявки не получены');
      }
      
      setRequest(requestData);
      
      // Проверяем, оставил ли юрист отклик на эту заявку (только если пользователь авторизован)
      if (user) {
        const hasLawyerResponded = requestData.responses && 
          requestData.responses.some(resp => resp.lawyer_id === user.id);
        
        setHasResponded(hasLawyerResponded);
      }
      
      setError(null);
    } catch (err) {
      console.error('Ошибка при загрузке деталей заявки:', err);
      setError('Не удалось загрузить детали заявки. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  }, [requestId, user]);

  // Загружать детали при каждом фокусе на экране
  useFocusEffect(
    useCallback(() => {
      fetchRequestDetails();
    }, [fetchRequestDetails])
  );

  const handleSendResponse = async () => {
    if (!responseMessage.trim()) {
      Alert.alert('Ошибка', 'Введите сообщение для отклика');
      return;
    }
    
    setSubmitting(true);
    try {
      const userData = {
        lawyer_id: user?.id || 999, // Если пользователь не авторизован, используем гостевой ID
        request_id: requestId,
        message: responseMessage,
        lawyer_name: user?.username || 'Вы (Гость)',
        specialization: user?.specialization || 'Юрист',
        experience: user?.experience || 0,
        rating: user?.rating || 0
      };
      
      // Получаем созданный отклик
      const newResponse = await RequestService.createResponse(userData);
      
      // Добавляем наш отклик в начало списка откликов
      const updatedRequest = {
        ...request,
        responses: [newResponse, ...(request.responses || [])],
        response_count: ((request.response_count || 0) + 1)
      };
      
      // Обновляем состояние
      setRequest(updatedRequest);
      setHasResponded(true);
      setResponseMessage('');
      
      // Предлагаем отправить личное сообщение клиенту
      setShowMessageModal(true);
    } catch (err) {
      console.error('Ошибка при отправке отклика:', err);
      Alert.alert(
        'Ошибка',
        'Не удалось отправить отклик. Попробуйте еще раз.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Отправка личного сообщения клиенту
  const handleSendDirectMessage = async () => {
    if (!directMessage.trim()) {
      Alert.alert('Ошибка', 'Введите текст сообщения');
      return;
    }
    
    try {
      // Получаем ID отправителя (юриста)
      const senderId = user?.id || 999;
      
      // Получаем ID получателя (клиента)
      const receiverId = request.client_id;
      
      // Отправляем сообщение
      const result = await ChatService.sendMessage(
        senderId,
        receiverId,
        directMessage,
        requestId
      );
      
      // Получаем ID созданной или существующей беседы
      const conversationId = result.conversation.id;
      
      Alert.alert(
        'Успешно',
        'Ваше сообщение отправлено клиенту!',
        [
          { 
            text: 'Перейти в чат', 
            onPress: () => {
              navigation.navigate('Chat', { 
                conversationId: conversationId,
                title: request.client_name || 'Клиент',
                requestId: requestId
              });
            } 
          },
          { text: 'ОК', style: 'cancel' }
        ]
      );
      
      // Закрываем модальное окно
      setShowMessageModal(false);
      setDirectMessage('');
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      Alert.alert('Ошибка', 'Не удалось отправить сообщение. Попробуйте позже.');
    }
  };

  // Форматирование даты для отображения
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Получение текста статуса
  const getStatusText = (status) => {
    switch (status) {
      case REQUEST_STATUS.OPEN:
        return 'Открыта';
      case REQUEST_STATUS.IN_PROGRESS:
        return 'В процессе';
      case REQUEST_STATUS.COMPLETED:
        return 'Завершена';
      case REQUEST_STATUS.CANCELLED:
        return 'Отменена';
      default:
        return 'Неизвестно';
    }
  };

  // Получение цвета статуса
  const getStatusColor = (status) => {
    switch (status) {
      case REQUEST_STATUS.OPEN:
        return COLORS.primary;
      case REQUEST_STATUS.IN_PROGRESS:
        return '#FFC107'; // Желтый
      case REQUEST_STATUS.COMPLETED:
        return COLORS.success;
      case REQUEST_STATUS.CANCELLED:
        return COLORS.error;
      default:
        return COLORS.grey;
    }
  };

  const renderResponseSection = () => {
    if (request.status !== REQUEST_STATUS.OPEN) {
      return (
        <View style={styles.closedRequestInfo}>
          <Ionicons name="information-circle-outline" size={24} color={COLORS.textSecondary} />
          <Text style={styles.closedRequestText}>
            Эта заявка больше не принимает откликов
          </Text>
        </View>
      );
    }
    
    if (hasResponded) {
      return (
        <View style={styles.respondedContainer}>
          <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
          <Text style={styles.respondedText}>
            Вы уже отправили отклик на эту заявку
          </Text>
          <Button
            title="Написать сообщение клиенту"
            onPress={() => setShowMessageModal(true)}
            style={styles.messageButton}
          />
        </View>
      );
    }
    
    return (
      <View style={styles.responseFormContainer}>
        <Text style={styles.responseFormTitle}>Ответить на заявку</Text>
        <TextInput
          style={styles.responseInput}
          placeholder="Напишите сообщение клиенту. Опишите ваш опыт в данной области, предложите варианты решения проблемы, укажите примерную стоимость услуг."
          value={responseMessage}
          onChangeText={setResponseMessage}
          multiline
          numberOfLines={4}
        />
        <Button
          title={submitting ? "Отправка..." : "Отправить отклик"}
          onPress={handleSendResponse}
          disabled={submitting || !responseMessage.trim()}
        />
        {!user && (
          <Text style={styles.guestInfo}>
            Вы отвечаете как гость. Для полноценного взаимодействия с клиентом рекомендуется авторизоваться.
          </Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Загрузка деталей заявки...</Text>
      </View>
    );
  }

  if (error || !request) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Заявка не найдена'}</Text>
        <Button
          title="Вернуться назад"
          onPress={() => navigation.goBack()}
          style={styles.errorButton}
        />
      </View>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.requestCard}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>{request.title}</Text>
              <Text style={styles.date}>
                {formatDate(request.created_at)}
              </Text>
              {request.isUrgent && (
                <View style={styles.urgentBadge}>
                  <Ionicons name="flash" size={16} color={COLORS.white} />
                  <Text style={styles.urgentText}>Срочно</Text>
                </View>
              )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                {getStatusText(request.status)}
              </Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Детали заявки</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Область права:</Text>
              <Text style={styles.detailValue}>{request.law_area_display || request.law_area}</Text>
            </View>
            
            {request.price_range && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Бюджет:</Text>
                <Text style={styles.detailValue}>{request.price_range_display || request.price_range}</Text>
              </View>
            )}
            
            {request.experience_required > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Минимальный опыт:</Text>
                <Text style={styles.detailValue}>{request.experience_required} лет</Text>
              </View>
            )}
            
            {request.location && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Местоположение:</Text>
                <Text style={styles.detailValue}>{request.location}</Text>
              </View>
            )}
            
            {request.deadline && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Срок выполнения:</Text>
                <Text style={styles.detailValue}>{formatDate(request.deadline)}</Text>
              </View>
            )}
            
            {request.service_type && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Тип услуги:</Text>
                <Text style={styles.detailValue}>{request.service_type}</Text>
              </View>
            )}
            
            {request.case_complexity && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Сложность дела:</Text>
                <Text style={styles.detailValue}>{request.case_complexity}</Text>
              </View>
            )}
            
            <Text style={styles.descriptionLabel}>Описание:</Text>
            <Text style={styles.description}>{request.description}</Text>
            
            {request.additional_info && (
              <>
                <Text style={styles.descriptionLabel}>Дополнительная информация:</Text>
                <Text style={styles.description}>{request.additional_info}</Text>
              </>
            )}
            
            {request.documents && request.documents.length > 0 && (
              <View style={styles.documentsSection}>
                <Text style={styles.descriptionLabel}>Приложенные документы:</Text>
                {request.documents.map(doc => (
                  <View key={doc.id} style={styles.documentItem}>
                    <Ionicons name="document-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.documentName}>{doc.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          
          {request.response_count > 0 && (
            <View style={styles.responseStatsContainer}>
              <Ionicons name="people-outline" size={18} color={COLORS.primary} />
              <Text style={styles.responseStats}>
                {request.response_count} {request.response_count === 1 ? 'юрист откликнулся' : 'юристов откликнулись'} на эту заявку
              </Text>
            </View>
          )}
        </Card>

        {/* Форма отклика */}
        <Card style={styles.responseCard}>
          {renderResponseSection()}
        </Card>
        
        {/* Другие отклики */}
        {request.responses && request.responses.length > 0 && (
          <Card style={styles.otherResponsesCard}>
            <Text style={styles.sectionTitle}>
              {request.responses.some(r => r.isYourResponse) 
                ? 'Ваш отклик и отклики других юристов' 
                : 'Отклики юристов'
              }
            </Text>
            {request.responses.map((response, index) => (
              <View key={response.id} style={[
                styles.otherResponseItem, 
                index < request.responses.length - 1 && styles.withBottomBorder,
                response.isYourResponse && styles.yourResponseItem
              ]}>
                <View style={styles.responseLawyerInfo}>
                  <Text style={[
                    styles.responseLawyerName,
                    response.isYourResponse && styles.yourResponseText
                  ]}>
                    {response.isYourResponse ? 'Ваш отклик' : response.lawyer_name}
                  </Text>
                  <View style={styles.responseStats}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.responseRating}>{response.rating}</Text>
                    <Text style={styles.responseExperience}>{response.experience} лет опыта</Text>
                  </View>
                  <Text style={styles.responseSpecialization}>{response.specialization}</Text>
                </View>
                <Text style={styles.responseMessage}>{response.message}</Text>
                <View style={styles.responseDetails}>
                  <Text style={styles.responsePrice}>{response.price}</Text>
                  <Text style={styles.responseTime}>{response.response_time}</Text>
                </View>
                <Text style={styles.responseDate}>
                  {response.isYourResponse 
                    ? 'Вы откликнулись ' + formatRelativeTime(response.created_at)
                    : 'Откликнулся ' + formatRelativeTime(response.created_at)
                  }
                </Text>
              </View>
            ))}
          </Card>
        )}

        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={fetchRequestDetails}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={20} color={COLORS.white} />
          <Text style={styles.refreshText}>Обновить</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Модальное окно для отправки сообщения */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showMessageModal}
        onRequestClose={() => setShowMessageModal(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Сообщение клиенту</Text>
            <Text style={styles.modalSubtitle}>
              Напишите личное сообщение клиенту, чтобы обсудить детали заявки
            </Text>
            
            <TextInput
              style={styles.messageInput}
              placeholder="Введите сообщение..."
              value={directMessage}
              onChangeText={setDirectMessage}
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowMessageModal(false);
                  setDirectMessage('');
                }}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.sendButton, !directMessage.trim() && styles.disabledButton]}
                onPress={handleSendDirectMessage}
                disabled={!directMessage.trim()}
              >
                <Text style={styles.sendButtonText}>Отправить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    marginBottom: 20,
    textAlign: 'center',
  },
  errorButton: {
    width: 200,
  },
  requestCard: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    flex: 1,
  },
  date: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGrey,
    marginVertical: 16,
  },
  detailsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    width: 140,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  descriptionLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  responseCard: {
    marginBottom: 24,
  },
  responseFormContainer: {
    padding: 16,
  },
  responseFormTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  responseInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  respondedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  respondedText: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 8,
  },
  closedRequestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  closedRequestText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  guestInfo: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  urgentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  urgentText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.white,
    marginLeft: 4,
  },
  responseStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGrey,
  },
  responseStats: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  otherResponsesCard: {
    marginBottom: 24,
    padding: 16,
  },
  otherResponseItem: {
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginTop: 12,
  },
  withBottomBorder: {
    marginBottom: 12,
  },
  responseLawyerInfo: {
    marginBottom: 8,
  },
  responseLawyerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  responseStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  responseRating: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
    marginRight: 12,
  },
  responseExperience: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  responseSpecialization: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  responseMessage: {
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 22,
  },
  responseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  responsePrice: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
    marginRight: 16,
  },
  responseTime: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  responseDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  documentsSection: {
    marginTop: 12,
    marginBottom: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: COLORS.lightGrey + '30',
    borderRadius: 8,
  },
  documentName: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  refreshText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  yourResponseItem: {
    backgroundColor: COLORS.primary + '10',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  yourResponseText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  messageButton: {
    marginTop: 16,
    backgroundColor: COLORS.primaryLight,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    color: COLORS.textSecondary,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.lightGrey,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontWeight: '500',
  },
  sendButtonText: {
    color: COLORS.white,
    fontWeight: '500',
  },
});

// Форматирование относительного времени
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'только что';
  } else if (diffMin < 60) {
    return `${diffMin} ${getDeclension(diffMin, ['минуту', 'минуты', 'минут'])} назад`;
  } else if (diffHour < 24) {
    return `${diffHour} ${getDeclension(diffHour, ['час', 'часа', 'часов'])} назад`;
  } else if (diffDay < 7) {
    return `${diffDay} ${getDeclension(diffDay, ['день', 'дня', 'дней'])} назад`;
  } else {
    return date.toLocaleDateString('ru-RU');
  }
};

// Функция для правильного склонения слов
const getDeclension = (number, titles) => {
  const cases = [2, 0, 1, 1, 1, 2];
  return titles[
    number % 100 > 4 && number % 100 < 20
      ? 2
      : cases[number % 10 < 5 ? number % 10 : 5]
  ];
};

export default LawyerRequestDetailScreen; 