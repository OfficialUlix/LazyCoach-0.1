import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { ColorScheme } from '../../theme/colors';

const { width } = Dimensions.get('window');

interface BiometricVerificationProps {
  onVerificationComplete: (faceImageUri: string) => Promise<void>;
  isProcessing?: boolean;
}

export const BiometricVerification: React.FC<BiometricVerificationProps> = ({
  onVerificationComplete,
  isProcessing = false,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const [step, setStep] = useState<'instructions' | 'capture' | 'processing' | 'complete'>('instructions');
  const [faceImageUri, setFaceImageUri] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const startVerification = () => {
    setStep('capture');
  };

  const captureFace = async () => {
    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required', 
          'We need camera access to verify your identity. Please enable camera permissions in your device settings.'
        );
        return;
      }

      // Launch camera with front-facing camera for selfies
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        aspect: [1, 1],
        cameraType: ImagePicker.CameraType.front,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setFaceImageUri(imageUri);
        setStep('processing');
        
        // Process the biometric verification
        setProcessing(true);
        try {
          await onVerificationComplete(imageUri);
          setStep('complete');
        } catch (error) {
          console.error('[BiometricVerification] Verification failed:', error);
          Alert.alert(
            'Verification Failed', 
            'We couldn\'t verify your identity. Please try again with better lighting and ensure your face is clearly visible.',
            [
              { text: 'Try Again', onPress: () => setStep('capture') },
              { text: 'Cancel', onPress: () => setStep('instructions') },
            ]
          );
        } finally {
          setProcessing(false);
        }
      }
    } catch (error) {
      console.error('[BiometricVerification] Camera error:', error);
      Alert.alert('Camera Error', 'Failed to open camera. Please try again.');
      setStep('instructions');
    }
  };

  const resetVerification = () => {
    setStep('instructions');
    setFaceImageUri(null);
    setProcessing(false);
  };

  const renderInstructions = () => (
    <View style={styles.instructionsContainer}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🔐</Text>
      </View>
      
      <Text style={styles.title}>Biometric Identity Verification</Text>
      <Text style={styles.subtitle}>
        Complete your identity verification with a secure facial scan
      </Text>

      <View style={styles.instructionsList}>
        <View style={styles.instructionItem}>
          <Text style={styles.instructionIcon}>📱</Text>
          <Text style={styles.instructionText}>
            Use your front-facing camera in good lighting
          </Text>
        </View>
        
        <View style={styles.instructionItem}>
          <Text style={styles.instructionIcon}>👤</Text>
          <Text style={styles.instructionText}>
            Remove glasses, hats, or anything covering your face
          </Text>
        </View>
        
        <View style={styles.instructionItem}>
          <Text style={styles.instructionIcon}>🎯</Text>
          <Text style={styles.instructionText}>
            Look directly at the camera and keep your face centered
          </Text>
        </View>
        
        <View style={styles.instructionItem}>
          <Text style={styles.instructionIcon}>🔒</Text>
          <Text style={styles.instructionText}>
            Your biometric data is encrypted and secure
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.startButton}
        onPress={startVerification}
      >
        <Text style={styles.startButtonText}>Start Verification</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCapture = () => (
    <View style={styles.captureContainer}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>📷</Text>
      </View>
      
      <Text style={styles.title}>Take Your Verification Photo</Text>
      <Text style={styles.subtitle}>
        Position your face in the camera frame and take a clear photo
      </Text>

      <View style={styles.cameraFrame}>
        <View style={styles.frameOverlay}>
          <Text style={styles.frameText}>Position your face here</Text>
        </View>
      </View>

      <View style={styles.captureButtons}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => setStep('instructions')}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.captureButton}
          onPress={captureFace}
        >
          <Text style={styles.captureButtonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProcessing = () => (
    <View style={styles.processingContainer}>
      <View style={styles.iconContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
      
      <Text style={styles.title}>Verifying Your Identity</Text>
      <Text style={styles.subtitle}>
        Please wait while we process your biometric data...
      </Text>

      <View style={styles.processingSteps}>
        <View style={[styles.processingStep, styles.processingStepActive]}>
          <Text style={styles.processingStepIcon}>✓</Text>
          <Text style={styles.processingStepText}>Photo captured</Text>
        </View>
        
        <View style={[styles.processingStep, processing && styles.processingStepActive]}>
          <Text style={styles.processingStepIcon}>
            {processing ? '⟳' : '○'}
          </Text>
          <Text style={styles.processingStepText}>Analyzing facial features</Text>
        </View>
        
        <View style={styles.processingStep}>
          <Text style={styles.processingStepIcon}>○</Text>
          <Text style={styles.processingStepText}>Verifying liveness</Text>
        </View>
      </View>
    </View>
  );

  const renderComplete = () => (
    <View style={styles.completeContainer}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>✅</Text>
      </View>
      
      <Text style={styles.title}>Verification Complete!</Text>
      <Text style={styles.subtitle}>
        Your biometric identity has been successfully verified
      </Text>

      <View style={styles.successInfo}>
        <Text style={styles.successText}>
          🔐 Your identity data is encrypted and secure
        </Text>
        <Text style={styles.successText}>
          ⚡ Verification completed in seconds
        </Text>
        <Text style={styles.successText}>
          ✨ Your coach profile is now verified
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.continueButton}
        onPress={resetVerification}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {step === 'instructions' && renderInstructions()}
      {step === 'capture' && renderCapture()}
      {step === 'processing' && renderProcessing()}
      {step === 'complete' && renderComplete()}
    </View>
  );
};

const createStyles = (theme: ColorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  instructionsContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  instructionsList: {
    width: '100%',
    marginBottom: 32,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  captureContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cameraFrame: {
    width: width - 80,
    height: width - 80,
    borderRadius: (width - 80) / 2,
    borderWidth: 4,
    borderColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    position: 'relative',
  },
  frameOverlay: {
    position: 'absolute',
    bottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.overlay,
    borderRadius: 8,
  },
  frameText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  captureButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 16,
    borderRadius: 12,
  },
  cancelButtonText: {
    color: theme.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  captureButton: {
    flex: 2,
    backgroundColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  captureButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  processingContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingSteps: {
    width: '100%',
    marginTop: 32,
  },
  processingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.surface,
    borderRadius: 8,
    opacity: 0.5,
  },
  processingStepActive: {
    opacity: 1,
    backgroundColor: theme.primaryLight + '20',
  },
  processingStepIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
    color: theme.primary,
  },
  processingStepText: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
  },
  completeContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successInfo: {
    width: '100%',
    marginBottom: 32,
  },
  successText: {
    fontSize: 14,
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: theme.success,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});