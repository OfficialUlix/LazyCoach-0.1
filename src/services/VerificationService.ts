import * as FileSystem from 'expo-file-system';
import { 
  CoachVerification, 
  VerificationDocument, 
  DocumentType, 
  VerificationStatus,
  VerificationDetails,
  BiometricData,
} from '../types/verification';
import { storage } from '../utils/storage';
import { analyticsService } from './AnalyticsService';

export class VerificationService {
  private static instance: VerificationService;
  
  private readonly STORAGE_KEYS = {
    VERIFICATION: 'coach_verification',
    DOCUMENTS: 'verification_documents',
    BIOMETRIC_DATA: 'biometric_data',
  };

  private constructor() {}

  public static getInstance(): VerificationService {
    if (!VerificationService.instance) {
      VerificationService.instance = new VerificationService();
    }
    return VerificationService.instance;
  }

  /**
   * Initialize verification for a coach
   */
  async initializeVerification(coachId: string): Promise<CoachVerification> {
    const verification: CoachVerification = {
      id: `verification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      coachId,
      status: 'not_started',
      submittedAt: new Date().toISOString(),
      verificationDetails: {
        personalInfo: {
          fullName: '',
          dateOfBirth: '',
          address: '',
          phoneNumber: '',
        },
        documents: [],
        professionalInfo: {
          certifications: [],
          experience: '',
          specializations: [],
          references: [],
        },
      },
      completionPercentage: 0,
    };

    await this.saveVerification(verification);
    
    analyticsService.track('verification_started', {
      coachId,
      verificationId: verification.id,
    });

    return verification;
  }

  /**
   * Get verification status for a coach
   */
  async getVerification(coachId: string): Promise<CoachVerification | null> {
    try {
      const stored = await storage.getItem(`${this.STORAGE_KEYS.VERIFICATION}_${coachId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('[VerificationService] Failed to get verification:', error);
      return null;
    }
  }

  /**
   * Save verification data
   */
  async saveVerification(verification: CoachVerification): Promise<void> {
    try {
      await storage.setItem(
        `${this.STORAGE_KEYS.VERIFICATION}_${verification.coachId}`,
        JSON.stringify(verification)
      );
    } catch (error) {
      console.error('[VerificationService] Failed to save verification:', error);
      throw new Error('Failed to save verification data');
    }
  }

  /**
   * Update personal information
   */
  async updatePersonalInfo(
    coachId: string, 
    personalInfo: VerificationDetails['personalInfo']
  ): Promise<void> {
    const verification = await this.getVerification(coachId);
    if (!verification) {
      throw new Error('Verification not found');
    }

    verification.verificationDetails.personalInfo = personalInfo;
    verification.completionPercentage = this.calculateCompletionPercentage(verification);
    
    if (verification.status === 'not_started') {
      verification.status = 'pending_documents';
    }

    await this.saveVerification(verification);

    analyticsService.track('verification_personal_info_updated', {
      coachId,
      verificationId: verification.id,
    });
  }

  /**
   * Process and save document
   */
  async uploadDocument(
    coachId: string,
    documentType: DocumentType,
    frontImageUri: string,
    backImageUri?: string
  ): Promise<VerificationDocument> {
    try {
      const verification = await this.getVerification(coachId);
      if (!verification) {
        throw new Error('Verification not found');
      }

      // Simulate document processing and OCR
      await this.processDocument(frontImageUri);
      if (backImageUri) {
        await this.processDocument(backImageUri);
      }

      const document: VerificationDocument = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: documentType,
        frontImageUri,
        backImageUri,
        uploadedAt: new Date().toISOString(),
        status: 'pending',
      };

      // Remove existing document of same type
      verification.verificationDetails.documents = verification.verificationDetails.documents.filter(
        doc => doc.type !== documentType
      );

      // Add new document
      verification.verificationDetails.documents.push(document);
      
      // Update status and completion
      verification.status = 'documents_uploaded';
      verification.completionPercentage = this.calculateCompletionPercentage(verification);

      await this.saveVerification(verification);

      analyticsService.track('verification_document_uploaded', {
        coachId,
        verificationId: verification.id,
        documentType,
        hasBackImage: !!backImageUri,
      });

      return document;
    } catch (error) {
      console.error('[VerificationService] Failed to upload document:', error);
      throw new Error('Failed to upload document');
    }
  }

  /**
   * Process document with simulated OCR
   */
  private async processDocument(imageUri: string): Promise<void> {
    // Simulate document processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simulate OCR validation
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error('Document file not found');
    }

    // Check file size (max 10MB)
    if (fileInfo.size && fileInfo.size > 10 * 1024 * 1024) {
      throw new Error('Document file size too large (max 10MB)');
    }

