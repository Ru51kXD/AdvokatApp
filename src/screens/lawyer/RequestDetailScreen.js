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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, REQUEST_STATUS } from '../../constants';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { RequestService } from '../../services/RequestService';
import { useAuth } from '../../contexts/AuthContext';

const LawyerRequestDetailScreen = ({ route, navigation }) => {
  const { requestId } = route.params;
  const { user } = useAuth();
  
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [hasResponded, setHasResponded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchRequestDetails = useCallback(async () => {
    if (!user || !requestId) return;
    
    setLoading(true);
    try {
      const requestData = await RequestService.getRequestById(requestId, user.id, user.userType);
      setRequest(requestData);
      
      // Проверяем, оставил ли юрист отклик на эту заявку
      const hasLawyerResponded = requestData.responses && 
        requestData.responses.some(resp => resp.lawyer_id === user.id);
      
      setHasResponded(hasLawyerResponded);
      setError(null);
    } catch (err) {
      console.error('Error fetching request details:', err);
      setError('Не удалось загрузить детали заявки.');
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
      await RequestService.createResponse({
        request_id: requestId,
        lawyer_id: user.id,
        message: responseMessage,
      });
      
      Alert.alert(
        'Успешно',
        'Ваш отклик отправлен клиенту',
        [{ text: 'OK' }]
      );
      
      setHasResponded(true);
      setResponseMessage('');
      // Обновляем данные после отправки отклика
      fetchRequestDetails();
    } catch (err) {
      Alert.alert(
        'Ошибка',
        'Не удалось отправить отклик. Попробуйте еще раз.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
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
        </View>
      );
    }
    
    return (
      <View style={styles.responseFormContainer}>
        <Text style={styles.responseFormTitle}>Ответить на заявку</Text>
        <TextInput
          style={styles.responseInput}
          placeholder="Напишите сообщение клиенту..."
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
            <View>
              <Text style={styles.title}>{request.title}</Text>
              <Text style={styles.date}>
                {formatDate(request.created_at)}
              </Text>
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
              <Text style={styles.detailValue}>{request.law_area}</Text>
            </View>
            
            {request.price_range && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Бюджет:</Text>
                <Text style={styles.detailValue}>{request.price_range}</Text>
              </View>
            )}
            
            {request.experience_required > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Минимальный опыт:</Text>
                <Text style={styles.detailValue}>{request.experience_required} лет</Text>
              </View>
            )}
            
            <Text style={styles.descriptionLabel}>Описание:</Text>
            <Text style={styles.description}>{request.description}</Text>
          </View>
        </Card>

        {/* Форма отклика */}
        <Card style={styles.responseCard}>
          {renderResponseSection()}
        </Card>

        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={fetchRequestDetails}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={20} color={COLORS.white} />
          <Text style={styles.refreshText}>Обновить</Text>
        </TouchableOpacity>
      </ScrollView>
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
});

export default LawyerRequestDetailScreen; 