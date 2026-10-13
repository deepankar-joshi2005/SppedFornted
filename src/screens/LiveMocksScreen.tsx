import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Nav } from '../navigation/types';
import { getLiveMocks, LiveMockItem } from '../services/dashboard.service';
import { MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  nav: Nav;
};

export default function LiveMocksScreen({ token, nav }: Props) {
  const [tests, setTests] = useState<LiveMockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (isRefresh?: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const result = await getLiveMocks(token);
        setTests(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load live tests.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token]
  );

  // Fresh fetch every time the screen is opened — no caching between sessions
  useEffect(() => {
    load();
  }, [load]);

  const handleStart = (testId: string) => {
    nav.push({ name: 'testInstructions', testId });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#1E1E1E" />
        </Pressable>

        {/* Live icon badge */}
        <View style={styles.headerIconWrap}>
          <Ionicons name="radio" size={18} color="#FFFFFF" />
        </View>

        <Text style={styles.headerTitle}>Live Tests</Text>

        {/* Red pulsing LIVE indicator in header — only when tests are present */}
        {tests.length > 0 && (
          <View style={styles.headerLiveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.headerLiveBadgeText}>LIVE</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={NAVY}
          />
        }
      >
        {/* Loading state */}
        {loading && (
          <View style={styles.centeredBox}>
            <ActivityIndicator color={NAVY} size="large" />
          </View>
        )}

        {/* Error state */}
        {!!error && !loading && (
          <View style={styles.centeredBox}>
            <Ionicons name="cloud-offline-outline" size={40} color="#94A3B8" />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={() => load()}>
              <Text style={styles.retryBtnText}>Tap to retry</Text>
            </Pressable>
          </View>
        )}

        {/* Empty state */}
        {!loading && !error && tests.length === 0 && (
          <View style={styles.centeredBox}>
            <Ionicons name="timer-outline" size={52} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No tests are Live now</Text>
            <Text style={styles.emptySubtitle}>
              Check back later or watch the Live Mocks section on the home screen for upcoming tests.
            </Text>
          </View>
        )}

        {/* Test cards */}
        {!loading &&
          !error &&
          tests.map((test) => {
            const catStr = test.category.toLowerCase();
            return (
              <Pressable
                key={test.id}
                style={styles.card}
                onPress={() => handleStart(test.id)}
                accessibilityRole="button"
                accessibilityLabel={`Start ${test.title}`}
              >
                {/* Left icon badge */}
                <View style={styles.cardIconBadge}>
                  {catStr.includes('agniveer') ||
                  catStr.includes('defence') ||
                  catStr.includes('army') ? (
                    <Ionicons name="shield" size={24} color="#1E1E1E" />
                  ) : catStr.includes('railway') || catStr.includes('rrb') ? (
                    <Ionicons name="train" size={24} color="#1E1E1E" />
                  ) : catStr.includes('bank') || catStr.includes('po') ? (
                    <Ionicons name="business" size={24} color="#1E1E1E" />
                  ) : catStr.includes('police') || catStr.includes('si') ? (
                    <Ionicons name="shield-checkmark" size={24} color="#1E1E1E" />
                  ) : catStr.includes('ssc') || catStr.includes('cgl') ? (
                    <Ionicons name="school" size={24} color="#1E1E1E" />
                  ) : (
                    <Ionicons name="ribbon" size={24} color="#1E1E1E" />
                  )}
                </View>

                {/* Middle: title + meta */}
                <View style={styles.cardMiddle}>
                  {/* Title row with LIVE badge */}
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {test.title}
                    </Text>
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveBadgeText}>LIVE</Text>
                    </View>
                  </View>

                  {/* Series / badge text sub-pill */}
                  <View style={styles.subPill}>
                    <Text style={styles.subPillText} numberOfLines={1}>
                      • {test.badgeText}
                      {test.liveTimeLabel ? ` · ${test.liveTimeLabel}` : ''}
                    </Text>
                  </View>

                  {/* Stats row */}
                  <Text style={styles.cardMeta}>
                    {test.totalQuestions} Ques • {test.durationMinutes} mins • {test.totalMarks} Marks
                  </Text>
                </View>

                {/* Right: Start pill */}
                <View style={styles.cardRight}>
                  <View style={styles.startPill}>
                    <Text style={styles.startPillText}>Start</Text>
                    <Ionicons name="chevron-forward" size={13} color="#1E1E1E" />
                  </View>
                </View>
              </Pressable>
            );
          })}
      </ScrollView>
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
    gap: 8,
    backgroundColor: '#FAF6F0',
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  headerLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  headerLiveBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 36,
    flexGrow: 1,
  },
  centeredBox: {
    flex: 1,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 13.5,
    color: '#C0392B',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 4,
    backgroundColor: NAVY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1E1E',
    textAlign: 'center',
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 19,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#1E1E1E',
    marginBottom: 12,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  cardMiddle: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  subPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  subPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  cardMeta: {
    fontSize: 11.5,
    color: '#78716C',
    marginTop: 1,
  },
  cardRight: {
    marginLeft: 8,
  },
  startPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.2,
    borderColor: '#1E1E1E',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  startPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E1E1E',
  },
});
