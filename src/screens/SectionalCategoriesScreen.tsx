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
import { getSectionalCategories, SectionalCategoryItem } from '../services/sectional.service';
import { getStreakDays } from '../services/dashboard.service';
import { ERROR, GOLD, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  nav: Nav;
};

export default function SectionalCategoriesScreen({ token, nav }: Props) {
  const [categories, setCategories] = useState<SectionalCategoryItem[] | null>(null);
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
          getSectionalCategories(token),
          getStreakDays(token),
        ]);
        setCategories(result);
        setStreakDays(streak);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sectional tests.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load();
  }, [load]);

  const totalSeriesCount = categories?.length || 0;
  const totalTestsCount = categories?.reduce((sum, c) => sum + c.totalTests, 0) || 0;
  const totalQuestionsCount = categories?.reduce((sum, c) => sum + c.totalQuestions, 0) || 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleWrap}>
          <View style={styles.headerLogoWrap}>
            <Ionicons name="layers" size={16} color="#FDE68A" />
          </View>
          <Text style={styles.headerTitle}>Sectional Tests</Text>
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
            <Text style={styles.statLabel}>categories</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statEmoji}>🎯</Text>
            <Text style={styles.statValue}>{totalTestsCount}</Text>
            <Text style={styles.statLabel}>total tests</Text>
          </View>
        </View>

        {/* Section Header Row */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWrap}>
            <Text style={styles.sectionTitle}>Available Categories</Text>
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

        {loading && !categories && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={NAVY} size="large" />
          </View>
        )}

        {!!error && !categories && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => load()} style={{ marginTop: 8 }}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </Pressable>
          </View>
        )}

        {categories?.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="layers-outline" size={36} color={MUTED} />
            <Text style={styles.emptyText}>No sectional tests available yet.</Text>
          </View>
        )}

        {/* Category Cards */}
        {categories?.map((cat) => (
          <Pressable
            key={cat.seriesId}
            style={styles.card}
            onPress={() =>
              nav.push({
                name: 'testList',
                seriesId: cat.seriesId,
                seriesIcon: cat.bannerImage ? resolveAssetUrl(cat.bannerImage) : undefined,
              })
            }
          >
            <View style={styles.cardMainRow}>
              {/* Left Badge */}
              <View style={styles.cardLogoBadge}>
                {cat.bannerImage ? (
                  <Image
                    source={{ uri: resolveAssetUrl(cat.bannerImage) }}
                    style={styles.cardLogoImg}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons name="layers" size={24} color={NAVY} />
                )}
              </View>

              {/* Middle Info */}
              <View style={styles.cardMiddleContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {cat.title}
                </Text>
                <Text style={styles.cardSubText}>
                  {cat.totalTests} Test{cat.totalTests === 1 ? '' : 's'} • {cat.totalQuestions} Questions
                </Text>

                {/* Progress bar — percent of tests completed (0 for now, dynamic when available) */}
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: '0%' }]} />
                </View>
              </View>

              {/* Right Action Pill */}
              <View style={styles.cardRightAction}>
                {cat.isPaid && !cat.isPurchased ? (
                  <View style={[styles.actionPill, styles.actionPillLocked]}>
                    <Text style={styles.actionPillTextLocked}>₹{cat.price}</Text>
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
          </Pressable>
        ))}
      </ScrollView>

      {/* How It Works Modal */}
      <Modal visible={howItWorksVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.infoModalCard}>
            <View style={styles.infoModalHeader}>
              <Text style={styles.infoModalTitle}>About Sectional Tests</Text>
              <Pressable onPress={() => setHowItWorksVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#1E1E1E" />
              </Pressable>
            </View>

            <View style={styles.infoStepRow}>
              <Text style={styles.infoStepIcon}>🎯</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoStepTitle}>Subject-wise Practice</Text>
                <Text style={styles.infoStepDesc}>
                  Focus on specific subjects like General Awareness, Maths, English and more.
                </Text>
              </View>
            </View>

            <View style={styles.infoStepRow}>
              <Text style={styles.infoStepIcon}>📊</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoStepTitle}>Track Your Weak Areas</Text>
                <Text style={styles.infoStepDesc}>
                  Identify which sections need more practice with instant score analysis after each test.
                </Text>
              </View>
            </View>

            <View style={styles.infoStepRow}>
              <Text style={styles.infoStepIcon}>🔥</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoStepTitle}>Build Daily Streak</Text>
                <Text style={styles.infoStepDesc}>
                  Attempt at least one test daily to keep your streak alive and stay consistent.
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
  },
  headerLogoWrap: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1E1E',
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
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#1E1E1E',
    marginHorizontal: 16,
    marginBottom: 12,
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
  progressTrack: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginTop: 6,
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
