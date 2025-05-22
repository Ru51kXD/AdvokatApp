import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const BankDetailsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    bic: '',
    iin: '',
  });
  
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!bankDetails.accountName) newErrors.accountName = 'Обязательное поле';
    if (!bankDetails.accountNumber) newErrors.accountNumber = 'Обязательное поле';
    if (!bankDetails.bankName) newErrors.bankName = 'Обязательное поле';
    if (!bankDetails.bic) newErrors.bic = 'Обязательное поле';
    if (!bankDetails.iin) newErrors.iin = 'Обязательное поле';
    
    // Проверка формата ИИН (12 цифр)
    if (bankDetails.iin && (!/^\d+$/.test(bankDetails.iin) || bankDetails.iin.length !== 12)) {
      newErrors.iin = 'ИИН должен содержать 12 цифр';
    }
    
    // Проверка номера счета (20 символов)
    if (bankDetails.accountNumber && bankDetails.accountNumber.length !== 20) {
      newErrors.accountNumber = 'Номер счета должен содержать 20 символов';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все обязательные поля корректно');
      return;
    }
    
    setLoading(true);
    
    // Имитация сохранения данных
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Успешно', 
        'Банковские реквизиты сохранены',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 1000);
  };

  const handleInputChange = (field, value) => {
    setBankDetails({
      ...bankDetails,
      [field]: value
    });
    
    // Очистка ошибки при изменении поля
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: null
      });
    }
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
        <Text style={styles.headerTitle}>Банковские реквизиты</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Данные для получения оплаты</Text>
          <Text style={styles.description}>
            Эти данные будут использоваться для получения оплаты за ваши услуги.
            Клиенты не увидят эту информацию напрямую.
          </Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>ФИО владельца счета *</Text>
            <TextInput
              style={[styles.input, errors.accountName && styles.inputError]}
              placeholder="Введите ФИО полностью"
              value={bankDetails.accountName}
              onChangeText={(text) => handleInputChange('accountName', text)}
            />
            {errors.accountName && <Text style={styles.errorText}>{errors.accountName}</Text>}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>ИИН *</Text>
            <TextInput
              style={[styles.input, errors.iin && styles.inputError]}
              placeholder="12-значный ИИН"
              value={bankDetails.iin}
              onChangeText={(text) => handleInputChange('iin', text)}
              keyboardType="numeric"
              maxLength={12}
            />
            {errors.iin && <Text style={styles.errorText}>{errors.iin}</Text>}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Название банка *</Text>
            <TextInput
              style={[styles.input, errors.bankName && styles.inputError]}
              placeholder="Например: Kaspi Bank, Halyk Bank"
              value={bankDetails.bankName}
              onChangeText={(text) => handleInputChange('bankName', text)}
            />
            {errors.bankName && <Text style={styles.errorText}>{errors.bankName}</Text>}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>БИК *</Text>
            <TextInput
              style={[styles.input, errors.bic && styles.inputError]}
              placeholder="БИК банка"
              value={bankDetails.bic}
              onChangeText={(text) => handleInputChange('bic', text)}
            />
            {errors.bic && <Text style={styles.errorText}>{errors.bic}</Text>}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Номер счета *</Text>
            <TextInput
              style={[styles.input, errors.accountNumber && styles.inputError]}
              placeholder="20-значный номер счета"
              value={bankDetails.accountNumber}
              onChangeText={(text) => handleInputChange('accountNumber', text)}
              keyboardType="numeric"
              maxLength={20}
            />
            {errors.accountNumber && <Text style={styles.errorText}>{errors.accountNumber}</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Информация о выплатах</Text>
          <Text style={styles.description}>
            Выплаты производятся еженедельно, по пятницам. Минимальная сумма для вывода составляет 5000 ₸.
          </Text>
          
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Для вывода средств необходимо пройти верификацию. Проверьте статус верификации в личном кабинете.
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.verificationButton}
            onPress={() => Alert.alert('Информация', 'Функция верификации находится в разработке')}
          >
            <Text style={styles.verificationButtonText}>Пройти верификацию</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>Сохранить реквизиты</Text>
          )}
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
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
    lineHeight: 20,
  },
  verificationButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  verificationButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
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

export default BankDetailsScreen; 