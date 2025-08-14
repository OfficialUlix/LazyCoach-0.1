import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PaymentMethod } from '../../services/PaymentService';
import { useTheme } from '../../context/ThemeContext';

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  onSelect?: () => void;
  onSetDefault?: () => void;
  onRemove?: () => void;
  selected?: boolean;
  showActions?: boolean;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  paymentMethod,
  onSelect,
  onSetDefault,
  onRemove,
  selected = false,
  showActions = true,
}) => {
  const { theme } = useTheme();

  const getPaymentMethodIcon = () => {
    switch (paymentMethod.type) {
      case 'card':
        return getCardIcon(paymentMethod.brand || 'unknown');
      case 'apple_pay':
        return '🍎';
      case 'google_pay':
        return '🔵';
      case 'paypal':
        return '💰';
      default:
        return '💳';
    }
  };

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      case 'discover':
        return '💳';
      default:
        return '💳';
    }
  };

  const formatExpiryDate = () => {
    if (paymentMethod.expiryMonth && paymentMethod.expiryYear) {
      return `${paymentMethod.expiryMonth.toString().padStart(2, '0')}/${paymentMethod.expiryYear.toString().slice(-2)}`;
    }
    return '';
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: selected ? theme.colors.primary + '20' : theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 6,
      borderWidth: selected ? 2 : 1,
      borderColor: selected ? theme.colors.primary : theme.colors.border,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    icon: {
      fontSize: 24,
      marginRight: 12,
    },
    methodInfo: {
      flex: 1,
    },
    methodName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    methodDetails: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    rightSection: {
      alignItems: 'flex-end',
    },
    defaultBadge: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginBottom: 8,
    },
    defaultText: {
      color: theme.colors.primaryText,
      fontSize: 12,
      fontWeight: '600',
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
    },
    primaryAction: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    secondaryAction: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.border,
    },
    removeAction: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.error,
    },
    actionText: {
      fontSize: 12,
      fontWeight: '600',
    },
    primaryActionText: {
      color: theme.colors.primaryText,
    },
    secondaryActionText: {
      color: theme.colors.text,
    },
    removeActionText: {
      color: theme.colors.error,
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Text style={styles.icon}>{getPaymentMethodIcon()}</Text>
          <View style={styles.methodInfo}>
            <Text style={styles.methodName}>{paymentMethod.name}</Text>
            {paymentMethod.type === 'card' && (
              <Text style={styles.methodDetails}>
                Expires {formatExpiryDate()}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.rightSection}>
          {paymentMethod.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
      </View>

      {showActions && (
        <View style={styles.actions}>
          {!paymentMethod.isDefault && onSetDefault && (
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={onSetDefault}
            >
              <Text style={[styles.actionText, styles.secondaryActionText]}>
                Set Default
              </Text>
            </TouchableOpacity>
          )}
          {onRemove && (
            <TouchableOpacity
              style={[styles.actionButton, styles.removeAction]}
              onPress={onRemove}
            >
              <Text style={[styles.actionText, styles.removeActionText]}>
                Remove
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default PaymentMethodCard;