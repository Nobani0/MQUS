import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, FlatList, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';

const CustomerHomeScreen = ({ navigation }) => {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('barbers_meta')
        .select(`
          id,
          shop_name,
          rating,
          profiles (full_name)
        `)
        .eq('is_active', true);

      if (error) throw error;
      setBarbers(data);
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحميل قائمة الحلاقين');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('خطأ', 'تعذر تسجيل الخروج');
  };

  const renderBarberItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.barberCard}
      onPress={() => navigation.navigate('Booking', { barber: item })}
    >
      <View>
        <Text style={styles.barberName}>{item.profiles?.full_name}</Text>
        <Text style={styles.barberShop}>{item.shop_name}</Text>
      </View>
      <Text style={styles.barberRating}>★ {item.rating || 'جديد'}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>مرحباً بك في مقص</Text>
          <Text style={styles.subtitle}>اختر حلاقك المفضل</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#8B5E3C" style={styles.loader} />
      ) : (
        <FlatList
          data={barbers}
          renderItem={renderBarberItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>لا يوجد حلاقين متاحين حالياً</Text>
          }
          refreshing={loading}
          onRefresh={fetchBarbers}
        />
      )}

      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutText}>تسجيل الخروج</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'right',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  barberCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 15,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  barberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5E3C',
    textAlign: 'right',
  },
  barberShop: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    marginTop: 2,
  },
  barberRating: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DAA520',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
    fontSize: 16,
  },
  logout: {
    margin: 20,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  logoutText: {
    color: '#ff4757',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CustomerHomeScreen;