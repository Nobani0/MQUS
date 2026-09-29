import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Logo/Illustration */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>مقص</Text>
        <Text style={styles.logoSubtext}>MQUS</Text>
      </View>
      
      {/* Title */}
      <Text style={styles.title}>مرحبًا بك في مصففك الشخصي</Text>
      
      {/* Subtitle */}
      <Text style={styles.subtitle}>
        احجز موعدك مع أفضل الحلاقين في منطقتك بسهولة وسرعة
      </Text>
      
      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.buttonCustomer}
          onPress={() => navigation.navigate('Auth', { userType: 'customer' })}
        >
          <Text style={styles.buttonText}>دخول كعميل</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.buttonBarber}
          onPress={() => navigation.navigate('Auth', { userType: 'barber' })}
        >
          <Text style={styles.buttonText}>دخول كحلاّق</Text>
        </TouchableOpacity>
      </View>
      
      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 MQUS. جميع الحقوق محفوظة.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#8B5E3C',
    marginBottom: 4,
  },
  logoSubtext: {
    fontSize: 18,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonsContainer: {
    gap: 12,
  },
  buttonCustomer: {
    backgroundColor: '#8B5E3C',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonBarber: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#8B5E3C',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextBarber: {
    color: '#8B5E3C',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});