import React, { createContext, useState, useContext, useEffect } from 'react';
import { requestAllMediaPermissions } from '../utils/permissions';

// Создаем контекст для управления разрешениями
const PermissionsContext = createContext({
  mediaPermissionsGranted: false,
  requestMediaPermissions: async () => {},
});

// Хук для использования контекста разрешений
export const usePermissions = () => useContext(PermissionsContext);

// Провайдер контекста разрешений
export const PermissionsProvider = ({ children }) => {
  const [mediaPermissionsGranted, setMediaPermissionsGranted] = useState(false);

  // Запрос разрешений для работы с медиа
  const requestMediaPermissions = async () => {
    try {
      await requestAllMediaPermissions();
      setMediaPermissionsGranted(true);
      return true;
    } catch (error) {
      console.error('Error requesting media permissions:', error);
      setMediaPermissionsGranted(false);
      return false;
    }
  };

  // Запрашиваем разрешения при загрузке компонента
  useEffect(() => {
    requestMediaPermissions();
  }, []);

  return (
    <PermissionsContext.Provider
      value={{
        mediaPermissionsGranted,
        requestMediaPermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}; 