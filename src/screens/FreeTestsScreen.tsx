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
import { FreeTestItem, getFreeTests } from '../services/tests.service';
import { ERROR, GOLD_TINT, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  nav: Nav;
};

export default function FreeTestsScreen({ token, nav }: Props) {
  const [tests, setTests] = useState<FreeTestItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (isRefresh?: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const result = await getFreeTests(token);
        setTests(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load free tests.');
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
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle}>Free Tests</Text>
        <View style={styles.iconBtn} />
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
          </View>
        )}

        {tests?.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="flash-outline" size={30} color={MUTED} />
            <Text style={styles.emptyText}>No free tests available right now.</Text>
          </View>
        )}

        {tests?.map((item) => (
          <Pressable
            key={item.id}
            style={styles.card}
            onPress={() => nav.push({ name: 'testInstructions', testId: item.id })}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{item.category}</Text>
              </View>
              <View style={styles.freePill}>
                <Text style={styles.freePillText}>FREE</Text>
              </View>
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.cardSeries}>{item.seriesTitle}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="help-circle-outline" size={14} color={MUTED} />
                <Text style={styles.statText}>{item.totalQuestions} Qs</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={14} color={MUTED} />
                <Text style={styles.statText}>{item.durationMinutes} min</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="trophy-outline" size={14} color={MUTED} />
                <Text style={styles.statText}>{item.totalMarks} marks</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
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
    minWidth: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
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
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: MUTED,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    gap: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: GOLD_TINT,
  },
  categoryPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: NAVY,
  },
  freePill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: '#E0F7E9',
  },
  freePillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#2E7D32',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: NAVY,
    marginTop: 2,
  },
  cardSeries: {
    fontSize: 11.5,
    color: MUTED,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11.5,
    color: MUTED,
  },
});
