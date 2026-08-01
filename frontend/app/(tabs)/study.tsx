import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/src/utils/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudyScreen() {
  const router = useRouter();
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => { loadDueCards(); }, []);

  const loadDueCards = async () => {
    try {
      const response = await api.get('/flashcards/due');
      setFlashcards(response.data.flashcards);
    } catch (error) {
      Alert.alert('Error', 'Failed to load flashcards');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (rating: string) => {
    if (reviewing) return;
    setReviewing(true);
    try {
      const currentCard = flashcards[currentIndex];
      await api.post(`/flashcards/${currentCard.id}/review`, null, { params: { rating } });
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
      } else {
        Alert.alert('Session Complete! 🎉', 'Great work! Your tree has grown.', [{ text: 'OK', onPress: () => router.push('/(tabs)') }]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to record review');
    } finally {
      setReviewing(false);
    }
  };

  if (loading) return <LinearGradient colors={['#1a472a', '#0d2818']} style={styles.container}><ActivityIndicator size="large" color="#fff" /></LinearGradient>;

  if (flashcards.length === 0) {
    return (
      <LinearGradient colors={['#1a472a', '#0d2818']} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#2d8659" />
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptyText}>No cards due for review right now.</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={() => router.push('/upload')}>
              <Text style={styles.uploadButtonText}>Upload Material</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <LinearGradient colors={['#1a472a', '#0d2818']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>{currentIndex + 1} / {flashcards.length}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${((currentIndex + 1) / flashcards.length) * 100}%` }]} />
            </View>
          </View>
          <TouchableOpacity style={styles.cardContainer} onPress={() => setShowAnswer(!showAnswer)} activeOpacity={0.9}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>{showAnswer ? 'Answer' : 'Question'}</Text>
              <ScrollView style={styles.cardTextContainer} contentContainerStyle={styles.cardTextContent}>
                <Text style={styles.cardText}>{showAnswer ? currentCard.answer : currentCard.question}</Text>
              </ScrollView>
              <View style={styles.tapHint}>
                <Ionicons name="hand-left" size={20} color="#a8d5ba" />
                <Text style={styles.tapHintText}>{showAnswer ? 'Tap to hide answer' : 'Tap to reveal answer'}</Text>
              </View>
            </View>
          </TouchableOpacity>
          {showAnswer && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingTitle}>How well did you know this?</Text>
              <TouchableOpacity style={[styles.ratingButton, styles.ratingAgain]} onPress={() => handleReview('again')} disabled={reviewing}><Text style={styles.ratingButtonText}>😰 Again</Text><Text style={styles.ratingButtonSub}>Review in 1 day</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.ratingButton, styles.ratingHard]} onPress={() => handleReview('hard')} disabled={reviewing}><Text style={styles.ratingButtonText}>😅 Hard</Text><Text style={styles.ratingButtonSub}>Review sooner</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.ratingButton, styles.ratingGood]} onPress={() => handleReview('good')} disabled={reviewing}><Text style={styles.ratingButtonText}>🙂 Good</Text><Text style={styles.ratingButtonSub}>Normal interval</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.ratingButton, styles.ratingEasy]} onPress={() => handleReview('easy')} disabled={reviewing}><Text style={styles.ratingButtonText}>😎 Easy</Text><Text style={styles.ratingButtonSub}>Review later</Text></TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, safeArea: { flex: 1 }, scrollView: { flex: 1 }, scrollContent: { padding: 20 },
  progressContainer: { marginBottom: 24 }, progressText: { color: '#a8d5ba', fontSize: 16, marginBottom: 8, textAlign: 'center', fontWeight: '600' },
  progressBar: { height: 8, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 4, overflow: 'hidden' }, progressFill: { height: '100%', backgroundColor: '#2d8659' },
  cardContainer: { marginBottom: 24 },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 20, padding: 32, minHeight: 300, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  cardLabel: { fontSize: 14, color: '#2d8659', fontWeight: '600', marginBottom: 16, textTransform: 'uppercase' },
  cardTextContainer: { flex: 1 }, cardTextContent: { flexGrow: 1, justifyContent: 'center' }, cardText: { fontSize: 22, color: '#0d2818', lineHeight: 32, textAlign: 'center' },
  tapHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 }, tapHintText: { color: '#8b9a8d', fontSize: 14, marginLeft: 8 },
  ratingContainer: { marginTop: 16 }, ratingTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  ratingButton: { borderRadius: 12, padding: 16, marginBottom: 12 },
  ratingAgain: { backgroundColor: '#d32f2f' }, ratingHard: { backgroundColor: '#f57c00' }, ratingGood: { backgroundColor: '#2d8659' }, ratingEasy: { backgroundColor: '#1976d2' },
  ratingButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }, ratingButtonSub: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, textAlign: 'center', marginTop: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }, emptyTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 24, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#a8d5ba', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  uploadButton: { backgroundColor: '#2d8659', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32 }, uploadButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});