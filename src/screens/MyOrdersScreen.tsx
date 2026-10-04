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
import { getMyOrders, MyOrderItem } from '../services/purchases.service';
import { ERROR, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  nav: Nav;
};

export default function MyOrdersScreen({ token, nav }: Props) {
  const [orders, setOrders] = useState<MyOrderItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (isRefresh?: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const result = await getMyOrders(token);
        setOrders(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load your orders.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load();
  }, [load]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={NAVY} />
        }
      >
        {loading && !orders && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={NAVY} size="large" />
          </View>
        )}

        {!!error && !orders && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {orders?.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="receipt-outline" size={32} color={MUTED} />
            <Text style={styles.emptyText}>You haven't purchased any test series yet.</Text>
          </View>
        )}

        {orders?.map((order) => (
          <Pressable
            key={order.purchaseId}
            style={styles.card}
            onPress={() =>
              nav.push({
                name: 'testList',
                testSeriesId: order.seriesId,
                seriesIcon: order.bannerImage ? resolveAssetUrl(order.bannerImage) : undefined,
              })
            }
          >
            <View style={styles.cardLogoBadge}>
              {order.bannerImage ? (
                <Image
                  source={{ uri: resolveAssetUrl(order.bannerImage) }}
                  style={styles.cardLogoImg}
                  resizeMode="contain"
                />
              ) : (
                <Ionicons name="document-text" size={22} color={NAVY} />
              )}
            </View>

            <View style={styles.cardMiddleContent}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {order.title}
              </Text>
              <Text style={styles.cardSubText}>
                {order.category} • Purchased {formatDate(order.purchasedAt)}
              </Text>
            </View>

            <View style={styles.cardRight}>
              <Text style={styles.priceText}>₹{order.amountPaid}</Text>
              <Ionicons name="chevron-forward" size={18} color={MUTED} />
            </View>
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
  scrollContent: { paddingHorizontal: 18, paddingBottom: 24, paddingTop: 8 },
  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  errorBox: {
    margin: 4,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FBEAE8',
  },
  errorText: { color: ERROR, fontSize: 13, textAlign: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 13, color: MUTED, textAlign: 'center', paddingHorizontal: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 13,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  cardLogoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    overflow: 'hidden',
  },
  cardLogoImg: { width: 32, height: 32, borderRadius: 16 },
  cardMiddleContent: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: NAVY },
  cardSubText: { fontSize: 11.5, color: MUTED, marginTop: 3 },
  cardRight: { alignItems: 'flex-end', gap: 2 },
  priceText: { fontSize: 14, fontWeight: '800', color: '#2E9E5B' },
});
