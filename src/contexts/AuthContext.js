import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import {
    createUser,
    getUsers,
    initDatabase,
    updateUser as updateUserInDB
} from '../database/database';
import { LawyerService } from '../services/LawyerService';

// Создаем контекст
const AuthContext = createContext();

// Начальное состояние авторизации
const initialState = {
  user: null,
  isAuthenticated: false
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(initialState);
  const [isLoading, setIsLoading] = useState(true);

  // Проверка авторизации при запуске приложения
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Инициализируем базу данных и обновляем имена адвокатов
        try {
          await initDatabase();
          console.log('База данных инициализирована');
          
          // Автоматически обновляем имена адвокатов при запуске
          setTimeout(async () => {
            try {
              const result = await LawyerService.updateLawyerNamesInDB();
              if (result.success && result.updated > 0) {
                console.log(`Автоматически обновлено ${result.updated} имен адвокатов`);
              }
            } catch (updateError) {
              console.log('Не удалось автоматически обновить имена адвокатов:', updateError);
            }
          }, 1000); // Задержка в 1 секунду для завершения инициализации
        } catch (dbError) {
          console.error('Ошибка инициализации базы данных:', dbError);
        }
        
        // Проверяем, сохранен ли пользователь в AsyncStorage
        const userJSON = await AsyncStorage.getItem('user');
        console.log('AuthContext: Checking for stored user', userJSON ? 'Found user data' : 'No user data found');
        
        if (userJSON) {
          // Если пользователь найден, устанавливаем его в state
          const user = JSON.parse(userJSON);
          console.log('AuthContext: Loaded user from storage', { id: user.id, email: user.email, type: user.user_type });
          
          setAuthState({
            user,
            isAuthenticated: true
          });
        }
      } catch (error) {
        console.error('Error loading user from AsyncStorage:', error);
      } finally {
        // В любом случае завершаем загрузку
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Функция для входа пользователя
  const signIn = async (email, password) => {
    try {
      setIsLoading(true);
      console.log('AuthContext: Attempting sign in', { email });
      
      // Получаем всех пользователей из БД
      const users = await getUsers();
      console.log('AuthContext: Found users', users.length);
      
      // Ищем пользователя с указанными email и паролем
      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        console.log('AuthContext: Login successful', { id: user.id, email: user.email, type: user.user_type });
        
        // Если пользователь адвокат, получаем его профиль
        let userWithProfile = { ...user };
        if (user.user_type === 'lawyer') {
          const lawyerProfile = await LawyerService.getLawyerProfile(user.id);
          if (lawyerProfile) {
            userWithProfile = { ...user, lawyer_profile: lawyerProfile };
          }
        }
        
        // Сохраняем полные данные пользователя в AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(userWithProfile));
        
        // Обновляем state
        setAuthState({
          user: userWithProfile,
          isAuthenticated: true
        });
        
        return { success: true, user: userWithProfile };
      } else {
        console.log('AuthContext: Login failed - invalid credentials');
        return { success: false, error: 'Ошибка: неверный адрес электронной почты и пароль' };
      }
    } catch (error) {
      console.error('Error signing in:', error);
      return { success: false, error: 'Произошла ошибка при входе' };
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для регистрации пользователя
  const signUp = async (userData) => {
    try {
      setIsLoading(true);
      
      // Получаем всех пользователей из БД
      const users = await getUsers();
      
      // Проверяем, существует ли пользователь с таким email
      const existingUser = users.find(u => u.email === userData.email);
      
      if (existingUser) {
        return { success: false, error: 'Пользователь с таким email уже существует' };
      }
      
      // Создаем данные для нового пользователя
      const userToCreate = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        phone: userData.phone,
        user_type: userData.user_type
      };
      
      // Создаем нового пользователя
      const newUser = await createUser(userToCreate);
      
      // Если регистрируется адвокат, создаем для него профиль
      let userWithProfile = { ...newUser };
      if (userData.user_type === 'lawyer' && userData.lawyer_profile) {
        const { createLawyer } = await import('../database/database');
        
        // Создаем профиль адвоката
        const lawyerProfile = await createLawyer({
          user_id: newUser.id,
          name: userData.lawyer_profile.name || newUser.username,
          specialization: userData.lawyer_profile.specialization,
          experience: parseInt(userData.lawyer_profile.experience) || 0,
          price_range: userData.lawyer_profile.price_range,
          city: userData.lawyer_profile.city,
          address: userData.lawyer_profile.address,
          bio: userData.lawyer_profile.bio
        });
        
        userWithProfile = { ...newUser, lawyer_profile: lawyerProfile };
      }
      
      // Сохраняем полные данные пользователя в AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(userWithProfile));
      
      // Обновляем state
      setAuthState({
        user: userWithProfile,
        isAuthenticated: true
      });
      
      return { success: true, user: userWithProfile };
    } catch (error) {
      console.error('Error signing up:', error);
      return { success: false, error: 'Произошла ошибка при регистрации' };
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для обновления данных пользователя
  const updateUser = async (userId, userData) => {
    try {
      setIsLoading(true);
      
      // Обновляем пользователя в базе данных
      const updatedUser = await updateUserInDB(userId, userData);
      
      if (!updatedUser) {
        return { success: false, error: 'Пользователь не найден' };
      }
      
      // Получаем текущие данные пользователя из контекста
      const currentUser = authState.user;
      
      // Объединяем текущие данные с обновленными
      const updatedAuthUser = {
        ...currentUser,
        ...updatedUser
      };
      
      // Сохраняем обновленные данные в AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(updatedAuthUser));
      
      // Обновляем state
      setAuthState({
        user: updatedAuthUser,
        isAuthenticated: true
      });
      
      return { success: true, user: updatedAuthUser };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: 'Произошла ошибка при обновлении профиля' };
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для выхода пользователя
  const signOut = async () => {
    try {
      // Удаляем пользователя из AsyncStorage
      await AsyncStorage.removeItem('user');
      
      // Сбрасываем state
      setAuthState(initialState);
      
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      return { success: false, error: 'Произошла ошибка при выходе' };
    }
  };

  // Демо вход (для тестирования)
  const demoLogin = async (userType = 'client') => {
    try {
      const users = await getUsers();
      let demoUser = users.find(u => u.user_type === userType);
      
      if (!demoUser) {
        // Если нет тестового пользователя, создаем его
        demoUser = await createUser({
          username: userType === 'lawyer' ? 'Демо адвокат' : 'Демо клиент',
          email: `demo_${userType}@example.com`,
          password: 'demo123',
          phone: '+77001234567',
          user_type: userType
        });
      }
      
      await AsyncStorage.setItem('user', JSON.stringify(demoUser));
      
      setAuthState({
        user: demoUser,
        isAuthenticated: true
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error in demo login:', error);
      Alert.alert('Ошибка', 'Не удалось выполнить демо вход');
      throw error;
    }
  };

  // Значение контекста
  const value = {
    authState,
    isLoading,
    signIn,
    signUp,
    signOut,
    demoLogin,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Хук для использования контекста авторизации
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
};

export default AuthContext; 