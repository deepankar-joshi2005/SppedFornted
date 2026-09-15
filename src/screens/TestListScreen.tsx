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
import { resolveAssetUrl } from '../config/api';
import { Nav } from '../navigation/types';
import { startAttempt } from '../services/attempts.service';
import { getTestsByCategory, TestListItem } from '../services/tests.service';
import { ERROR, GOLD, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  category: string;
  nav: Nav;
};

type Filter = 'All' | 'New' | 'Attempted' | 'Completed';
const FILTERS: Filter[] = ['All', 'New', 'Attempted', 'Completed'];

const filterMatches = (filter: Filter, status: TestListItem['status']): boolean => {
  if (filter === 'All') return true;
  if (filter === 'New') return status === 'not-attempted';
  if (filter === 'Attempted') return status === 'in-progress';
  return status === 'completed';
};

export default function TestListScreen({ token, category, nav }: Props) {
  const [seriesTitle, setSeriesTitle] = useState('');
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [tests, setTests] = useState<TestListItem[] | null>(null);
  const [filter, setFilter] = useState<Filter>('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [startingId, setStartingId] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh?: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const result = await getTestsByCategory(token, category);
        setSeriesTitle(result.seriesTitle);
        setBannerImage(result.bannerImage);
        setTests(result.tests);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tests.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token, category]
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleStartOrResume = async (test: TestListItem) => {
    if (test.status === 'in-progress' && test.attemptId) {
      nav.push({ name: 'testTaking', attemptId: test.attemptId, testId: test.id });
      return;
    }
    setStartingId(test.id);
    try {
      const result = await startAttempt(token, test.id);
      nav.push({ name: 'testTaking', attemptId: result.attemptId, testId: test.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start test.');
    } finally {
      setStartingId(null);
    }
  };

  const handleViewResult = (test: TestListItem) => {
    if (test.attemptId) nav.push({ name: 'testResult', attemptId: test.attemptId });
  };

  const filteredTests = tests?.filter((t) => filterMatches(filter, t.status)) ?? [];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {seriesTitle || `${category} Mock Tests`}
        </Text>
        <Pressable
          style={styles.iconBtn}
          hitSlop={8}
          onPress={() => nav.push({ name: 'notifications' })}
        >
          <Ionicons name="notifications-outline" size={20} color={NAVY} />
        </Pressable>
      </View>

      {!!bannerImage?.trim() && (
        <Image
          source={{ uri: resolveAssetUrl(bannerImage) }}
          style={styles.banner}
          resizeMode="cover"
        />
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            style={[styles.filterPill, filter === f && styles.filterPillActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={NAVY} />
        }
      >
        {loading && !tests && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={NAVY} size="large" />
          </View>
        )}

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {filteredTests.map((test) => (
          <View style={styles.card} key={test.id}>
            <View style={styles.cardTopRow}>
              <Text style={styles.cardTitle}>{test.title}</Text>
              <StatusBadge status={test.status} />
            </View>
            <Text style={styles.metaText}>
              {test.totalQuestions} Questions • {test.durationMinutes} Minutes •{' '}
              {test.totalMarks} Marks
            </Text>
            <View style={styles.divider} />
            <View style={styles.cardBottomRow}>
              <Text style={styles.difficultyText}>
                Difficulty: <Text style={styles.difficultyValue}>{test.difficulty}</Text>
              </Text>
              {test.status === 'completed' ? (
                <View style={styles.completedActions}>
                  <Text style={styles.scoreText}>
                    Score: {test.score}/{test.totalMarks}
                  </Text>
                  <View style={styles.completedBtnRow}>
                    <Pressable style={styles.outlineBtn} onPress={() => handleViewResult(test)}>
                      <Text style={styles.outlineBtnText}>View Result</Text>
                    </Pressable>
                    {test.canReattempt && (
                      <Pressable
                        style={styles.primaryBtnSmall}
                        onPress={() => handleStartOrResume(test)}
                        disabled={startingId === test.id}
                      >
                        {startingId === test.id ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Text style={styles.primaryBtnSmallText}>Reattempt</Text>
                        )}
                      </Pressable>
                    )}
                  </View>
                </View>
              ) : (
                <Pressable
                  style={styles.primaryBtn}
                  onPress={() => handleStartOrResume(test)}
                  disabled={startingId === test.id}
                >
                  {startingId === test.id ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      {test.status === 'in-progress' ? 'Resume Test' : 'Start Test'}
                    </Text>
                  )}
                </Pressable>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusBadge({ status }: { status: TestListItem['status'] }) {
  if (status === 'completed') {
    return (
      <View style={[styles.badge, styles.badgeCompleted]}>
        <Text style={[styles.badgeText, styles.badgeTextCompleted]}>Attempted</Text>
      </View>
    );
  }
  if (status === 'in-progress') {
    return (
      <View style={[styles.badge, styles.badgeProgress]}>
        <Text style={[styles.badgeText, styles.badgeTextProgress]}>In Progress</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, styles.badgeNew]}>
      <Text style={[styles.badgeText, styles.badgeTextNew]}>Not Attempted</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F4EF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
  },
  banner: {
    width: '100%',
    height: 130,
    marginBottom: 12,
    backgroundColor: '#EEF1F7',
  },
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
    height: 52,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  filterPillActive: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  filterText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: NAVY,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 14,
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
    color: ERROR,
    fontSize: 13,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: NAVY,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeNew: { backgroundColor: '#FDF1DC' },
  badgeProgress: { backgroundColor: '#E9F0FB' },
  badgeCompleted: { backgroundColor: '#E4F5EA' },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  badgeTextNew: { color: '#B4790C' },
  badgeTextProgress: { color: NAVY },
  badgeTextCompleted: { color: '#2E9E5B' },
  metaText: {
    fontSize: 12,
    color: MUTED,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#EDEBE4',
    marginTop: 12,
    marginBottom: 12,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 12.5,
    color: MUTED,
  },
  difficultyValue: {
    fontWeight: '700',
    color: NAVY,
  },
  primaryBtn: {
    backgroundColor: NAVY,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 9,
    minWidth: 96,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },
  completedActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: NAVY,
  },
  completedBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  outlineBtn: {
    borderWidth: 1.3,
    borderColor: NAVY,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  outlineBtnText: {
    color: NAVY,
    fontWeight: '700',
    fontSize: 12,
  },
  primaryBtnSmall: {
    backgroundColor: GOLD,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
    minWidth: 84,
    alignItems: 'center',
  },
  primaryBtnSmallText: {
    color: NAVY,
    fontWeight: '700',
    fontSize: 12,
  },
});
