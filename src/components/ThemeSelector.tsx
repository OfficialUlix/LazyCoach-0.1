import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ThemeName } from '../theme/colors';

interface ThemeSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ visible, onClose }) => {
  const { theme, themeName, setTheme, isAutoTheme, setAutoTheme, availableThemes } = useTheme();

  const handleThemeSelect = (selectedTheme: ThemeName) => {
    setTheme(selectedTheme);
  };

  const handleAutoThemeToggle = () => {
    setAutoTheme(!isAutoTheme);
  };

  const styles = createStyles(theme);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Done</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Choose Theme</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          {/* Auto Theme Option */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.option, isAutoTheme && styles.selectedOption]}
              onPress={handleAutoThemeToggle}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionHeader}>
                  <Text style={styles.preview}>🤖</Text>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionTitle, isAutoTheme && styles.selectedText]}>
                      Automatic
                    </Text>
                    <Text style={[styles.optionDescription, isAutoTheme && styles.selectedDescription]}>
                      Follow system appearance settings
                    </Text>
                  </View>
                </View>
                {isAutoTheme && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Manual Theme Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Manual Themes</Text>
            {availableThemes.map((themeOption) => (
              <TouchableOpacity
                key={themeOption.name}
                style={[
                  styles.option,
                  !isAutoTheme && themeName === themeOption.name && styles.selectedOption,
                ]}
                onPress={() => handleThemeSelect(themeOption.name)}
                disabled={isAutoTheme}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionHeader}>
                    <Text style={styles.preview}>{themeOption.preview}</Text>
                    <View style={styles.optionText}>
                      <Text style={[
                        styles.optionTitle,
                        !isAutoTheme && themeName === themeOption.name && styles.selectedText,
                        isAutoTheme && styles.disabledText
                      ]}>
                        {themeOption.displayName}
                      </Text>
                      <Text style={[
                        styles.optionDescription,
                        !isAutoTheme && themeName === themeOption.name && styles.selectedDescription,
                        isAutoTheme && styles.disabledText
                      ]}>
                        {themeOption.description}
                      </Text>
                    </View>
                  </View>
                  {!isAutoTheme && themeName === themeOption.name && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Theme Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Theme Preview</Text>
            <View style={styles.previewCard}>
              <View style={[styles.previewHeader, { backgroundColor: theme.primary }]}>
                <Text style={styles.previewHeaderText}>LazyCoach</Text>
              </View>
              <View style={styles.previewContent}>
                <Text style={[styles.previewTitle, { color: theme.text }]}>
                  Welcome back!
                </Text>
                <Text style={[styles.previewSubtitle, { color: theme.textSecondary }]}>
                  Find your perfect coach
                </Text>
                <View style={styles.previewElements}>
                  <View style={[styles.previewButton, { backgroundColor: theme.primary }]}>
                    <Text style={styles.previewButtonText}>Book Session</Text>
                  </View>
                  <View style={[styles.previewCard2, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.previewCardText, { color: theme.text }]}>Coach Card</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  cancelButton: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  placeholder: {
    width: 50, // Balance the header layout
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  option: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: theme.primary,
    backgroundColor: theme.primaryLight + '10',
  },
  optionContent: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preview: {
    fontSize: 32,
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: theme.textMuted,
  },
  selectedText: {
    color: theme.primary,
  },
  selectedDescription: {
    color: theme.primaryDark,
  },
  disabledText: {
    color: theme.disabled,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  previewCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
  },
  previewHeader: {
    padding: 16,
    alignItems: 'center',
  },
  previewHeaderText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  previewContent: {
    padding: 16,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  previewElements: {
    flexDirection: 'row',
    gap: 12,
  },
  previewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  previewButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  previewCard2: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  previewCardText: {
    fontSize: 12,
    fontWeight: '500',
  },
});