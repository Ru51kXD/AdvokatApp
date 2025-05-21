import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Formik } from 'formik';
import * as Yup from 'yup';

import { COLORS } from '../constants';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';

const validationSchema = Yup.object().shape({
  username: Yup.string()
    .min(2, 'Имя пользователя должно содержать минимум 2 символа')
    .required('Имя пользователя обязательно'),
  email: Yup.string()
    .email('Введите корректный email')
    .required('Email обязателен'),
  phone: Yup.string()
    .matches(/^\+?[0-9]{10,12}$/, 'Введите корректный номер телефона'),
  password: Yup.string()
    .min(6, 'Пароль должен содержать минимум 6 символов')
    .required('Пароль обязателен'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Пароли не совпадают')
    .required('Подтверждение пароля обязательно'),
  userType: Yup.string().required('Выберите тип пользователя'),
});

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState('client'); // 'client' or 'lawyer'

  const handleRegister = async (values) => {
    setIsLoading(true);
    
    try {
      await register(
        values.username,
        values.email,
        values.password,
        values.phone,
        userType
      );
      // Note: Successful registration will trigger navigation in the main navigator
    } catch (error) {
      Alert.alert(
        'Ошибка регистрации',
        'Не удалось зарегистрироваться. Пожалуйста, попробуйте снова.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
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
              username: '', 
              email: '', 
              phone: '', 
              password: '', 
              confirmPassword: '',
              userType: userType 
            }}
            validationSchema={validationSchema}
            onSubmit={handleRegister}
            enableReinitialize
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
                  title="Зарегистрироваться"
                  onPress={handleSubmit}
                  loading={isLoading}
                  style={styles.submitButton}
                />
              </View>
            )}
          </Formik>

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
  formContainer: {
    padding: 24,
  },
  title: {
    fontSize: 28,
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