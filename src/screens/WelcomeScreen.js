import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>A</Text>
          </View>
          <Text style={styles.title}>Добро пожаловать в Advokaty.kz</Text>
          <Text style={styles.subtitle}>
            Найдите лучшего юриста для решения ваших правовых вопросов
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>Войти</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.registerButton]}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={[styles.buttonText, styles.registerButtonText]}>
              Зарегистрироваться
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: SIZES.padding * 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
    ...SHADOWS.medium,
  },
  logoText: {
    ...FONTS.h1,
    color: COLORS.primary,
    fontSize: width * 0.15,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  subtitle: {
    ...FONTS.body2,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.8,
  },
  buttonContainer: {
    width: '100%',
    paddingBottom: SIZES.padding * 2,
  },
  button: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  buttonText: {
    ...FONTS.body2,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  registerButtonText: {
    color: COLORS.white,
  },
});

export default WelcomeScreen; 