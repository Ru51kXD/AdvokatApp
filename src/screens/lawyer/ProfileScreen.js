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
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, KAZAKHSTAN_CITIES, LAW_AREAS } from '../../constants';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Picker from '../../components/Picker';
import { useAuth } from '../../contexts/AuthContext';
import { LawyerService } from '../../services/LawyerService';

const LawyerProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
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

  const loadProfile = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const lawyerProfile = await LawyerService.getLawyerProfile(user.id);
      setProfileData(lawyerProfile);
      setFormData({
        specialization: lawyerProfile.specialization || '',
        experience: lawyerProfile.experience ? lawyerProfile.experience.toString() : '',
        price_range: lawyerProfile.price_range || '',
        bio: lawyerProfile.bio || '',
        city: lawyerProfile.city || '',
        address: lawyerProfile.address || '',
      });
    } catch (err) {
      console.error('Error loading profile:', err);
      Alert.alert('Ошибка', 'Не удалось загрузить данные профиля.');
    } finally {
      setLoading(false);
    }
  }, [user]);

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
            await logout();
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
      
      await LawyerService.updateLawyerProfile(user.id, {
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

  if (loading && !profileData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Загрузка профиля...</Text>
      </View>
    );
  }

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
            <Text style={styles.name}>{user?.username || 'Адвокат'}</Text>
            <Text style={styles.userType}>Адвокат</Text>
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
              items={COLORS.PRICE_RANGES}
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
                disabled={loading}
              />
            </View>
          </View>
        ) : (
          <>
            {/* Профессиональная информация */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Профессиональная информация</Text>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Специализация:</Text>
                <Text style={styles.infoText}>
                  {profileData?.specialization || 'Не указана'}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Опыт работы:</Text>
                <Text style={styles.infoText}>
                  {profileData?.experience 
                    ? `${profileData.experience} ${getYearText(profileData.experience)}` 
                    : 'Не указан'}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Стоимость услуг:</Text>
                <Text style={styles.infoText}>
                  {profileData?.price_range || 'Не указана'}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Город:</Text>
                <Text style={styles.infoText}>
                  {profileData?.city || 'Не указан'}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Адрес:</Text>
                <Text style={styles.infoText}>
                  {profileData?.address || 'Не указан'}
                </Text>
              </View>
            </View>

            {/* О себе */}
            {profileData?.bio && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>О себе</Text>
                <Text style={styles.bioText}>{profileData.bio}</Text>
              </View>
            )}

            {/* Контактная информация */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Контактная информация</Text>
              
              <View style={styles.infoItem}>
                <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.contactText}>{user?.email || 'Не указан'}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.contactText}>{user?.phone || 'Не указан'}</Text>
              </View>
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
              
              <TouchableOpacity style={styles.settingItem} onPress={() => {}}>
                <View style={styles.settingLeft}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
                  <Text style={styles.settingText}>Изменить пароль</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem} onPress={() => {}}>
                <View style={styles.settingLeft}>
                  <Ionicons name="help-circle-outline" size={20} color={COLORS.textSecondary} />
                  <Text style={styles.settingText}>Помощь и поддержка</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
              </TouchableOpacity>
            </View>

            {/* Статистика */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Статистика</Text>
              
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>0</Text>
                  <Text style={styles.statLabel}>Откликов</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>0</Text>
                  <Text style={styles.statLabel}>В работе</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>0</Text>
                  <Text style={styles.statLabel}>Завершено</Text>
                </View>
              </View>
            </View>
          </>
        )}

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

// Функция для корректного склонения слова "год" в зависимости от числа
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
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#FFC107',
    fontSize: 14,
    marginRight: 4,
  },
  ratingValue: {
    color: COLORS.textSecondary,
    fontSize: 14,
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
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    width: 140,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  bioText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  contactText: {
    fontSize: 14,
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
    fontSize: 14,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  actionButtons: {
    marginTop: 16,
    flexDirection: 'row',
  },
  saveButton: {
    flex: 1,
    marginRight: 8,
  },
  cancelButton: {
    flex: 1,
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

export default LawyerProfileScreen; 