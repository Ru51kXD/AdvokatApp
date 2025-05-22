import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, REQUEST_STATUS } from '../../constants';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ResponseCard from '../../components/ResponseCard';
import { RequestService } from '../../services/RequestService';
import { useAuth } from '../../contexts/AuthContext';

const RequestDetailScreen = ({ route, navigation }) => {
  const { requestId } = route.params;
  const { user } = useAuth();
  
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handleAcceptResponse = async (responseId) => {
    try {
      await RequestService.updateResponseStatus(responseId, 'accepted');
      Alert.alert(
        'Успешно',
        'Вы приняли предложение юриста. Теперь вы можете связаться с ним.',
        [{ text: 'OK' }]
      );
      // Обновляем данные после принятия
      fetchRequestDetails();
    } catch (err) {
      Alert.alert(
        'Ошибка',
        'Не удалось принять предложение юриста. Попробуйте еще раз.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRejectResponse = async (responseId) => {
    try {
      await RequestService.updateResponseStatus(responseId, 'rejected');
      Alert.alert(
        'Успешно',
        'Вы отклонили предложение юриста.',
        [{ text: 'OK' }]
      );
      // Обновляем данные после отклонения
      fetchRequestDetails();
    } catch (err) {
      Alert.alert(
        'Ошибка',
        'Не удалось отклонить предложение юриста. Попробуйте еще раз.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleViewLawyerProfile = (lawyer) => {
    navigation.navigate('LawyerDetail', { lawyerId: lawyer.id });
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
            
            <Text style={styles.descriptionLabel}>Описание:</Text>
            <Text style={styles.description}>{request.description}</Text>
          </View>
        </Card>

        {/* Отклики юристов */}
        <View style={styles.responsesSection}>
          <Text style={styles.responsesTitle}>
            Отклики юристов {request.responses && `(${request.responses.length})`}
          </Text>
          
          {(!request.responses || request.responses.length === 0) && (
            <View style={styles.emptyResponses}>
              <Ionicons name="chatbubble-ellipses-outline" size={64} color={COLORS.lightGrey} />
              <Text style={styles.emptyResponsesText}>
                Пока нет ответов на вашу заявку
              </Text>
              <Text style={styles.emptyResponsesSubtext}>
                Ответы юристов появятся здесь
              </Text>
            </View>
          )}
          
          {request.responses && request.responses.map((response) => (
            <ResponseCard
              key={response.id}
              response={response}
              onPress={() => handleViewLawyerProfile({ id: response.lawyer_id })}
              onAccept={() => handleAcceptResponse(response.id)}
              onReject={() => handleRejectResponse(response.id)}
              isClient={true}
            />
          ))}
        </View>

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
    marginBottom: 20,
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
  responsesSection: {
    marginBottom: 80,
  },
  responsesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  emptyResponses: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
  },
  emptyResponsesText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyResponsesSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
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

export default RequestDetailScreen; 