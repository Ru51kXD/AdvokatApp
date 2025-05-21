import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Card from './Card';
import { COLORS, RESPONSE_STATUS } from '../constants';
import Button from './Button';

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
  
  return (
    <Card onPress={onPress}>
      {/* Lawyer Info */}
      <View style={styles.header}>
        <Image source={getAvatar()} style={styles.avatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{response.lawyer_name}</Text>
          <Text style={styles.specialization}>{response.specialization || 'Юрист'}</Text>
          {response.rating > 0 && renderRating(response.rating)}
        </View>
        {getStatusBadge(response.status)}
      </View>
      
      {/* Response Message */}
      {response.message && (
        <Text style={styles.message}>{response.message}</Text>
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
          <TouchableOpacity style={styles.contactButton} onPress={onPress}>
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