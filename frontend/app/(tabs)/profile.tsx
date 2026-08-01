import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <LinearGradient colors={['#1a472a', '#0d2818']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{user?.name.charAt(0).toUpperCase()}</Text></View>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.badge}>
              <Ionicons name={user?.subscription_tier === 'premium' ? 'star' : 'leaf'} size={16} color="#fff" />
              <Text style={styles.badgeText}>{user?.subscription_tier === 'premium' ? 'Premium' : 'Free'}</Text>
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            {user?.subscription_tier === 'free' && (
              <TouchableOpacity style={styles.upgradeCard} onPress={() => router.push('/subscription')}>
                <View style={styles.upgradeIcon}><Ionicons name="star" size={32} color="#ffd93d" /></View>
                <View style={styles.upgradeInfo}>
                  <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
                  <Text style={styles.upgradeText}>Unlimited uploads, advanced features, and more!</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#a8d5ba" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.menuItem}><Ionicons name="notifications" size={24} color="#2d8659" /><Text style={styles.menuText}>Notifications</Text><Ionicons name="chevron-forward" size={24} color="#a8d5ba" /></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color="#e53935" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
          <Text style={styles.version}>Version 1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, safeArea: { flex: 1 }, scrollView: { flex: 1 }, scrollContent: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 32 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#2d8659', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 40, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  email: { fontSize: 16, color: '#a8d5ba', marginBottom: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(45, 134, 89, 0.3)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  badgeText: { color: '#fff', marginLeft: 6, fontWeight: '600' },
  section: { marginBottom: 24 }, sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  upgradeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 217, 61, 0.1)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: 'rgba(255, 217, 61, 0.3)' },
  upgradeIcon: { marginRight: 16 }, upgradeInfo: { flex: 1 }, upgradeTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 }, upgradeText: { fontSize: 14, color: '#a8d5ba' },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, padding: 16, marginBottom: 8 },
  menuText: { flex: 1, fontSize: 16, color: '#fff', marginLeft: 16 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(229, 57, 53, 0.1)', borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, borderColor: 'rgba(229, 57, 53, 0.3)' },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#e53935', marginLeft: 8 },
  version: { textAlign: 'center', color: '#8b9a8d', fontSize: 14, marginTop: 24 },
});