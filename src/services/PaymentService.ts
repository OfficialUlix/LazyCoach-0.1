import { analyticsService } from './AnalyticsService';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'apple_pay' | 'google_pay' | 'paypal';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  name: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'processing' | 'succeeded' | 'canceled';
  clientSecret: string;
}

export interface SessionPayment {
  sessionId: string;
  coachId: string;
  amount: number;
  currency: string;
  sessionType: string;
  description: string;
  scheduledDate: string;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

class PaymentService {
  private static instance: PaymentService;
  private paymentMethods: PaymentMethod[] = [];
  private isInitialized = false;

  private constructor() {
    this.initializeMockData();
  }

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  private initializeMockData(): void {
    this.paymentMethods = [
      {
        id: 'pm_1',
        type: 'card',
        last4: '4242',
        brand: 'visa',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true,
        name: 'Visa •••• 4242',
      },
      {
        id: 'pm_2',
        type: 'apple_pay',
        isDefault: false,
        name: 'Apple Pay',
      },
    ];
    this.isInitialized = true;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      console.log('[PaymentService] Initializing...');
      this.initializeMockData();
      console.log('[PaymentService] Initialized successfully');
    } catch (error) {
      console.error('[PaymentService] Failed to initialize:', error);
      throw error;
    }
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    await this.initialize();
    return [...this.paymentMethods];
  }

  async addPaymentMethod(method: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod> {
    await this.initialize();
    
    const newMethod: PaymentMethod = {
      ...method,
      id: `pm_${Date.now()}`,
    };

    if (newMethod.isDefault) {
      this.paymentMethods.forEach(pm => pm.isDefault = false);
    }

    this.paymentMethods.push(newMethod);
    
    analyticsService.track('payment_method_added', {
      type: newMethod.type,
      isDefault: newMethod.isDefault,
    });

    console.log('[PaymentService] Payment method added:', newMethod.name);
    return newMethod;
  }

  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    await this.initialize();
    
    const index = this.paymentMethods.findIndex(pm => pm.id === paymentMethodId);
    if (index === -1) {
      throw new Error('Payment method not found');
    }

    const removedMethod = this.paymentMethods[index];
    this.paymentMethods.splice(index, 1);

    if (removedMethod.isDefault && this.paymentMethods.length > 0) {
      this.paymentMethods[0].isDefault = true;
    }

    analyticsService.track('payment_method_removed', {
      type: removedMethod.type,
      wasDefault: removedMethod.isDefault,
    });

    console.log('[PaymentService] Payment method removed:', removedMethod.name);
  }

  async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    await this.initialize();
    
    const method = this.paymentMethods.find(pm => pm.id === paymentMethodId);
    if (!method) {
      throw new Error('Payment method not found');
    }

    this.paymentMethods.forEach(pm => pm.isDefault = pm.id === paymentMethodId);

    analyticsService.track('payment_method_set_default', {
      type: method.type,
      paymentMethodId,
    });

    console.log('[PaymentService] Default payment method set:', method.name);
  }

  async createPaymentIntent(payment: SessionPayment): Promise<PaymentIntent> {
    await this.initialize();
    
    const paymentIntent: PaymentIntent = {
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: payment.amount * 100, // Convert to cents
      currency: payment.currency.toLowerCase(),
      status: 'requires_payment_method',
      clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 16)}`,
    };

    analyticsService.track('payment_intent_created', {
      amount: payment.amount,
      currency: payment.currency,
      sessionType: payment.sessionType,
      coachId: payment.coachId,
    });

    console.log('[PaymentService] Payment intent created:', paymentIntent.id);
    return paymentIntent;
  }

  async confirmPayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<PaymentResult> {
    await this.initialize();
    
    try {
      const paymentMethod = this.paymentMethods.find(pm => pm.id === paymentMethodId);
      if (!paymentMethod) {
        throw new Error('Payment method not found');
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate random success/failure for testing
      const isSuccess = Math.random() > 0.1; // 90% success rate

      if (isSuccess) {
        analyticsService.track('payment_succeeded', {
          paymentIntentId,
          paymentMethodType: paymentMethod.type,
          paymentMethodId,
        });

        console.log('[PaymentService] Payment succeeded:', paymentIntentId);
        return {
          success: true,
          paymentIntentId,
        };
      } else {
        const error = 'Your card was declined. Please try a different payment method.';
        
        analyticsService.track('payment_failed', {
          paymentIntentId,
          paymentMethodType: paymentMethod.type,
          paymentMethodId,
          error,
        });

        console.log('[PaymentService] Payment failed:', error);
        return {
          success: false,
          error,
        };
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      analyticsService.track('payment_error', {
        paymentIntentId,
        paymentMethodId,
        error: errorMessage,
      });

      console.error('[PaymentService] Payment error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async processRefund(paymentIntentId: string, amount?: number): Promise<PaymentResult> {
    await this.initialize();
    
    try {
      // Simulate refund processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      analyticsService.track('refund_processed', {
        paymentIntentId,
        amount,
      });

      console.log('[PaymentService] Refund processed:', paymentIntentId);
      return {
        success: true,
        paymentIntentId,
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      analyticsService.track('refund_failed', {
        paymentIntentId,
        error: errorMessage,
      });

      console.error('[PaymentService] Refund failed:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async getPaymentHistory(): Promise<any[]> {
    await this.initialize();
    
    // Mock payment history
    return [
      {
        id: 'pi_1',
        amount: 75.00,
        currency: 'USD',
        status: 'succeeded',
        date: '2024-01-15T10:00:00Z',
        description: 'Personal Training Session with John Doe',
        paymentMethod: this.paymentMethods.find(pm => pm.isDefault),
      },
      {
        id: 'pi_2',
        amount: 120.00,
        currency: 'USD',
        status: 'succeeded',
        date: '2024-01-10T14:30:00Z',
        description: 'Nutrition Consultation with Sarah Smith',
        paymentMethod: this.paymentMethods.find(pm => pm.type === 'apple_pay'),
      },
    ];
  }

  async validatePaymentAmount(amount: number): Promise<boolean> {
    const minAmount = 5.00;
    const maxAmount = 1000.00;
    
    if (amount < minAmount || amount > maxAmount) {
      analyticsService.track('payment_amount_validation_failed', {
        amount,
        minAmount,
        maxAmount,
      });
      return false;
    }
    
    return true;
  }

  getServiceFeePlatformRate(): number {
    return 0.029; // 2.9% platform fee
  }

  getServiceFeeFixed(): number {
    return 0.30; // $0.30 fixed fee
  }

  calculateTotalWithFees(amount: number): {
    subtotal: number;
    platformFee: number;
    fixedFee: number;
    total: number;
  } {
    const subtotal = amount;
    const platformFee = Math.round(subtotal * this.getServiceFeePlatformRate() * 100) / 100;
    const fixedFee = this.getServiceFeeFixed();
    const total = subtotal + platformFee + fixedFee;

    return {
      subtotal,
      platformFee,
      fixedFee,
      total,
    };
  }
}

export const paymentService = PaymentService.getInstance();