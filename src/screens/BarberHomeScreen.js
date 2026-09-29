import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, FlatList, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';

const BarberHomeScreen = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState(0);

  useEffect(() => {
    fetchBarberData();
  }, []);

  const fetchBarberData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Get Barber ID from profiles/barbers_meta
      const { data: barberMeta, error: metaError } = await supabase
        .from('barbers_meta')
        .select('id')
        .eq('profile_id', (await supabase.from('profiles').select('id').eq('user_id', user.id).single()).data.id)
        .single();

      if (metaError) throw metaError;

      // 2. Fetch Appointments
      const { data: appts, error: apptError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_time,
          status,
          profiles (full_name),
          services (title, price)
        `)
        .eq('barber_id', barberMeta.id)
        .order('appointment_time', { ascending: true });

      if (apptError) throw apptError;
      setAppointments(appts);

      // 3. Simple Earnings Calculation (Sum of completed services)
      const total = appts
        .filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + (parseFloat(a.services?.price) || 0), 0);
      setEarnings(total);

    } catch (error) {
      console.error(error);
      Alert.alert('خطأ', 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('خطأ', 'تعذر تسجيل الخروج');
  };

  const renderAppointmentItem = ({ item }) => (
    <View style={styles.bookingCard}>
      <View>
        <Text style={styles.bookingCustomer}>{item.profiles?.full_name}</Text>
        <Text style={styles.bookingService}>{item.services?.title}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.bookingTime}>
          {new Date(item.appointment_time).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={[styles.statusText, { color: item.status === 'pending' ? '#DAA520' : '#28a745' }]}>
          {item.status === 'pending' ? 'قيد الانتظار' : 'مكتمل'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>لوحة تحكم الحلاق</Text>
        <Text style={styles.subtitle}>إدارة الحجوزات والدخل</Text>
      </View>

      <View style={styles.earningsBox}>
        <Text style={styles.earningsLabel}>إجمالي الدخل (المكتمل):</Text>
        <Text style={styles.earningsAmount}>{earnings} د.أ</Text>
      </View>

      <Text style={styles.sectionTitle}>الحجوزات اليوم:</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#8B5E3C" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={appointments}
          renderItem={renderAppointmentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>لا توجد حجوزات حالياً</Text>}
          onRefresh={fetchBarberData}
          refreshing={loading}
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
  earningsBox: {
    backgroundColor: '#8B5E3C',
    margin: 20,
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#8B5E3C',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 5,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
    marginBottom: 15,
    textAlign: 'right',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  bookingCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 15,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  bookingCustomer: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  bookingService: {
    fontSize: 14,
    color: '#8B5E3C',
    marginTop: 2,
    textAlign: 'right',
  },
  bookingTime: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  statusText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#999',
  },
  logout: {
    margin: 20,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: '#ff4757',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default BarberHomeScreen;