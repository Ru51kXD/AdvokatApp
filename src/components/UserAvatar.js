import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import ImageService from '../services/ImageService';

const UserAvatar = ({ 
  userId, 
  username,
  size = 80, 
  isLawyer = false,
  showEditButton = false,
  onEditPress = null,
  style
}) => {
  const [loading, setLoading] = useState(true);
  const [avatarUri, setAvatarUri] = useState(null);
  const [error, setError] = useState(false);

  // Получаем инициалы из имени пользователя
  const initials = ImageService.getInitials(username);
  
  // Получаем цвет фона в зависимости от типа пользователя и ID
  const backgroundColor = isLawyer 
    ? ImageService.getLawyerAvatarColor(userId || 0)
    : ImageService.getClientAvatarColor(userId || 0);

  // Загружаем аватар при монтировании компонента
  useEffect(() => {
    const loadAvatar = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      
      try {
        const result = await ImageService.getUserAvatar(userId);
        
        if (result.success && result.avatarUri) {
          setAvatarUri(result.avatarUri);
        } else {
          setError(true);
        }
      } catch (error) {
        console.error('Ошибка при загрузке аватара:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    loadAvatar();
  }, [userId]);

  // Создаем стили на основе переданных пропсов
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: backgroundColor,
  };
  
  const initialsStyle = {
    fontSize: size * 0.4,
  };
  
  const imageStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };
  
  const editButtonSize = size * 0.3;
  const editButtonStyle = {
    width: editButtonSize,
    height: editButtonSize,
    borderRadius: editButtonSize / 2,
    bottom: 0,
    right: 0,
  };
  
  // Если происходит загрузка, показываем индикатор
  if (loading) {
    return (
      <View style={[containerStyle, styles.container, style]}>
        <ActivityIndicator size="small" color={COLORS.white} />
      </View>
    );
  }

  // Если есть аватар, отображаем его
  if (avatarUri && !error) {
    return (
      <View style={[styles.wrapper, style]}>
        <Image 
          source={{ uri: avatarUri }} 
          style={[imageStyle, styles.image]}
          onError={() => setError(true)}
        />
        
        {showEditButton && onEditPress && (
          <TouchableOpacity 
            style={[styles.editButton, editButtonStyle]} 
            onPress={onEditPress}
          >
            <Ionicons name="camera" size={editButtonSize * 0.6} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // По умолчанию отображаем инициалы на цветном фоне
  return (
    <View style={[styles.wrapper, style]}>
      <View style={[containerStyle, styles.container]}>
        <Text style={[styles.initials, initialsStyle]}>{initials}</Text>
      </View>
      
      {showEditButton && onEditPress && (
        <TouchableOpacity 
          style={[styles.editButton, editButtonStyle]} 
          onPress={onEditPress}
        >
          <Ionicons name="camera" size={editButtonSize * 0.6} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: 'white',
    fontWeight: 'bold',
  },
  image: {
    resizeMode: 'cover',
  },
  editButton: {
    position: 'absolute',
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  }
});

export default UserAvatar; 