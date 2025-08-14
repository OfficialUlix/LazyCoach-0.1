import { useNavigation as useRNNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList, AuthStackParamList } from '../types/navigation';

export type MainStackNavigationProp = StackNavigationProp<MainStackParamList>;
export type AuthStackNavigationProp = StackNavigationProp<AuthStackParamList>;

export const useMainNavigation = () => useRNNavigation<MainStackNavigationProp>();
export const useAuthNavigation = () => useRNNavigation<AuthStackNavigationProp>();