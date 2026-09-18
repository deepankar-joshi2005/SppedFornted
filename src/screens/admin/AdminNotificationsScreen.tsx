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
import AdminHeader from '../../components/admin/AdminHeader';
import { AdminNav } from '../../navigation/adminTypes';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationItem,
} from '../../services/notifications.service';
import { ERROR, GOLD, MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  nav: AdminNav;
};

const timeAgo = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function AdminNotificationsScreen({ token, nav }: Props) {
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (isRefresh?: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const result = await getNotifications(token);
        setItems(result.notifications);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notifications.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleTap = async (item: NotificationItem) => {
    if (item.isRead) return;
    setItems((prev) =>
      prev ? prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)) : prev
    );
    try {
      await markNotificationRead(token, item.id);
    } catch {
      // best-effort; local state already updated
    }
  };

  const handleMarkAll = async () => {
    setItems((prev) => (prev ? prev.map((n) => ({ ...n, isRead: true })) : prev));
    try {
      await markAllNotificationsRead(token);
    } catch {
      // best-effort
    }
  };

  const unreadCount = items?.filter((n) => !n.isRead).length ?? 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <AdminHeader
        title="Notifications"
        onBack={() => nav.pop()}
        right={
          <Pressable onPress={handleMarkAll} hitSlop={8} disabled={!unreadCount}>
            <Text style={[styles.markAllText, !unreadCount && styles.markAllTextDisabled]}>
              Mark all
            </Text>
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={NAVY} />
        }
      >
        {loading && !items && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={NAVY} size="large" />
          </View>
        )}

        {!!error && !items && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {items?.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="notifications-off-outline" size={30} color={MUTED} />
            <Text style={styles.emptyText}>No notifications yet.</Text>
          </View>
        )}

        {items?.map((item) => (
          <Pressable
            key={item.id}
            style={[styles.card, !item.isRead && styles.cardUnread]}
            onPress={() => handleTap(item)}
          >
            <View style={styles.cardIconWrap}>
              <Ionicons name="person-add-outline" size={18} color={GOLD} />
            </View>
            <View style={styles.cardBody}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {!item.isRead && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.cardMessage}>{item.message}</Text>
              <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  markAllText: { fontSize: 12.5, fontWeight: '700', color: GOLD },
  markAllTextDisabled: { color: '#C7C4BA' },
  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  errorBox: { margin: 20, padding: 16, borderRadius: 12, backgroundColor: '#FBEAE8' },
  errorText: { color: ERROR, fontSize: 13, textAlign: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 13, color: MUTED },
  scrollContent: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 24, gap: 10 },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  cardUnread: { backgroundColor: '#FBF7EC', borderColor: '#F0DFAE' },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FDF1DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 13.5, fontWeight: '800', color: NAVY },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: GOLD },
  cardMessage: { fontSize: 12.5, color: '#334155', marginTop: 4, lineHeight: 18 },
  cardTime: { fontSize: 10.5, color: MUTED, marginTop: 6 },
});
