import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  Image,
  Alert,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { COLORS } from '../../constants';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { RequestService } from '../../services/RequestService';

const ClientProfileScreen = ({ navigation }) => {
  const { authState, signOut } = useAuth();
  
  // Состояние для настроек
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Состояние для статистики
  const [statistics, setStatistics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
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
    // Переход к экрану редактирования профиля
    Alert.alert(
      'Редактирование профиля',
      'Здесь вы можете изменить свои личные данные.',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Продолжить', 
          onPress: () => {
            Alert.alert('Информация', 'Функция редактирования профиля будет доступна в следующем обновлении.');
          }
        }
      ]
    );
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

  const navigateToAdminPanel = () => {
    navigation.navigate('AdminScreen');
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Профиль пользователя */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image 
              source={require('../../../assets/images/icon.png')} 
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          
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
          style={styles.logoutButton}
        />

        <Text style={styles.version}>Версия приложения: 1.0.0</Text>
      </ScrollView>
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
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  userType: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  editProfileButton: {
    padding: 8,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    borderRadius: 8,
    marginTop: 8,
  },
  refreshText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 8,
  },
  logoutButton: {
    marginBottom: 16,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
});

export default ClientProfileScreen; 
 
 
 