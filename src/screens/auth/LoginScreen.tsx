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

export const LoginScreen: React.FC = () => {
  const navigation = useAuthNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();
  const { theme } = useTheme();

  const handleLogin = async (): Promise<void> => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
    } catch (error) {
      Alert.alert('Error', 'Invalid email or password');
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
        
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.form}>
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
          />

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>Sign Up</Text>
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
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
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
  loginButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
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