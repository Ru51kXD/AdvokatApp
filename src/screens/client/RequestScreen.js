import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, LAW_AREAS, PRICE_RANGES, EXPERIENCE_OPTIONS } from '../../constants';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Picker from '../../components/Picker';
import { useAuth } from '../../contexts/AuthContext';
import { RequestService } from '../../services/RequestService';

const validationSchema = Yup.object().shape({
  title: Yup.string()
    .required('Заголовок обязателен')
    .min(5, 'Заголовок должен содержать минимум 5 символов'),
  description: Yup.string()
    .required('Описание обязательно')
    .min(20, 'Описание должно содержать минимум 20 символов'),
  law_area: Yup.string()
    .required('Выберите область права'),
});

const RequestScreen = ({ route, navigation }) => {
  const { lawyerId } = route.params || {};
  const { authState } = useAuth();
  const user = authState.user;
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is logged in when component mounts
  useEffect(() => {
    if (!user) {
      // Use a timeout to show the alert after navigation is complete
      const timer = setTimeout(() => {
        Alert.alert(
          'Требуется авторизация',
          'Пожалуйста, войдите в систему для создания заявки.',
          [
            { text: 'Отмена', onPress: () => navigation.goBack() },
            { text: 'Войти', onPress: () => navigation.navigate('Login') }
          ]
        );
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [user, navigation]);

  const handleSubmit = async (values) => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const requestData = {
        title: values.title,
        description: values.description,
        law_area: values.law_area,
        price_range: values.price_range,
        experience_required: values.experience_required ? parseInt(values.experience_required, 10) : null,
        lawyer_id: lawyerId, // Может быть undefined, если это общая заявка
      };
      
      const createdRequest = await RequestService.createRequest(user.id, requestData);
      
      Alert.alert(
        'Успешно!',
        'Ваша заявка успешно создана.',
        [{ 
          text: 'OK', 
          onPress: () => {
            if (lawyerId) {
              // Если это была заявка для конкретного юриста, вернуться на экран юриста
              navigation.goBack();
            } else {
              // Иначе перейти на экран со списком заявок, используя reset для полной перезагрузки стека
              navigation.reset({
                index: 0,
                routes: [{ name: 'ClientRequests' }],
              });
              
              // Или можно перейти на детальное представление новой заявки
              // navigation.navigate('RequestDetail', { requestId: createdRequest.id });
            }
          }
        }]
      );
    } catch (error) {
      Alert.alert(
        'Ошибка',
        'Не удалось создать заявку. Пожалуйста, попробуйте еще раз.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // If user is not logged in, show authentication message
  if (!user) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <View style={styles.authContainer}>
          <Ionicons name="lock-closed-outline" size={64} color={COLORS.lightGrey} />
          <Text style={styles.authTitle}>Требуется авторизация</Text>
          <Text style={styles.authMessage}>
            Для создания заявок необходимо войти в систему или зарегистрироваться
          </Text>
          <Button
            title="Войти"
            onPress={() => navigation.navigate('Login')}
            style={styles.authButton}
          />
          <Button
            title="Назад"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.cancelButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <Text style={styles.title}>Создание заявки</Text>
            <Text style={styles.subtitle}>
              Опишите вашу ситуацию, и адвокаты предложат свою помощь
            </Text>
            
            <Formik
              initialValues={{
                title: '',
                description: '',
                law_area: '',
                price_range: '',
                experience_required: '',
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
                setFieldValue,
              }) => (
                <View style={styles.form}>
                  <Input
                    label="Заголовок"
                    placeholder="Кратко опишите вашу проблему"
                    value={values.title}
                    onChangeText={handleChange('title')}
                    onBlur={handleBlur('title')}
                    error={touched.title && errors.title}
                  />
                  
                  <Input
                    label="Описание"
                    placeholder="Опишите ситуацию подробнее..."
                    value={values.description}
                    onChangeText={handleChange('description')}
                    onBlur={handleBlur('description')}
                    error={touched.description && errors.description}
                    multiline
                    numberOfLines={6}
                  />
                  
                  <Picker
                    label="Область права"
                    placeholder="Выберите область права"
                    items={LAW_AREAS}
                    value={values.law_area}
                    onValueChange={(value) => setFieldValue('law_area', value)}
                    error={touched.law_area && errors.law_area}
                  />
                  
                  <Picker
                    label="Бюджет (необязательно)"
                    placeholder="Выберите диапазон стоимости"
                    items={PRICE_RANGES}
                    value={values.price_range}
                    onValueChange={(value) => setFieldValue('price_range', value)}
                  />
                  
                  <Picker
                    label="Минимальный стаж юриста (необязательно)"
                    placeholder="Укажите минимальный опыт"
                    items={EXPERIENCE_OPTIONS}
                    value={values.experience_required}
                    onValueChange={(value) => {
                      if (typeof value === 'object') {
                        setFieldValue('experience_required', value.value);
                      } else {
                        setFieldValue('experience_required', value);
                      }
                    }}
                  />
                  
                  <Button
                    title={isLoading ? 'Создание...' : 'Создать заявку'}
                    onPress={handleSubmit}
                    disabled={isLoading}
                    style={styles.submitButton}
                  />
                  
                  <Button
                    title="Отмена"
                    onPress={() => navigation.goBack()}
                    variant="outline"
                    style={styles.cancelButton}
                  />
                </View>
              )}
            </Formik>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  form: {
    marginBottom: 24,
  },
  submitButton: {
    marginTop: 24,
  },
  cancelButton: {
    marginTop: 12,
  },
  // Auth container styles
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  authMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  authButton: {
    width: '100%',
    marginBottom: 12,
  },
});

export default RequestScreen; 