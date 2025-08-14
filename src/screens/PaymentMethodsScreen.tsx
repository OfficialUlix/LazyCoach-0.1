import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { PaymentMethod, paymentService } from '../services/PaymentService';
import { useTheme } from '../context/ThemeContext';
import { analyticsService } from '../services/AnalyticsService';
import PaymentMethodCard from '../components/payment/PaymentMethodCard';
import { Loading } from '../components/Loading';
import { ErrorBoundary } from '../components/ErrorBoundary';

const PaymentMethodsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    analyticsService.trackScreenView('PaymentMethods');
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
      Alert.alert(
        'Error',
        'Failed to load payment methods. Please try again.',
        [
          { text: 'Cancel' },
          { text: 'Retry', onPress: () => loadPaymentMethods(isRefresh) },
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      await paymentService.setDefaultPaymentMethod(paymentMethodId);
      await loadPaymentMethods();
    } catch (error) {
      console.error('Failed to set default payment method:', error);
      Alert.alert('Error', 'Failed to update default payment method');
    }
  };

  const handleRemovePaymentMethod = (paymentMethod: PaymentMethod) => {
    Alert.alert(
      'Remove Payment Method',
      `Are you sure you want to remove ${paymentMethod.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await paymentService.removePaymentMethod(paymentMethod.id);
              await loadPaymentMethods();
            } catch (error) {
              console.error('Failed to remove payment method:', error);
              Alert.alert('Error', 'Failed to remove payment method');
            }
          },
        },
      ]
    );
  };

  const handleAddPaymentMethod = () => {
    Alert.alert(
      'Add Payment Method',
      'Choose a payment method type',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Credit Card',
          onPress: () => mockAddCreditCard(),
        },
        {
          text: 'Apple Pay',
          onPress: () => mockAddApplePay(),
        },
      ]
    );
  };

  const mockAddCreditCard = async () => {
    try {
      const newMethod = await paymentService.addPaymentMethod({
        type: 'card',
        last4: '1234',
        brand: 'mastercard',
        expiryMonth: 8,
        expiryYear: 2027,
        isDefault: false,
        name: 'Mastercard •••• 1234',
      });
      
      setPaymentMethods(prev => [...prev, newMethod]);
      
      Alert.alert('Success', 'Payment method added successfully');
    } catch (error) {
      console.error('Failed to add payment method:', error);
      Alert.alert('Error', 'Failed to add payment method');
    }
  };

  const mockAddApplePay = async () => {
    try {
      const newMethod = await paymentService.addPaymentMethod({
        type: 'apple_pay',
        isDefault: false,
        name: 'Apple Pay',
      });
      
      setPaymentMethods(prev => [...prev, newMethod]);
      
      Alert.alert('Success', 'Apple Pay added successfully');
    } catch (error) {
      console.error('Failed to add Apple Pay:', error);
      Alert.alert('Error', 'Failed to add Apple Pay');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    header: {
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    methodsList: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyDescription: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
    },
    addMethodButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 24,
    },
    addMethodButtonText: {
      color: theme.colors.primaryText,
      fontSize: 16,
      fontWeight: '600',
    },
    footer: {
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    footerText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <Loading />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Payment Methods</Text>
            <Text style={styles.subtitle}>
              Manage your payment methods for booking sessions
            </Text>
          </View>

          <View style={styles.methodsList}>
            {paymentMethods.length > 0 ? (
              <>
                {paymentMethods.map((method) => (
                  <PaymentMethodCard
                    key={method.id}
                    paymentMethod={method}
                    onSetDefault={() => handleSetDefault(method.id)}
                    onRemove={() => handleRemovePaymentMethod(method)}
                    showActions={true}
                  />
                ))}
                <TouchableOpacity
                  style={styles.addMethodButton}
                  onPress={handleAddPaymentMethod}
                >
                  <Text style={styles.addMethodButtonText}>
                    + Add Payment Method
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>💳</Text>
                <Text style={styles.emptyTitle}>No Payment Methods</Text>
                <Text style={styles.emptyDescription}>
                  Add a payment method to start booking sessions with coaches
                </Text>
                <TouchableOpacity
                  style={styles.addMethodButton}
                  onPress={handleAddPaymentMethod}
                >
                  <Text style={styles.addMethodButtonText}>
                    Add Your First Payment Method
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footer}>
            🔒 Your payment information is encrypted and secure. We never store your full card details.
          </Text>
        </View>
      </View>
    </ErrorBoundary>
  );
};

export default PaymentMethodsScreen;