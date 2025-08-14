export interface Coach {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  sessions: number;
  price: number;
  priceDisplay: string;
  description: string;
  image?: string;
  availability: TimeSlot[];
  location: string;
  experience: number;
  languages: string[];
  tags: string[];
  reviews: Review[];
}

export interface TimeSlot {
  id: string;
  start: string;
  end: string;
  available: boolean;
  date: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface BookedSession {
  id: string;
  coachId: string;
  coachName: string;
  timeSlot: TimeSlot;
  status: 'upcoming' | 'completed' | 'cancelled';
  price: number;
  notes?: string;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string;
  text?: string;
  message?: string;
  timestamp: string;
  type?: 'text' | 'system';
  status?: MessageStatus;
  isRead?: boolean;
}

export interface Conversation {
  id: string;
  coachId: string;
  coachName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
}

export type UserType = 'client' | 'coach';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  userType: UserType;
  preferences: {
    specialty: string[];
    priceRange: [number, number];
    location: string;
  };
  bookedSessions: BookedSession[];
  // Coach-specific fields
  coachProfile?: {
    specialties: string[];
    hourlyRate: number;
    bio: string;
    rating: number;
    totalSessions: number;
    verified: boolean;
    verificationStatus: 'pending' | 'approved' | 'rejected';
    verificationDocuments?: {
      type: 'passport' | 'license';
      documentNumber: string;
      uploadDate: string;
    };
  };
}