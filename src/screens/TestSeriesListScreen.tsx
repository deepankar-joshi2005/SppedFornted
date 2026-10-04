import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
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
import { getSeriesByCategory, SeriesByCategoryItem } from '../services/tests.service';
import { getStreakDays } from '../services/dashboard.service';
import { ERROR, GOLD, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  category: string;
  categoryIcon?: string;
  nav: Nav;
};

export default function TestSeriesListScreen({ token, category, categoryIcon, nav }: Props) {
  const [series, setSeries] = useState<SeriesByCategoryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [streakDays, setStreakDays] = useState(0);

  const [howItWorksVisible, setHowItWorksVisible] = useState(false);

  const load = useCallback(
    async (isRefresh?: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const [result, streak] = await Promise.all([
          getSeriesByCategory(token, category),
          getStreakDays(token),
        ]);
        setSeries(result);
        setStreakDays(streak);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load test series.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token, category]
  );

  useEffect(() => {
    load();
  }, [load]);

  const totalSeriesCount = series?.length || 0;
  const totalMocksCount = series?.reduce((sum, s) => sum + s.totalTests, 0) || 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header matching the Category page theme */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleWrap}>
          <Pressable style={styles.backBtn} onPress={nav.pop} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color="#1E1E1E" />
          </Pressable>
          <View style={styles.headerLogoWrap}>
            {categoryIcon ? (
              <Image source={{ uri: categoryIcon }} style={styles.headerLogoImg} resizeMode="cover" />
            ) : (
              <Ionicons name="sparkles" size={16} color="#FDE68A" />
            )}
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Test Series
          </Text>
        </View>

        <NotificationBell
          token={token}
          size={20}
          style={styles.bellBtn}
          onPress={() => nav.push({ name: 'notifications' })}
        />
      </View>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={NAVY} />
        }
      >
        {/* Top Stats Banner Card */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{streakDays}</Text>
            <Text style={styles.statLabel}>day streak</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statEmoji}>📝</Text>
            <Text style={styles.statValue}>{totalSeriesCount}</Text>
            <Text style={styles.statLabel}>test series</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statEmoji}>🎯</Text>
            <Text style={styles.statValue}>{totalMocksCount}</Text>
            <Text style={styles.statLabel}>total mocks</Text>
          </View>
        </View>

        {/* Section Header Row */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWrap}>
            <Text style={styles.sectionTitle}>{category}</Text>
            <Text style={styles.sectionCount}>{totalSeriesCount}</Text>
          </View>
          <Pressable
            style={styles.howItWorksBtn}
            onPress={() => setHowItWorksVisible(true)}
            hitSlop={8}
          >
            <Ionicons name="information-circle-outline" size={16} color="#64748B" />
            <Text style={styles.howItWorksText}>How it works</Text>
          </Pressable>
        </View>

        {loading && !series && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={NAVY} size="large" />
          </View>
        )}

        {!!error && !series && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => load()} style={{ marginTop: 8 }}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </Pressable>
          </View>
        )}

        {series?.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="document-text-outline" size={36} color={MUTED} />
            <Text style={styles.emptyText}>No test series available in this category yet.</Text>
          </View>
        )}

        {/* Test Series Cards */}
        {series?.map((item) => (
          <Pressable
            style={styles.card}
            key={item.seriesId}
            onPress={() =>
              nav.push({
                name: 'testList',
                testSeriesId: item.seriesId,
                seriesIcon: categoryIcon,
              })
            }
          >
            {/* Banner strip — only when the admin has uploaded one for this series */}
            {!!item.bannerImage && (
              <Image
                source={{ uri: resolveAssetUrl(item.bannerImage) }}
                style={styles.cardBanner}
                resizeMode="cover"
              />
            )}

            <View style={styles.cardBody}>
              <View style={styles.cardMainRow}>
                {/* Left Badge: same Category icon shown on the Category page */}
                <View style={styles.cardLogoBadge}>
                  {categoryIcon ? (
                    <Image source={{ uri: categoryIcon }} style={styles.cardLogoImg} resizeMode="contain" />
                  ) : (
                    <Ionicons name="school" size={24} color={NAVY} />
                  )}
                </View>

                {/* Middle Info Column */}
                <View style={styles.cardMiddleContent}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </View>

                  <Text style={styles.cardSubText}>
                    {item.totalTests} Tests • {item.totalQuestions} Qs • {item.durationMinutes} mins
                  </Text>

                  <View style={styles.progressLabelRow}>
                    <Text style={styles.difficultyText}>{item.difficulty}</Text>
                    <Text style={styles.percentText}>{item.percentCompleted}% Completed</Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${item.percentCompleted}%` }]} />
                  </View>
                </View>

                {/* Right Action Button Pill */}
                <View style={styles.cardRightAction}>
                  {item.isPaid && !item.isPurchased ? (
                    <View style={[styles.actionPill, styles.actionPillLocked]}>
                      <Text style={styles.actionPillTextLocked}>₹{item.price}</Text>
                      <Ionicons name="chevron-down" size={14} color="#92400E" />
                    </View>
                  ) : (
                    <View style={[styles.actionPill, styles.actionPillOpen]}>
                      <Text style={styles.actionPillTextOpen}>Open</Text>
                      <Ionicons name="chevron-down" size={14} color="#1E1E1E" />
                    </View>
                  )}
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* How It Works Modal */}
      <Modal visible={howItWorksVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.infoModalCard}>
            <View style={styles.infoModalHeader}>
              <Text style={styles.infoModalTitle}>About Test Series</Text>
              <Pressable onPress={() => setHowItWorksVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#1E1E1E" />
              </Pressable>
            </View>

            <View style={styles.infoStepRow}>
              <Text style={styles.infoStepIcon}>🎯</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoStepTitle}>Full Length & Sectional Mocks</Text>
                <Text style={styles.infoStepDesc}>
                  Pick a test series to attempt high quality mock tests curated for real exam patterns.
                </Text>
              </View>
            </View>

            <View style={styles.infoStepRow}>
              <Text style={styles.infoStepIcon}>📊</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoStepTitle}>Instant Analysis & Ranks</Text>
                <Text style={styles.infoStepDesc}>
                  Track your score percentiles, solution reviews, and rank leaderboard after completing each mock.
                </Text>
              </View>
            </View>

            <Pressable style={styles.infoCloseBtn} onPress={() => setHowItWorksVisible(false)}>
              <Text style={styles.infoCloseBtnText}>Got It</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#FAF6F0',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  backBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -2,
  },
  headerLogoWrap: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerLogoImg: {
    width: 30,
    height: 30,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1E1E',
    flexShrink: 1,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFDF6',
    borderWidth: 1.2,
    borderColor: '#F0D688',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  statLabel: {
    fontSize: 11,
    color: '#78716C',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#EFE9D8',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#78716C',
  },
  howItWorksBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  howItWorksText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorBox: {
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FBEAE8',
    alignItems: 'center',
  },
  errorText: {
    color: ERROR,
    fontSize: 13,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: NAVY,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#1E1E1E',
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardBanner: {
    width: '100%',
    height: 110,
    backgroundColor: '#EEF1F7',
  },
  cardBody: {
    padding: 13,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLogoBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    overflow: 'hidden',
  },
  cardLogoImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  cardMiddleContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  cardSubText: {
    fontSize: 11.5,
    color: '#78716C',
    marginTop: 2,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  difficultyText: {
    fontSize: 11,
    color: MUTED,
    fontWeight: '600',
  },
  percentText: {
    fontSize: 11,
    fontWeight: '700',
    color: NAVY,
  },
  progressTrack: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginTop: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2.5,
    backgroundColor: GOLD,
  },
  cardRightAction: {
    marginLeft: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.2,
  },
  actionPillOpen: {
    backgroundColor: '#FEF3C7',
    borderColor: '#1E1E1E',
  },
  actionPillTextOpen: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  actionPillLocked: {
    backgroundColor: '#FEF3C7',
    borderColor: '#92400E',
  },
  actionPillTextLocked: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#92400E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#1E1E1E',
  },
  infoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  infoStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  infoStepIcon: {
    fontSize: 22,
  },
  infoStepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  infoStepDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  infoCloseBtn: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  infoCloseBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
