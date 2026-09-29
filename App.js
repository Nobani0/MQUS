import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './src/services/supabase';

import WelcomeScreen from './src/screens/WelcomeScreen';
import AuthScreen from './src/screens/AuthScreen';
import CustomerHomeScreen from './src/screens/CustomerHomeScreen';
import BarberHomeScreen from './src/screens/BarberHomeScreen';
import BarbersListScreen from './src/screens/BarbersListScreen';
import BookingScreen from './src/screens/BookingScreen';
import ReviewsScreen from './src/screens/ReviewsScreen';

const Stack = createStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session and user type
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await fetchUserType(session.user.id);
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await fetchUserType(session.user.id);
      } else {
        setUserType(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserType = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('user_id', userId)
        .single();
      
      if (data) setUserType(data.user_type);
      if (error) console.error('Error fetching user type:', error.message);
    } catch (error) {
      console.error('User type fetch error:', error);
    }
  };

  if (loading) return null;

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark" />
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
      >
        {session && userType ? (
          // Authenticated routes based on user type
          userType === 'customer' ? (
            <>
              <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />
              <Stack.Screen name="BarbersList" component={BarbersListScreen} />
              <Stack.Screen name="Booking" component={BookingScreen} />
              <Stack.Screen name="Reviews" component={ReviewsScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="BarberHome" component={BarberHomeScreen} />
              <Stack.Screen name="Reviews" component={ReviewsScreen} />
              {/* Add other barber-specific screens here */}
            </>
          )
        ) : (
          // Unauthenticated routes
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}