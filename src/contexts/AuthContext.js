import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from '../database/database';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const loadUser = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          setUser(JSON.parse(userJson));
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const register = async (username, email, password, phone, userType) => {
    try {
      const db = await getDatabase();
      
      // Check if email already exists
      const existingUsers = await db.getAllAsync('SELECT * FROM users WHERE email = ?', [email]);
      if (existingUsers.length > 0) {
        throw new Error('Email already registered');
      }

      // Insert new user
      const result = await db.runAsync(
        'INSERT INTO users (username, email, password, phone, user_type) VALUES (?, ?, ?, ?, ?)',
        [username, email, password, phone, userType]
      );
      
      const newUser = {
        id: result.lastInsertRowId,
        username,
        email,
        phone,
        userType
      };

      // If user type is lawyer, create lawyer profile
      if (userType === 'lawyer') {
        await db.runAsync(
          'INSERT INTO lawyers (user_id) VALUES (?)',
          [result.lastInsertRowId]
        );
      }
      
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      return newUser;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const db = await getDatabase();
      
      const user = await db.getFirstAsync(
        'SELECT * FROM users WHERE email = ? AND password = ?',
        [email, password]
      );
      
      if (!user) {
        throw new Error('Invalid email or password');
      }

      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        userType: user.user_type
      };

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Дополнительная функция для быстрого входа с демо-данными
  const demoLogin = async (userType = 'client') => {
    try {
      const db = await getDatabase();
      
      // Получаем случайного пользователя выбранного типа
      const users = await db.getAllAsync(
        'SELECT * FROM users WHERE user_type = ? LIMIT 1',
        [userType]
      );
      
      if (!users || users.length === 0) {
        throw new Error('Demo user not found');
      }
      
      const user = users[0];
      
      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        userType: user.user_type
      };

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Demo login error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        demoLogin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 