    console.log('[VerificationService] Document processed successfully');
  }

  /**
   * Submit biometric verification
   */
  async submitBiometricVerification(
    coachId: string,
    faceImageUri: string
  ): Promise<void> {
    try {
      const verification = await this.getVerification(coachId);
      if (!verification) {
        throw new Error('Verification not found');
      }

      // Simulate biometric processing
      await this.processBiometricData(faceImageUri);

      const biometricData: BiometricData = {
        faceImageUri,
        livenessVerified: true,
        verifiedAt: new Date().toISOString(),
      };

      verification.verificationDetails.biometricData = biometricData;
      verification.completionPercentage = this.calculateCompletionPercentage(verification);

      await this.saveVerification(verification);

      analyticsService.track('verification_biometric_completed', {
        coachId,
        verificationId: verification.id,
      });
    } catch (error) {
      console.error('[VerificationService] Failed to submit biometric verification:', error);
      throw new Error('Biometric verification failed');
    }
  }

  /**
   * Process biometric data with simulated liveness detection
   */
  private async processBiometricData(faceImageUri: string): Promise<void> {
    // Simulate biometric processing
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    const fileInfo = await FileSystem.getInfoAsync(faceImageUri);
    if (!fileInfo.exists) {
      throw new Error('Biometric image not found');
    }

    // Simulate liveness detection (95% success rate)
    if (Math.random() < 0.05) {
      throw new Error('Liveness verification failed. Please try again.');
    }

    console.log('[VerificationService] Biometric verification completed successfully');
  }

  /**
   * Submit verification for review
   */
  async submitForReview(coachId: string): Promise<void> {
    const verification = await this.getVerification(coachId);
    if (!verification) {
      throw new Error('Verification not found');
    }

    // Validate completion
    if (verification.completionPercentage < 100) {
      throw new Error('Verification not complete. Please complete all required steps.');
    }

    verification.status = 'under_review';
    verification.submittedAt = new Date().toISOString();

    await this.saveVerification(verification);

    // Simulate automated review process
    this.simulateReviewProcess(verification);

    analyticsService.track('verification_submitted_for_review', {
      coachId,
      verificationId: verification.id,
      completionPercentage: verification.completionPercentage,
    });
  }

  /**
   * Simulate the verification review process
   */
  private async simulateReviewProcess(verification: CoachVerification): Promise<void> {
    // Simulate review delay (in production, this would be done by admin staff)
    setTimeout(async () => {
      try {
        // 90% approval rate for simulation
        const isApproved = Math.random() < 0.9;
        
        verification.status = isApproved ? 'approved' : 'rejected';
        verification.reviewedAt = new Date().toISOString();
        verification.reviewedBy = 'Automated System';

        if (!isApproved) {
          verification.notes = [
            'Document quality insufficient - please resubmit with clearer images',
            'Additional documentation required for professional credentials',
          ];
        }

        await this.saveVerification(verification);

        analyticsService.track('verification_review_completed', {
          coachId: verification.coachId,
          verificationId: verification.id,
          approved: isApproved,
        });

        console.log(`[VerificationService] Verification ${verification.id} ${isApproved ? 'approved' : 'rejected'}`);
      } catch (error) {
        console.error('[VerificationService] Failed to complete review:', error);
      }
    }, 10000 + Math.random() * 20000); // 10-30 second review simulation
  }

  /**
   * Calculate completion percentage
   */
  private calculateCompletionPercentage(verification: CoachVerification): number {
    let completed = 0;
    const total = 5; // Total steps

    // Personal info
    const { personalInfo } = verification.verificationDetails;
    if (personalInfo.fullName && personalInfo.dateOfBirth && personalInfo.address && personalInfo.phoneNumber) {
      completed += 1;
    }

    // Required documents
    const requiredDocs = ['national_id', 'professional_certificate'];
    const uploadedRequiredDocs = verification.verificationDetails.documents.filter(
      doc => requiredDocs.includes(doc.type)
    );
    if (uploadedRequiredDocs.length >= 2) {
      completed += 1;
    }

    // At least one additional document
    const additionalDocs = verification.verificationDetails.documents.filter(
      doc => !requiredDocs.includes(doc.type)
    );
    if (additionalDocs.length > 0) {
      completed += 1;
    }

    // Professional info
    const { professionalInfo } = verification.verificationDetails;
    if (professionalInfo.experience && professionalInfo.specializations.length > 0) {
      completed += 1;
    }

    // Biometric verification
    if (verification.verificationDetails.biometricData?.livenessVerified) {
      completed += 1;
    }

    return Math.round((completed / total) * 100);
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats(): Promise<{
    totalVerifications: number;
    pendingReview: number;
    approved: number;
    rejected: number;
    averageProcessingTime: number;
  }> {
    // In a real app, this would query a database
    // For now, return mock statistics
    return {
      totalVerifications: 1247,
      pendingReview: 23,
      approved: 1156,
      rejected: 68,
      averageProcessingTime: 2.5, // days
    };
  }

  /**
   * Check if coach is verified
   */
  async isCoachVerified(coachId: string): Promise<boolean> {
    const verification = await this.getVerification(coachId);
    return verification?.status === 'approved' ?? false;
  }

  /**
   * Get verification badge info
   */
  async getVerificationBadge(coachId: string): Promise<{
    isVerified: boolean;
    level: 'none' | 'basic' | 'premium' | 'elite';
    verifiedAt?: string;
  }> {
    const verification = await this.getVerification(coachId);
    
    if (!verification || verification.status !== 'approved') {
      return { isVerified: false, level: 'none' };
    }

    // Determine verification level based on documents and completeness
    const hasAllDocuments = verification.verificationDetails.documents.length >= 3;
    const hasBiometric = !!verification.verificationDetails.biometricData;
    const hasProfessionalCerts = verification.verificationDetails.professionalInfo.certifications.length > 0;

    let level: 'basic' | 'premium' | 'elite' = 'basic';
    
    if (hasAllDocuments && hasBiometric && hasProfessionalCerts) {
      level = 'elite';
    } else if (hasAllDocuments && hasBiometric) {
      level = 'premium';
    }

    return {
      isVerified: true,
      level,
      verifiedAt: verification.reviewedAt,
    };
  }
}

// Export singleton instance
export const verificationService = VerificationService.getInstance();