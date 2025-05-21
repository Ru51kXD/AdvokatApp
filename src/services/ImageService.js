import { Asset } from 'expo-asset';

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

export const ImageService = {
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

  // Функция предзагрузки (не требуется, так как мы используем динамические аватары)
  preloadImages: async () => {
    // Ничего не делаем, так как мы не используем изображения
    console.log('No images to preload');
    return Promise.resolve();
  },
};

export default ImageService; 