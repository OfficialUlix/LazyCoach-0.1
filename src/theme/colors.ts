export interface ColorScheme {
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryText: string;
  
  // Secondary colors  
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  
  // Background colors
  background: string;
  surface: string;
  card: string;
  inputBackground: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Border and divider colors
  border: string;
  divider: string;
  
  // Interactive states
  pressed: string;
  disabled: string;
  
  // Overlay colors
  overlay: string;
  backdrop: string;
  shadow: string;
  
  // Loading states
  skeleton: string;
  skeletonHighlight: string;
}

export const lightColors: ColorScheme = {
  // Primary - LazyCoach Blue
  primary: '#0066CC',
  primaryLight: '#3385D6',
  primaryDark: '#004C99',
  primaryText: '#FFFFFF',
  
  // Secondary - Complementary accent
  secondary: '#FF6B35',
  secondaryLight: '#FF8A5C',
  secondaryDark: '#E55A2B',
  
  // Backgrounds
  background: '#FFFFFF',
  surface: '#F8F9FA',
  card: '#FFFFFF',
  inputBackground: '#F9F9F9',
  
  // Text
  text: '#212529',
  textSecondary: '#495057',
  textMuted: '#6C757D',
  
  // Status
  success: '#28A745',
  warning: '#FFC107',
  error: '#DC3545',
  info: '#17A2B8',
  
  // Borders
  border: '#DEE2E6',
  divider: '#E9ECEF',
  
  // Interactive
  pressed: '#F1F3F4',
  disabled: '#ADB5BD',
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  backdrop: 'rgba(248, 249, 250, 0.95)',
  shadow: '#000000',
  
  // Loading states
  skeleton: '#E9ECEF',
  skeletonHighlight: '#F8F9FA',
};

export const darkColors: ColorScheme = {
  // Primary - Softer blue for dark mode
  primary: '#4A9EFF',
  primaryLight: '#6BB3FF',
  primaryDark: '#2A7EE8',
  primaryText: '#FFFFFF',
  
  // Secondary - Warm orange for contrast
  secondary: '#FF7A4D',
  secondaryLight: '#FF9470',
  secondaryDark: '#E5633A',
  
  // Backgrounds
  background: '#121212',
  surface: '#1E1E1E',
  card: '#2D2D2D',
  inputBackground: '#2D2D2D',
  
  // Text
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textMuted: '#757575',
  
  // Status
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Borders
  border: '#404040',
  divider: '#333333',
  
  // Interactive
  pressed: '#404040',
  disabled: '#666666',
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  backdrop: 'rgba(30, 30, 30, 0.95)',
  shadow: '#000000',
  
  // Loading states
  skeleton: '#333333',
  skeletonHighlight: '#404040',
};

export const oceanColors: ColorScheme = {
  // Primary - Ocean teal
  primary: '#008B8B',
  primaryLight: '#20A5A5',
  primaryDark: '#006B6B',
  primaryText: '#FFFFFF',
  
  // Secondary - Coral accent
  secondary: '#FF7F7F',
  secondaryLight: '#FF9999',
  secondaryDark: '#E66666',
  
  // Backgrounds
  background: '#F0F8FF',
  surface: '#E0F6FF',
  card: '#FFFFFF',
  inputBackground: '#F5FCFF',
  
  // Text
  text: '#2F4F4F',
  textSecondary: '#708090',
  textMuted: '#9CA3AF',
  
  // Status
  success: '#20B2AA',
  warning: '#FFD700',
  error: '#CD5C5C',
  info: '#4682B4',
  
  // Borders
  border: '#B0E0E6',
  divider: '#D1ECFA',
  
  // Interactive
  pressed: '#E6F3FF',
  disabled: '#A9C5D1',
  
  // Overlays
  overlay: 'rgba(47, 79, 79, 0.5)',
  backdrop: 'rgba(224, 246, 255, 0.95)',
  shadow: '#2F4F4F',
  
  // Loading states
  skeleton: '#B0E0E6',
  skeletonHighlight: '#E0F6FF',
};

export const sunsetColors: ColorScheme = {
  // Primary - Warm orange
  primary: '#FF6B35',
  primaryLight: '#FF8A5C',
  primaryDark: '#E55A2B',
  primaryText: '#FFFFFF',
  
  // Secondary - Deep purple
  secondary: '#8B5CF6',
  secondaryLight: '#A78BFA',
  secondaryDark: '#7C3AED',
  
  // Backgrounds
  background: '#FFF8F3',
  surface: '#FEF1E8',
  card: '#FFFFFF',
  inputBackground: '#FEFBF7',
  
  // Text
  text: '#7C2D12',
  textSecondary: '#92400E',
  textMuted: '#A16207',
  
  // Status
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  info: '#0284C7',
  
  // Borders
  border: '#FED7AA',
  divider: '#FDE68A',
  
  // Interactive
  pressed: '#FEF3C7',
  disabled: '#D6D3D1',
  
  // Overlays
  overlay: 'rgba(124, 45, 18, 0.5)',
  backdrop: 'rgba(254, 241, 232, 0.95)',
  shadow: '#7C2D12',
  
  // Loading states
  skeleton: '#FED7AA',
  skeletonHighlight: '#FEF1E8',
};

export type ThemeName = 'light' | 'dark' | 'ocean' | 'sunset';

export const themes: Record<ThemeName, ColorScheme> = {
  light: lightColors,
  dark: darkColors,
  ocean: oceanColors,
  sunset: sunsetColors,
};