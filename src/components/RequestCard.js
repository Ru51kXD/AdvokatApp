import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { COLORS, REQUEST_STATUS } from '../constants';

// Вспомогательная функция для безопасного извлечения текста из объектов
const safeText = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    if (value.hasOwnProperty('label')) return value.label;
    if (value.hasOwnProperty('name')) return value.name;
    if (value.hasOwnProperty('value')) return value.value;
    if (value.hasOwnProperty('id')) return String(value.id);
    return '';
  }
  return String(value);
};

// Функция для безопасного создания копии объекта запроса без циклических ссылок
const sanitizeRequest = (request) => {
  if (!request) return {};
  
  // Создаем базовую копию объекта
  const sanitized = { ...request };
  
  // Безопасно обрабатываем поля, которые могут быть объектами
  if (typeof sanitized.law_area === 'object') {
    sanitized.law_area = safeText(sanitized.law_area);
  }
  
  if (typeof sanitized.price_range === 'object') {
    sanitized.price_range = safeText(sanitized.price_range);
  }
  
  if (typeof sanitized.client_name === 'object') {
    sanitized.client_name = safeText(sanitized.client_name);
  }
  
  if (typeof sanitized.title === 'object') {
    sanitized.title = safeText(sanitized.title);
  }
  
  if (typeof sanitized.description === 'object') {
    sanitized.description = safeText(sanitized.description);
  }
  
  return sanitized;
};

const RequestCard = ({ request, onPress, showResponses = false, showClientInfo = false }) => {
  // Проверяем, что request существует и содержит необходимые данные
  if (!request) {
    return null;
  }
  
  // Создаем безопасную копию запроса
  const safeRequest = sanitizeRequest(request);

  const getStatusBadge = (status) => {
    let type = 'default';
    let text = 'В ожидании';
    
    switch (status) {
      case REQUEST_STATUS?.OPEN:
        type = 'default';
        text = 'Открыт';
        break;
      case REQUEST_STATUS?.IN_PROGRESS:
        type = 'warning';
        text = 'В процессе';
        break;
      case REQUEST_STATUS?.COMPLETED:
        type = 'success';
        text = 'Завершен';
        break;
      case REQUEST_STATUS?.CANCELLED:
        type = 'error';
        text = 'Отменен';
        break;
      default:
        type = 'default';
        text = 'Открыт';
    }
    
    return <Card.Badge text={text} type={type} />;
  };
  
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (error) {
      console.error('Ошибка форматирования даты:', error);
      return 'Неизвестная дата';
    }
  };
  
  // Относительная дата (сколько дней назад)
  const getRelativeDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return 'сегодня';
      } else if (diffDays === 1) {
        return 'вчера';
      } else if (diffDays < 7) {
        return `${diffDays} ${getDaysLabel(diffDays)} назад`;
      } else {
        return formatDate(dateString);
      }
    } catch (error) {
      console.error('Ошибка вычисления относительной даты:', error);
      return 'недавно';
    }
  };
  
  // Правильное склонение для количества дней
  const getDaysLabel = (days) => {
    if (days === 1) return 'день';
    if (days > 1 && days < 5) return 'дня';
    return 'дней';
  };
  
  // Приоритетные (срочные) заявки
  const isUrgent = safeRequest.isUrgent || false;
  
  // Отклик адвоката на заявку
  const hasResponded = safeRequest.hasResponded || false;
  
  // Получаем значения или устанавливаем дефолтные
  const title = safeText(safeRequest.title) || 'Без названия';
  const description = safeText(safeRequest.description) || '';
  const lawArea = safeText(safeRequest.law_area) || 'Не указано';
  const priceRange = safeText(safeRequest.price_range) || 'Не указано';
  const createdAt = safeRequest.created_at || new Date().toISOString();
  const responseCount = safeRequest.response_count || 0;
  const clientName = safeText(safeRequest.client_name) || 'Клиент';
  const experienceRequired = safeRequest.experience_required || 0;
  
  return (
    <Card onPress={onPress}>
      <Card.Title>
        {isUrgent && (
          <View style={styles.urgentContainer}>
            <Ionicons name="time" size={16} color={COLORS.error} />
            <Text style={styles.urgentText}>Срочно</Text>
          </View>
        )}
        {title}
      </Card.Title>
      
      <View style={styles.metaContainer}>
        <Text style={styles.date}>
          {getRelativeDate(createdAt)}
        </Text>
        {responseCount > 0 && (
          <View style={styles.responseCount}>
            <Ionicons name="people-outline" size={12} color={COLORS.primary} />
            <Text style={styles.responseCountText}>
              {responseCount} {getResponseLabel(responseCount)}
            </Text>
          </View>
        )}
        {hasResponded && (
          <View style={styles.respondedBadge}>
            <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
            <Text style={styles.respondedText}>Вы откликнулись</Text>
          </View>
        )}
      </View>
      
      <Card.Content>
        {showClientInfo && (
          <Card.Row>
            <Card.Label>Клиент:</Card.Label>
            <Card.Value>{clientName}</Card.Value>
          </Card.Row>
        )}
        
        <Card.Row>
          <Card.Label>Область права:</Card.Label>
          <Card.Value>{getLawAreaLabel(lawArea)}</Card.Value>
        </Card.Row>
        
        <Card.Row>
          <Card.Label>Бюджет:</Card.Label>
          <Card.Value>{getPriceRangeLabel(priceRange)}</Card.Value>
        </Card.Row>
        
        {experienceRequired > 0 && (
          <Card.Row>
            <Card.Label>Опыт работы:</Card.Label>
            <Card.Value>От {experienceRequired} лет</Card.Value>
          </Card.Row>
        )}
      </Card.Content>
      
      {description && (
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      )}
      
      <Card.Footer>
        <View style={styles.leftFooter}>
          {getStatusBadge(safeRequest.status)}
        </View>
        
        <View style={styles.viewDetails}>
          <Text style={styles.viewDetailsText}>Подробнее</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </View>
      </Card.Footer>
    </Card>
  );
};

// Helper function to get correct response form in Russian
const getResponseLabel = (count) => {
  count = parseInt(count) || 0;
  if (count === 1) return 'отклик';
  if (count > 1 && count < 5) return 'отклика';
  return 'откликов';
};

// Получаем более читаемые названия областей права
const getLawAreaLabel = (value) => {
  const labels = {
    'family': 'Семейное право',
    'criminal': 'Уголовное право',
    'civil': 'Гражданское право',
    'business': 'Корпоративное право',
    'tax': 'Налоговое право'
  };
  
  return labels[value] || value;
};

// Получаем более читаемые названия ценовых диапазонов
const getPriceRangeLabel = (value) => {
  const labels = {
    'free': 'Бесплатная консультация',
    'low': 'До 5 000 ₸',
    'medium': 'От 5 000 до 20 000 ₸',
    'high': 'От 20 000 до 50 000 ₸',
    'premium': 'От 50 000 ₸'
  };
  
  return labels[value] || value;
};

const styles = StyleSheet.create({
  description: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 16,
  },
  leftFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  responseCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  responseCountText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 2,
  },
  urgentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '15',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  urgentText: {
    fontSize: 11,
    color: COLORS.error,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  respondedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '15',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  respondedText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '500',
    marginLeft: 2,
  },
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  }
});

export default RequestCard; 