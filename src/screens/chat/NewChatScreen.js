import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import ChatService from '../../services/ChatService';
import ImageService from '../../services/ImageService';

const NewChatScreen = ({ navigation }) => {
  const { authState } = useAuth();
  const user = authState.user || {}; // Safe access to user object
  
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка доступных пользователей для беседы
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Проверка авторизации
        if (!authState.isAuthenticated || !user.id) {
          setError('Необходимо войти в систему для доступа к чату');
          setLoading(false);
          return;
        }
        
        const data = await ChatService.getPotentialChatPartners(user.id);
        setUsers(data);
        setFilteredUsers(data);
      } catch (err) {
        console.error('Error loading potential chat partners:', err);
        setError('Не удалось загрузить список пользователей: ' + (err.message || 'Неизвестная ошибка'));
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [authState, user.id]);

  // Фильтрация пользователей по поисковому запросу
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = users.filter(u => 
        u.username.toLowerCase().includes(query) ||
        (u.specialization && u.specialization.toLowerCase().includes(query)) ||
        (u.city && u.city.toLowerCase().includes(query))
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  // Начать беседу с выбранным пользователем
  const handleSelectUser = async (selectedUser) => {
    try {
      // Проверка авторизации
      if (!authState.isAuthenticated || !user.id) {
        alert('Необходимо войти в систему для отправки сообщений');
        return;
      }
      
      // Создаем первое сообщение и беседу
      const message = "Здравствуйте! Хотел бы обсудить с вами юридический вопрос.";
      const result = await ChatService.sendMessage(user.id, selectedUser.id, message);
      
      // Переходим к экрану чата
      navigation.navigate('ChatScreen', {
        conversationId: result.conversation.id,
        title: selectedUser.username || selectedUser.name || 'Пользователь'
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Не удалось начать беседу: ' + (error.message || 'Неизвестная ошибка'));
    }
  };

  // Рендер элемента пользователя
  const renderUserItem = ({ item }) => {
    // Цвет аватара в зависимости от типа пользователя
    const color = user.user_type === 'client'
      ? ImageService.getLawyerAvatarColor(item.id)
      : ImageService.getClientAvatarColor(item.id);
    const initials = ImageService.getInitials(item.name || item.username);
    
    // Отображаемое имя пользователя (с приоритетом полного имени)
    const displayName = item.name || item.username;
    
    return (
      <TouchableOpacity 
        style={styles.userItem}
        onPress={() => handleSelectUser(item)}
      >
        <View style={[styles.avatar, { backgroundColor: color }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{displayName}</Text>
          
          {user.user_type === 'client' && item.specialization ? (
            <View style={styles.detailRow}>
              <Text style={styles.specialization}>{item.specialization}</Text>
              {item.experience && (
                <Text style={styles.experience}>{item.experience} лет опыта</Text>
              )}
            </View>
          ) : null}
          
          {user.user_type === 'client' && item.city ? (
            <Text style={styles.city}>{item.city}</Text>
          ) : null}
          
          {user.user_type === 'lawyer' && item.request_count > 0 ? (
            <Text style={styles.requestCount}>{item.request_count} активных заявок</Text>
          ) : null}
        </View>
        
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={COLORS.textSecondary} 
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          {!authState.isAuthenticated && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.retryText}>Войти</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.retryButton, { marginTop: 10 }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryText}>Назад</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery.length > 0 
                  ? 'По вашему запросу ничего не найдено' 
                  : 'Нет доступных пользователей'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: 40,
  },
  clearButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
  list: {
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  specialization: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  experience: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  city: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  requestCount: {
    fontSize: 14,
    color: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  }
});

export default NewChatScreen; 