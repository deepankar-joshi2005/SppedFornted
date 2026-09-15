import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationBell from '../components/NotificationBell';
import { resolveAssetUrl } from '../config/api';
import { Nav } from '../navigation/types';
import { getDashboard, DashboardData } from '../services/dashboard.service';
import { AuthUser } from '../services/auth.service';
import { useLanguage } from '../context/LanguageContext';
import { CARD_SHADOW, GOLD, GOLD_TINT, MUTED, NAVY, SOFT_SHADOW } from '../theme/colors';

type Props = {
  user: AuthUser;
  token: string;
  nav: Nav;
  onLogout: () => void;
};

const STAT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  totalTests: 'reader-outline',
  attempted: 'checkmark-circle-outline',
  avgScore: 'stats-chart-outline',
  rank: 'ribbon-outline',
};

const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export default function HomeScreen({ user, token, nav }: Props) {
  const { t } = useLanguage();
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (category?: string, isRefresh?: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const result = await getDashboard(token, category);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load(selectedCategory ?? undefined);
  }, [load, selectedCategory]);

  const firstName = user.name.split(' ')[0];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(selectedCategory ?? undefined, true)}
            tintColor={NAVY}
          />
        }
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcomeText}>{t('welcome_back', 'Welcome back,')}</Text>
            <Text style={styles.helloText}>{t('hello', 'Hello,')} {firstName} 👋</Text>
          </View>
          <View style={styles.headerActions}>
            <NotificationBell token={token} onPress={() => nav.push({ name: 'notifications' })} />
            <Pressable style={styles.avatar} onPress={() => nav.resetToTab('profile')}>
              <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={MUTED} />
          <Text style={styles.searchPlaceholder}>{t('search_placeholder', 'Search tests or categories...')}</Text>
        </View>

        {loading && !data && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={NAVY} size="large" />
          </View>
        )}

        {!!error && !data && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => load(selectedCategory ?? undefined)}>
              <Text style={styles.retryText}>{t('retry', 'Tap to retry')}</Text>
            </Pressable>
          </View>
        )}

        {data && (
          <>
            <View style={styles.statsGrid}>
              <StatCard
                icon={STAT_ICONS.totalTests}
                label={t('total_tests', 'Total Tests')}
                value={String(data.stats.totalTests)}
              />
              <StatCard
                icon={STAT_ICONS.attempted}
                label={t('tests_attempted', 'Attempted')}
                value={String(data.stats.attempted)}
              />
              <StatCard
                icon={STAT_ICONS.avgScore}
                label={t('avg_score', 'Avg Score')}
                value={`${data.stats.avgScore}%`}
              />
              <StatCard
                icon={STAT_ICONS.rank}
                label={t('overall_rank', 'Curr. Rank')}
                value={data.stats.rank ? `#${data.stats.rank}` : '—'}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryRow}
            >
              {data.categories.map((cat) => {
                const isActive = selectedCategory === cat.name;
                return (
                  <Pressable
                    key={cat.name}
                    style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                    onPress={() => setSelectedCategory(isActive ? null : cat.name)}
                  >
                    {cat.iconImage && (
                      <Image
                        source={{ uri: resolveAssetUrl(cat.iconImage) }}
                        style={styles.categoryIcon}
                      />
                    )}
                    <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {data.continueTest && (
              <>
                <Text style={styles.sectionTitle}>{t('continue_practicing', 'Continue Test')}</Text>
                <Pressable
                  style={styles.continueCard}
                  onPress={() =>
                    nav.push({
                      name: 'testTaking',
                      attemptId: data.continueTest!.attemptId,
                      testId: data.continueTest!.testId,
                    })
                  }
                >
                  <View style={styles.continueHeaderRow}>
                    <Text style={styles.continueTitle}>{data.continueTest.title}</Text>
                    <Text style={styles.resumeText}>{t('resume_test', 'Resume Test')}</Text>
                  </View>
                  <View style={styles.continueProgressRow}>
                    <Text style={styles.continueSubtext}>
                      {data.continueTest.questionsCompleted} /{' '}
                      {data.continueTest.totalQuestions} {t('questions', 'Questions')}
                    </Text>
                    <Text style={styles.continuePercent}>{data.continueTest.percent}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[styles.progressFill, { width: `${data.continueTest.percent}%` }]}
                    />
                  </View>
                </Pressable>
              </>
            )}

            <Text style={styles.sectionTitle}>{t('test_series_title', 'Popular Test Series')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.seriesRow}
            >
              {data.popularSeries.map((series) => (
                <Pressable
                  style={styles.seriesCard}
                  key={series.id}
                  onPress={() => nav.push({ name: 'testList', category: series.category })}
                >
                  {series.bannerImage && (
                    <Image
                      source={{ uri: resolveAssetUrl(series.bannerImage) }}
                      style={styles.seriesBanner}
                      resizeMode="cover"
                    />
                  )}
                  <Text style={styles.seriesTitle} numberOfLines={2}>
                    {series.title}
                  </Text>
                  <Text style={styles.seriesSubtext}>
                    {series.totalPapers} {series.unitLabel}
                  </Text>
                  <View
                    style={[
                      styles.availableBadge,
                      !series.isAvailable && styles.comingSoonBadge,
                    ]}
                  >
                    <Text
                      style={[styles.availableText, !series.isAvailable && styles.comingSoonText]}
                    >
                      {series.isAvailable ? t('completed', 'Available Now') : 'Coming Soon'}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={16} color={NAVY} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F4EF',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  welcomeText: {
    fontSize: 13,
    color: MUTED,
  },
  helloText: {
    fontSize: 19,
    fontWeight: '800',
    color: NAVY,
    marginTop: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: NAVY,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    marginTop: 18,
    gap: 8,
    ...CARD_SHADOW,
  },
  searchPlaceholder: {
    fontSize: 13,
    color: '#9AA3B2',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FBEAE8',
    alignItems: 'center',
  },
  errorText: {
    color: '#C0392B',
    fontSize: 13,
    textAlign: 'center',
  },
  retryText: {
    marginTop: 8,
    color: NAVY,
    fontWeight: '700',
    fontSize: 12.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 18,
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    ...SOFT_SHADOW,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: GOLD_TINT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11.5,
    color: MUTED,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: NAVY,
    marginTop: 2,
  },
  categoryScroll: {
    marginTop: 18,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingRight: 10,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  categoryIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  categoryPillActive: {
    backgroundColor: NAVY,
    borderColor: NAVY,
    ...SOFT_SHADOW,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: NAVY,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: NAVY,
    marginTop: 24,
    marginBottom: 12,
  },
  continueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: NAVY,
    padding: 16,
  },
  continueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  continueTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: NAVY,
    flexShrink: 1,
  },
  resumeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: GOLD,
  },
  continueProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 8,
  },
  continueSubtext: {
    fontSize: 12,
    color: MUTED,
  },
  continuePercent: {
    fontSize: 12.5,
    fontWeight: '800',
    color: NAVY,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EEEDE6',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: GOLD,
  },
  seriesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingRight: 10,
  },
  seriesCard: {
    width: 168,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    ...SOFT_SHADOW,
  },
  seriesBanner: {
    width: '100%',
    height: 70,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#EEF1F7',
  },
  seriesTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: NAVY,
    minHeight: 34,
  },
  seriesSubtext: {
    fontSize: 11.5,
    color: MUTED,
    marginTop: 6,
  },
  availableBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#E4F5EA',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  comingSoonBadge: {
    backgroundColor: '#F1EFE9',
  },
  availableText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2E9E5B',
  },
  comingSoonText: {
    color: MUTED,
  },
});
