import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Card from './Card';
import { COLORS } from '../constants';
import ImageService from '../services/ImageService';
import { Ionicons } from '@expo/vector-icons';

const LawyerCard = ({ lawyer, onPress }) => {
  if (!lawyer) {
    return null;
  }

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
          <Card.Badge 
            text={lawyer.experience > 5 ? 'Опытный адвокат' : 'Адвокат'}
            type={lawyer.rating >= 4 ? 'success' : 'default'}
          />
          <Text style={styles.contactInfo}>Подробнее</Text>
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
  contactInfo: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LawyerCard; 