import React, { useState } from 'react';
import { View, StyleSheet, Image, Text, SafeAreaView, ActivityIndicator } from 'react-native';
import Button from '../components/Button';
import { COLORS } from '../constants';
import { useAuth } from '../contexts/AuthContext';

const WelcomeScreen = ({ navigation }) => {
  const { demoLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleDemoLogin = async (userType) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await demoLogin(userType);
      // Авторизация успешна, навигация будет обработана в AppNavigation
    } catch (err) {
      setError('Ошибка при входе с демо-данными');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.title}>advokaty.kz</Text>
        <Text style={styles.subtitle}>
          Cервис для поиска адвокатов в Казахстане
        </Text>
        
        <View style={styles.description}>
          <Text style={styles.descriptionText}>
            Свяжитесь с опытными юристами и получите профессиональную юридическую консультацию
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Войти"
            onPress={() => navigation.navigate('Login')}
            style={styles.button}
          />
          <Button
            title="Зарегистрироваться"
            onPress={() => navigation.navigate('Register')}
            variant="outline"
            style={styles.button}
          />
          
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>или</Text>
            <View style={styles.dividerLine} />
          </View>
          
          <Text style={styles.demoTitle}>Демо-доступ к приложению:</Text>
          
          {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : (
            <>
              <Button
                title="Войти как клиент (демо)"
                onPress={() => handleDemoLogin('client')}
                variant="secondary"
                style={styles.demoButton}
              />
              <Button
                title="Войти как адвокат (демо)"
                onPress={() => handleDemoLogin('lawyer')}
                variant="secondary"
                style={styles.demoButton}
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 32,
    textAlign: 'center',
  },
  description: {
    marginBottom: 48,
    width: '100%',
  },
  descriptionText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 'auto',
  },
  button: {
    marginBottom: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.lightGrey,
  },
  dividerText: {
    color: COLORS.textSecondary,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  demoTitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  demoButton: {
    marginBottom: 12,
  },
  loader: {
    marginTop: 20,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 12,
  }
});

export default WelcomeScreen; 