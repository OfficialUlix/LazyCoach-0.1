import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../context/ThemeContext';
import { ColorScheme } from '../../theme/colors';
import { DocumentType, VerificationRequirement } from '../../types/verification';

interface DocumentUploaderProps {
  requirement: VerificationRequirement;
  onUpload: (documentType: DocumentType, frontUri: string, backUri?: string) => Promise<void>;
  existingFrontImage?: string;
  existingBackImage?: string;
  isUploading?: boolean;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  requirement,
  onUpload,
  existingFrontImage,
  existingBackImage,
  isUploading = false,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const [frontImage, setFrontImage] = useState<string | null>(existingFrontImage || null);
  const [backImage, setBackImage] = useState<string | null>(existingBackImage || null);
  const [uploading, setUploading] = useState(false);

  const needsBackImage = requirement.type === 'drivers_license' || requirement.type === 'national_id';

  const pickImage = async (isBack: boolean = false) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        if (isBack) {
          setBackImage(imageUri);
        } else {
          setFrontImage(imageUri);
        }
      }
    } catch (error) {
      console.error('[DocumentUploader] Failed to pick image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const takePhoto = async (isBack: boolean = false) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        if (isBack) {
          setBackImage(imageUri);
        } else {
          setFrontImage(imageUri);
        }
      }
    } catch (error) {
      console.error('[DocumentUploader] Failed to take photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setFrontImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('[DocumentUploader] Failed to pick document:', error);
      Alert.alert('Error', 'Failed to select document. Please try again.');
    }
  };

  const showImageOptions = (isBack: boolean = false) => {
    Alert.alert(
      isBack ? 'Back of Document' : 'Document Image',
      'Choose how to add your document image',
      [
        { text: 'Camera', onPress: () => takePhoto(isBack) },
        { text: 'Photo Library', onPress: () => pickImage(isBack) },
        { text: 'Files', onPress: pickDocument },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleUpload = async () => {
    if (!frontImage) {
      Alert.alert('Missing Image', 'Please select the front image of your document.');
      return;
    }

    if (needsBackImage && !backImage) {
      Alert.alert('Missing Image', 'Please select the back image of your document.');
      return;
    }

    setUploading(true);
    try {
      await onUpload(requirement.type, frontImage, backImage || undefined);
      Alert.alert('Success', 'Document uploaded successfully!');
    } catch (error) {
      console.error('[DocumentUploader] Upload failed:', error);
      Alert.alert('Upload Failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const clearImages = () => {
    setFrontImage(null);
    setBackImage(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{requirement.description}</Text>
        {requirement.required && <Text style={styles.required}>Required</Text>}
      </View>

      <Text style={styles.description}>
        Accepted formats: {requirement.acceptedFormats.join(', ').toUpperCase()}
      </Text>
      <Text style={styles.description}>
        Maximum size: {Math.round(requirement.maxSizeBytes / (1024 * 1024))}MB
      </Text>

      <View style={styles.imageSection}>
        {/* Front Image */}
        <View style={styles.imageContainer}>
          <Text style={styles.imageLabel}>
            Front {needsBackImage ? '(Required)' : ''}
          </Text>
          {frontImage ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: frontImage }} style={styles.previewImage} />
              <TouchableOpacity 
                style={styles.changeButton}
                onPress={() => showImageOptions(false)}
              >
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={() => showImageOptions(false)}
            >
              <Text style={styles.uploadButtonText}>📷 Add Front Image</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Back Image (if needed) */}
        {needsBackImage && (
          <View style={styles.imageContainer}>
            <Text style={styles.imageLabel}>Back (Required)</Text>
            {backImage ? (
              <View style={styles.imagePreview}>
                <Image source={{ uri: backImage }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.changeButton}
                  onPress={() => showImageOptions(true)}
                >
                  <Text style={styles.changeButtonText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={() => showImageOptions(true)}
              >
                <Text style={styles.uploadButtonText}>📷 Add Back Image</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {(frontImage || backImage) && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.clearButton} onPress={clearImages}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.uploadActionButton, uploading && styles.disabledButton]}
            onPress={handleUpload}
            disabled={uploading || isUploading}
          >
            {uploading || isUploading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.uploadActionButtonText}>Upload Document</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: ColorScheme) => StyleSheet.create({
  container: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    flex: 1,
  },
  required: {
    fontSize: 12,
    color: theme.error,
    fontWeight: '500',
    backgroundColor: theme.error + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  description: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  imageSection: {
    marginTop: 16,
  },
  imageContainer: {
    marginBottom: 16,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 8,
  },
  uploadButton: {
    backgroundColor: theme.background,
    borderWidth: 2,
    borderColor: theme.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  uploadButtonText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  imagePreview: {
    position: 'relative',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  changeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.overlay,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  changeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  uploadActionButton: {
    flex: 2,
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  uploadActionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});