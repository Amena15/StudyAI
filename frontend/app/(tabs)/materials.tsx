import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/src/utils/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MaterialsScreen() {
  const router = useRouter();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMaterials(); }, []);

  const loadMaterials = async () => {
    try {
      const response = await api.get('/materials');
      setMaterials(response.data);
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => type === 'pdf' ? 'document-text' : type === 'image' ? 'image' : type === 'youtube' ? 'logo-youtube' : 'document';
  const getTypeColor = (type: string) => type === 'pdf' ? '#e53935' : type === 'image' ? '#8e24aa' : type === 'youtube' ? '#ff0000' : '#2d8659';

  const renderMaterial = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.materialCard}>
      <View style={[styles.iconContainer, { backgroundColor: getTypeColor(item.type) }]}>
        <Ionicons name={getTypeIcon(item.type) as any} size={24} color="#fff" />
      </View>
      <View style={styles.materialInfo}>
        <Text style={styles.materialTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.materialType}>{item.type.toUpperCase()} • {new Date(item.uploaded_at).toLocaleDateString()}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#a8d5ba" />
    </TouchableOpacity>
  );

  if (loading) return <LinearGradient colors={['#1a472a', '#0d2818']} style={styles.container}><ActivityIndicator size="large" color="#fff" /></LinearGradient>;

  return (
    <LinearGradient colors={['#1a472a', '#0d2818']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>My Materials</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/upload')}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        {materials.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open" size={80} color="#2d8659" />
            <Text style={styles.emptyTitle}>No Materials Yet</Text>
            <Text style={styles.emptyText}>Upload your study materials to generate flashcards!</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={() => router.push('/upload')}>
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.uploadButtonText}>Upload Material</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList data={materials} renderItem={renderMaterial} keyExtractor={(item) => item.id} contentContainerStyle={styles.listContent} />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  addButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2d8659', justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 20, paddingTop: 0 },
  materialCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 16, padding: 16, marginBottom: 12 },
  iconContainer: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  materialInfo: { flex: 1 }, materialTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 }, materialType: { fontSize: 12, color: '#a8d5ba' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 24, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#a8d5ba', textAlign: 'center', marginBottom: 32 },
  uploadButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2d8659', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 24 },
  uploadButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
});