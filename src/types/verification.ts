export type DocumentType = 'passport' | 'drivers_license' | 'national_id' | 'professional_certificate';

export type VerificationStatus = 
  | 'not_started'
  | 'pending_documents'
  | 'documents_uploaded'
  | 'under_review'
  | 'additional_info_required'
  | 'approved'
  | 'rejected';

export interface VerificationDocument {
  id: string;
  type: DocumentType;
  frontImageUri: string;
  backImageUri?: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface BiometricData {
  faceImageUri?: string;
  livenessVerified: boolean;
  verifiedAt: string;
}

export interface VerificationDetails {
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    address: string;
    phoneNumber: string;
  };
  documents: VerificationDocument[];
  biometricData?: BiometricData;
  professionalInfo: {
    certifications: string[];
    experience: string;
    specializations: string[];
    references?: string[];
  };
}

export interface CoachVerification {
  id: string;
  coachId: string;
  status: VerificationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  verificationDetails: VerificationDetails;
  notes?: string[];
  completionPercentage: number;
}

export interface VerificationRequirement {
  type: DocumentType;
  required: boolean;
  description: string;
  acceptedFormats: string[];
  maxSizeBytes: number;
}

export const VERIFICATION_REQUIREMENTS: VerificationRequirement[] = [
  {
    type: 'passport',
    required: false,
    description: 'Government-issued passport',
    acceptedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
  },
  {
    type: 'drivers_license',
    required: false,
    description: 'Valid driver\'s license',
    acceptedFormats: ['jpg', 'jpeg', 'png'],
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
  },
  {
    type: 'national_id',
    required: true,
    description: 'National ID card or equivalent government ID',
    acceptedFormats: ['jpg', 'jpeg', 'png'],
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
  },
  {
    type: 'professional_certificate',
    required: true,
    description: 'Professional coaching certification or qualification',
    acceptedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
    maxSizeBytes: 15 * 1024 * 1024, // 15MB
  },
];

export const VERIFICATION_STEPS = [
  {
    id: 'personal_info',
    title: 'Personal Information',
    description: 'Provide your personal details',
    required: true,
  },
  {
    id: 'identity_documents',
    title: 'Identity Documents',
    description: 'Upload government-issued ID',
    required: true,
  },
  {
    id: 'professional_credentials',
    title: 'Professional Credentials',
    description: 'Upload coaching certifications',
    required: true,
  },
  {
    id: 'biometric_verification',
    title: 'Biometric Verification',
    description: 'Complete identity verification',
    required: true,
  },
  {
    id: 'review',
    title: 'Review & Submit',
    description: 'Review and submit your application',
    required: true,
  },
];