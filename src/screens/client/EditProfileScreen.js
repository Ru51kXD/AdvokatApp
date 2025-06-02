import React, { useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../components/Button';
import Input from '../../components/Input';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';

const EditProfileScreen = ({ route, navigation }) => {
  const { userData } = route.params || {};
  const { authState, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    username: userData?.username || '',
    email: userData?.email || '',
    phone: userData?.phone || '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!formData.username || !formData.email) {
      Alert.alert('Ошибка', 'Имя пользователя и Email обязательны');
      return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Ошибка', 'Введите корректный Email');
      return;
    }
    
    setLoading(true);
    try {
      // Update user data
      const result = await updateUser(authState.user.id, formData);
      
      if (result.success) {
        Alert.alert('Успешно', 'Профиль успешно обновлен');
        navigation.goBack();
      } else {
        Alert.alert('Ошибка', result.error || 'Не удалось обновить профиль');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      Alert.alert('Ошибка', 'Произошла ошибка при обновлении профиля. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Редактирование профиля</Text>
          
          <Text style={styles.inputLabel}>Имя пользователя</Text>
          <Input
            value={formData.username}
            onChangeText={(value) => handleInputChange('username', value)}
            placeholder="Введите имя пользователя"
          />
          
          <Text style={styles.inputLabel}>Email</Text>
          <Input
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            placeholder="Введите email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <Text style={styles.inputLabel}>Телефон</Text>
          <Input
            value={formData.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
            placeholder="Введите номер телефона"
            keyboardType="phone-pad"
          />
          
          <View style={styles.formButtons}>
            <Button
              title="Отмена"
              onPress={() => navigation.goBack()}
              variant="outline"
              style={styles.cancelButton}
            />
            <Button
              title="Сохранить"
              onPress={handleSaveProfile}
              style={styles.saveButton}
              loading={loading}
            />
          </View>
        </View>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 12,
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
});

export default EditProfileScreen; 