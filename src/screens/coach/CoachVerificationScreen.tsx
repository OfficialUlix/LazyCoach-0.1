import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { WorkaroundTextInput } from '../../components/WorkaroundTextInput';
import { Loading } from '../../components/Loading';
import { useMainNavigation } from '../../hooks/useNavigation';
import { ColorScheme } from '../../theme/colors';

type DocumentType = 'passport' | 'license';
type VerificationStatus = 'pending' | 'approved' | 'rejected';

interface VerificationDocument {
  type: DocumentType;
  documentNumber: string;
  uploadDate: string;
  imageUri?: string;
}

export const CoachVerificationScreen: React.FC = () => {
  const navigation = useMainNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>('passport');
  const [documentNumber, setDocumentNumber] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const styles = createStyles(theme);

  const handleImagePicker = () => {
    Alert.alert(
      'Select Document Photo',
      'Choose how you would like to upload your document photo',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Camera', 
          onPress: () => {
            // Simulate camera selection
            setSelectedImage('camera://mock-document-photo');
          }
        },
        { 
          text: 'Photo Library', 
          onPress: () => {
            // Simulate photo library selection
            setSelectedImage('library://mock-document-photo');
          }
        },
      ]
    );
  };

  const handleSubmitVerification = async () => {
    if (!documentNumber.trim()) {
      Alert.alert('Error', 'Please enter your document number');
      return;
    }

    if (!selectedImage) {
      Alert.alert('Error', 'Please upload a photo of your document');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call to submit verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Verification Submitted',
        'Your verification documents have been submitted for review. You will receive an update within 1-3 business days.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getVerificationStatus = (): { status: VerificationStatus; message: string; color: string } => {
    const coachProfile = user?.coachProfile;
    if (!coachProfile) return { status: 'pending', message: 'Not started', color: theme.textMuted };

    switch (coachProfile.verificationStatus) {
      case 'approved':
        return { status: 'approved', message: 'Verified ✓', color: theme.success };
      case 'rejected':
        return { status: 'rejected', message: 'Verification failed', color: theme.error };
      default:
        return { status: 'pending', message: 'Under review', color: theme.warning };
    }
  };

  const verificationStatus = getVerificationStatus();

  if (isLoading) {
    return <Loading />;
  }

  if (user?.userType !== 'coach') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>This feature is only available for coaches.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Coach Verification</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Status</Text>
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, { color: verificationStatus.color }]}>
              {verificationStatus.message}
            </Text>
            {user?.coachProfile?.verificationDocuments && (
              <Text style={styles.statusDetails}>
                Document: {user.coachProfile.verificationDocuments.type.toUpperCase()} 
                #{user.coachProfile.verificationDocuments.documentNumber}
              </Text>
            )}
          </View>
        </View>

        {/* Verification Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Verify?</Text>
          <Text style={styles.infoText}>
            Verification helps build trust with potential clients by confirming your identity. 
            Verified coaches are more likely to receive bookings and can set higher rates.
          </Text>
          <View style={styles.benefitsList}>
            <Text style={styles.benefitItem}>✓ Verified badge on your profile</Text>
            <Text style={styles.benefitItem}>✓ Higher search ranking</Text>
            <Text style={styles.benefitItem}>✓ Access to premium features</Text>
            <Text style={styles.benefitItem}>✓ Increased client trust</Text>
          </View>
        </View>

        {/* Document Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Document Type</Text>
          <View style={styles.documentTypeContainer}>
            <TouchableOpacity
              style={[
                styles.documentTypeOption,
                documentType === 'passport' && styles.selectedDocumentType
              ]}
              onPress={() => setDocumentType('passport')}
            >
              <Text style={styles.documentIcon}>📖</Text>
              <Text style={[
                styles.documentTypeText,
                documentType === 'passport' && styles.selectedDocumentTypeText
              ]}>
                Passport
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.documentTypeOption,
                documentType === 'license' && styles.selectedDocumentType
              ]}
              onPress={() => setDocumentType('license')}
            >
              <Text style={styles.documentIcon}>🪪</Text>
              <Text style={[
                styles.documentTypeText,
                documentType === 'license' && styles.selectedDocumentTypeText
              ]}>
                Driver's License
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Document Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Document Details</Text>
          <Text style={styles.fieldLabel}>
            {documentType === 'passport' ? 'Passport Number' : 'License Number'}
          </Text>
          <WorkaroundTextInput
            style={styles.textInput}
            placeholder={`Enter your ${documentType === 'passport' ? 'passport' : 'license'} number`}
            value={documentNumber}
            onChangeText={setDocumentNumber}
            autoCapitalize="characters"
          />
        </View>

        {/* Document Photo Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Document Photo</Text>
          <Text style={styles.uploadDescription}>
            Upload a clear photo of your {documentType === 'passport' ? 'passport photo page' : 'driver\'s license'}.
            Make sure all text is readable and the image is well-lit.
          </Text>

          <TouchableOpacity style={styles.uploadButton} onPress={handleImagePicker}>
            {selectedImage ? (
              <View style={styles.uploadedImageContainer}>
                <Text style={styles.uploadedImageText}>📄 Document uploaded</Text>
                <Text style={styles.uploadedImageSubtext}>Tap to change</Text>
              </View>
            ) : (
              <View style={styles.uploadButtonContent}>
                <Text style={styles.uploadIcon}>📷</Text>
                <Text style={styles.uploadButtonText}>Upload Document Photo</Text>
                <Text style={styles.uploadButtonSubtext}>Camera or Photo Library</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Security Notice */}
        <View style={styles.section}>
          <Text style={styles.securityTitle}>🔒 Your Privacy is Protected</Text>
          <Text style={styles.securityText}>
            Your documents are encrypted and stored securely. We only use them for verification purposes 
            and will never share your personal information with third parties.
          </Text>
        </View>

        {/* Submit Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!documentNumber.trim() || !selectedImage) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmitVerification}
            disabled={!documentNumber.trim() || !selectedImage}
          >
            <Text style={styles.submitButtonText}>Submit for Verification</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: ColorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerButton: {
    flex: 1,
  },
  headerButtonText: {
    fontSize: 18,
    color: theme.primary,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    flex: 1,
    textAlign: 'center',
  },
  headerPlaceholder: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusDetails: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  infoText: {
    fontSize: 16,
    color: theme.textSecondary,
    lineHeight: 24,
    marginBottom: 16,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  documentTypeContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  documentTypeOption: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedDocumentType: {
    backgroundColor: theme.primaryLight + '10',
    borderColor: theme.primary,
  },
  documentIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  documentTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
  },
  selectedDocumentTypeText: {
    color: theme.primary,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: theme.surface,
    color: theme.text,
  },
  uploadDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.border,
    borderStyle: 'dashed',
  },
  uploadButtonContent: {
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 4,
  },
  uploadButtonSubtext: {
    fontSize: 14,
    color: theme.textMuted,
  },
  uploadedImageContainer: {
    alignItems: 'center',
  },
  uploadedImageText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.success,
    marginBottom: 4,
  },
  uploadedImageSubtext: {
    fontSize: 14,
    color: theme.textMuted,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  securityText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: theme.disabled,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});