import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ColorScheme } from '../../theme/colors';
import { UserType } from '../../types';

const { width } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
}

interface OnboardingFlowProps {
  userType: UserType;
  onComplete: (data: OnboardingData) => void;
  onSkip?: () => void;
}

export interface OnboardingData {
  interests: string[];
  goals: string[];
  experience: string;
  availability: string[];
  preferences: {
    sessionType: 'video' | 'audio' | 'chat';
    duration: number;
    reminders: boolean;
  };
  // Coach-specific data
  specializations?: string[];
  certifications?: string[];
  pricing?: {
    hourlyRate: number;
    packageRates?: { sessions: number; price: number }[];
  };
}

const CLIENT_INTERESTS = [
  'Career Development', 'Life Coaching', 'Fitness & Health', 'Relationships',
  'Stress Management', 'Goal Setting', 'Time Management', 'Leadership',
  'Communication Skills', 'Work-Life Balance', 'Personal Growth', 'Confidence Building',
];

const CLIENT_GOALS = [
  'Get promoted at work', 'Improve relationships', 'Build better habits',
  'Reduce stress and anxiety', 'Increase productivity', 'Find life purpose',
  'Improve communication', 'Build confidence', 'Achieve work-life balance',
  'Start a new career', 'Lose weight', 'Learn new skills',
];

const COACH_SPECIALIZATIONS = [
  'Life Coaching', 'Career Coaching', 'Executive Coaching', 'Health & Wellness',
  'Relationship Coaching', 'Business Coaching', 'Leadership Development',
  'Performance Coaching', 'Spiritual Coaching', 'Financial Coaching',
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'New to coaching (0-1 years)', description: 'Just starting my coaching journey' },
  { id: 'intermediate', label: 'Some experience (2-5 years)', description: 'Have worked with several clients' },
  { id: 'experienced', label: 'Experienced (5+ years)', description: 'Established coaching practice' },
  { id: 'expert', label: 'Expert (10+ years)', description: 'Recognized industry expert' },
];

