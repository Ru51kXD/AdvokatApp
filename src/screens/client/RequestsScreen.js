import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Text, 
  ActivityIndicator, 
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../constants';
import RequestCard from '../../components/RequestCard';
import Button from '../../components/Button';
import { RequestService } from '../../services/RequestService';
import { useAuth } from '../../contexts/AuthContext';

const ClientRequestsScreen = ({ navigation }) => {
  const { authState } = useAuth();
  const user = authState.user;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGuest, setIsGuest] = useState(false);

  const fetchRequests = useCallback(async () => {
    // Check if user is logged in
    if (!user) {
      setIsGuest(true);
      setLoading(false);
      setRequests([]); // Empty requests for guest users
      return;
    }
    
    setIsGuest(false);
    setLoading(true);
    try {
      console.log('Fetching requests for user ID:', user.id);
      const clientRequests = await RequestService.getClientRequests(user.id);
      console.log('Received requests:', clientRequests);
      
      // Просто используем полученные заявки, без добавления тестовых
      setRequests(clientRequests);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Не удалось загрузить список заявок.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Загружать заявки при каждом фокусе на экране
  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [fetchRequests])
  );

  const handleRequestPress = (request) => {
    navigation.navigate('RequestDetail', { requestId: request.id });
  };

  const handleCreateRequest = () => {
    navigation.navigate('Request');
  };

  const renderItem = ({ item }) => (
    <RequestCard 
      request={item} 
      onPress={() => handleRequestPress(item)}
      showResponses={true}
    />
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color={COLORS.lightGrey} />
      
      {isGuest ? (
        <>
          <Text style={styles.emptyTitle}>Вам необходимо авторизоваться</Text>
          <Text style={styles.emptySubtitle}>
            Для просмотра и создания заявок войдите в систему или зарегистрируйтесь
          </Text>
          <Button
            title="Войти"
            onPress={() => navigation.navigate('Login')}
            style={styles.createButton}
          />
        </>
      ) : (
        <>
          <Text style={styles.emptyTitle}>У вас пока нет заявок</Text>
          <Text style={styles.emptySubtitle}>
            Создайте свою первую заявку, и адвокаты смогут ответить на неё
          </Text>
          <Button
            title="Создать заявку"
            onPress={handleCreateRequest}
            style={styles.createButton}
          />
        </>
      )}
    </View>
  );

  if (loading && !requests.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Загрузка заявок...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <FlatList
        data={requests}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Мои заявки</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={fetchRequests}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons name="refresh" size={24} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          </View>
        }
      />
      
      {!isGuest && requests.length > 0 && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={handleCreateRequest}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    width: '100%',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default ClientRequestsScreen; 