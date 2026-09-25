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
import { getSectionalCategories, SectionalCategoryItem } from '../services/sectional.service';
import { ERROR, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  nav: Nav;
};

export default function SectionalCategoriesScreen({ token, nav }: Props) {
  const [categories, setCategories] = useState<SectionalCategoryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (isRefresh?: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const result = await getSectionalCategories(token);
        setCategories(result);
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

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle}>Sectional Tests</Text>
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
            <Ionicons name="apps-outline" size={30} color={MUTED} />
            <Text style={styles.emptyText}>No sectional tests available yet.</Text>
          </View>
        )}

        {categories?.map((cat) => (
          <Pressable
            key={cat.seriesId}
            style={styles.card}
            onPress={() => nav.push({ name: 'testList', seriesId: cat.seriesId })}
          >
            {cat.bannerImage ? (
              <Image
                source={{ uri: resolveAssetUrl(cat.bannerImage) }}
                style={styles.cardIconWrap}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.cardIconWrap}>
                <Ionicons name="apps-outline" size={20} color={NAVY} />
              </View>
            )}
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{cat.title}</Text>
              <Text style={styles.cardSubtitle}>
                {cat.totalTests} Test{cat.totalTests === 1 ? '' : 's'} • {cat.totalQuestions} Questions
              </Text>
            </View>
            {cat.isPaid && !cat.isPurchased ? (
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>₹{cat.price}</Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={16} color={MUTED} />
            )}
          </Pressable>
        ))}
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
  scrollContent: { paddingHorizontal: 18, paddingBottom: 24, gap: 10 },
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
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EDE7F6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 13.5, fontWeight: '800', color: NAVY },
  cardSubtitle: { fontSize: 12, color: MUTED, marginTop: 2 },
  priceBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  priceBadgeText: { fontSize: 12, fontWeight: '800', color: '#92400E' },
});
