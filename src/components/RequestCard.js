import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import Card from './Card';
import { COLORS, REQUEST_STATUS } from '../constants';

const RequestCard = ({ request, onPress, showResponses = false }) => {
  const getStatusBadge = (status) => {
    let type = 'default';
    let text = 'В ожидании';
    
    switch (status) {
      case REQUEST_STATUS.OPEN:
        type = 'default';
        text = 'Открыт';
        break;
      case REQUEST_STATUS.IN_PROGRESS:
        type = 'warning';
        text = 'В процессе';
        break;
      case REQUEST_STATUS.COMPLETED:
        type = 'success';
        text = 'Завершен';
        break;
      case REQUEST_STATUS.CANCELLED:
        type = 'error';
        text = 'Отменен';
        break;
    }
    
    return <Card.Badge text={text} type={type} />;
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  return (
    <Card onPress={onPress}>
      <Card.Title>{request.title}</Card.Title>
      
      <Card.Content>
        <Card.Row>
          <Card.Label>Область права:</Card.Label>
          <Card.Value>{request.law_area}</Card.Value>
        </Card.Row>
        
        {request.price_range && (
          <Card.Row>
            <Card.Label>Бюджет:</Card.Label>
            <Card.Value>{request.price_range}</Card.Value>
          </Card.Row>
        )}
        
        {request.experience_required > 0 && (
          <Card.Row>
            <Card.Label>Опыт работы:</Card.Label>
            <Card.Value>От {request.experience_required} лет</Card.Value>
          </Card.Row>
        )}
        
        {request.client_name && (
          <Card.Row>
            <Card.Label>Клиент:</Card.Label>
            <Card.Value>{request.client_name}</Card.Value>
          </Card.Row>
        )}
      </Card.Content>
      
      {request.description && (
        <Text style={styles.description} numberOfLines={2}>
          {request.description}
        </Text>
      )}
      
      <Card.Footer>
        <View style={styles.leftFooter}>
          {getStatusBadge(request.status)}
          <Text style={styles.date}>
            {formatDate(request.created_at)}
          </Text>
        </View>
        
        {showResponses && request.response_count !== undefined && (
          <View style={styles.responseCount}>
            <Text style={styles.responseCountText}>
              {request.response_count} {getResponseLabel(request.response_count)}
            </Text>
          </View>
        )}
      </Card.Footer>
    </Card>
  );
};

// Helper function to get correct response form in Russian
const getResponseLabel = (count) => {
  if (count === 1) return 'отклик';
  if (count > 1 && count < 5) return 'отклика';
  return 'откликов';
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
    marginLeft: 8,
  },
  responseCount: {
    backgroundColor: COLORS.primary + '20',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  responseCountText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  }
});

export default RequestCard; 