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
  const { user } = useAuth();
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
        const data = await ChatService.getPotentialChatPartners(user.id);
        setUsers(data);
        setFilteredUsers(data);
      } catch (err) {
        console.error('Error loading potential chat partners:', err);
        setError('Не удалось загрузить список пользователей');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

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
      // Создаем первое сообщение и беседу
      const message = "Здравствуйте! Хотел бы обсудить с вами юридический вопрос.";
      const result = await ChatService.sendMessage(user.id, selectedUser.id, message);
      
      // Переходим к экрану чата
      navigation.replace('ChatScreen', {
        conversationId: result.conversationId,
        title: selectedUser.username
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Не удалось начать беседу');
    }
  };

  // Рендер элемента пользователя
  const renderUserItem = ({ item }) => {
    // Цвет аватара в зависимости от типа пользователя
    const color = user.userType === 'client'
      ? ImageService.getLawyerAvatarColor(item.id)
      : ImageService.getClientAvatarColor(item.id);
    const initials = ImageService.getInitials(item.username);
    
    return (
      <TouchableOpacity 
        style={styles.userItem}
        onPress={() => handleSelectUser(item)}
      >
        <View style={[styles.avatar, { backgroundColor: color }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.username}</Text>
          
          {user.userType === 'client' && item.specialization ? (
            <View style={styles.detailRow}>
              <Text style={styles.specialization}>{item.specialization}</Text>
              {item.experience && (
                <Text style={styles.experience}>{item.experience} лет опыта</Text>
              )}
            </View>
          ) : null}
          
          {user.userType === 'client' && item.city ? (
            <Text style={styles.city}>{item.city}</Text>
          ) : null}
          
          {user.userType === 'lawyer' && item.request_count > 0 ? (
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
          <TouchableOpacity
            style={styles.retryButton}
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