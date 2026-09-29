import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';

function AuthScreen({ route, navigation }) {
  const { userType } = route.params || { userType: 'customer' };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // Added for Sign Up
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between Login and Sign Up

  const handleAuth = async () => {
    if (!email || !password || (isSignUp && !fullName)) {
      Alert.alert('تنبيه', 'يرجى ملء جميع الحقول');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // 1. Sign Up User
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData?.user) {
          // 2. Create Profile in 'profiles' table
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              { 
                user_id: authData.user.id, 
                user_type: userType, 
                full_name: fullName 
              }
            ]);

          if (profileError) throw profileError;
          Alert.alert('نجاح', 'تم إنشاء الحساب بنجاح. يرجى تفعيل البريد الإلكتروني إذا لزم الأمر.');
        }
      } else {
        // Login Logic
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) throw loginError;
      }

      // Navigate based on userType
      if (userType === 'customer') {
        navigation.replace('CustomerHome');
      } else {
        navigation.replace('BarberHome');
      }
    } catch (error) {
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء العملية');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>{isSignUp ? 'إنشاء حساب' : 'تسجيل الدخول'}</Text>
        <Text style={styles.subheader}>
          {userType === 'customer' ? 'مرحباً بك في مقص (عميل)' : 'مرحباً بك في مقص (حلاق)'}
        </Text>
      </View>

      <View style={styles.form}>
        {isSignUp && (
          <TextInput
            style={styles.input}
            placeholder="الاسم الكامل"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="البريد الإلكتروني"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="كلمة المرور"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleAuth} 
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{isSignUp ? 'تسجيل جديد' : 'دخول'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setIsSignUp(!isSignUp)} 
          style={styles.toggleButton}
        >
          <Text style={styles.toggleText}>
            {isSignUp ? 'لديك حساب بالفعل؟ سجل دخول' : 'ليس لديك حساب؟ أنشئ حساباً الآن'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backButtonText}>العودة للخلف</Text>
      </TouchableOpacity>
      
      <Text style={styles.footer}>جميع الحقوق محفوظة © 2026 MQUS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 30,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B5E3C',
    marginBottom: 10,
  },
  subheader: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#8B5E3C',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
    backButtonText: {
    color: '#8B5E3C',
    fontSize: 14,
  },
  toggleButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  toggleText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    fontSize: 12,
    color: '#999',
  },
});
