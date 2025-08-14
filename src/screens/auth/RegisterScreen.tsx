import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Loading } from '../../components/Loading';
import { WorkaroundTextInput } from '../../components/WorkaroundTextInput';
import { useAuthNavigation } from '../../hooks/useNavigation';
import { UserType } from '../../types';

export const RegisterScreen: React.FC = () => {
  const navigation = useAuthNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('client');
  const { register, isLoading } = useAuth();
  const { theme } = useTheme();

  const handleRegister = async (): Promise<void> => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      await register(name, email, password, userType);
    } catch (error) {
      Alert.alert('Error', 'Registration failed. Please try again.');
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  const styles = createStyles(theme);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../../assets/LazyCoachLogo.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.logoSubtext}>Your Personal Growth Partner</Text>
        </View>
        
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>

        <View style={styles.userTypeContainer}>
          <Text style={styles.userTypeLabel}>I am...</Text>
          <View style={styles.userTypeOptions}>
            <TouchableOpacity
              style={[
                styles.userTypeOption,
                userType === 'client' && styles.selectedUserTypeOption
              ]}
              onPress={() => setUserType('client')}
            >
              <Text style={styles.userTypeIcon}>🙋‍♀️</Text>
              <Text style={[
                styles.userTypeText,
                userType === 'client' && styles.selectedUserTypeText
              ]}>
                Looking for a Coach
              </Text>
              <Text style={[
                styles.userTypeDescription,
                userType === 'client' && styles.selectedUserTypeDescription
              ]}>
                Find and book coaching sessions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.userTypeOption,
                userType === 'coach' && styles.selectedUserTypeOption
              ]}
              onPress={() => setUserType('coach')}
            >
              <Text style={styles.userTypeIcon}>👨‍🏫</Text>
              <Text style={[
                styles.userTypeText,
                userType === 'coach' && styles.selectedUserTypeText
              ]}>
                I am a Coach
              </Text>
              <Text style={[
                styles.userTypeDescription,
                userType === 'coach' && styles.selectedUserTypeDescription
              ]}>
                Offer coaching services to clients
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.form}>
          <WorkaroundTextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            keyboardType="default"
          />

          <WorkaroundTextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <WorkaroundTextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="none"
            autoComplete="off"
            passwordRules=""
            importantForAutofill="no"
          />

          <WorkaroundTextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textContentType="none"
            autoComplete="off"
            passwordRules=""
            importantForAutofill="no"
          />

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>Create Account</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  logoSubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  title: {
    fontSize: 32,
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
  userTypeContainer: {
    marginBottom: 24,
  },
  userTypeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  userTypeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  userTypeOption: {
    flex: 1,
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedUserTypeOption: {
    backgroundColor: theme.primaryLight + '20',
    borderColor: theme.primary,
  },
  userTypeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  userTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  selectedUserTypeText: {
    color: theme.primary,
  },
  userTypeDescription: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedUserTypeDescription: {
    color: theme.primaryDark,
  },
  form: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: theme.inputBackground,
    color: theme.text,
  },
  registerButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  linkText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});