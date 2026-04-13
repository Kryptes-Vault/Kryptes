import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CreditCard } from 'lucide-react-native';

export default function CardsScreen() {
  return (
    <View style={styles.container}>
      <CreditCard size={48} color="#FF3B13" />
      <Text style={styles.title}>Bank Cards</Text>
      <Text style={styles.subtitle}>Secure Payment Methods</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
});
