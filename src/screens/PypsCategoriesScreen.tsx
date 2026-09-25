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
import { getPyqs, PyqItem } from '../services/pyq.service';
import { ERROR, GOLD_TINT, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  nav: Nav;
};

type CategoryGroup = {
  category: string;
  paperCount: number;
};

export default function PypsCategoriesScreen({ token, nav }: Props) {
  const [papers, setPapers] = useState<PyqItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (isRefresh?: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const result = await getPyqs(token);
        setPapers(result);
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
    const counts = new Map<string, number>();
    for (const p of papers) {
      counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    }
    for (const [category, paperCount] of counts) {
      categories.push({ category, paperCount });
    }
    categories.sort((a, b) => a.category.localeCompare(b.category));
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle}>Previous Year Papers</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={NAVY} />
        }
      >
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

        {categories.map((cat) => (
          <Pressable
            key={cat.category}
            style={styles.card}
            onPress={() => nav.push({ name: 'pypsExams', category: cat.category })}
          >
            <View style={styles.cardIconWrap}>
              <Ionicons name="document-text-outline" size={18} color={NAVY} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{cat.category}</Text>
              <Text style={styles.cardSubtitle}>
                {cat.paperCount} paper{cat.paperCount === 1 ? '' : 's'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={MUTED} />
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
  freeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 18,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: GOLD_TINT,
  },
  freeBannerText: {
    fontSize: 12.5,
    fontWeight: '700',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FCE4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: NAVY,
  },
  cardSubtitle: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
});
