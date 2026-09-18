import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationBell from '../components/NotificationBell';
import { Nav } from '../navigation/types';
import { getLeaderboard, LeaderboardEntry, LeaderboardResponse } from '../services/leaderboard.service';
import { CARD_SHADOW, ERROR, GOLD, MUTED, NAVY, SOFT_SHADOW } from '../theme/colors';

type Props = {
  token: string;
  testId: string;
  nav: Nav;
};

const PODIUM_COLORS = ['#F0C869', '#C7CBD1', '#D79A67'];

export default function LeaderboardScreen({ token, testId, nav }: Props) {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const result = await getLeaderboard(token, testId);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, testId]);

  const top3 = data?.top.slice(0, 3) ?? [];
  const rest = data?.top.slice(3) ?? [];
  const currentUserInTop = data?.top.some((e) => e.isCurrentUser) ?? false;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Leaderboard</Text>
          {!!data && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {data.testTitle}
            </Text>
          )}
        </View>
        <NotificationBell
          token={token}
          style={styles.iconBtn}
          onPress={() => nav.push({ name: 'notifications' })}
        />
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={NAVY} size="large" />
        </View>
      )}

      {!!error && !data && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {data && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {top3.length > 0 && (
            <View style={styles.podiumRow}>
              {[top3[1], top3[0], top3[2]].map((entry, slot) =>
                entry ? <PodiumCard key={entry.userId} entry={entry} color={PODIUM_COLORS[slot === 1 ? 0 : slot === 0 ? 1 : 2]} big={entry.rank === 1} /> : <View key={slot} style={styles.podiumSpacer} />
              )}
            </View>
          )}

          {rest.map((entry) => (
            <View
              key={entry.userId}
              style={[styles.row, entry.isCurrentUser && styles.rowHighlight]}
            >
              <Text style={styles.rowRank}>#{entry.rank}</Text>
              <View style={styles.rowAvatar}>
                <Text style={styles.rowAvatarText}>{entry.initials}</Text>
              </View>
              <Text style={styles.rowName} numberOfLines={1}>
                {entry.isCurrentUser ? `${entry.name} (You)` : entry.name}
              </Text>
              <Text style={styles.rowScore}>
                {entry.score}/{data.totalMarks} ({entry.scorePercent}%)
              </Text>
            </View>
          ))}

          {!currentUserInTop && data.currentUser && (
            <View style={[styles.row, styles.rowHighlight]}>
              <Text style={styles.rowRank}>#{data.currentUser.rank}</Text>
              <View style={styles.rowAvatar}>
                <Text style={styles.rowAvatarText}>{data.currentUser.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {data.currentUser.name} (You)
                </Text>
                <Text style={styles.percentileText}>
                  Percentile: {data.currentUser.percentile}%
                </Text>
              </View>
              <Text style={styles.rowScore}>
                {data.currentUser.score}/{data.totalMarks} ({data.currentUser.scorePercent}%)
              </Text>
            </View>
          )}

          {data.top.length === 0 && (
            <View style={styles.emptyBox}>
              <Ionicons name="trophy-outline" size={28} color={MUTED} />
              <Text style={styles.emptyText}>No completed attempts yet for this test.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function PodiumCard({ entry, color, big }: { entry: LeaderboardEntry; color: string; big: boolean }) {
  return (
    <View style={styles.podiumCard}>
      <View
        style={[
          styles.podiumAvatar,
          { backgroundColor: color, width: big ? 68 : 56, height: big ? 68 : 56, borderRadius: big ? 34 : 28 },
        ]}
      >
        <Text style={[styles.podiumAvatarText, big && { fontSize: 18 }]}>{entry.initials}</Text>
      </View>
      <Text style={styles.podiumName} numberOfLines={1}>
        {entry.name}
      </Text>
      <View style={[styles.podiumRankBadge, big && styles.podiumRankBadgeBig]}>
        <Text style={styles.podiumRankText}>#{entry.rank}</Text>
        <Text style={styles.podiumScoreText}>{entry.score}</Text>
      </View>
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
    paddingBottom: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: NAVY,
  },
  headerSubtitle: {
    fontSize: 11,
    color: MUTED,
    marginTop: 1,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FBEAE8',
  },
  errorText: {
    color: ERROR,
    fontSize: 13,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 14,
    marginTop: 10,
    marginBottom: 26,
  },
  podiumSpacer: {
    width: 70,
  },
  podiumCard: {
    alignItems: 'center',
    width: 92,
  },
  podiumAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  podiumAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: NAVY,
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '700',
    color: NAVY,
    marginTop: 6,
    textAlign: 'center',
  },
  podiumRankBadge: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    width: '100%',
    ...SOFT_SHADOW,
  },
  podiumRankBadgeBig: {
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  podiumRankText: {
    fontSize: 13,
    fontWeight: '800',
    color: NAVY,
  },
  podiumScoreText: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    ...SOFT_SHADOW,
  },
  rowHighlight: {
    borderWidth: 1.5,
    borderColor: NAVY,
    backgroundColor: '#EEF1F7',
    ...CARD_SHADOW,
  },
  rowRank: {
    fontSize: 13,
    fontWeight: '800',
    color: MUTED,
    width: 28,
  },
  rowAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEEDE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: NAVY,
  },
  rowName: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: NAVY,
  },
  percentileText: {
    fontSize: 11,
    color: GOLD,
    marginTop: 2,
  },
  rowScore: {
    fontSize: 12.5,
    fontWeight: '700',
    color: NAVY,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: MUTED,
  },
});
