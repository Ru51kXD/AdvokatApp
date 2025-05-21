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

import { COLORS, REQUEST_STATUS } from '../../constants';
import RequestCard from '../../components/RequestCard';
import { RequestService } from '../../services/RequestService';
import { useAuth } from '../../contexts/AuthContext';

const LawyerRequestsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'open', 'responded'

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const availableRequests = await RequestService.getAvailableRequests(user.id);
      setRequests(availableRequests);
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

  const filteredRequests = useCallback(() => {
    if (filter === 'all') return requests;
    if (filter === 'open') return requests.filter(r => r.status === REQUEST_STATUS.OPEN);
    if (filter === 'responded') return requests.filter(r => r.hasResponded);
    return requests;
  }, [requests, filter]);

  const renderItem = ({ item }) => (
    <RequestCard 
      request={item} 
      onPress={() => handleRequestPress(item)}
      showClientInfo={true}
    />
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color={COLORS.lightGrey} />
      <Text style={styles.emptyTitle}>Нет доступных заявок</Text>
      <Text style={styles.emptySubtitle}>
        Доступные для отклика заявки будут отображаться здесь
      </Text>
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
        data={filteredRequests()}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>Доступные заявки</Text>
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

            <View style={styles.filterContainer}>
              <TouchableOpacity 
                style={[
                  styles.filterButton, 
                  filter === 'all' && styles.filterButtonActive
                ]}
                onPress={() => setFilter('all')}
              >
                <Text style={[
                  styles.filterText,
                  filter === 'all' && styles.filterTextActive
                ]}>
                  Все
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.filterButton, 
                  filter === 'open' && styles.filterButtonActive
                ]}
                onPress={() => setFilter('open')}
              >
                <Text style={[
                  styles.filterText,
                  filter === 'open' && styles.filterTextActive
                ]}>
                  Открытые
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.filterButton, 
                  filter === 'responded' && styles.filterButtonActive
                ]}
                onPress={() => setFilter('responded')}
              >
                <Text style={[
                  styles.filterText,
                  filter === 'responded' && styles.filterTextActive
                ]}>
                  С моим откликом
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
      />
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
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.text,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.white,
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
  },
});

export default LawyerRequestsScreen; 