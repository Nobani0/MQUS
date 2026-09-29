import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput } from 'react-native';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const ReviewsScreen = ({ navigation, route }) => {
  const { appointmentId, barberId } = route.params || {};
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('تنبيه', 'يرجى اختيار تقييم (1-5)');
      return;
    }

    if (!isSupabaseConfigured) {
      Alert.alert('تنبيه', 'Supabase غير مُعد');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          appointment_id: appointmentId,
          customer_id: 'demo-customer-id', // from auth in real app
          barber_id: barberId,
          rating,
          comment: comment || null,
        });

      if (error) throw error;
      Alert.alert('نجاح', 'شكراً لتقييمك!', [
        { text: 'حسناً', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('خطأ', err.message || 'فشل إرسال التقييم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>تقييم الخدمة</Text>
      <Text style={styles.subheader}>اختر تقييماً من 1 إلى 5 نجوم</Text>

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Text style={star <= rating ? styles.starActive : styles.starInactive}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.ratingText}>{rating}/5</Text>

      <View style={styles.commentGroup}>
        <Text style={styles.inputLabel}>تعليق (اختياري)</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="اكتب تجربتك..."
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>إرسال التقييم</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  subheader: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  starActive: {
    fontSize: 36,
    color: '#ffc107',
    marginHorizontal: 6,
  },
  starInactive: {
    fontSize: 36,
    color: '#ddd',
    marginHorizontal: 6,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 24,
  },
  commentGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  commentInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#8B5E3C',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReviewsScreen;