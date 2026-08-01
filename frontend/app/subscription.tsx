import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSubscription } from '@/src/contexts/SubscriptionContext';

// @ts-ignore
import { Paywall } from 'react-native-purchases-ui';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { isPremium, checkSubscription } = useSubscription();

  // If user is already premium, show success screen
  if (isPremium) {
    return (
      <LinearGradient colors={['#1a472a', '#0d2818']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <Text style={styles.title}>You are Premium! 🌟</Text>
            <Text style={styles.subtitle}>
              Enjoy unlimited uploads, advanced analytics, and exclusive trees.
            </Text>
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={() => router.back()}
            >
              <Text style={styles.secondaryButtonText}>Go Back to App</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Show the RevenueCat Paywall for non-premium users
  return (
    <LinearGradient colors={['#1a472a', '#0d2818']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.closeButtonText}>✕ Close</Text>
        </TouchableOpacity>
        
        <Paywall
          onPurchaseCompleted={() => { 
            checkSubscription(); 
            Alert.alert('Success', 'Welcome to StudyAI Pro!'); 
          }}
          onPurchaseError={(info: any) => { 
            Alert.alert('Error', info.error?.message || 'Purchase failed'); 
          }}
          onRestoreCompleted={() => { 
            checkSubscription(); 
            Alert.alert('Restored', 'Subscription restored successfully!'); 
          }}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  }, 
  safeArea: { 
    flex: 1 
  },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 12,
    textAlign: 'center'
  },
  subtitle: { 
    fontSize: 16, 
    color: '#a8d5ba', 
    textAlign: 'center', 
    marginBottom: 32,
    lineHeight: 24
  },
  button: { 
    backgroundColor: '#2d8659', 
    borderRadius: 12, 
    padding: 16, 
    width: '100%', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  secondaryButton: { 
    backgroundColor: 'rgba(255,255,255,0.1)' 
  },
  secondaryButtonText: { 
    color: '#a8d5ba', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  closeButton: { 
    padding: 20, 
    alignSelf: 'flex-end' 
  },
  closeButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});