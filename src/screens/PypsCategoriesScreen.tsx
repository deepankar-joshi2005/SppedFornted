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
import { resolveAssetUrl } from '../config/api';
import { Nav } from '../navigation/types';
import { getPyqs, PyqItem } from '../services/pyq.service';
import { getStreakDays } from '../services/dashboard.service';
import { ERROR, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  nav: Nav;
};

type CategoryGroup = {
  category: string;
  categoryIcon?: string | null;
  paperCount: number;
};

export default function PypsCategoriesScreen({ token, nav }: Props) {
  const [papers, setPapers] = useState<PyqItem[] | null>(null);
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
          getPyqs(token),
          getStreakDays(token),
        ]);
        setPapers(result);
        setStreakDays(streak);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load papers.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load();
  }, [load]);

  const categories: CategoryGroup[] = [];
  if (papers) {
    const counts = new Map<string, { count: number; icon?: string | null }>();
    for (const p of papers) {
      const existing = counts.get(p.category);
      counts.set(p.category, {
        count: (existing?.count ?? 0) + 1,
        icon: p.categoryIcon || existing?.icon || null,
      });
    }
    for (const [category, data] of counts) {
      categories.push({ category, paperCount: data.count, categoryIcon: data.icon });
    }
    categories.sort((a, b) => a.category.localeCompare(b.category));
  }

  const totalPapersCount = papers?.length || 0;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#1E1E1E" />
        </Pressable>

        <View style={styles.headerLogoWrap}>
          <Ionicons name="document-text" size={18} color="#FDE68A" />
        </View>

        <Text style={styles.headerTitle}>Previous Year Papers</Text>
        <View style={styles.iconBtn} />
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
            <Text style={styles.statEmoji}>📚</Text>
            <Text style={styles.statValue}>{categories.length}</Text>
            <Text style={styles.statLabel}>categories</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statEmoji}>🎯</Text>
            <Text style={styles.statValue}>{totalPapersCount}</Text>
            <Text style={styles.statLabel}>total papers</Text>
          </View>
        </View>

        {/* Section Header Row */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWrap}>
            <Text style={styles.sectionTitle}>Exam Categories</Text>
            <Text style={styles.sectionCount}>{categories.length}</Text>
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

        {loading && !papers && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={NAVY} size="large" />
          </View>
        )}

        {!!error && !papers && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {papers && categories.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="document-text-outline" size={30} color={MUTED} />
            <Text style={styles.emptyText}>No papers available yet.</Text>
          </View>
        )}

        {/* Category Cards */}
        {categories.map((cat) => (
          <Pressable
            key={cat.category}
            style={styles.card}
            onPress={() => nav.push({ name: 'pypsExams', category: cat.category })}
          >
            {/* Left Badge: Category Logo Image */}
            <View style={styles.cardLogoBadge}>
              {cat.categoryIcon ? (
                <Image
                  source={{ uri: resolveAssetUrl(cat.categoryIcon) }}
                  style={styles.cardLogoImg}
                  resizeMode="contain"
                />
              ) : (
                <Ionicons name="school-outline" size={24} color={NAVY} />
              )}
            </View>

            {/* Middle Info Column */}
            <View style={styles.cardMiddleContent}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {cat.category}
              </Text>
              <Text style={styles.cardSubText}>
                {cat.paperCount} paper{cat.paperCount === 1 ? '' : 's'} available
              </Text>
            </View>

            {/* Right Action Button Pill */}
            <View style={styles.cardRightAction}>
              <View style={[styles.actionPill, styles.actionPillOpen]}>
                <Text style={styles.actionPillTextOpen}>Explore</Text>
                <Ionicons name="chevron-down" size={14} color="#1E1E1E" />
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
              <Text style={styles.infoModalTitle}>About PYQ Papers</Text>
              <Pressable onPress={() => setHowItWorksVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#1E1E1E" />
              </Pressable>
            </View>

            <View style={styles.infoStepRow}>
              <Text style={styles.infoStepIcon}>📑</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoStepTitle}>Category Selection</Text>
                <Text style={styles.infoStepDesc}>
                  Select your exam category to browse previous year question papers sorted by exam type and year.
                </Text>
              </View>
            </View>

            <View style={styles.infoStepRow}>
              <Text style={styles.infoStepIcon}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoStepTitle}>PDF Reader</Text>
                <Text style={styles.infoStepDesc}>
                  Open, view and study high quality PDF question papers with answer keys.
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
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 10,
    backgroundColor: '#FAF6F0',
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1E1E',
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
