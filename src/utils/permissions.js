import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Platform, Alert } from 'react-native';

/**
 * Запрашивает разрешения для работы с изображениями
 * @returns {Promise<boolean>} Результат запроса разрешения
 */
export const requestImagePermissions = async () => {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Необходимо разрешение',
        'Для работы с изображениями необходим доступ к галерее',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  }
  return true;
};

/**
 * Запрашивает разрешения для работы с камерой
 * @returns {Promise<boolean>} Результат запроса разрешения
 */
export const requestCameraPermissions = async () => {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Необходимо разрешение',
        'Для работы с камерой необходим доступ к камере',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  }
  return true;
};

/**
 * Запрашивает все необходимые разрешения для работы с медиа
 * @returns {Promise<void>}
 */
export const requestAllMediaPermissions = async () => {
  await requestImagePermissions();
  await requestCameraPermissions();
};

/**
 * Выбирает изображение из галереи
 * @param {Object} options Опции для выбора изображения
 * @returns {Promise<Object|null>} Результат выбора изображения
 */
export const pickImage = async (options = {}) => {
  const hasPermission = await requestImagePermissions();
  if (!hasPermission) return null;
  
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      ...options
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    return null;
  }
};

/**
 * Делает снимок с камеры
 * @param {Object} options Опции для снимка
 * @returns {Promise<Object|null>} Результат снимка
 */
export const takePhoto = async (options = {}) => {
  const hasPermission = await requestCameraPermissions();
  if (!hasPermission) return null;
  
  try {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      ...options
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    return null;
  } catch (error) {
    console.error('Error taking photo:', error);
    return null;
  }
};

/**
 * Выбирает документ
 * @param {Object} options Опции для выбора документа
 * @returns {Promise<Object|null>} Результат выбора документа
 */
export const pickDocument = async (options = {}) => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
      ...options
    });
    
    if (result.type === 'success') {
      return result;
    }
    return null;
  } catch (error) {
    console.error('Error picking document:', error);
    return null;
  }
}; 