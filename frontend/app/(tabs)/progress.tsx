import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/src/utils/api';

export default function ProgressScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats').then(res => setStats(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LinearGradient colors={['#1a472a', '#0d2818']} style={styles.container}><ActivityIndicator size="large" color="#fff" /></LinearGradient>;

  return (
    <LinearGradient colors={['#1a472a', '#0d2818']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.content}>
          <Text style={styles.title}>Progress Dashboard</Text>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats?.total_cards || 0}</Text>
            <Text style={styles.statLabel}>Total Cards</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats?.mastered_cards || 0}</Text>
            <Text style={styles.statLabel}>Mastered</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats?.current_streak || 0} 🔥</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, safeArea: { flex: 1 },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 32, textAlign: 'center' },
  statBox: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 16, padding: 24, marginBottom: 16, alignItems: 'center' },
  statValue: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 16, color: '#a8d5ba', marginTop: 8 },
});