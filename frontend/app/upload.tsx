import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import api from '@/src/utils/api';
import { SafeAreaView } from 'react-native-safe-area-context';

type UploadType = 'text' | 'pdf' | 'image' | 'youtube' | null;

export default function UploadScreen() {
  const router = useRouter();
  const [uploadType, setUploadType] = useState<UploadType>(null);
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const handleTextUpload = async () => {
    if (!title || !textContent) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', textContent);
      await api.post('/materials/upload/text', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Success', 'Material uploaded!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Upload failed');
    } finally { setUploading(false); }
  };

  const handlePDFUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (!result.canceled && result.assets[0]) setSelectedFile(result.assets[0]);
  };

  const uploadPDF = async () => {
    if (!title || !selectedFile) { Alert.alert('Error', 'Please provide a title and select a PDF'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('file', { uri: selectedFile.uri, type: 'application/pdf', name: selectedFile.name } as any);
      await api.post('/materials/upload/pdf', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Success', 'PDF uploaded!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Upload failed');
    } finally { setUploading(false); }
  };

  const handleImageUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      allowsEditing: true, 
      quality: 1 
    });
    if (!result.canceled && result.assets[0]) setSelectedFile(result.assets[0]);
  };

  const uploadImage = async () => {
    if (!title || !selectedFile) { Alert.alert('Error', 'Please provide a title and select an image'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('file', { uri: selectedFile.uri, type: 'image/jpeg', name: 'image.jpg' } as any);
      await api.post('/materials/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Success', 'Image uploaded!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Upload failed');
    } finally { setUploading(false); }
  };

  const handleYouTubeUpload = async () => {
    if (!title || !youtubeUrl) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('url', youtubeUrl);
      await api.post('/materials/upload/youtube', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Success', 'YouTube video processed!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Upload failed');
    } finally { setUploading(false); }
  };

  if (!uploadType) {
    return (
      <LinearGradient colors={['#1a472a', '#0d2818']} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={28} color="#fff" /></TouchableOpacity>
            <Text style={styles.headerTitle}>Upload Material</Text>
            <View style={{ width: 28 }} />
          </View>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.subtitle}>Choose upload type</Text>
            <TouchableOpacity style={styles.typeCard} onPress={() => setUploadType('text')}>
              <View style={[styles.typeIcon, { backgroundColor: '#2d8659' }]}><Ionicons name="document-text" size={32} color="#fff" /></View>
              <View style={styles.typeInfo}><Text style={styles.typeTitle}>Text / Notes</Text><Text style={styles.typeDescription}>Paste your study notes directly</Text></View>
              <Ionicons name="chevron-forward" size={24} color="#a8d5ba" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.typeCard} onPress={() => setUploadType('pdf')}>
              <View style={[styles.typeIcon, { backgroundColor: '#e53935' }]}><Ionicons name="document" size={32} color="#fff" /></View>
              <View style={styles.typeInfo}><Text style={styles.typeTitle}>PDF Document</Text><Text style={styles.typeDescription}>Upload lecture slides or textbooks</Text></View>
              <Ionicons name="chevron-forward" size={24} color="#a8d5ba" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.typeCard} onPress={() => setUploadType('image')}>
              <View style={[styles.typeIcon, { backgroundColor: '#8e24aa' }]}><Ionicons name="image" size={32} color="#fff" /></View>
              <View style={styles.typeInfo}><Text style={styles.typeTitle}>Image / Photo</Text><Text style={styles.typeDescription}>Upload handwritten notes</Text></View>
              <Ionicons name="chevron-forward" size={24} color="#a8d5ba" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.typeCard} onPress={() => setUploadType('youtube')}>
              <View style={[styles.typeIcon, { backgroundColor: '#ff0000' }]}><Ionicons name="logo-youtube" size={32} color="#fff" /></View>
              <View style={styles.typeInfo}><Text style={styles.typeTitle}>YouTube Video</Text><Text style={styles.typeDescription}>Extract transcript from video</Text></View>
              <Ionicons name="chevron-forward" size={24} color="#a8d5ba" />
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a472a', '#0d2818']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setUploadType(null)}><Ionicons name="arrow-back" size={28} color="#fff" /></TouchableOpacity>
            <Text style={styles.headerTitle}>{uploadType === 'text' ? 'Text Notes' : uploadType === 'pdf' ? 'PDF Document' : uploadType === 'image' ? 'Image Upload' : 'YouTube Video'}</Text>
            <View style={{ width: 28 }} />
          </View>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <TextInput style={styles.input} placeholder="Material Title" placeholderTextColor="#8b9a8d" value={title} onChangeText={setTitle} />
            {uploadType === 'text' && (
              <>
                <TextInput style={[styles.input, styles.textArea]} placeholder="Paste your notes here..." placeholderTextColor="#8b9a8d" value={textContent} onChangeText={setTextContent} multiline numberOfLines={10} textAlignVertical="top" />
                <TouchableOpacity style={styles.uploadButton} onPress={handleTextUpload} disabled={uploading}>
                  {uploading ? <ActivityIndicator color="#fff" /> : <><Ionicons name="cloud-upload" size={24} color="#fff" /><Text style={styles.uploadButtonText}>Upload & Generate</Text></>}
                </TouchableOpacity>
              </>
            )}
            {uploadType === 'pdf' && (
              <>
                <TouchableOpacity style={styles.filePickerButton} onPress={handlePDFUpload}>
                  <Ionicons name="document" size={24} color="#2d8659" />
                  <Text style={styles.filePickerText}>{selectedFile ? selectedFile.name : 'Select PDF File'}</Text>
                </TouchableOpacity>
                {selectedFile && (
                  <TouchableOpacity style={styles.uploadButton} onPress={uploadPDF} disabled={uploading}>
                    {uploading ? <ActivityIndicator color="#fff" /> : <><Ionicons name="cloud-upload" size={24} color="#fff" /><Text style={styles.uploadButtonText}>Upload & Generate</Text></>}
                  </TouchableOpacity>
                )}
              </>
            )}
            {uploadType === 'image' && (
              <>
                <TouchableOpacity style={styles.filePickerButton} onPress={handleImageUpload}>
                  <Ionicons name="image" size={24} color="#2d8659" />
                  <Text style={styles.filePickerText}>{selectedFile ? 'Image Selected' : 'Select Image'}</Text>
                </TouchableOpacity>
                {selectedFile && (
                  <TouchableOpacity style={styles.uploadButton} onPress={uploadImage} disabled={uploading}>
                    {uploading ? <ActivityIndicator color="#fff" /> : <><Ionicons name="cloud-upload" size={24} color="#fff" /><Text style={styles.uploadButtonText}>Upload & Extract Text</Text></>}
                  </TouchableOpacity>
                )}
              </>
            )}
            {uploadType === 'youtube' && (
              <>
                <TextInput style={styles.input} placeholder="YouTube URL" placeholderTextColor="#8b9a8d" value={youtubeUrl} onChangeText={setYoutubeUrl} autoCapitalize="none" />
                <TouchableOpacity style={styles.uploadButton} onPress={handleYouTubeUpload} disabled={uploading}>
                  {uploading ? <ActivityIndicator color="#fff" /> : <><Ionicons name="cloud-upload" size={24} color="#fff" /><Text style={styles.uploadButtonText}>Process Video</Text></>}
                </TouchableOpacity>
              </>
            )}
            {uploading && (
              <View style={styles.uploadingMessage}>
                <ActivityIndicator size="large" color="#2d8659" />
                <Text style={styles.uploadingText}>Processing your material and generating questions...</Text>
                <Text style={styles.uploadingSubtext}>This may take 15-30 seconds</Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, safeArea: { flex: 1 }, keyboardView: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  scrollView: { flex: 1 }, scrollContent: { padding: 20, paddingTop: 0 },
  subtitle: { fontSize: 16, color: '#a8d5ba', marginBottom: 20 },
  typeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 16, padding: 20, marginBottom: 16 },
  typeIcon: { width: 60, height: 60, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  typeInfo: { flex: 1 }, typeTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 }, typeDescription: { fontSize: 14, color: '#a8d5ba' },
  input: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, padding: 16, fontSize: 16, color: '#fff', marginBottom: 16 },
  textArea: { height: 200, textAlignVertical: 'top' },
  filePickerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, padding: 20, marginBottom: 16, borderWidth: 2, borderColor: 'rgba(45, 134, 89, 0.3)', borderStyle: 'dashed' },
  filePickerText: { fontSize: 16, color: '#2d8659', marginLeft: 12, fontWeight: '600' },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2d8659', borderRadius: 12, padding: 18, marginTop: 8 },
  uploadButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginLeft: 12 },
  uploadingMessage: { alignItems: 'center', marginTop: 32, padding: 24, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 16 },
  uploadingText: { fontSize: 16, color: '#fff', textAlign: 'center', marginTop: 16 },
  uploadingSubtext: { fontSize: 14, color: '#a8d5ba', textAlign: 'center', marginTop: 8 },
});