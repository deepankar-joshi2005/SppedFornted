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
import { Nav } from '../navigation/types';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationItem,
} from '../services/notifications.service';
import { ERROR, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  nav: Nav;
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

export default function NotificationsScreen({ token, nav }: Props) {
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
    if (!item.isRead) {
      setItems((prev) =>
        prev ? prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)) : prev
      );
      try {
        await markNotificationRead(token, item.id);
      } catch {
        // best-effort; local state already updated
      }
    }

    // Case A: Solution Review / Answer Key / Result related
    if (
      item.targetScreen === 'solutionReview' ||
      item.attemptId ||
      item.type === 'result' ||
      item.title.toLowerCase().includes('completed') ||
      item.title.toLowerCase().includes('submitted') ||
      item.message.toLowerCase().includes('answer key')
    ) {
      if (item.attemptId) {
        nav.push({ name: 'solutionReview', attemptId: item.attemptId });
        return;
      }
      if (item.testId) {
        nav.push({ name: 'testInstructions', testId: item.testId });
        return;
      }
      nav.resetToTab('results');
      return;
    }

    // Case B: New Test Added / Start Test related
    if (
      item.targetScreen === 'testInstructions' ||
      item.testId ||
      item.title.toLowerCase().includes('test added')
    ) {
      if (item.testId) {
        nav.push({ name: 'testInstructions', testId: item.testId });
        return;
      }
      if (item.category) {
        nav.push({ name: 'testList', category: item.category });
        return;
      }
      nav.resetToTab('tests');
      return;
    }

    // Case B2: New Previous Year Paper Added
    if (item.targetScreen === 'pyq' || item.title.toLowerCase().includes('paper')) {
      nav.push({ name: 'pypsCategories' });
      return;
    }

    // Case B3: New E-Book Added
    if (
      item.targetScreen === 'ebooks' ||
      item.title.toLowerCase().includes('e-book') ||
      item.title.toLowerCase().includes('ebook')
    ) {
      nav.push({ name: 'ebooks' });
      return;
    }

    // Case C: New Test Series Added
    if (
      item.targetScreen === 'testList' ||
      item.category ||
      item.title.toLowerCase().includes('series')
    ) {
      if (item.category) {
        nav.push({ name: 'testList', category: item.category });
        return;
      }
      nav.resetToTab('tests');
      return;
    }
  };

  const getActionLabel = (item: NotificationItem): string => {
    if (
      item.targetScreen === 'solutionReview' ||
      item.attemptId ||
      item.type === 'result' ||
      item.title.toLowerCase().includes('completed') ||
      item.title.toLowerCase().includes('submitted')
    ) {
      return 'View Solution ›';
    }
    if (
      item.targetScreen === 'testInstructions' ||
      item.testId ||
      item.title.toLowerCase().includes('test added')
    ) {
      return 'Start Test ›';
    }
    if (item.targetScreen === 'pyq' || item.title.toLowerCase().includes('paper')) {
      return 'View Papers ›';
    }
    if (
      item.targetScreen === 'ebooks' ||
      item.title.toLowerCase().includes('e-book') ||
      item.title.toLowerCase().includes('ebook')
    ) {
      return 'View E-Book ›';
    }
    return 'View Series ›';
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
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#101F42" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable style={styles.iconBtn} onPress={handleMarkAll} hitSlop={8} disabled={!unreadCount}>
          <Text style={[styles.markAllText, !unreadCount && styles.markAllTextDisabled]}>
            Mark all
          </Text>
        </Pressable>
      </View>

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
            <Ionicons name="notifications-off-outline" size={36} color={MUTED} />
            <Text style={styles.emptyText}>No notifications yet.</Text>
          </View>
        )}

        {items?.map((item) => {
          const actionLabel = getActionLabel(item);
          return (
            <Pressable
              key={item.id}
              style={styles.card}
              onPress={() => handleTap(item)}
            >
              <View style={styles.cardTopSection}>
                {/* Megaphone icon badge exactly as in screenshot */}
                <Image
                  source={require('../../assets/notification-badge.png')}
                  style={styles.badgeImage}
                  resizeMode="contain"
                />

                <View style={styles.cardBody}>
                  <View style={styles.cardTitleRow}>
                    <View style={styles.titleWithBadge}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.glowDot}>🟡</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#1E293B" style={styles.chevron} />
                  </View>

                  <Text style={styles.cardMessage}>{item.message}</Text>
                </View>
              </View>

              <View style={styles.cardBottomRow}>
                <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
                <Pressable onPress={() => handleTap(item)} hitSlop={6}>
                  <Text style={styles.actionText}>{actionLabel}</Text>
                </Pressable>
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
    backgroundColor: '#EEF2F6',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#EEF2F6',
  },
  iconBtn: {
    minWidth: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#101F42',
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },
  markAllTextDisabled: {
    color: '#A0AEC0',
  },
  loadingBox: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  errorBox: {
    margin: 20,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FBEAE8',
  },
  errorText: {
    color: ERROR,
    fontSize: 13,
    textAlign: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 70,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: MUTED,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  badgeImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginTop: 2,
  },
  cardBody: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 6,
    gap: 5,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#101F42',
    letterSpacing: -0.2,
  },
  glowDot: {
    fontSize: 11,
  },
  chevron: {
    marginLeft: 4,
  },
  cardMessage: {
    fontSize: 12.8,
    color: '#475569',
    marginTop: 3,
    lineHeight: 18,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardTime: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  actionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#D97706',
    textDecorationLine: 'underline',
  },
});
