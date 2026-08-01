import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/src/utils/api';
import { useAuth } from '@/src/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [tree, setTree] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [growthAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (tree) {
      Animated.timing(growthAnim, { toValue: tree.growth_level, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    }
  }, [tree]);

  const loadData = async () => {
    try {
      const [treeRes, streakRes, statsRes] = await Promise.all([api.get('/tree'), api.get('/streak'), api.get('/stats')]);
      setTree(treeRes.data);
      setStreak(streakRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTreeEmoji = () => {
    if (!tree) return '🌱';
    const growth = tree.growth_level;
    if (growth < 10) return '🌱';
    if (growth < 30) return '🌿';
    if (growth < 60) return '🌳';
    return '🌲';
  };

  if (loading) {
    return <LinearGradient colors={['#1a472a', '#0d2818']} style={styles.container}><ActivityIndicator size="large" color="#fff" /></LinearGradient>;
  }

  return (
    <LinearGradient colors={['#1a472a', '#0d2818']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Hello, {user?.name}!</Text>
              <Text style={styles.subGreeting}>Keep your tree growing 🌱</Text>
            </View>
            <TouchableOpacity style={styles.statsButton} onPress={() => router.push('/(tabs)/progress')}>
              <Ionicons name="stats-chart" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={24} color="#ff6b35" />
                <Text style={styles.streakNumber}>{streak?.current_streak || 0}</Text>
                <Text style={styles.streakLabel}>Day Streak</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.dueBadge}>
                <Ionicons name="time" size={24} color="#ffd93d" />
                <Text style={styles.dueNumber}>{stats?.due_today || 0}</Text>
                <Text style={styles.dueLabel}>Due Today</Text>
              </View>
            </View>
          </View>

          <View style={styles.treeContainer}>
            <Text style={styles.treeTitle}>Your Knowledge Tree</Text>
            <View style={styles.treeCircle}>
              <Animated.Text style={[styles.treeEmoji, { fontSize: growthAnim.interpolate({ inputRange: [0, 100], outputRange: [80, 230] }) }]}>
                {getTreeEmoji()}
              </Animated.Text>
            </View>
            <View style={styles.growthBarContainer}>
              <View style={styles.growthBar}>
                <Animated.View style={[styles.growthFill, { width: growthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
              </View>
              <Text style={styles.growthText}>{tree?.growth_level || 0}% Growth</Text>
            </View>
            <Text style={styles.treeDescription}>
              {tree && tree.growth_level < 10 && "Your tree is just starting. Water it with correct answers!"}
              {tree && tree.growth_level >= 10 && tree.growth_level < 30 && "Nice sprout! Keep studying to grow it more."}
              {tree && tree.growth_level >= 30 && tree.growth_level < 60 && "Your sapling is thriving! Don't forget to review."}
              {tree && tree.growth_level >= 60 && "Magnificent tree! You're mastering your subjects."}
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(tabs)/study')}>
            <Ionicons name="book" size={24} color="#fff" />
            <Text style={styles.primaryButtonText}>Start Studying</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/upload')}>
            <Ionicons name="add-circle" size={24} color="#2d8659" />
            <Text style={styles.secondaryButtonText}>Upload Material</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, safeArea: { flex: 1 }, scrollView: { flex: 1 }, scrollContent: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#fff' }, subGreeting: { fontSize: 16, color: '#a8d5ba', marginTop: 4 },
  statsButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 16, padding: 20, marginBottom: 24 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  streakBadge: { flex: 1, alignItems: 'center' }, streakNumber: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 8 }, streakLabel: { fontSize: 14, color: '#a8d5ba', marginTop: 4 },
  divider: { width: 1, height: 60, backgroundColor: 'rgba(255, 255, 255, 0.2)', marginHorizontal: 20 },
  dueBadge: { flex: 1, alignItems: 'center' }, dueNumber: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 8 }, dueLabel: { fontSize: 14, color: '#a8d5ba', marginTop: 4 },
  treeContainer: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24 },
  treeTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  treeCircle: { width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(45, 134, 89, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  treeEmoji: { fontSize: 120 },
  growthBarContainer: { width: '100%', marginTop: 16 },
  growthBar: { height: 12, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 6, overflow: 'hidden' },
  growthFill: { height: '100%', backgroundColor: '#2d8659' },
  growthText: { color: '#a8d5ba', fontSize: 14, marginTop: 8, textAlign: 'center', fontWeight: '600' },
  treeDescription: { color: '#a8d5ba', fontSize: 14, textAlign: 'center', marginTop: 16, lineHeight: 20 },
  primaryButton: { backgroundColor: '#2d8659', borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 12 },
  secondaryButton: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  secondaryButtonText: { color: '#2d8659', fontSize: 18, fontWeight: 'bold', marginLeft: 12 },
});