import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '../utils/storage';
import { ColorScheme, ThemeName, themes } from '../theme/colors';

interface ThemeContextType {
  theme: ColorScheme;
  themeName: ThemeName;
  setTheme: (themeName: ThemeName) => void;
  isAutoTheme: boolean;
  setAutoTheme: (auto: boolean) => void;
  availableThemes: Array<{
    name: ThemeName;
    displayName: string;
    description: string;
    preview: string;
  }>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

const THEME_STORAGE_KEY = 'lazycoach_theme';
const AUTO_THEME_STORAGE_KEY = 'lazycoach_auto_theme';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeName, setThemeName] = useState<ThemeName>('light');
  const [isAutoTheme, setIsAutoTheme] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  const availableThemes = [
    {
      name: 'light' as ThemeName,
      displayName: 'Light',
      description: 'Clean and bright interface',
      preview: '☀️',
    },
    {
      name: 'dark' as ThemeName,
      displayName: 'Dark',
      description: 'Easy on the eyes in low light',
      preview: '🌙',
    },
    {
      name: 'ocean' as ThemeName,
      displayName: 'Ocean',
      description: 'Calming teal and blue tones',
      preview: '🌊',
    },
    {
      name: 'sunset' as ThemeName,
      displayName: 'Sunset',
      description: 'Warm orange and purple gradients',
      preview: '🌅',
    },
  ];

  // Load theme preferences on app start
  useEffect(() => {
    const loadThemePreferences = async () => {
      try {
        const [savedTheme, autoThemeEnabled] = await Promise.all([
          storage.getItem(THEME_STORAGE_KEY),
          storage.getItem(AUTO_THEME_STORAGE_KEY),
        ]);

        const isAuto = autoThemeEnabled !== 'false';
        setIsAutoTheme(isAuto);

        if (isAuto) {
          // Use system theme
          setThemeName(systemColorScheme === 'dark' ? 'dark' : 'light');
        } else if (savedTheme && themes[savedTheme as ThemeName]) {
          // Use saved manual theme
          setThemeName(savedTheme as ThemeName);
        }
      } catch (error) {
        console.error('Failed to load theme preferences:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadThemePreferences();
  }, []); // Remove systemColorScheme dependency to prevent loop

  // Update theme when system theme changes (if auto mode is enabled)
  useEffect(() => {
    if (isAutoTheme && isLoaded && systemColorScheme) {
      const newTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
      setThemeName(newTheme);
    }
  }, [systemColorScheme, isAutoTheme, isLoaded]);

  const setTheme = async (newThemeName: ThemeName) => {
    try {
      setThemeName(newThemeName);
      setIsAutoTheme(false);
      
      await Promise.all([
        storage.setItem(THEME_STORAGE_KEY, newThemeName),
        storage.setItem(AUTO_THEME_STORAGE_KEY, 'false'),
      ]);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const setAutoTheme = async (auto: boolean) => {
    try {
      setIsAutoTheme(auto);
      
      if (auto && systemColorScheme) {
        // Switch to system theme
        const systemTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
        setThemeName(systemTheme);
      }
      
      await storage.setItem(AUTO_THEME_STORAGE_KEY, auto.toString());
    } catch (error) {
      console.error('Failed to save auto theme preference:', error);
    }
  };

  const currentTheme = themes[themeName];

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        themeName,
        setTheme,
        isAutoTheme,
        setAutoTheme,
        availableThemes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};