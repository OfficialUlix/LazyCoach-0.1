import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { PaymentMethod, PaymentIntent, SessionPayment, paymentService } from '../../services/PaymentService';
import { useTheme } from '../../context/ThemeContext';
import PaymentMethodCard from './PaymentMethodCard';
import { Loading } from '../Loading';

interface PaymentSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (paymentIntentId: string) => void;
  sessionPayment: SessionPayment;
}

const PaymentSheet: React.FC<PaymentSheetProps> = ({
  visible,
  onClose,
  onSuccess,
  sessionPayment,
}) => {
  const { theme } = useTheme();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPaymentMethods();
      createPaymentIntent();
    }
  }, [visible]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods);
      const defaultMethod = methods.find(m => m.isDefault);
      if (defaultMethod) {
        setSelectedMethod(defaultMethod);
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error);
      Alert.alert('Error', 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const createPaymentIntent = async () => {
    try {
      const intent = await paymentService.createPaymentIntent(sessionPayment);
      setPaymentIntent(intent);
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      Alert.alert('Error', 'Failed to initialize payment');
    }
  };

  const handlePayNow = async () => {
    if (!selectedMethod || !paymentIntent) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    try {
      setProcessing(true);
      const result = await paymentService.confirmPayment(
        paymentIntent.id,
        selectedMethod.id
      );

      if (result.success && result.paymentIntentId) {
        onSuccess(result.paymentIntentId);
        onClose();
      } else {
        Alert.alert('Payment Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      Alert.alert('Error', 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleAddPaymentMethod = () => {
    Alert.alert(
      'Add Payment Method',
      'This would open the payment method collection form',
      [{ text: 'OK' }]
    );
  };

  const calculateFees = () => {
    return paymentService.calculateTotalWithFees(sessionPayment.amount);
  };

  const fees = calculateFees();

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
    },
    closeButton: {
      padding: 4,
    },
    closeText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    sessionDetails: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    sessionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    sessionDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 12,
    },
    feeBreakdown: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 12,
    },
    feeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    feeLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    feeAmount: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
    },
    totalAmount: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    addMethodButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginTop: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
    },
    addMethodText: {
      fontSize: 16,
      color: theme.colors.primary,
      fontWeight: '600',
      marginLeft: 8,
    },
    footer: {
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    payButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    payButtonDisabled: {
      backgroundColor: theme.colors.disabled,
    },
    payButtonText: {
      color: theme.colors.primaryText,
      fontSize: 18,
      fontWeight: '700',
      marginLeft: 8,
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
    },
  });

  if (loading) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Payment</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.loadingContainer}>
              <Loading />
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Payment</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.scrollContent}>
              {/* Session Details */}
              <View style={styles.sessionDetails}>
                <Text style={styles.sessionTitle}>{sessionPayment.sessionType}</Text>
                <Text style={styles.sessionDescription}>
                  {sessionPayment.description}
                </Text>
                <Text style={styles.sessionDescription}>
                  Scheduled: {new Date(sessionPayment.scheduledDate).toLocaleDateString()}
                </Text>

                {/* Fee Breakdown */}
                <View style={styles.feeBreakdown}>
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Session Fee</Text>
                    <Text style={styles.feeAmount}>${fees.subtotal.toFixed(2)}</Text>
                  </View>
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Platform Fee</Text>
                    <Text style={styles.feeAmount}>${fees.platformFee.toFixed(2)}</Text>
                  </View>
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Processing Fee</Text>
                    <Text style={styles.feeAmount}>${fees.fixedFee.toFixed(2)}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>${fees.total.toFixed(2)}</Text>
                  </View>
                </View>
              </View>

              {/* Payment Methods */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Method</Text>
                {paymentMethods.map((method) => (
                  <PaymentMethodCard
                    key={method.id}
                    paymentMethod={method}
                    selected={selectedMethod?.id === method.id}
                    onSelect={() => setSelectedMethod(method)}
                    showActions={false}
                  />
                ))}
                <TouchableOpacity
                  style={styles.addMethodButton}
                  onPress={handleAddPaymentMethod}
                >
                  <Text style={styles.addMethodText}>+ Add Payment Method</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.payButton,
                (!selectedMethod || processing) && styles.payButtonDisabled,
              ]}
              onPress={handlePayNow}
              disabled={!selectedMethod || processing}
            >
              {processing && (
                <ActivityIndicator color={theme.colors.primaryText} size="small" />
              )}
              <Text style={styles.payButtonText}>
                {processing ? 'Processing...' : `Pay $${fees.total.toFixed(2)}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PaymentSheet;