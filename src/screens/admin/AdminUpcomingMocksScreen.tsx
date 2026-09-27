import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminNav } from '../../navigation/adminTypes';
import {
  AvailableTestItem,
  UpcomingMockItem,
  addUpcomingMock,
  deleteUpcomingMock,
  getAdminUpcomingMocks,
  getAvailableTests,
} from '../../services/admin/upcomingMock.service';
import { MUTED, NAVY, SOFT_SHADOW } from '../../theme/colors';

type Props = { token: string; nav: AdminNav };

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'No date set';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  }) + ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export default function AdminUpcomingMocksScreen({ token, nav }: Props) {
  const [tab, setTab] = useState<'current' | 'add'>('current');
  const [upcoming, setUpcoming] = useState<UpcomingMockItem[]>([]);
  const [available, setAvailable] = useState<AvailableTestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (isRefresh?: boolean) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [u, a] = await Promise.all([
        getAdminUpcomingMocks(token),
        getAvailableTests(token),
      ]);
      setUpcoming(u);
      setAvailable(a);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load');
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (testId: string) => {
    setAddingId(testId);
    try {
      await addUpcomingMock(token, testId);
      await load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add');
    } finally {
      setAddingId(null);
    }
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Remove from Upcoming',
      `Remove "${title}" from upcoming mocks?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(id);
            try {
              await deleteUpcomingMock(token, id);
              await load();
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => nav.pop()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle}>Upcoming Mocks</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabBtn, tab === 'current' && styles.tabBtnActive]}
          onPress={() => setTab('current')}
        >
          <Text style={[styles.tabText, tab === 'current' && styles.tabTextActive]}>
            Current ({upcoming.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, tab === 'add' && styles.tabBtnActive]}
          onPress={() => setTab('add')}
        >
          <Text style={[styles.tabText, tab === 'add' && styles.tabTextActive]}>
            Add Tests
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={NAVY} style={{ marginTop: 40 }} />
      ) : tab === 'current' ? (
        /* ── Current upcoming mocks ── */
        <FlatList
          data={upcoming}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={NAVY} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={40} color={MUTED} />
              <Text style={styles.emptyText}>No upcoming mocks yet.</Text>
              <Text style={styles.emptySubText}>Switch to "Add Tests" tab to add some.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{item.category || 'General'}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.testTitle}</Text>
                {!!item.seriesTitle && (
                  <Text style={styles.cardSeries}>{item.seriesTitle}</Text>
                )}
                <View style={styles.statsRow}>
                  <Ionicons name="help-circle-outline" size={13} color={MUTED} />
                  <Text style={styles.statText}>{item.totalQuestions} Qs</Text>
                  <Ionicons name="time-outline" size={13} color={MUTED} />
                  <Text style={styles.statText}>{item.durationMinutes} min</Text>
                  <Ionicons name="ribbon-outline" size={13} color={MUTED} />
                  <Text style={styles.statText}>{item.totalMarks} Marks</Text>
                </View>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar" size={13} color="#2563EB" />
                  <Text style={styles.dateText}>{formatDate(item.startDate)}</Text>
                </View>
              </View>
              <Pressable
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id, item.testTitle)}
                disabled={deletingId === item.id}
              >
                {deletingId === item.id ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                )}
              </Pressable>
            </View>
          )}
        />
      ) : (
        /* ── Add tests tab ── */
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={NAVY} />}
        >
          {available.length === 0 && (
            <View style={styles.emptyBox}>
              <Ionicons name="document-outline" size={40} color={MUTED} />
              <Text style={styles.emptyText}>No published tests found.</Text>
              <Text style={styles.emptySubText}>Publish a test first to add it here.</Text>
            </View>
          )}
          {available.map((item) => (
            <View style={[styles.card, item.alreadyAdded && styles.cardAdded]} key={item.id}>
              <View style={styles.cardLeft}>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{item.category || 'General'}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.testTitle}</Text>
                {!!item.seriesTitle && (
                  <Text style={styles.cardSeries}>{item.seriesTitle}</Text>
                )}
                <View style={styles.statsRow}>
                  <Ionicons name="help-circle-outline" size={13} color={MUTED} />
                  <Text style={styles.statText}>{item.totalQuestions} Qs</Text>
                  <Ionicons name="time-outline" size={13} color={MUTED} />
                  <Text style={styles.statText}>{item.durationMinutes} min</Text>
                </View>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={13} color={item.startDate ? '#2563EB' : '#EF4444'} />
                  <Text style={[styles.dateText, !item.startDate && { color: '#EF4444' }]}>
                    {item.startDate ? formatDate(item.startDate) : 'No start date — set in test settings'}
                  </Text>
                </View>
              </View>

              {item.alreadyAdded ? (
                <View style={styles.addedBadge}>
                  <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                  <Text style={styles.addedBadgeText}>Added</Text>
                </View>
              ) : (
                <Pressable
                  style={[styles.addBtn, !item.startDate && styles.addBtnDisabled]}
                  onPress={() => item.startDate && handleAdd(item.id)}
                  disabled={addingId === item.id || !item.startDate}
                >
                  {addingId === item.id ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="add" size={16} color="#FFF" />
                      <Text style={styles.addBtnText}>Add</Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: NAVY },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: NAVY },
  tabText: { fontSize: 13, fontWeight: '600', color: MUTED },
  tabTextActive: { color: NAVY, fontWeight: '800' },
  listContent: { padding: 16, gap: 12, paddingBottom: 32 },
  emptyBox: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyText: { fontSize: 14, fontWeight: '700', color: NAVY },
  emptySubText: { fontSize: 12, color: MUTED, textAlign: 'center' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    ...SOFT_SHADOW,
  },
  cardAdded: { opacity: 0.75 },
  cardLeft: { flex: 1, marginRight: 10 },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  categoryPillText: { fontSize: 10, fontWeight: '700', color: '#4F46E5' },
  cardTitle: { fontSize: 13.5, fontWeight: '800', color: NAVY, lineHeight: 19 },
  cardSeries: { fontSize: 11.5, color: MUTED, marginTop: 2 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  statText: { fontSize: 11.5, color: MUTED, marginRight: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  dateText: { fontSize: 11.5, color: '#2563EB', fontWeight: '600' },
  deleteBtn: { padding: 8 },
  addBtn: {
    backgroundColor: NAVY,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addBtnDisabled: { backgroundColor: '#CBD5E1' },
  addBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  addedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addedBadgeText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
});
