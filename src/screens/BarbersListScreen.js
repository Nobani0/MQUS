import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const BarbersListScreen = ({ navigation }) => {
  const [barbers, setBarbers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBarbers = async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase غير مُعد. يرجى إضافة متغيرات البيئة.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('barbers_meta')
        .select('id, shop_name, location_address, rating, experience_years')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      setBarbers(data || []);
    } catch (err) {
      setError(err.message || 'فشل تحميل قائمة الحلاقين');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBarbers();
  }, []);

  const handleSelectBarber = (barber) => {
    navigation.navigate('Booking', { barber });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5E3C" />
        <Text style={styles.loadingText}>جاري تحميل الحلاقين...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBarbers}>
          <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>اختر حلاقك</Text>
      <Text style={styles.subheader}>{barbers.length} حلاق متاح</Text>

      <FlatList
        data={barbers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.barberCard} onPress={() => handleSelectBarber(item)}>
            <View style={styles.barberInfo}>
              <Text style={styles.shopName}>{item.shop_name}</Text>
              <Text style={styles.location}>📍 {item.location_address}</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.rating}>★ {item.rating || 0.0}</Text>
                <Text style={styles.experience}>{item.experience_years || 0} سنوات خبرة</Text>
              </View>
            </View>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  subheader: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4757',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#8B5E3C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  barberCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  barberInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  location: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  rating: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
  },
  experience: {
    fontSize: 13,
    color: '#8B5E3C',
  },
  arrowText: {
    fontSize: 24,
    color: '#ccc',
  },
  separator: {
    height: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default BarbersListScreen;