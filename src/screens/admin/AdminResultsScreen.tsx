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
import { AdminNav } from '../../navigation/adminTypes';
import { AdminTestListItem, listAllTests } from '../../services/admin/tests.service';
import { GOLD, MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  nav: AdminNav;
};

export default function AdminResultsScreen({ token, nav }: Props) {
  const [tests, setTests] = useState<AdminTestListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (isRefresh?: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const result = await listAllTests(token);
        setTests(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tests.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Results</Text>
        <Text style={styles.headerSubtitle}>Pick a test to view its leaderboard</Text>
      </View>

      <ScrollView
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

        {!!error && !tests && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => load()}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </Pressable>
          </View>
        )}

        {tests?.map((test) => (
          <Pressable
            key={test.id}
            style={styles.card}
            onPress={() => nav.push({ name: 'resultsForTest', testId: test.id, testTitle: test.title })}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="trophy-outline" size={18} color={NAVY} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.title}>{test.title}</Text>
              <Text style={styles.meta}>
                {test.seriesTitle} • {test.totalQuestions} Questions
              </Text>
            </View>
            <View style={styles.attemptsCol}>
              <Text style={styles.attemptsValue}>{test.attemptCount}</Text>
              <Text style={styles.attemptsLabel}>Attempts</Text>
            </View>
          </Pressable>
        ))}

        {tests && tests.length === 0 && <Text style={styles.emptyText}>No tests created yet.</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  headerRow: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 6 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: NAVY },
  headerSubtitle: { fontSize: 12, color: MUTED, marginTop: 2 },
  scrollContent: { padding: 18, paddingBottom: 30, gap: 12 },
  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  errorBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FBEAE8',
    alignItems: 'center',
  },
  errorText: { color: '#C0392B', fontSize: 13, textAlign: 'center' },
  retryText: { marginTop: 8, color: NAVY, fontWeight: '700', fontSize: 12.5 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EEF1F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  title: { fontSize: 13.5, fontWeight: '800', color: NAVY },
  meta: { fontSize: 11.5, color: MUTED, marginTop: 3 },
  attemptsCol: { alignItems: 'flex-end' },
  attemptsValue: { fontSize: 16, fontWeight: '800', color: GOLD },
  attemptsLabel: { fontSize: 10, color: MUTED },
  emptyText: { textAlign: 'center', color: MUTED, marginTop: 30 },
});
