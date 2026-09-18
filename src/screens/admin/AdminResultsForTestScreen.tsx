import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminHeader from '../../components/admin/AdminHeader';
import { AdminNav } from '../../navigation/adminTypes';
import { getLeaderboard, LeaderboardResponse } from '../../services/leaderboard.service';
import { GOLD, MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  testId: string;
  testTitle: string;
  nav: AdminNav;
};

export default function AdminResultsForTestScreen({ token, testId, testTitle, nav }: Props) {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getLeaderboard(token, testId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard.');
    } finally {
      setLoading(false);
    }
  }, [token, testId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <AdminHeader title={testTitle} subtitle="Leaderboard" onBack={() => nav.pop()} />

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={NAVY} size="large" />
        </View>
      )}

      {!!error && !data && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={load}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </Pressable>
        </View>
      )}

      {data && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {data.top.length === 0 && (
            <Text style={styles.emptyText}>No completed attempts yet for this test.</Text>
          )}
          {data.top.map((entry) => (
            <View key={entry.userId} style={styles.card}>
              <View style={styles.rankWrap}>
                <Text style={styles.rank}>#{entry.rank}</Text>
              </View>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{entry.initials}</Text>
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.name}>{entry.name}</Text>
                <Text style={styles.meta}>Score: {entry.score}</Text>
              </View>
              <Text style={styles.percent}>{entry.scorePercent}%</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  loadingBox: { paddingVertical: 60, alignItems: 'center' },
  errorBox: { margin: 18, padding: 16, borderRadius: 12, backgroundColor: '#FBEAE8', alignItems: 'center' },
  errorText: { color: '#C0392B', fontSize: 13, textAlign: 'center' },
  retryText: { marginTop: 8, color: NAVY, fontWeight: '700', fontSize: 12.5 },
  scrollContent: { padding: 18, paddingBottom: 40, gap: 10 },
  emptyText: { fontSize: 12.5, color: MUTED, textAlign: 'center', marginTop: 30 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    gap: 10,
  },
  rankWrap: { width: 28, alignItems: 'center' },
  rank: { fontSize: 13, fontWeight: '800', color: GOLD },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF1F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 11, fontWeight: '800', color: NAVY },
  textWrap: { flex: 1 },
  name: { fontSize: 13, fontWeight: '700', color: NAVY },
  meta: { fontSize: 11, color: MUTED, marginTop: 2 },
  percent: { fontSize: 15, fontWeight: '800', color: NAVY },
});
