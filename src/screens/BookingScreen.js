import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const BookingScreen = ({ navigation, route }) => {
  const { barber } = route.params || {};
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [appointmentTime, setAppointmentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchServices = async () => {
    if (!barber || !isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, title, price, duration_minutes')
        .eq('barber_id', barber.id)
        .order('price', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      setError(err.message || 'فشل تحميل الخدمات');
    }
  };

  useEffect(() => {
    fetchServices();
  }, [barber]);

  const formatDateTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('ar-SA', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const timeStr = d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${dateStr} - ${timeStr}`;
  };

    const handleBook = async () => {
    if (!selectedService) {
      Alert.alert('تنبيه', 'يرجى اختيار خدمة');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Get current customer profile ID
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // 2. Insert Appointment
      const { error: insertError } = await supabase
        .from('appointments')
        .insert({
          customer_id: profile.id,
          barber_id: barber.id,
          service_id: selectedService.id,
          appointment_time: appointmentTime.toISOString(),
          status: 'pending',
        });

      if (insertError) throw insertError;

      Alert.alert('نجاح', 'تم حجز الموعد بنجاح!', [
        { text: 'حسناً', onPress: () => navigation.replace('CustomerHome') },
      ]);
    } catch (err) {
      setError(err.message || 'فشل الحجز. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!barber) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>لم يتم تحديد حلاق</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.barberHeader}>
        <Text style={styles.barberName}>{barber.shop_name}</Text>
        <Text style={styles.barberLocation}>📍 {barber.location_address}</Text>
      </View>

      <Text style={styles.sectionTitle}>اختر الخدمة</Text>
      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.serviceCard,
              selectedService?.id === item.id && styles.serviceCardSelected,
            ]}
            onPress={() => setSelectedService(item)}
          >
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceTitle}>{item.title}</Text>
              <Text style={styles.serviceDetails}>
                {item.duration_minutes} دقيقة • {item.price} جنية
              </Text>
            </View>
            {selectedService?.id === item.id && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>موعد الحجز</Text>
        <View style={styles.dateTimeContainer}>
          <TouchableOpacity 
            style={styles.dateTimeButton} 
            onPress={() => {
              // For demo, just set a random future time
              const newTime = new Date();
              newTime.setDate(newTime.getDate() + Math.floor(Math.random() * 7));
              newTime.setHours(9 + Math.floor(Math.random() * 8)); // 9am-5pm
              setAppointmentTime(newTime);
            }}
          >
            <Text style={styles.dateTimeLabel}>تعديل التاريخ والوقت</Text>
            <Text style={styles.dateTimeValue}>{formatDateTime(appointmentTime)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        style={[styles.bookButton, isLoading && styles.bookButtonDisabled]}
        onPress={handleBook}
        disabled={isLoading || !selectedService}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.bookButtonText}>حجز الموعد</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
  },
  barberHeader: {
    marginBottom: 25,
    alignItems: 'center',
  },
  barberName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5E3C',
    textAlign: 'center',
  },
  barberLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'right',
  },
  serviceCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 15,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 10,
  },
  serviceCardSelected: {
    borderColor: '#8B5E3C',
    backgroundColor: '#FAF3EE',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  serviceDetails: {
    fontSize: 13,
    color: '#8B5E3C',
    marginTop: 2,
    textAlign: 'right',
  },
  checkmark: {
    fontSize: 20,
    color: '#8B5E3C',
    fontWeight: 'bold',
  },
  dateTimeContainer: {
  },
  dateTimeButton: {
    backgroundColor: '#f9f9f9',
    padding: 18,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'flex-end',
  },
  dateTimeLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  dateTimeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  errorText: {
    color: '#ff4757',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  bookButton: {
    backgroundColor: '#8B5E3C',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#8B5E3C',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  bookButtonDisabled: {
    backgroundColor: '#ccc',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  separator: {
    height: 0,
  },
  listContent: {
    paddingBottom: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default BookingScreen;