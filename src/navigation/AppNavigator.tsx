import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList, MainStackParamList } from '../types/navigation';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { HomeScreen } from '../screens/main/HomeScreen';
import { CoachDetailScreen } from '../screens/main/CoachDetailScreen';
import { MySessionsScreen } from '../screens/tabs/MySessionsScreen';
import { MessagesScreen } from '../screens/messages/MessagesScreen';
import { ChatScreen } from '../screens/messages/ChatScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import { CoachVerificationScreen } from '../screens/coach/CoachVerificationScreen';
import { Loading } from '../components/Loading';

const AuthStack = createStackNavigator<AuthStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();

const AuthStackNavigator = (): React.ReactElement => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

const MainStackNavigator = (): React.ReactElement => (
  <MainStack.Navigator screenOptions={{ headerShown: false }}>
    <MainStack.Screen name="Home" component={HomeScreen} />
    <MainStack.Screen name="CoachDetail" component={CoachDetailScreen} />
    <MainStack.Screen name="MySessions" component={MySessionsScreen} />
    <MainStack.Screen name="Messages" component={MessagesScreen} />
    <MainStack.Screen name="Chat" component={ChatScreen} />
    <MainStack.Screen name="UserProfile" component={UserProfileScreen} />
    <MainStack.Screen name="CoachVerification" component={CoachVerificationScreen} />
  </MainStack.Navigator>
);

export const AppNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <NavigationContainer>
      {user ? <MainStackNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
};