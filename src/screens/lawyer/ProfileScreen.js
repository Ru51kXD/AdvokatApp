import React, { useState, useEffect, useCallback } from 'react';
import {   View,   StyleSheet,   Text,   ScrollView,   TouchableOpacity,  Image,  Alert,  Switch,  ActivityIndicator,  Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, KAZAKHSTAN_CITIES, LAW_AREAS, PRICE_RANGES } from '../../constants';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Picker from '../../components/Picker';
import { useAuth } from '../../contexts/AuthContext';
import { LawyerService } from '../../services/LawyerService';
import { RequestService } from '../../services/RequestService';

const LawyerProfileScreen = ({ navigation }) => {
  const { authState, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    specialization: '',
    experience: '',
    price_range: '',
    bio: '',
    city: '',
    address: '',
  });
  
  // Stats data for dashboard
  const [stats, setStats] = useState({
    totalClients: 0,
    activeRequests: 0,
    totalEarnings: 0,
    responseRate: 0,
    reviewCount: 0
  });

  const loadProfile = useCallback(async () => {
    if (!authState.user) return;
    
    setLoading(true);
    try {
      const lawyerProfile = await LawyerService.getLawyerProfile(authState.user.id);
      
      if (lawyerProfile) {
        setProfileData(lawyerProfile);
        setFormData({
          specialization: lawyerProfile.specialization || '',
          experience: lawyerProfile.experience ? lawyerProfile.experience.toString() : '',
          price_range: lawyerProfile.price_range || '',
          bio: lawyerProfile.bio || '',
          city: lawyerProfile.city || '',
          address: lawyerProfile.address || '',
        });
        
        // Calculate some stats (using demo data for now since we don't have real data)
        // In a real app, this would come from backend APIs
        setStats({
          totalClients: Math.floor(Math.random() * 20) + 5, // 5-25 clients
          activeRequests: Math.floor(Math.random() * 8) + 1, // 1-8 active requests
          totalEarnings: Math.floor(Math.random() * 500000) + 100000, // 100,000-600,000 tenge
          responseRate: Math.floor(Math.random() * 30) + 70, // 70-100% response rate
          reviewCount: Math.floor(Math.random() * 15) + 1, // 1-15 reviews
        });
      } else {
        // If no lawyer profile is found, try to get it from registration data
        const { getLawyerByUserId } = await import('../../database/database');
        const lawyer = await getLawyerByUserId(authState.user.id);
        
        if (lawyer) {
          setProfileData(lawyer);
          setFormData({
            specialization: lawyer.specialization || '',
            experience: lawyer.experience ? lawyer.experience.toString() : '',
            price_range: lawyer.price_range || '',
            bio: lawyer.bio || '',
            city: lawyer.city || '',
            address: lawyer.address || '',
          });
          
          // Demo stats
          setStats({
            totalClients: Math.floor(Math.random() * 20) + 5,
            activeRequests: Math.floor(Math.random() * 8) + 1,
            totalEarnings: Math.floor(Math.random() * 500000) + 100000,
            responseRate: Math.floor(Math.random() * 30) + 70,
            reviewCount: Math.floor(Math.random() * 15) + 1,
          });
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      Alert.alert('Ошибка', 'Не удалось загрузить данные профиля.');
    } finally {
      setLoading(false);
    }
  }, [authState.user]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
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

  const handleToggleNotifications = () => {
    setNotificationsEnabled(prev => !prev);
  };

  const handleToggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const experienceValue = formData.experience ? parseInt(formData.experience, 10) : 0;
      
      await LawyerService.updateLawyerProfile(authState.user.id, {
        ...formData,
        experience: experienceValue,
      });
      
      Alert.alert('Успешно', 'Профиль успешно обновлен');
      setIsEditing(false);
      loadProfile();
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось обновить профиль. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePrivacyAndSecurity = () => {
    navigation.navigate('PrivacyAndSecurity');
  };
  
  const handleBankDetails = () => {
    navigation.navigate('BankDetails');
  };
  
  const handleSupport = () => {
    navigation.navigate('Support');
  };

  if (loading && !profileData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Загрузка профиля...</Text>
      </View>
    );
  }

  // Format the earnings with currency symbol
  const formattedEarnings = new Intl.NumberFormat('kk-KZ', {
    style: 'currency',
    currency: 'KZT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(stats.totalEarnings);

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Профиль юриста */}
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
            <Text style={styles.name}>{authState.user?.username || 'Адвокат'}</Text>
            <Text style={styles.userType}>
              {profileData?.specialization || 'Адвокат'}
            </Text>
            {profileData?.rating > 0 && (
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingText}>
                  {'★'.repeat(Math.floor(profileData.rating))}
                  {'☆'.repeat(5 - Math.floor(profileData.rating))}
                </Text>
                <Text style={styles.ratingValue}>
                  {profileData.rating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity style={styles.editProfileButton} onPress={handleToggleEdit}>
            <Ionicons 
              name={isEditing ? "close" : "create-outline"} 
              size={24} 
              color={COLORS.primary} 
            />
          </TouchableOpacity>
        </View>

        {/* Dashboard статистики */}
        {!isEditing && (
          <View style={styles.dashboardSection}>
            <Text style={styles.sectionTitle}>Панель адвоката</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalClients}</Text>
                <Text style={styles.statLabel}>Клиентов</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.activeRequests}</Text>
                <Text style={styles.statLabel}>Активных заявок</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.reviewCount}</Text>
                <Text style={styles.statLabel}>Отзывов</Text>
              </View>
            </View>
            
            <View style={styles.earningsCard}>
              <View>
                <Text style={styles.earningsLabel}>Общий заработок</Text>
                <Text style={styles.earningsValue}>{formattedEarnings}</Text>
              </View>
              <View style={styles.responseRateContainer}>
                <Text style={styles.responseRateLabel}>Скорость отклика</Text>
                <View style={styles.responseRateBar}>
                  <View style={[styles.responseRateFill, { width: `${stats.responseRate}%` }]} />
                </View>
                <Text style={styles.responseRateValue}>{stats.responseRate}%</Text>
              </View>
            </View>
            
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => navigation.navigate('RequestsTab')}
              >
                <Ionicons name="briefcase-outline" size={24} color={COLORS.primary} />
                <Text style={styles.quickActionText}>Заявки</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => navigation.navigate('ChatsTab')}
              >
                <Ionicons name="chatbubbles-outline" size={24} color={COLORS.primary} />
                <Text style={styles.quickActionText}>Чаты</Text>
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationText}>3</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Форма редактирования */}
        {isEditing ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Редактирование профиля</Text>
            
            <Picker
              label="Специализация"
              placeholder="Выберите вашу специализацию"
              items={LAW_AREAS}
              value={formData.specialization}
              onValueChange={(value) => handleInputChange('specialization', value)}
            />
            
            <Input
              label="Опыт работы (лет)"
              placeholder="Укажите ваш опыт в годах"
              value={formData.experience}
              onChangeText={(value) => handleInputChange('experience', value)}
              keyboardType="numeric"
            />
            
            <Picker
              label="Стоимость услуг"
              placeholder="Выберите диапазон стоимости"
              items={PRICE_RANGES}
              value={formData.price_range}
              onValueChange={(value) => handleInputChange('price_range', value)}
            />
            
            <Picker
              label="Город"
              placeholder="Выберите город"
              items={KAZAKHSTAN_CITIES}
              value={formData.city}
              onValueChange={(value) => handleInputChange('city', value)}
            />
            
            <Input
              label="Адрес"
              placeholder="Укажите ваш рабочий адрес"
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
            />
            
            <Input
              label="О себе"
              placeholder="Расскажите о своей практике и опыте работы"
              value={formData.bio}
              onChangeText={(value) => handleInputChange('bio', value)}
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.actionButtons}>
              <Button
                title="Сохранить"
                onPress={handleSaveProfile}
                style={styles.saveButton}
                loading={loading}
              />
              <Button
                title="Отмена"
                onPress={handleToggleEdit}
                variant="outline"
                style={styles.cancelButton}
              />
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Информация профиля</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Специализация:</Text>
              <Text style={styles.infoValue}>{profileData?.specialization || 'Не указана'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Опыт работы:</Text>
              <Text style={styles.infoValue}>
                {profileData?.experience ? `${profileData.experience} ${getYearText(profileData.experience)}` : 'Не указан'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Стоимость услуг:</Text>
              <Text style={styles.infoValue}>{profileData?.price_range || 'Не указана'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Город:</Text>
              <Text style={styles.infoValue}>{profileData?.city || 'Не указан'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Адрес:</Text>
              <Text style={styles.infoValue}>{profileData?.address || 'Не указан'}</Text>
            </View>
            
            {profileData?.bio && (
              <View style={styles.bioContainer}>
                <Text style={styles.bioLabel}>О себе:</Text>
                <Text style={styles.bioText}>{profileData.bio}</Text>
              </View>
            )}
          </View>
        )}

        {/* Настройки */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Настройки</Text>
          
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Уведомления</Text>
              <Text style={styles.settingDescription}>
                Получать уведомления о новых заявках и сообщениях
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.settingButton}
            onPress={handlePrivacyAndSecurity}
          >
            <View style={styles.settingButtonContent}>
              <Ionicons name="shield-checkmark-outline" size={22} color={COLORS.text} />
              <Text style={styles.settingButtonText}>Приватность и безопасность</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={COLORS.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingButton}
            onPress={handleBankDetails}
          >
            <View style={styles.settingButtonContent}>
              <Ionicons name="cash-outline" size={22} color={COLORS.text} />
              <Text style={styles.settingButtonText}>Банковские реквизиты</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={COLORS.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingButton}
            onPress={handleSupport}
          >
            <View style={styles.settingButtonContent}>
              <Ionicons name="help-circle-outline" size={22} color={COLORS.text} />
              <Text style={styles.settingButtonText}>Поддержка</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={COLORS.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.settingButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <View style={styles.settingButtonContent}>
              <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
              <Text style={styles.logoutButtonText}>Выйти из аккаунта</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.versionText}>Версия приложения: 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper function to get correct year text in Russian
const getYearText = (years) => {
  if (years === 1) return 'год';
  if (years > 1 && years < 5) return 'года';
  return 'лет';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
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
        elevation: 3,
      },
    }),
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
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 14,
    marginRight: 4,
  },
  ratingValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  editProfileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
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
        elevation: 3,
      },
    }),
  },
  dashboardSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
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
        elevation: 3,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  earningsCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  earningsLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  earningsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  responseRateContainer: {
    marginTop: 8,
  },
  responseRateLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  responseRateBar: {
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    marginBottom: 4,
  },
  responseRateFill: {
    height: 8,
    backgroundColor: COLORS.success,
    borderRadius: 4,
  },
  responseRateValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.success,
    textAlign: 'right',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 12,
    position: 'relative',
  },
  quickActionText: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'red',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    width: 150,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  bioContainer: {
    marginTop: 8,
  },
  bioLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  bioText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  actionButtons: {
    marginTop: 16,
  },
  saveButton: {
    marginBottom: 8,
  },
  cancelButton: {
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    maxWidth: '80%',
  },
  settingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  settingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingButtonText: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 12,
  },
  logoutButton: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    color: COLORS.error,
    marginLeft: 12,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
});

export default LawyerProfileScreen; 