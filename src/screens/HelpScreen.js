import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants';
import { Ionicons } from '@expo/vector-icons';

const HelpScreen = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });

  const handleSubmit = () => {
    // Здесь будет логика отправки формы
    Alert.alert(
      'Успешно',
      'Ваша заявка принята. Мы свяжемся с вами в ближайшее время.',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Записаться на консультацию</Text>
        <Text style={styles.subtitle}>
          Оставьте заявку, и мы свяжемся с вами для уточнения деталей
        </Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Ваше имя</Text>
          <TextInput
            style={styles.input}
            placeholder="Введите ваше имя"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Телефон</Text>
          <TextInput
            style={styles.input}
            placeholder="+7 (___) ___-__-__"
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            keyboardType="email-address"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Сообщение</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Опишите вашу ситуацию"
            multiline
            numberOfLines={4}
            value={formData.message}
            onChangeText={(text) => setFormData({ ...formData, message: text })}
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Отправить заявку</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SIZES.padding,
    backgroundColor: COLORS.primary,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.white,
    marginBottom: SIZES.base,
  },
  subtitle: {
    ...FONTS.body3,
    color: COLORS.white,
    opacity: 0.8,
  },
  formContainer: {
    padding: SIZES.padding,
  },
  inputContainer: {
    marginBottom: SIZES.padding,
  },
  label: {
    ...FONTS.body4,
    color: COLORS.text,
    marginBottom: SIZES.base,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    alignItems: 'center',
    marginTop: SIZES.padding,
  },
  submitButtonText: {
    ...FONTS.body3,
    color: COLORS.white,
  },
});

export default HelpScreen; 