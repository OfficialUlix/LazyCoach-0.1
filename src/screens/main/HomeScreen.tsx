import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useMainNavigation } from '../../hooks/useNavigation';
import { SearchBar } from '../../components/search/SearchBar';
import { FilterModal, FilterOptions } from '../../components/search/FilterModal';
import { ErrorDisplay } from '../../components/ErrorDisplay';
import { LoadingList } from '../../components/LoadingStates';
import { NetworkStatus } from '../../components/NetworkStatus';
import { Coach } from '../../types';
import { useSearchCoaches } from '../../hooks/useDataService';
import { useOfflineData } from '../../hooks/useOfflineData';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useScreenPerformance } from '../../hooks/usePerformance';
import { ColorScheme } from '../../theme/colors';


export const HomeScreen: React.FC = () => {
  const navigation = useMainNavigation();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { isOnline, searchCoachesOffline } = useOfflineData();
  const { trackScreenView, trackSearch, trackAction } = useAnalytics();
  
  // Track screen performance
  useScreenPerformance('HomeScreen');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: [0, 500],
    minRating: 0,
  });

  // Use the new data service with caching
  const { 
    data: filteredCoaches, 
    loading, 
    error, 
    refresh,
    isCached 
  } = useSearchCoaches(
    searchQuery,
    filters.specialty,
    filters.priceRange,
    filters.minRating,
    { useCache: true, cacheTTL: 5 * 60 * 1000 } // 5 minute cache
  );

  // Track screen view
  useEffect(() => {
    trackScreenView('HomeScreen');
  }, [trackScreenView]);

  // Track search results
  useEffect(() => {
    if (searchQuery && filteredCoaches && !loading) {
      trackSearch(searchQuery, filteredCoaches.length, filters);
    }
  }, [searchQuery, filteredCoaches, loading, filters, trackSearch]);

  const handleCoachPress = (coach: Coach): void => {
    trackAction('coach_select', 'coach_card', { coachId: coach.id, coachName: coach.name });
    navigation.navigate('CoachDetail', { coach });
  };

  const handleApplyFilters = (newFilters: FilterOptions): void => {
    setFilters(newFilters);
    trackAction('filters_apply', 'filter_modal', { 
      specialty: newFilters.specialty,
      priceRange: newFilters.priceRange,
      minRating: newFilters.minRating,
      activeFiltersCount: activeFiltersCount(),
    });
  };

  const activeFiltersCount = (): number => {
    let count = 0;
    if (filters.specialty) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 500) count++;
    if (filters.minRating > 0) count++;
    return count;
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <NetworkStatus position="top" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image 
            source={require('../../../assets/LazyCoachLogo.jpeg')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Hello, {user?.name}!</Text>
            <Text style={styles.subtitle}>Find your perfect coach</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterButton, activeFiltersCount() > 0 && styles.activeFilterButton]}
          onPress={() => setShowFilters(true)}
        >
          <Text style={[styles.filterButtonText, activeFiltersCount() > 0 && styles.activeFilterButtonText]}>
            Filters {activeFiltersCount() > 0 && `(${activeFiltersCount()})`}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.resultsCount}>
          {loading ? 'Loading...' : `${filteredCoaches?.length || 0} coach${(filteredCoaches?.length || 0) !== 1 ? 'es' : ''} found${isCached ? ' (cached)' : ''}`}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? 'Search Results' : 'Featured Coaches'}
          </Text>
          
          {error ? (
            <ErrorDisplay
              title="Failed to load coaches"
              message={error}
              onRetry={refresh}
              retryText="Reload Coaches"
            />
          ) : loading ? (
            <LoadingList itemCount={5} />
          ) : (filteredCoaches?.length || 0) === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No coaches found</Text>
              <Text style={styles.emptyStateSubtext}>Try adjusting your search or filters</Text>
            </View>
          ) : (
            filteredCoaches?.map((coach) => (
            <TouchableOpacity
              key={coach.id}
              style={styles.coachCard}
              onPress={() => handleCoachPress(coach)}
            >
              <View style={styles.coachHeader}>
                <View style={styles.coachInfo}>
                  <Text style={styles.coachName}>{coach.name}</Text>
                  <Text style={styles.coachSpecialty}>{coach.specialty}</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>{coach.priceDisplay}</Text>
                </View>
              </View>
              
              <Text style={styles.coachDescription}>{coach.description}</Text>
              
              <View style={styles.coachStats}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>⭐ {coach.rating}</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{coach.sessions}</Text>
                  <Text style={styles.statLabel}>Sessions</Text>
                </View>
                <TouchableOpacity style={styles.bookButton}>
                  <Text style={styles.bookButtonText}>View Profile</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('MySessions')}
            >
              <Text style={styles.actionTitle}>📅</Text>
              <Text style={styles.actionText}>My Sessions</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Messages')}
            >
              <Text style={styles.actionTitle}>💬</Text>
              <Text style={styles.actionText}>Messages</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('UserProfile')}
            >
              <Text style={styles.actionTitle}>⚙️</Text>
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 4,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  logoutText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
  },
  coachCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  coachHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  coachInfo: {
    flex: 1,
  },
  coachName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  coachSpecialty: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  priceContainer: {
    backgroundColor: theme.primaryLight + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
  },
  coachDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  coachStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  bookButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  activeFilterButton: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  resultsCount: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
});