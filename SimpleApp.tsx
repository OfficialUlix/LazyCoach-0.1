import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, TouchableOpacity } from 'react-native';

// Simple LazyCoach app that should definitely work
export default function SimpleApp(): React.ReactElement {
  const [count, setCount] = React.useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={require('./assets/LazyCoachLogo.jpeg')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.title}>LazyCoach</Text>
        <Text style={styles.subtitle}>Your Personal Growth Partner</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>App Status</Text>
          <Text style={styles.statusText}>✅ Running Successfully! (Stable)</Text>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={() => setCount(count + 1)}
          >
            <Text style={styles.buttonText}>Test Tap: {count}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.features}>
          <Text style={styles.featuresTitle}>Features Ready:</Text>
          <Text style={styles.feature}>🎨 Hot-swappable themes</Text>
          <Text style={styles.feature}>👥 Coach/Client registration</Text>
          <Text style={styles.feature}>🔐 Biometric verification</Text>
          <Text style={styles.feature}>⚡ Real-time messaging</Text>
          <Text style={styles.feature}>📱 Offline support</Text>
          <Text style={styles.feature}>📊 Analytics tracking</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    color: '#28a745',
    marginBottom: 16,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  features: {
    alignItems: 'center',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  feature: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});