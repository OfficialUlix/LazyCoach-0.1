import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '../utils/storage';
import { User, UserType } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, userType: UserType) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on app start
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async (): Promise<void> => {
    try {
      const storedUser = await storage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserToStorage = async (user: User): Promise<void> => {
    try {
      await storage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user to storage:', error);
    }
  };

  const clearUserFromStorage = async (): Promise<void> => {
    try {
      await storage.removeItem('user');
    } catch (error) {
      console.error('Failed to clear user from storage:', error);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful login
      const userData: User = {
        id: '1',
        email,
        name: email.split('@')[0],
        userType: 'client', // Default to client for login
        preferences: {
          specialty: [],
          priceRange: [0, 500],
          location: '',
        },
        bookedSessions: [],
      };
      
      setUser(userData);
      await saveUserToStorage(userData);
    } catch (error) {
      throw new Error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, userType: UserType): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful registration
      const userData: User = {
        id: Date.now().toString(),
        email,
        name,
        userType,
        preferences: {
          specialty: [],
          priceRange: [0, 500],
          location: '',
        },
        bookedSessions: [],
        // Add coach profile if user is registering as a coach
        ...(userType === 'coach' && {
          coachProfile: {
            specialties: [],
            hourlyRate: 0,
            bio: '',
            rating: 0,
            totalSessions: 0,
            verified: false,
            verificationStatus: 'pending' as const,
          }
        })
      };
      
      setUser(userData);
      await saveUserToStorage(userData);
    } catch (error) {
      throw new Error('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setUser(null);
    await clearUserFromStorage();
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};