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
import ImageService from '../../services/ImageService';
import UserAvatar from '../../components/UserAvatar';
import AvatarPickerModal from '../../components/AvatarPickerModal';

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
  
  // Avatar state
  const [hasAvatar, setHasAvatar] = useState(false);
  const [isAvatarPickerVisible, setIsAvatarPickerVisible] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [avatarKey, setAvatarKey] = useState(0); // For forcing avatar updates
  
  // Stats data for dashboard
  const [stats, setStats] = useState({
    totalClients: 0,
    activeRequests: 0,
    totalEarnings: 0,
    responseRate: 0,
    reviewCount: 0
  });

  // Check for existing avatar
  useEffect(() => {
    const checkAvatar = async () => {
      if (authState?.user?.id) {
        const result = await ImageService.getUserAvatar(authState.user.id);
        setHasAvatar(result.success);
      }
    };
    
    checkAvatar();
  }, [authState?.user?.id]);

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
  
  // Avatar handlers
  const handleAvatarPress = () => {
    setIsAvatarPickerVisible(true);
  };
  
  const handlePickImage = async () => {
    setIsAvatarPickerVisible(false);
    setIsAvatarLoading(true);
    
    try {
      const result = await ImageService.pickImage();
      
      if (result.success && result.image) {
        const saveResult = await ImageService.saveUserAvatar(authState.user.id, result.image);
        
        if (saveResult.success) {
          setHasAvatar(true);
          setAvatarKey(prev => prev + 1); // Force avatar update
          Alert.alert('Успешно', 'Аватар успешно обновлен');
        } else {
          Alert.alert('Ошибка', saveResult.error || 'Не удалось сохранить аватар');
        }
      }
    } catch (error) {
      console.error('Ошибка при выборе изображения:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при выборе изображения');
    } finally {
      setIsAvatarLoading(false);
    }
  };
  
  const handleTakePhoto = async () => {
    setIsAvatarPickerVisible(false);
    setIsAvatarLoading(true);
    
    try {
      const result = await ImageService.takePhoto();
      
      if (result.success && result.image) {
        const saveResult = await ImageService.saveUserAvatar(authState.user.id, result.image);
        
        if (saveResult.success) {
          setHasAvatar(true);
          setAvatarKey(prev => prev + 1); // Force avatar update
          Alert.alert('Успешно', 'Аватар успешно обновлен');
        } else {
          Alert.alert('Ошибка', saveResult.error || 'Не удалось сохранить аватар');
        }
      }
    } catch (error) {
      console.error('Ошибка при съемке фото:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при съемке фото');
    } finally {
      setIsAvatarLoading(false);
    }
  };
  
  const handleRemoveAvatar = async () => {
    setIsAvatarPickerVisible(false);
    setIsAvatarLoading(true);
    
    try {
      const result = await ImageService.removeUserAvatar(authState.user.id);
      
      if (result.success) {
        setHasAvatar(false);
        setAvatarKey(prev => prev + 1); // Force avatar update
        Alert.alert('Успешно', 'Аватар успешно удален');
      } else {
        Alert.alert('Ошибка', result.error || 'Не удалось удалить аватар');
      }
    } catch (error) {
      console.error('Ошибка при удалении аватара:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при удалении аватара');
    } finally {
      setIsAvatarLoading(false);
    }
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
          {isAvatarLoading ? (
            <View style={styles.avatarLoaderContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <UserAvatar
              key={avatarKey}
              userId={authState?.user?.id}
              username={authState?.user?.username || 'Адвокат'}
              size={80}
              isLawyer={true}
              showEditButton={!isEditing}
              onEditPress={handleAvatarPress}
              style={styles.avatar}
            />
          )}
          
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
                <Text style={styles.statValue}>{stats.responseRate}%</Text>
                <Text style={styles.statLabel}>Отклик</Text>
              </View>
            </View>
            
            <View style={styles.earningsCard}>
              <View>
                <Text style={styles.earningsLabel}>Заработано за месяц</Text>
                <Text style={styles.earningsValue}>{formattedEarnings}</Text>
              </View>
              <Ionicons name="trending-up" size={24} color={COLORS.success} />
            </View>
            
            <View style={styles.reviewsRow}>
              <Text style={styles.reviewsText}>
                <Text style={styles.reviewsCount}>{stats.reviewCount}</Text> отзывов
              </Text>
              <TouchableOpacity style={styles.viewReviewsButton}>
                <Text style={styles.viewReviewsText}>Посмотреть все</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Форма редактирования профиля */}
        {isEditing ? (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Редактирование профиля</Text>
            
            <Text style={styles.inputLabel}>Специализация</Text>
            <Picker
              selectedValue={formData.specialization}
              onValueChange={(value) => handleInputChange('specialization', value)}
              items={LAW_AREAS}
              placeholder="Выберите специализацию"
            />
            
            <Text style={styles.inputLabel}>Опыт работы (лет)</Text>
            <Input
              value={formData.experience}
              onChangeText={(value) => handleInputChange('experience', value)}
              placeholder="Введите количество лет опыта"
              keyboardType="numeric"
            />
            
            <Text style={styles.inputLabel}>Ценовой диапазон</Text>
            <Picker
              selectedValue={formData.price_range}
              onValueChange={(value) => handleInputChange('price_range', value)}
              items={PRICE_RANGES}
              placeholder="Выберите ценовой диапазон"
            />
            
            <Text style={styles.inputLabel}>Город</Text>
            <Picker
              selectedValue={formData.city}
              onValueChange={(value) => handleInputChange('city', value)}
              items={KAZAKHSTAN_CITIES}
              placeholder="Выберите город"
            />
            
            <Text style={styles.inputLabel}>Адрес офиса</Text>
            <Input
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              placeholder="Введите адрес офиса"
            />
            
            <Text style={styles.inputLabel}>О себе</Text>
            <Input
              value={formData.bio}
              onChangeText={(value) => handleInputChange('bio', value)}
              placeholder="Расскажите о своем опыте, образовании и т.д."
              multiline
              numberOfLines={5}
              style={styles.textArea}
            />
            
            <View style={styles.formButtons}>
              <Button
                title="Отмена"
                onPress={handleToggleEdit}
                variant="outline"
                style={styles.cancelButton}
              />
              <Button
                title="Сохранить"
                onPress={handleSaveProfile}
                style={styles.saveButton}
              />
            </View>
          </View>
        ) : (
          <>
            {/* Информация о профиле */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Профессиональная информация</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Специализация:</Text>
                <Text style={styles.infoValue}>
                  {profileData?.specialization || 'Не указано'}
                </Text>
              </View>
              
              {profileData?.experience > 0 && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Опыт работы:</Text>
                  <Text style={styles.infoValue}>
                    {profileData.experience} {getYearText(profileData.experience)}
                  </Text>
                </View>
              )}
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Стоимость услуг:</Text>
                <Text style={styles.infoValue}>
                  {profileData?.price_range || 'Не указано'}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Город:</Text>
                <Text style={styles.infoValue}>
                  {profileData?.city || 'Не указано'}
                </Text>
              </View>
              
              {profileData?.address && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Адрес:</Text>
                  <Text style={styles.infoValue}>{profileData.address}</Text>
                </View>
              )}
            </View>
            
            {/* О себе */}
            {profileData?.bio && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>О себе</Text>
                <Text style={styles.bioText}>{profileData.bio}</Text>
              </View>
            )}
            
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
              
              <TouchableOpacity style={styles.settingItem} onPress={handleBankDetails}>
                <View style={styles.settingLeft}>
                  <Ionicons name="card-outline" size={20} color={COLORS.textSecondary} />
                  <Text style={styles.settingText}>Банковские реквизиты</Text>
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
              
              <TouchableOpacity style={styles.settingItem} onPress={handleSupport}>
                <View style={styles.settingLeft}>
                  <Ionicons name="help-circle-outline" size={20} color={COLORS.textSecondary} />
                  <Text style={styles.settingText}>Поддержка</Text>
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
          </>
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

// Helper function to get correct year form in Russian
const getYearText = (years) => {
  years = Number(years);
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
    paddingBottom: 32,
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
    marginBottom: 24,
  },
  avatar: {
    marginRight: 16,
  },
  avatarLoaderContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#FFC107',
    fontSize: 16,
  },
  ratingValue: {
    marginLeft: 4,
    color: COLORS.text,
    fontWeight: '500',
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
  dashboardSection: {
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.lightGrey + '50',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  earningsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  earningsLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  reviewsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewsText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  reviewsCount: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
  viewReviewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewReviewsText: {
    fontSize: 14,
    color: COLORS.primary,
    marginRight: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  infoValue: {
    flex: 2,
    fontSize: 16,
    color: COLORS.text,
  },
  bioText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  formSection: {
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
  inputLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
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
    marginBottom: 16,
  },
});

export default LawyerProfileScreen; 