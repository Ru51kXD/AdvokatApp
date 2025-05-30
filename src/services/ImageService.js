import { Asset } from 'expo-asset';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Коллекция цветов для аватаров адвокатов
const lawyerColors = [
  '#3498db', // Синий
  '#9b59b6', // Фиолетовый
  '#2ecc71', // Зеленый
  '#e74c3c', // Красный
  '#f39c12', // Оранжевый
  '#1abc9c', // Бирюзовый
];

// Коллекция цветов для аватаров клиентов
const clientColors = [
  '#3498db', // Синий
  '#e74c3c', // Красный
  '#f39c12', // Оранжевый
];

const ImageService = {
  // Получить цвет аватара адвоката по ID
  getLawyerAvatarColor: (id) => {
    const index = (id % lawyerColors.length);
    return lawyerColors[index];
  },
  
  // Получить цвет аватара клиента по ID
  getClientAvatarColor: (id) => {
    const index = (id % clientColors.length);
    return clientColors[index];
  },
  
  // Получить инициалы из имени
  getInitials: (name) => {
    if (!name) return '??';
    
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  },
  
  // Выбор изображения из библиотеки устройства
  pickImage: async () => {
    try {
      // Запрашиваем разрешение на доступ к галерее
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        console.error('Требуется разрешение на доступ к медиафайлам');
        return {
          success: false,
          error: 'Требуется разрешение на доступ к галерее фотографий'
        };
      }

      // Открываем выбор изображений
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Квадратное соотношение для аватарки
        quality: 0.7, // Снижаем качество для уменьшения размера
        base64: true, // Получаем изображение в формате base64
      });

      if (result.canceled) {
        console.log('Выбор изображения отменен');
        return { success: false };
      }

      return {
        success: true,
        image: result.assets[0]
      };
    } catch (error) {
      console.error('Ошибка при выборе изображения:', error);
      return {
        success: false,
        error: 'Произошла ошибка при выборе изображения'
      };
    }
  },
  
  // Сделать снимок с камеры
  takePhoto: async () => {
    try {
      // Запрашиваем разрешение на доступ к камере
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        console.error('Требуется разрешение на доступ к камере');
        return {
          success: false,
          error: 'Требуется разрешение на доступ к камере'
        };
      }

      // Открываем камеру
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1], // Квадратное соотношение для аватарки
        quality: 0.7, // Снижаем качество для уменьшения размера
        base64: true, // Получаем изображение в формате base64
      });

      if (result.canceled) {
        console.log('Съемка фото отменена');
        return { success: false };
      }

      return {
        success: true,
        image: result.assets[0]
      };
    } catch (error) {
      console.error('Ошибка при съемке фото:', error);
      return {
        success: false,
        error: 'Произошла ошибка при съемке фото'
      };
    }
  },
  
  // Сохранить аватар пользователя
  saveUserAvatar: async (userId, imageData) => {
    try {
      if (!userId || !imageData) {
        console.error('Отсутствуют необходимые данные для сохранения аватара');
        return { 
          success: false, 
          error: 'Отсутствуют необходимые данные для сохранения аватара' 
        };
      }
      
      // Создаем ключ для хранения аватара пользователя
      const storageKey = `user_avatar_${userId}`;
      
      // Сохраняем данные изображения в AsyncStorage
      await AsyncStorage.setItem(storageKey, JSON.stringify({
        uri: imageData.uri,
        base64: imageData.base64,
        updatedAt: new Date().toISOString()
      }));
      
      console.log('Аватар пользователя успешно сохранен');
      
      return {
        success: true,
        avatarUri: imageData.uri
      };
    } catch (error) {
      console.error('Ошибка при сохранении аватара:', error);
      return {
        success: false,
        error: 'Произошла ошибка при сохранении аватара'
      };
    }
  },
  
  // Получить аватар пользователя
  getUserAvatar: async (userId) => {
    try {
      if (!userId) {
        return { success: false, error: 'ID пользователя не указан' };
      }
      
      // Получаем данные аватара из AsyncStorage
      const storageKey = `user_avatar_${userId}`;
      const avatarData = await AsyncStorage.getItem(storageKey);
      
      if (!avatarData) {
        return { success: false };
      }
      
      const parsedData = JSON.parse(avatarData);
      
      return {
        success: true,
        avatarUri: parsedData.uri,
        avatarBase64: parsedData.base64
      };
    } catch (error) {
      console.error('Ошибка при получении аватара:', error);
      return {
        success: false,
        error: 'Произошла ошибка при получении аватара'
      };
    }
  },
  
  // Удалить аватар пользователя
  removeUserAvatar: async (userId) => {
    try {
      if (!userId) {
        return { success: false, error: 'ID пользователя не указан' };
      }
      
      // Удаляем данные аватара из AsyncStorage
      const storageKey = `user_avatar_${userId}`;
      await AsyncStorage.removeItem(storageKey);
      
      console.log('Аватар пользователя успешно удален');
      
      return { success: true };
    } catch (error) {
      console.error('Ошибка при удалении аватара:', error);
      return {
        success: false,
        error: 'Произошла ошибка при удалении аватара'
      };
    }
  },
  
  // Метод инициализации (алиас для preloadImages)
  init: async () => {
    return ImageService.preloadImages();
  },

  // Функция предзагрузки (не требуется, так как мы используем динамические аватары)
  preloadImages: async () => {
    // Ничего не делаем, так как мы не используем изображения
    console.log('No images to preload');
    return Promise.resolve();
  },
};

export { ImageService };
export default ImageService; 