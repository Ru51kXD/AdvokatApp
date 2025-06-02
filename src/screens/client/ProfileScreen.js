import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AvatarPickerModal from '../../components/AvatarPickerModal';
import Button from '../../components/Button';
import UserAvatar from '../../components/UserAvatar';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import ImageService from '../../services/ImageService';
import { RequestService } from '../../services/RequestService';

const ClientProfileScreen = ({ navigation }) => {
  const { authState, signOut } = useAuth();
  
  // Состояние для настроек
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Состояние для статистики
  const [statistics, setStatistics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Состояние для аватарки
  const [hasAvatar, setHasAvatar] = useState(false);
  const [isAvatarPickerVisible, setIsAvatarPickerVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarKey, setAvatarKey] = useState(0); // Для принудительного обновления аватара
  
  // Проверяем наличие аватара при загрузке экрана
  useEffect(() => {
    const checkAvatar = async () => {
      if (authState?.user?.id) {
        const result = await ImageService.getUserAvatar(authState.user.id);
        setHasAvatar(result.success);
      }
    };
    
    checkAvatar();
  }, [authState?.user?.id]);
  
  // Загрузка статистики при фокусе на экране
  useFocusEffect(
    useCallback(() => {
      const loadStatistics = async () => {
        if (!authState?.user?.id) return;
        
        setLoadingStats(true);
        try {
          const stats = await RequestService.getRequestsStatistics(authState.user.id);
          setStatistics(stats);
        } catch (error) {
          console.error('Ошибка при загрузке статистики:', error);
          Alert.alert('Ошибка', 'Не удалось загрузить статистику заявок');
        } finally {
          setLoadingStats(false);
        }
      };
      
      loadStatistics();
    }, [authState?.user?.id])
  );

  const handleLogout = async () => {
    Alert.alert(
      'Выход',
      'Вы действительно хотите выйти из аккаунта?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Выйти', 
          onPress: async () => {
            const result = await signOut();
            if (result.success) {
              // Вместо использования navigation.reset, просто выходим
              // Приложение автоматически переключится на AuthStack через AppNavigation
              console.log('Выход из системы выполнен успешно');
            } else {
              Alert.alert('Ошибка', result.error || 'Не удалось выйти из аккаунта');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const handleEditProfile = () => {
    // Navigate to the EditProfileScreen
    navigation.navigate('EditProfileScreen', {
      userData: {
        username: authState?.user?.username || '',
        email: authState?.user?.email || '',
        phone: authState?.user?.phone || '',
      }
    });
  };

  const handleToggleNotifications = () => {
    setNotificationsEnabled(prev => !prev);
    Alert.alert(
      'Уведомления ' + (notificationsEnabled ? 'выключены' : 'включены'),
      'Настройка сохранена.'
    );
  };

  const handleSupport = () => {
    navigation.navigate('Support');
  };

  const handlePrivacyAndSecurity = () => {
    navigation.navigate('PrivacyAndSecurity');
  };
  
  const handleDataSettings = () => {
    Alert.alert(
      'Настройки данных',
      'Здесь вы можете управлять своими данными',
      [
        { text: 'Экспорт данных', onPress: () => Alert.alert('Информация', 'Функция экспорта данных будет доступна в следующем обновлении.') },
        { text: 'Удалить аккаунт', onPress: () => Alert.alert('Внимание', 'Удаление аккаунта приведет к потере всех ваших данных. Эта операция необратима.') },
        { text: 'Отмена', style: 'cancel' }
      ]
    );
  };

  // Обработчики для аватарки
  const handleAvatarPress = () => {
    setIsAvatarPickerVisible(true);
  };
  
  const handlePickImage = async () => {
    setIsAvatarPickerVisible(false);
    setIsLoading(true);
    
    try {
      const result = await ImageService.pickImage();
      
      if (result.success && result.image) {
        const saveResult = await ImageService.saveUserAvatar(authState.user.id, result.image);
        
        if (saveResult.success) {
          setHasAvatar(true);
          setAvatarKey(prev => prev + 1); // Обновляем ключ для принудительного обновления аватара
          Alert.alert('Успешно', 'Аватар успешно обновлен');
        } else {
          Alert.alert('Ошибка', saveResult.error || 'Не удалось сохранить аватар');
        }
      }
    } catch (error) {
      console.error('Ошибка при выборе изображения:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при выборе изображения');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTakePhoto = async () => {
    setIsAvatarPickerVisible(false);
    setIsLoading(true);
    
    try {
      const result = await ImageService.takePhoto();
      
      if (result.success && result.image) {
        const saveResult = await ImageService.saveUserAvatar(authState.user.id, result.image);
        
        if (saveResult.success) {
          setHasAvatar(true);
          setAvatarKey(prev => prev + 1); // Обновляем ключ для принудительного обновления аватара
          Alert.alert('Успешно', 'Аватар успешно обновлен');
        } else {
          Alert.alert('Ошибка', saveResult.error || 'Не удалось сохранить аватар');
        }
      }
    } catch (error) {
      console.error('Ошибка при съемке фото:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при съемке фото');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveAvatar = async () => {
    setIsAvatarPickerVisible(false);
    setIsLoading(true);
    
    try {
      const result = await ImageService.removeUserAvatar(authState.user.id);
      
      if (result.success) {
        setHasAvatar(false);
        setAvatarKey(prev => prev + 1); // Обновляем ключ для принудительного обновления аватара
        Alert.alert('Успешно', 'Аватар успешно удален');
      } else {
        Alert.alert('Ошибка', result.error || 'Не удалось удалить аватар');
      }
    } catch (error) {
      console.error('Ошибка при удалении аватара:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при удалении аватара');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToAdminPanel = () => {
    navigation.navigate('AdminScreen');
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Профиль пользователя */}
        <View style={styles.profileHeader}>
          {isLoading ? (
            <View style={styles.avatarContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <UserAvatar
              key={avatarKey}
              userId={authState?.user?.id}
              username={authState?.user?.username || 'Пользователь'}
              size={80}
              isLawyer={false}
              showEditButton={true}
              onEditPress={handleAvatarPress}
              style={styles.avatar}
            />
          )}
          
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{authState?.user?.username || 'Пользователь'}</Text>
            <Text style={styles.userType}>Клиент</Text>
          </View>
          
          <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Основная информация */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Контактная информация</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{authState?.user?.email || 'Нет данных'}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{authState?.user?.phone || 'Не указан'}</Text>
          </View>
        </View>

        {/* Статистика */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Статистика</Text>
          
          {loadingStats ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>Загрузка статистики...</Text>
            </View>
          ) : (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{statistics?.total || 0}</Text>
                <Text style={styles.statLabel}>Заявок создано</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{statistics?.inProgress || 0}</Text>
                <Text style={styles.statLabel}>Заявок в работе</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{statistics?.completed || 0}</Text>
                <Text style={styles.statLabel}>Заявок завершено</Text>
              </View>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={async () => {
              setLoadingStats(true);
              try {
                const stats = await RequestService.getRequestsStatistics(authState.user.id);
                setStatistics(stats);
                Alert.alert('Успешно', 'Статистика обновлена');
              } catch (error) {
                Alert.alert('Ошибка', 'Не удалось обновить статистику');
              } finally {
                setLoadingStats(false);
              }
            }}
          >
            <Ionicons name="refresh" size={16} color={COLORS.primary} />
            <Text style={styles.refreshText}>Обновить статистику</Text>
          </TouchableOpacity>
        </View>

        {/* Настройки */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Настройки</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.settingText}>Уведомления</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: COLORS.lightGrey, true: COLORS.primary + '80' }}
              thumbColor={notificationsEnabled ? COLORS.primary : COLORS.grey}
            />
          </View>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleDataSettings}>
            <View style={styles.settingLeft}>
              <Ionicons name="cloud-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.settingText}>Управление данными</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleSupport}>
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.settingText}>Помощь и поддержка</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyAndSecurity}>
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.settingText}>Приватность и безопасность</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
          </TouchableOpacity>
          
          {/* Admin Panel Button */}
          <TouchableOpacity style={styles.settingItem} onPress={navigateToAdminPanel}>
            <View style={styles.settingLeft}>
              <Ionicons name="settings-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.settingText}>Панель администратора</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
          </TouchableOpacity>
        </View>

        {/* Кнопка выхода */}
        <Button 
          title="Выйти из аккаунта"
          onPress={handleLogout}
          variant="outline"
          color="error"
          style={styles.logoutButton}
        />
        
        {/* Только для разработки, в релизе удалить */}
        {__DEV__ && (
          <TouchableOpacity 
            style={styles.devButton}
            onPress={navigateToAdminPanel}
          >
            <Text style={styles.devButtonText}>Админ-панель (DEV)</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      
      {/* Модальное окно выбора аватара */}
      <AvatarPickerModal
        visible={isAvatarPickerVisible}
        onClose={() => setIsAvatarPickerVisible(false)}
        onPickFromGallery={handlePickImage}
        onTakePhoto={handleTakePhoto}
        onRemoveAvatar={handleRemoveAvatar}
        hasAvatar={hasAvatar}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  userType: {
    fontSize: 16,
    color: COLORS.primary,
  },
  editProfileButton: {
    padding: 8,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 8,
    backgroundColor: COLORS.lightGrey,
    borderRadius: 8,
  },
  refreshText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 12,
  },
  logoutButton: {
    marginTop: 8,
    marginBottom: 32,
  },
  devButton: {
    padding: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  devButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 8,
    color: COLORS.textSecondary,
  },
});

export default ClientProfileScreen; 
 
 
 