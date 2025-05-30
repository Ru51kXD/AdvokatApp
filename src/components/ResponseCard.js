import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, RESPONSE_STATUS } from '../constants';
import Button from './Button';
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

const ResponseCard = ({ 
  response, 
  onPress, 
  onAccept, 
  onReject,
  isClient = false, 
}) => {
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
  
  const getStatusBadge = (status) => {
    let type = 'default';
    let text = 'Ожидание';
    
    switch (status) {
      case RESPONSE_STATUS.PENDING:
        type = 'default';
        text = 'На рассмотрении';
        break;
      case RESPONSE_STATUS.ACCEPTED:
        type = 'success';
        text = 'Принято';
        break;
      case RESPONSE_STATUS.REJECTED:
        type = 'error';
        text = 'Отклонено';
        break;
    }
    
    return <Card.Badge text={text} type={type} />;
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get placeholder avatar if no image provided
  const getAvatar = () => {
    return require('../../assets/images/icon.png');
  };

  // Safely extract response data
  const lawyerName = safeText(response.lawyer_name || response.username || 'Адвокат');
  const specialization = safeText(response.specialization || 'Юрист');
  const message = safeText(response.message);
  
  return (
    <Card onPress={onPress}>
      {/* Lawyer Info */}
      <View style={styles.header}>
        <Image source={getAvatar()} style={styles.avatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{lawyerName}</Text>
          <Text style={styles.specialization}>{specialization}</Text>
          {response.rating > 0 && renderRating(response.rating)}
        </View>
        {getStatusBadge(response.status)}
      </View>
      
      {/* Response Message */}
      {message && (
        <Text style={styles.message}>{message}</Text>
      )}
      
      {/* Additional Info */}
      <Card.Content>
        {response.experience > 0 && (
          <Card.Row>
            <Card.Label>Опыт работы:</Card.Label>
            <Card.Value>{response.experience} {getExperienceLabel(response.experience)}</Card.Value>
          </Card.Row>
        )}
        
        <Card.Row>
          <Card.Label>Дата отклика:</Card.Label>
          <Card.Value>{formatDate(response.created_at)}</Card.Value>
        </Card.Row>
      </Card.Content>
      
      {/* Actions for client */}
      {isClient && response.status === RESPONSE_STATUS.PENDING && (
        <View style={styles.actions}>
          <Button 
            title="Принять" 
            onPress={() => onAccept(response.id)} 
            style={styles.actionButton}
          />
          <Button 
            title="Отклонить" 
            onPress={() => onReject(response.id)}
            variant="outline"
            style={styles.actionButton}
          />
        </View>
      )}
      
      {/* Contact info for accepted responses */}
      {response.status === RESPONSE_STATUS.ACCEPTED && (
        <Card.Footer>
          <TouchableOpacity 
            style={styles.contactButton} 
            onPress={() => onPress && onPress(response)}
          >
            <Text style={styles.contactText}>Связаться с юристом</Text>
          </TouchableOpacity>
        </Card.Footer>
      )}
    </Card>
  );
};

// Helper function to get correct year form in Russian
const getExperienceLabel = (years) => {
  if (years === 1) return 'год';
  if (years > 1 && years < 5) return 'года';
  return 'лет';
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  specialization: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  ratingStars: {
    color: '#FFC107',
    fontSize: 14,
  },
  ratingNumber: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  message: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 16,
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  contactButton: {
    padding: 8,
    alignItems: 'center',
    width: '100%',
  },
  contactText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ResponseCard; 