const AVAILABILITY_OPTIONS = [
  'Weekday mornings', 'Weekday afternoons', 'Weekday evenings',
  'Weekend mornings', 'Weekend afternoons', 'Weekend evenings',
  'Flexible schedule', 'By appointment only',
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  userType,
  onComplete,
  onSkip,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    interests: [],
    goals: [],
    experience: '',
    availability: [],
    preferences: {
      sessionType: 'video',
      duration: 60,
      reminders: true,
    },
  });

  const clientSteps: OnboardingStep[] = [
    {
      id: 'interests',
      title: 'What areas interest you?',
      description: 'Select the topics you\'d like coaching support with',
      component: renderInterestsStep(),
    },
    {
      id: 'goals',
      title: 'What are your goals?',
      description: 'Choose what you\'d like to achieve',
      component: renderGoalsStep(),
    },
    {
      id: 'preferences',
      title: 'Session preferences',
      description: 'How would you like to have your coaching sessions?',
      component: renderPreferencesStep(),
    },
    {
      id: 'availability',
      title: 'When are you available?',
      description: 'Select your preferred times for coaching sessions',
      component: renderAvailabilityStep(),
    },
  ];

  const coachSteps: OnboardingStep[] = [
    {
      id: 'specializations',
      title: 'Your specializations',
      description: 'What type of coaching do you offer?',
      component: renderSpecializationsStep(),
    },
    {
      id: 'experience',
      title: 'Your experience level',
      description: 'How long have you been coaching?',
      component: renderExperienceStep(),
    },
    {
      id: 'pricing',
      title: 'Set your rates',
      description: 'What do you charge for your services?',
      component: renderPricingStep(),
    },
    {
      id: 'availability',
      title: 'Your availability',
      description: 'When are you available to coach?',
      component: renderAvailabilityStep(),
    },
  ];

  const steps = userType === 'client' ? clientSteps : coachSteps;
  const isLastStep = currentStep === steps.length - 1;

  function renderInterestsStep() {
    return (
      <View style={styles.stepContent}>
        <View style={styles.optionsGrid}>
          {CLIENT_INTERESTS.map((interest) => (
            <TouchableOpacity
              key={interest}
              style={[
                styles.optionButton,
                onboardingData.interests.includes(interest) && styles.selectedOption,
              ]}
              onPress={() => toggleInterest(interest)}
            >
              <Text style={[
                styles.optionText,
                onboardingData.interests.includes(interest) && styles.selectedOptionText,
              ]}>
                {interest}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  function renderGoalsStep() {
    return (
      <View style={styles.stepContent}>
        <View style={styles.optionsGrid}>
          {CLIENT_GOALS.map((goal) => (
            <TouchableOpacity
              key={goal}
              style={[
                styles.optionButton,
                onboardingData.goals.includes(goal) && styles.selectedOption,
              ]}
              onPress={() => toggleGoal(goal)}
            >
              <Text style={[
                styles.optionText,
                onboardingData.goals.includes(goal) && styles.selectedOptionText,
              ]}>
                {goal}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  function renderSpecializationsStep() {
    return (
      <View style={styles.stepContent}>
        <View style={styles.optionsGrid}>
          {COACH_SPECIALIZATIONS.map((spec) => (
            <TouchableOpacity
              key={spec}
              style={[
                styles.optionButton,
                onboardingData.specializations?.includes(spec) && styles.selectedOption,
              ]}
              onPress={() => toggleSpecialization(spec)}
            >
              <Text style={[
                styles.optionText,
                onboardingData.specializations?.includes(spec) && styles.selectedOptionText,
              ]}>
                {spec}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  function renderExperienceStep() {
    return (
      <View style={styles.stepContent}>
        {EXPERIENCE_LEVELS.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.experienceOption,
              onboardingData.experience === level.id && styles.selectedExperienceOption,
            ]}
            onPress={() => setOnboardingData(prev => ({ ...prev, experience: level.id }))}
          >
            <Text style={[
              styles.experienceTitle,
              onboardingData.experience === level.id && styles.selectedExperienceTitle,
            ]}>
              {level.label}
            </Text>
            <Text style={[
              styles.experienceDescription,
              onboardingData.experience === level.id && styles.selectedExperienceDescription,
            ]}>
              {level.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  function renderPricingStep() {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.pricingLabel}>Hourly Rate (USD)</Text>
        <View style={styles.priceOptions}>
          {[50, 75, 100, 150, 200, 300].map((rate) => (
            <TouchableOpacity
              key={rate}
              style={[
                styles.priceOption,
                onboardingData.pricing?.hourlyRate === rate && styles.selectedPriceOption,
              ]}
              onPress={() => setOnboardingData(prev => ({
                ...prev,
                pricing: { ...prev.pricing, hourlyRate: rate },
              }))}
            >
              <Text style={[
                styles.priceText,
                onboardingData.pricing?.hourlyRate === rate && styles.selectedPriceText,
              ]}>
                ${rate}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.pricingNote}>
          You can adjust your rates anytime in your profile settings
        </Text>
      </View>
    );
  }

  function renderPreferencesStep() {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.preferenceLabel}>Preferred session type</Text>
        <View style={styles.preferenceOptions}>
          {[
            { id: 'video', label: 'Video Call', icon: '📹' },
            { id: 'audio', label: 'Audio Call', icon: '📞' },
            { id: 'chat', label: 'Text Chat', icon: '💬' },
          ].map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.preferenceOption,
                onboardingData.preferences.sessionType === type.id && styles.selectedPreferenceOption,
              ]}
              onPress={() => setOnboardingData(prev => ({
                ...prev,
                preferences: { ...prev.preferences, sessionType: type.id as any },
              }))}
            >
              <Text style={styles.preferenceIcon}>{type.icon}</Text>
              <Text style={[
                styles.preferenceText,
                onboardingData.preferences.sessionType === type.id && styles.selectedPreferenceText,
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.preferenceLabel}>Session duration</Text>
        <View style={styles.durationOptions}>
          {[30, 60, 90].map((duration) => (
            <TouchableOpacity
              key={duration}
              style={[
                styles.durationOption,
                onboardingData.preferences.duration === duration && styles.selectedDurationOption,
              ]}
              onPress={() => setOnboardingData(prev => ({
                ...prev,
                preferences: { ...prev.preferences, duration },
              }))}
            >
              <Text style={[
                styles.durationText,
                onboardingData.preferences.duration === duration && styles.selectedDurationText,
              ]}>
                {duration} min
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  function renderAvailabilityStep() {
    return (
      <View style={styles.stepContent}>
        <View style={styles.optionsGrid}>
          {AVAILABILITY_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                onboardingData.availability.includes(option) && styles.selectedOption,
              ]}
              onPress={() => toggleAvailability(option)}
            >
              <Text style={[
                styles.optionText,
                onboardingData.availability.includes(option) && styles.selectedOptionText,
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  const toggleInterest = (interest: string) => {
    setOnboardingData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const toggleGoal = (goal: string) => {
    setOnboardingData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal],
    }));
  };

  const toggleSpecialization = (spec: string) => {
    setOnboardingData(prev => ({
      ...prev,
      specializations: prev.specializations?.includes(spec)
        ? prev.specializations?.filter(s => s !== spec)
        : [...(prev.specializations || []), spec],
    }));
  };

  const toggleAvailability = (option: string) => {
    setOnboardingData(prev => ({
      ...prev,
      availability: prev.availability.includes(option)
        ? prev.availability.filter(a => a !== option)
        : [...prev.availability, option],
    }));
  };

  const handleNext = () => {
    if (isLastStep) {
      onComplete(onboardingData);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const canContinue = () => {
    const step = steps[currentStep];
    switch (step.id) {
      case 'interests':
        return onboardingData.interests.length > 0;
      case 'goals':
        return onboardingData.goals.length > 0;
      case 'specializations':
        return (onboardingData.specializations?.length || 0) > 0;
      case 'experience':
        return onboardingData.experience !== '';
      case 'pricing':
        return onboardingData.pricing?.hourlyRate !== undefined;
      case 'availability':
        return onboardingData.availability.length > 0;
      default:
        return true;
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentStep + 1) / steps.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {currentStep + 1} of {steps.length}
        </Text>
      </View>

      {/* Step content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>{currentStepData.title}</Text>
        <Text style={styles.stepDescription}>{currentStepData.description}</Text>
        {currentStepData.component}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        {onSkip && currentStep === 0 && (
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.navigationButtons}>
          {currentStep > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.nextButton, !canContinue() && styles.disabledButton]}
            onPress={handleNext}
            disabled={!canContinue()}
          >
            <Text style={styles.nextButtonText}>
              {isLastStep ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: ColorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  progressContainer: {
    padding: 20,
    backgroundColor: theme.surface,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: 4,
    backgroundColor: theme.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 32,
    lineHeight: 22,
  },
  stepContent: {
    flex: 1,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: theme.primary + '20',
    borderColor: theme.primary,
  },
  optionText: {
    fontSize: 14,
    color: theme.text,
    textAlign: 'center',
  },
  selectedOptionText: {
    color: theme.primary,
    fontWeight: '500',
  },
  experienceOption: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedExperienceOption: {
    backgroundColor: theme.primary + '20',
    borderColor: theme.primary,
  },
  experienceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  selectedExperienceTitle: {
    color: theme.primary,
  },
  experienceDescription: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  selectedExperienceDescription: {
    color: theme.primary,
  },
  pricingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16,
  },
  priceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  priceOption: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  selectedPriceOption: {
    backgroundColor: theme.primary + '20',
    borderColor: theme.primary,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  selectedPriceText: {
    color: theme.primary,
  },
  pricingNote: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16,
    marginTop: 16,
  },
  preferenceOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  preferenceOption: {
    flex: 1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  selectedPreferenceOption: {
    backgroundColor: theme.primary + '20',
    borderColor: theme.primary,
  },
  preferenceIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  preferenceText: {
    fontSize: 14,
    color: theme.text,
    textAlign: 'center',
  },
  selectedPreferenceText: {
    color: theme.primary,
    fontWeight: '500',
  },
  durationOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  durationOption: {
    flex: 1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectedDurationOption: {
    backgroundColor: theme.primary + '20',
    borderColor: theme.primary,
  },
  durationText: {
    fontSize: 14,
    color: theme.text,
  },
  selectedDurationText: {
    color: theme.primary,
    fontWeight: '500',
  },
  navigation: {
    padding: 20,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  skipButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  skipButtonText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  nextButton: {
    flex: 2,
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});