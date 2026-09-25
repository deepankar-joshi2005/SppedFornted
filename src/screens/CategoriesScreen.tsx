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
import { DashboardCategory, getDashboard } from '../services/dashboard.service';
import { ERROR, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  nav: Nav;
};

export default function CategoriesScreen({ token, nav }: Props) {
  const [categories, setCategories] = useState<DashboardCategory[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (isRefresh?: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const data = await getDashboard(token);
        setCategories(data.categories);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load categories.');
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
        <Text style={styles.headerTitle}>All Categories</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={NAVY} />
        }
      >
        {loading && !categories && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={NAVY} size="large" />
          </View>
        )}

        {!!error && !categories && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {categories?.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="grid-outline" size={30} color={MUTED} />
            <Text style={styles.emptyText}>No categories available yet.</Text>
          </View>
        )}

        <View style={styles.grid}>
          {categories?.map((cat) => (
            <Pressable
              key={cat.name}
              style={styles.card}
              onPress={() => nav.push({ name: 'testList', category: cat.name })}
            >
              <View style={styles.iconCircle}>
                {cat.iconImage ? (
                  <Image
                    source={{ uri: resolveAssetUrl(cat.iconImage) }}
                    style={styles.iconImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="school-outline" size={24} color={NAVY} />
                )}
              </View>
              <Text style={styles.cardLabel} numberOfLines={2}>
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
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
  headerTitle: { fontSize: 16, fontWeight: '800', color: NAVY },
  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  errorBox: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FBEAE8',
  },
  errorText: { color: ERROR, fontSize: 13, textAlign: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 13, color: MUTED },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 24 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  card: {
    width: '23%',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDEBE4',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconImage: { width: '100%', height: '100%' },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: NAVY,
    textAlign: 'center',
  },
});
