import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, KAZAKHSTAN_CITIES, LAW_AREAS } from '../constants';
import Input from '../components/Input';
import Picker from '../components/Picker';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';

// Validation schemas for different steps
const basicInfoSchema = Yup.object().shape({
  username: Yup.string()
    .min(2, 'Имя пользователя должно содержать минимум 2 символа')
    .required('Имя пользователя обязательно'),
  email: Yup.string()
    .email('Введите корректный email')
    .required('Email обязателен'),
  phone: Yup.string()
    .matches(/^\+?[0-9]{10,12}$/, 'Введите корректный номер телефона')
    .required('Телефон обязателен'),
  password: Yup.string()
    .min(6, 'Пароль должен содержать минимум 6 символов')
    .required('Пароль обязателен'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Пароли не совпадают')
    .required('Подтверждение пароля обязательно'),
});

const lawyerInfoSchema = Yup.object().shape({
  specialization: Yup.string().required('Укажите вашу специализацию'),
  experience: Yup.number()
    .min(0, 'Опыт не может быть отрицательным')
    .required('Укажите опыт работы'),
  price_range: Yup.string().required('Укажите диапазон стоимости услуг'),
  city: Yup.string().required('Укажите город'),
  address: Yup.string().required('Укажите адрес'),
  bio: Yup.string().min(10, 'Расскажите о себе подробнее').required('Информация о вас обязательна'),
});

const RegisterScreen = ({ navigation }) => {
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState('client');
  const [step, setStep] = useState(1);
  
  // Базовые данные пользователя
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    user_type: 'client'
  });
  
  // Данные для профиля адвоката
  const [lawyerData, setLawyerData] = useState({
    specialization: '',
    experience: '',
    price_range: '',
    city: '',
    address: '',
    bio: ''
  });
  
  const handleBasicInfoSubmit = (values) => {
    setUserData({
      ...values,
      user_type: userType
    });
    
    if (userType === 'lawyer') {
      setStep(2);
    } else {
      handleRegister({
        ...values,
        user_type: 'client'
      });
    }
  };
  
  const handleLawyerInfoSubmit = (values) => {
    const completeData = {
      ...userData,
      lawyer_profile: values
    };
    handleRegister(completeData);
  };
  
  const handleRegister = async (completeData) => {
    setIsLoading(true);
    
    try {
      const result = await signUp(completeData);
      
      if (!result.success) {
        Alert.alert('Ошибка регистрации', result.error || 'Не удалось зарегистрироваться');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(
        'Ошибка регистрации',
        'Не удалось зарегистрироваться. Пожалуйста, попробуйте снова.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerText}>
            {step === 1 ? 'Создание аккаунта' : 'Профессиональная информация'}
          </Text>
          <View style={styles.spacer} />
        </View>
        
        <View style={styles.formContainer}>
          {step === 1 ? (
            <>
              <Text style={styles.title}>Создать аккаунт</Text>
              <Text style={styles.subtitle}>
                Зарегистрируйтесь, чтобы начать пользоваться сервисом
              </Text>

              <View style={styles.userTypeContainer}>
                <Button
                  title="Я - Клиент"
                  onPress={() => setUserType('client')}
                  variant={userType === 'client' ? 'primary' : 'outline'}
                  style={[styles.userTypeButton, { marginRight: 8 }]}
                />
                <Button
                  title="Я - Адвокат"
                  onPress={() => setUserType('lawyer')}
                  variant={userType === 'lawyer' ? 'primary' : 'outline'}
                  style={styles.userTypeButton}
                />
              </View>

              <Formik
                initialValues={{ 
                  username: userData.username, 
                  email: userData.email, 
                  phone: userData.phone, 
                  password: userData.password, 
                  confirmPassword: userData.confirmPassword
                }}
                validationSchema={basicInfoSchema}
                onSubmit={handleBasicInfoSubmit}
              >
                {({
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  values,
                  errors,
                  touched,
                }) => (
                  <View style={styles.form}>
                    <Input
                      label="Имя и фамилия"
                      placeholder="Введите ваше имя и фамилию"
                      value={values.username}
                      onChangeText={handleChange('username')}
                      onBlur={handleBlur('username')}
                      error={touched.username && errors.username}
                    />

                    <Input
                      label="Email"
                      placeholder="Введите ваш email"
                      value={values.email}
                      onChangeText={handleChange('email')}
                      onBlur={handleBlur('email')}
                      error={touched.email && errors.email}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />

                    <Input
                      label="Телефон"
                      placeholder="Введите ваш номер телефона"
                      value={values.phone}
                      onChangeText={handleChange('phone')}
                      onBlur={handleBlur('phone')}
                      error={touched.phone && errors.phone}
                      keyboardType="phone-pad"
                    />

                    <Input
                      label="Пароль"
                      placeholder="Создайте пароль"
                      value={values.password}
                      onChangeText={handleChange('password')}
                      onBlur={handleBlur('password')}
                      error={touched.password && errors.password}
                      secureTextEntry
                    />

                    <Input
                      label="Подтверждение пароля"
                      placeholder="Повторите пароль"
                      value={values.confirmPassword}
                      onChangeText={handleChange('confirmPassword')}
                      onBlur={handleBlur('confirmPassword')}
                      error={touched.confirmPassword && errors.confirmPassword}
                      secureTextEntry
                    />

                    <Button
                      title={userType === 'client' ? "Зарегистрироваться" : "Далее"}
                      onPress={handleSubmit}
                      loading={isLoading}
                      style={styles.submitButton}
                    />
                  </View>
                )}
              </Formik>
            </>
          ) : (
            <>
              <Text style={styles.title}>Профессиональная информация</Text>
              <Text style={styles.subtitle}>
                Расскажите о своей юридической практике, чтобы клиенты могли найти вас
              </Text>

              <Formik
                initialValues={{
                  specialization: lawyerData.specialization,
                  experience: lawyerData.experience,
                  price_range: lawyerData.price_range,
                  city: lawyerData.city,
                  address: lawyerData.address,
                  bio: lawyerData.bio
                }}
                validationSchema={lawyerInfoSchema}
                onSubmit={handleLawyerInfoSubmit}
              >
                {({
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  setFieldValue,
                  values,
                  errors,
                  touched,
                }) => (
                  <View style={styles.form}>
                    <Picker
                      label="Специализация"
                      placeholder="Выберите вашу специализацию"
                      items={LAW_AREAS}
                      value={values.specialization}
                      onValueChange={(value) => setFieldValue('specialization', value)}
                      error={touched.specialization && errors.specialization}
                    />
                    
                    <Input
                      label="Опыт работы (в годах)"
                      placeholder="Укажите стаж работы"
                      value={values.experience}
                      onChangeText={handleChange('experience')}
                      onBlur={handleBlur('experience')}
                      error={touched.experience && errors.experience}
                      keyboardType="number-pad"
                    />
                    
                    <Picker
                      label="Стоимость услуг"
                      placeholder="Укажите диапазон цен"
                      items={[
                        { label: 'До 10 000 тенге', value: 'До 10 000 тенге' },
                        { label: '10 000 - 30 000 тенге', value: '10 000 - 30 000 тенге' },
                        { label: '30 000 - 50 000 тенге', value: '30 000 - 50 000 тенге' },
                        { label: 'От 50 000 тенге', value: 'От 50 000 тенге' },
                        { label: 'По договоренности', value: 'По договоренности' }
                      ]}
                      value={values.price_range}
                      onValueChange={(value) => setFieldValue('price_range', value)}
                      error={touched.price_range && errors.price_range}
                    />
                    
                    <Picker
                      label="Город"
                      placeholder="Выберите город"
                      items={KAZAKHSTAN_CITIES}
                      value={values.city}
                      onValueChange={(value) => setFieldValue('city', value)}
                      error={touched.city && errors.city}
                    />
                    
                    <Input
                      label="Адрес"
                      placeholder="Укажите адрес офиса"
                      value={values.address}
                      onChangeText={handleChange('address')}
                      onBlur={handleBlur('address')}
                      error={touched.address && errors.address}
                    />
                    
                    <Input
                      label="О себе"
                      placeholder="Расскажите о своем опыте, образовании и успешных делах"
                      value={values.bio}
                      onChangeText={handleChange('bio')}
                      onBlur={handleBlur('bio')}
                      error={touched.bio && errors.bio}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />

                    <View style={styles.buttonRow}>
                      <Button
                        title="Назад"
                        onPress={() => setStep(1)}
                        variant="outline"
                        style={[styles.rowButton, styles.backBtn]}
                      />
                      <Button
                        title="Завершить регистрацию"
                        onPress={handleSubmit}
                        loading={isLoading}
                        style={[styles.rowButton, styles.nextBtn]}
                      />
                    </View>
                  </View>
                )}
              </Formik>
            </>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Уже есть аккаунт? </Text>
            <Text
              style={styles.footerLink}
              onPress={() => navigation.navigate('Login')}
            >
              Войти
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  backButton: {
    padding: 8,
  },
  spacer: {
    width: 40,
  },
  formContainer: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  userTypeContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  userTypeButton: {
    flex: 1,
  },
  form: {
    marginBottom: 24,
  },
  submitButton: {
    marginTop: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  rowButton: {
    flex: 1,
  },
  backBtn: {
    marginRight: 8,
  },
  nextBtn: {
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  footerLink: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterScreen;