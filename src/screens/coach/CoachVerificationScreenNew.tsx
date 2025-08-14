import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ColorScheme } from '../../theme/colors';
import { Loading } from '../../components/Loading';
import { DocumentUploader } from '../../components/verification/DocumentUploader';
import { BiometricVerification } from '../../components/verification/BiometricVerification';
import { verificationService } from '../../services/VerificationService';
import {
  CoachVerification,
  VERIFICATION_REQUIREMENTS,
  VERIFICATION_STEPS,
  DocumentType,
  VerificationStatus,
} from '../../types/verification';

export const CoachVerificationScreenNew: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = createStyles(theme);
  
  const [verification, setVerification] = useState<CoachVerification | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    dateOfBirth: '',
    address: '',
    phoneNumber: '',
  });
  const [professionalInfo, setProfessionalInfo] = useState({
    experience: '',
    specializations: [] as string[],
    certifications: [] as string[],
  });

  useEffect(() => {
    initializeVerification();
  }, []);

  const initializeVerification = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      let existingVerification = await verificationService.getVerification(user.id);
      
      if (!existingVerification) {
        existingVerification = await verificationService.initializeVerification(user.id);
      }
      
      setVerification(existingVerification);
      
      // Set form data from existing verification
      if (existingVerification.verificationDetails.personalInfo) {
        setPersonalInfo(existingVerification.verificationDetails.personalInfo);
      }
      
      if (existingVerification.verificationDetails.professionalInfo) {
        setProfessionalInfo(existingVerification.verificationDetails.professionalInfo);
      }
      
      // Determine current step based on completion
      const stepIndex = determineCurrentStep(existingVerification);
      setCurrentStep(stepIndex);
    } catch (error) {
      console.error('[CoachVerificationScreen] Failed to initialize verification:', error);
      Alert.alert('Error', 'Failed to load verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const determineCurrentStep = (verification: CoachVerification): number => {
    const { personalInfo, documents, biometricData, professionalInfo } = verification.verificationDetails;
    
    if (!personalInfo.fullName || !personalInfo.dateOfBirth || !personalInfo.address || !personalInfo.phoneNumber) {
      return 0; // Personal info
    }
    
    const hasRequiredDocs = documents.some(doc => doc.type === 'national_id') && 
                           documents.some(doc => doc.type === 'professional_certificate');
    
    if (!hasRequiredDocs) {
      return 1; // Identity documents
    }
    
    if (!professionalInfo.experience || professionalInfo.specializations.length === 0) {
      return 2; // Professional credentials
    }
    
    if (!biometricData?.livenessVerified) {
      return 3; // Biometric verification
    }
    
    return 4; // Review & submit
  };

  const handlePersonalInfoSave = async () => {
    if (!user?.id || !personalInfo.fullName || !personalInfo.dateOfBirth || 
        !personalInfo.address || !personalInfo.phoneNumber) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    try {
      setIsUploading(true);
      await verificationService.updatePersonalInfo(user.id, personalInfo);
      setCurrentStep(1);
      await refreshVerification();
    } catch (error) {
      Alert.alert('Error', 'Failed to save personal information. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocumentUpload = async (documentType: DocumentType, frontUri: string, backUri?: string) => {
    if (!user?.id) throw new Error('User not found');
    
    await verificationService.uploadDocument(user.id, documentType, frontUri, backUri);
    await refreshVerification();
  };

  const handleBiometricVerification = async (faceImageUri: string) => {
    if (!user?.id) throw new Error('User not found');
    
    await verificationService.submitBiometricVerification(user.id, faceImageUri);
    await refreshVerification();
    setCurrentStep(4);
  };

  const handleSubmitForReview = async () => {
    if (!user?.id || !verification) return;
    
    try {
      setIsUploading(true);
      await verificationService.submitForReview(user.id);
      await refreshVerification();
      Alert.alert(
        'Verification Submitted',
        'Your verification has been submitted for review. You will be notified once the review is complete.',
        [{ text: 'OK', onPress: () => {/* Navigate back or to dashboard */} }]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit verification.');
    } finally {
      setIsUploading(false);
    }
  };

  const refreshVerification = async () => {
    if (!user?.id) return;
    const updated = await verificationService.getVerification(user.id);
    if (updated) {
      setVerification(updated);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {VERIFICATION_STEPS.map((step, index) => (
        <View key={step.id} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            index <= currentStep && styles.stepCircleActive,
            index < currentStep && styles.stepCircleCompleted,
          ]}>
            <Text style={[
              styles.stepNumber,
              index <= currentStep && styles.stepNumberActive,
            ]}>
              {index < currentStep ? '✓' : index + 1}
            </Text>
          </View>
          <Text style={[
            styles.stepTitle,
            index === currentStep && styles.stepTitleActive,
          ]}>
            {step.title}
          </Text>
          {index < VERIFICATION_STEPS.length - 1 && (
            <View style={[
              styles.stepConnector,
              index < currentStep && styles.stepConnectorActive,
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderPersonalInfoStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>
        Please provide your personal information as it appears on your government-issued ID.
      </Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={personalInfo.fullName}
          onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, fullName: text }))}
          placeholder="Enter your full name"
          placeholderTextColor={theme.textSecondary}
        />
        
        <Text style={styles.label}>Date of Birth *</Text>
        <TextInput
          style={styles.input}
          value={personalInfo.dateOfBirth}
          onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, dateOfBirth: text }))}
          placeholder="MM/DD/YYYY"
          placeholderTextColor={theme.textSecondary}
        />
        
        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={personalInfo.address}
          onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, address: text }))}
          placeholder="Enter your full address"
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={3}
        />
        
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={personalInfo.phoneNumber}
          onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, phoneNumber: text }))}
          placeholder="Enter your phone number"
          placeholderTextColor={theme.textSecondary}
          keyboardType="phone-pad"
        />
      </View>
      
      <TouchableOpacity
        style={[styles.continueButton, isUploading && styles.disabledButton]}
        onPress={handlePersonalInfoSave}
        disabled={isUploading}
      >
        <Text style={styles.continueButtonText}>
          {isUploading ? 'Saving...' : 'Continue'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderDocumentsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>
        Upload clear, high-quality images of your identification documents.
      </Text>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {VERIFICATION_REQUIREMENTS.map((requirement) => {
          const existingDoc = verification?.verificationDetails.documents.find(
            doc => doc.type === requirement.type
          );
          
          return (
            <DocumentUploader
              key={requirement.type}
              requirement={requirement}
              onUpload={handleDocumentUpload}
              existingFrontImage={existingDoc?.frontImageUri}
              existingBackImage={existingDoc?.backImageUri}
              isUploading={isUploading}
            />
          );
        })}
      </ScrollView>
      
      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => setCurrentStep(2)}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProfessionalStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>
        Tell us about your professional coaching background and qualifications.
      </Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Coaching Experience *</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={professionalInfo.experience}
          onChangeText={(text) => setProfessionalInfo(prev => ({ ...prev, experience: text }))}
          placeholder="Describe your coaching experience, years of practice, etc."
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={4}
        />
        
        <Text style={styles.label}>Specializations *</Text>
        <TextInput
          style={styles.input}
          value={professionalInfo.specializations.join(', ')}
          onChangeText={(text) => setProfessionalInfo(prev => ({ 
            ...prev, 
            specializations: text.split(',').map(s => s.trim()).filter(s => s) 
          }))}
          placeholder="Life coaching, business coaching, etc. (comma separated)"
          placeholderTextColor={theme.textSecondary}
        />
      </View>
      
      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => setCurrentStep(3)}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBiometricStep = () => (
    <BiometricVerification
      onVerificationComplete={handleBiometricVerification}
      isProcessing={isUploading}
    />
  );

  const renderReviewStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>
        Review your information and submit your verification for approval.
      </Text>
      
      <View style={styles.reviewSection}>
        <Text style={styles.reviewTitle}>Verification Summary</Text>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Completion:</Text>
          <Text style={styles.reviewValue}>{verification?.completionPercentage}%</Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Documents Uploaded:</Text>
          <Text style={styles.reviewValue}>{verification?.verificationDetails.documents.length}</Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Biometric Verified:</Text>
          <Text style={styles.reviewValue}>
            {verification?.verificationDetails.biometricData?.livenessVerified ? 'Yes' : 'No'}
          </Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Status:</Text>
          <Text style={[styles.reviewValue, styles.statusText]}>
            {verification?.status?.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={[styles.submitButton, isUploading && styles.disabledButton]}
        onPress={handleSubmitForReview}
        disabled={isUploading || verification?.status === 'under_review'}
      >
        <Text style={styles.submitButtonText}>
          {isUploading ? 'Submitting...' : verification?.status === 'under_review' ? 'Under Review' : 'Submit for Review'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Coach Verification</Text>
        <Text style={styles.subtitle}>
          Complete your verification to start coaching on LazyCoach
        </Text>
      </View>
      
      {renderStepIndicator()}
      
      <View style={styles.content}>
        {currentStep === 0 && renderPersonalInfoStep()}
        {currentStep === 1 && renderDocumentsStep()}
        {currentStep === 2 && renderProfessionalStep()}
        {currentStep === 3 && renderBiometricStep()}
        {currentStep === 4 && renderReviewStep()}
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: ColorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    padding: 20,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.background,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primaryLight + '20',
  },
  stepCircleCompleted: {
    backgroundColor: theme.success,
    borderColor: theme.success,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  stepNumberActive: {
    color: theme.primary,
  },
  stepTitle: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  stepTitleActive: {
    color: theme.text,
    fontWeight: '500',
  },
  stepConnector: {
    position: 'absolute',
    top: 16,
    left: '60%',
    right: '-60%',
    height: 2,
    backgroundColor: theme.border,
    zIndex: -1,
  },
  stepConnectorActive: {
    backgroundColor: theme.success,
  },
  stepContent: {
    flex: 1,
  },
  stepDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.text,
    marginBottom: 16,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  continueButton: {
    backgroundColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewSection: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
  },
  statusText: {
    color: theme.primary,
  },
  submitButton: {
    backgroundColor: theme.success,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});