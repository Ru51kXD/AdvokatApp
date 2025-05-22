import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  Switch,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const PrivacyAndSecurityScreen = ({ navigation }) => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showProfile, setShowProfile] = useState(true);
  const [dataSharing, setDataSharing] = useState(true);
  const [locationTracking, setLocationTracking] = useState(false);

  const handleTwoFactorToggle = () => {
    if (!twoFactorEnabled) {
      // Показываем диалог подтверждения включения 2FA
      Alert.alert(
        'Двухфакторная аутентификация',
        'Для включения двухфакторной аутентификации потребуется подтвердить ваш номер телефона. Продолжить?',
        [
          { text: 'Отмена', style: 'cancel' },
          { 
            text: 'Продолжить', 
            onPress: () => {
              setTwoFactorEnabled(true);
              Alert.alert('Успешно', 'Двухфакторная аутентификация включена');
            }
          }
        ]
      );
    } else {
      setTwoFactorEnabled(false);
      Alert.alert('Информация', 'Двухфакторная аутентификация отключена');
    }
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Смена пароля',
      'На ваш email будет отправлена ссылка для смены пароля',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Отправить', 
          onPress: () => {
            Alert.alert('Успешно', 'Ссылка для смены пароля отправлена на ваш email');
          }
        }
      ]
    );
  };

  const handleSaveSettings = () => {
    Alert.alert('Успешно', 'Настройки приватности и безопасности сохранены');
    navigation.goBack();
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Приватность и безопасность</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Безопасность</Text>
          
          <TouchableOpacity 
            style={styles.settingButton}
            onPress={handleChangePassword}
          >
            <View style={styles.settingButtonContent}>
              <Ionicons name="key-outline" size={22} color={COLORS.text} />
              <Text style={styles.settingButtonText}>Сменить пароль</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Двухфакторная аутентификация</Text>
              <Text style={styles.settingDescription}>
                Повышенный уровень защиты вашего аккаунта
              </Text>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={handleTwoFactorToggle}
              trackColor={{ false: COLORS.lightGrey, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Приватность</Text>
          
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Показывать мой профиль</Text>
              <Text style={styles.settingDescription}>
                Отображать ваш профиль в списке адвокатов
              </Text>
            </View>
            <Switch
              value={showProfile}
              onValueChange={setShowProfile}
              trackColor={{ false: COLORS.lightGrey, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Обмен данными</Text>
              <Text style={styles.settingDescription}>
                Позволить приложению собирать анонимные данные для улучшения сервиса
              </Text>
            </View>
            <Switch
              value={dataSharing}
              onValueChange={setDataSharing}
              trackColor={{ false: COLORS.lightGrey, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Отслеживание местоположения</Text>
              <Text style={styles.settingDescription}>
                Разрешить доступ к вашему местоположению
              </Text>
            </View>
            <Switch
              value={locationTracking}
              onValueChange={setLocationTracking}
              trackColor={{ false: COLORS.lightGrey, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Сессии</Text>
          
          <TouchableOpacity 
            style={styles.settingButton}
            onPress={() => Alert.alert('Информация', 'У вас только одна активная сессия')}
          >
            <View style={styles.settingButtonContent}>
              <Ionicons name="laptop-outline" size={22} color={COLORS.text} />
              <View>
                <Text style={styles.settingButtonText}>Активные сессии</Text>
                <Text style={styles.settingDescription}>Просмотр и управление активными сессиями</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={22} color={COLORS.text} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingButton, styles.dangerButton]}
            onPress={() => Alert.alert(
              'Подтверждение',
              'Вы уверены, что хотите завершить все сессии? Вам придется войти заново.',
              [
                { text: 'Отмена', style: 'cancel' },
                { text: 'Завершить', style: 'destructive' }
              ]
            )}
          >
            <View style={styles.settingButtonContent}>
              <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
              <Text style={styles.dangerButtonText}>Завершить все сессии</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSaveSettings}
        >
          <Text style={styles.saveButtonText}>Сохранить настройки</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  settingDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    maxWidth: '90%',
    marginTop: 4,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  settingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingButtonText: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 12,
  },
  dangerButton: {
    borderBottomWidth: 0,
  },
  dangerButtonText: {
    fontSize: 16,
    color: COLORS.error,
    marginLeft: 12,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default PrivacyAndSecurityScreen; 