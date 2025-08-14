import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { WorkaroundTextInput } from '../../components/WorkaroundTextInput';
import { ThemeSelector } from '../../components/ThemeSelector';
import { FilterOptions } from '../../components/search/FilterModal';
import { useMainNavigation } from '../../hooks/useNavigation';
import { ColorScheme } from '../../theme/colors';

const specialties = [
  'Life & Career Coach',
  'Business Coach',
  'Wellness Coach',
  'Executive Coach',
  'Relationship Coach',
];

export const UserProfileScreen: React.FC = () => {
  const navigation = useMainNavigation();
  const { user, logout } = useAuth();
  const { theme, themeName, isAutoTheme, availableThemes } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [editedEmail, setEditedEmail] = useState(user?.email || '');
  const [editedLocation, setEditedLocation] = useState(user?.preferences.location || '');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(
    user?.preferences.specialty || []
  );
  const [priceRange, setPriceRange] = useState<[number, number]>(
    user?.preferences.priceRange || [0, 500]
  );

  const handleSave = async (): Promise<void> => {
    try {
      // TODO: Implement API call to update user profile
      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleCancel = (): void => {
    setEditedName(user?.name || '');
    setEditedEmail(user?.email || '');
    setEditedLocation(user?.preferences.location || '');
    setSelectedSpecialties(user?.preferences.specialty || []);
    setPriceRange(user?.preferences.priceRange || [0, 500]);
    setIsEditing(false);
  };

  const toggleSpecialty = (specialty: string): void => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const handleLogout = (): void => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  if (!user) {
    return null;
  }

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => isEditing ? handleSave() : setIsEditing(true)}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? 'Save' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Name</Text>
            {isEditing ? (
              <WorkaroundTextInput
                style={styles.textInput}
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Enter your name"
              />
            ) : (
              <Text style={styles.fieldValue}>{user.name}</Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Email</Text>
            {isEditing ? (
              <WorkaroundTextInput
                style={styles.textInput}
                value={editedEmail}
                onChangeText={setEditedEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.fieldValue}>{user.email}</Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Location</Text>
            {isEditing ? (
              <WorkaroundTextInput
                style={styles.textInput}
                value={editedLocation}
                onChangeText={setEditedLocation}
                placeholder="Enter your location"
              />
            ) : (
              <Text style={styles.fieldValue}>
                {user.preferences.location || 'Not specified'}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coaching Preferences</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Interested Specialties</Text>
            {isEditing ? (
              <View style={styles.specialtyContainer}>
                {specialties.map((specialty) => (
                  <TouchableOpacity
                    key={specialty}
                    style={[
                      styles.specialtyChip,
                      selectedSpecialties.includes(specialty) && styles.selectedSpecialtyChip
                    ]}
                    onPress={() => toggleSpecialty(specialty)}
                  >
                    <Text style={[
                      styles.specialtyChipText,
                      selectedSpecialties.includes(specialty) && styles.selectedSpecialtyChipText
                    ]}>
                      {specialty}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.fieldValue}>
                {user.preferences.specialty.length > 0 
                  ? user.preferences.specialty.join(', ')
                  : 'None selected'
                }
              </Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Budget Range</Text>
            {isEditing ? (
              <View style={styles.priceRangeContainer}>
                <Text style={styles.priceRangeText}>
                  ${priceRange[0]} - ${priceRange[1]} per session
                </Text>
                <View style={styles.priceRangeButtons}>
                  <TouchableOpacity
                    style={[styles.priceButton, priceRange[0] === 0 && priceRange[1] === 500 && styles.selectedPriceButton]}
                    onPress={() => setPriceRange([0, 500])}
                  >
                    <Text style={styles.priceButtonText}>Any</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.priceButton, priceRange[0] === 50 && priceRange[1] === 80 && styles.selectedPriceButton]}
                    onPress={() => setPriceRange([50, 80])}
                  >
                    <Text style={styles.priceButtonText}>$50-80</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.priceButton, priceRange[0] === 80 && priceRange[1] === 120 && styles.selectedPriceButton]}
                    onPress={() => setPriceRange([80, 120])}
                  >
                    <Text style={styles.priceButtonText}>$80-120</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.priceButton, priceRange[0] === 120 && priceRange[1] === 200 && styles.selectedPriceButton]}
                    onPress={() => setPriceRange([120, 200])}
                  >
                    <Text style={styles.priceButtonText}>$120-200</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.fieldValue}>
                ${user.preferences.priceRange[0]} - ${user.preferences.priceRange[1]} per session
              </Text>
            )}
          </View>
        </View>

        {user.userType === 'coach' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Coach Verification</Text>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Verification Status</Text>
              <View style={styles.verificationStatusContainer}>
                <Text style={[
                  styles.verificationStatus,
                  { color: user.coachProfile?.verified ? theme.success : theme.warning }
                ]}>
                  {user.coachProfile?.verified ? '✓ Verified' : 'Pending Verification'}
                </Text>
                {!user.coachProfile?.verified && (
                  <TouchableOpacity 
                    style={styles.verificationButton}
                    onPress={() => navigation.navigate('CoachVerification')}
                  >
                    <Text style={styles.verificationButtonText}>Complete Verification</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Theme</Text>
            <TouchableOpacity 
              style={styles.themeSelector}
              onPress={() => setShowThemeSelector(true)}
            >
              <Text style={styles.themeText}>
                {isAutoTheme ? 'Automatic' : availableThemes.find(t => t.name === themeName)?.displayName}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Stats</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.bookedSessions.length}</Text>
              <Text style={styles.statLabel}>Total Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {user.bookedSessions.filter(s => s.status === 'completed').length}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {user.bookedSessions.filter(s => s.status === 'upcoming').length}
              </Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
          </View>
        </View>

        {isEditing && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel Changes</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ThemeSelector
        visible={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
      />
    </SafeAreaView>
  );
};

const createStyles = (theme: ColorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    flex: 1,
  },
  backButtonText: {
    fontSize: 18,
    color: theme.primary,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  editButtonText: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: theme.textSecondary,
    lineHeight: 22,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: theme.surface,
    color: theme.text,
  },
  specialtyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  selectedSpecialtyChip: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  specialtyChipText: {
    fontSize: 14,
    color: theme.text,
  },
  selectedSpecialtyChipText: {
    color: 'white',
    fontWeight: '500',
  },
  priceRangeContainer: {
    alignItems: 'flex-start',
  },
  priceRangeText: {
    fontSize: 16,
    color: theme.text,
    marginBottom: 12,
  },
  priceRangeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priceButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  selectedPriceButton: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  priceButtonText: {
    fontSize: 14,
    color: theme.text,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.primary,
  },
  statLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  themeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  themeText: {
    fontSize: 16,
    color: theme.text,
  },
  chevron: {
    fontSize: 18,
    color: theme.textMuted,
    fontWeight: '300',
  },
  verificationStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verificationStatus: {
    fontSize: 16,
    fontWeight: '600',
  },
  verificationButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  verificationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: theme.surface,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: theme.error,
    paddingVertical: 16,
    borderRadius: 8,
  },
  logoutButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});