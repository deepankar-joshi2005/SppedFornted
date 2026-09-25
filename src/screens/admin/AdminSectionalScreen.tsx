import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminHeader from '../../components/admin/AdminHeader';
import FilterPillTabs from '../../components/admin/FilterPillTabs';
import { AdminNav } from '../../navigation/adminTypes';
import {
  AdminSeriesCounts,
  AdminSeriesListItem,
  deleteSeries,
  listSeries,
  SeriesStatus,
} from '../../services/admin/series.service';
import { ERROR, GOLD, MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  nav: AdminNav;
};

type FilterKey = 'all' | SeriesStatus;

export default function AdminSectionalScreen({ token, nav }: Props) {
  const [series, setSeries] = useState<AdminSeriesListItem[] | null>(null);
  const [counts, setCounts] = useState<AdminSeriesCounts | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (isRefresh?: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const result = await listSeries(token, {
          kind: 'sectional',
          status: filter === 'all' ? undefined : filter,
          search: search || undefined,
        });
        setSeries(result.series);
        setCounts(result.counts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sectional tests.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token, filter, search]
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = (item: AdminSeriesListItem) => {
    const risky = item.status === 'published' && item.studentCount > 0;
    const message = risky
      ? `"${item.title}" is PUBLISHED and ${item.studentCount} student(s) have already attempted tests in it. Deleting will permanently erase their attempt history too, along with all tests and questions. This cannot be undone.`
      : `Delete "${item.title}"? This will permanently remove it along with all its tests and questions. This cannot be undone.`;

    Alert.alert(risky ? 'Students have attempted this!' : 'Delete Sectional Category', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: risky ? 'Delete Anyway' : 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSeries(token, item.id);
            load(true);
          } catch (err) {
            Alert.alert('Failed to delete', err instanceof Error ? err.message : '');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <AdminHeader
        title="Sectional Tests"
        subtitle="Subject-wise practice categories (Math, English...)"
        onBack={() => nav.pop()}
      />

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={MUTED} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search sectional categories..."
          placeholderTextColor="#9AA3B2"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FilterPillTabs
        active={filter}
        onChange={(key) => setFilter(key as FilterKey)}
        options={[
          { key: 'all', label: `All (${counts?.all ?? 0})` },
          { key: 'published', label: `Published (${counts?.published ?? 0})` },
          { key: 'draft', label: `Draft (${counts?.draft ?? 0})` },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={NAVY} />
        }
      >
        {loading && !series && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={NAVY} size="large" />
          </View>
        )}

        {!!error && !series && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => load()}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </Pressable>
          </View>
        )}

        {series?.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>
              {item.testCount} Tests • {item.totalQuestions} Questions • {item.studentCount} Students
            </Text>
            <View style={styles.tagRow}>
              <View
                style={[
                  styles.statusBadge,
                  item.status === 'published' ? styles.statusPublished : styles.statusDraft,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    item.status === 'published' ? styles.statusTextPublished : styles.statusTextDraft,
                  ]}
                >
                  {item.status === 'published' ? 'Published' : 'Draft'}
                </Text>
              </View>
              <Text style={item.accessType === 'paid' ? styles.paidTag : styles.freeTag}>
                {item.accessType === 'paid' ? `₹${item.price} Paid` : 'Free'}
              </Text>
            </View>
            <View style={styles.cardFooter}>
              <View style={styles.linkRow}>
                <Pressable onPress={() => nav.push({ name: 'seriesTests', seriesId: item.id })}>
                  <Text style={styles.linkText}>Manage Tests</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    nav.push({ name: 'createSeriesStep1', seriesId: item.id, kind: 'sectional' })
                  }
                >
                  <Text style={styles.linkText}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => handleDelete(item)}>
                  <Text style={[styles.linkText, { color: ERROR }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}

        {series && series.length === 0 && (
          <Text style={styles.emptyText}>
            No sectional categories yet. Tap "Create Category" to add one (e.g. Math, English).
          </Text>
        )}
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => nav.push({ name: 'createSeriesStep1', kind: 'sectional' })}
      >
        <Ionicons name="add" size={18} color="#FFFFFF" />
        <Text style={styles.fabText}>Create Category</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    marginTop: 14,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  searchInput: { flex: 1, fontSize: 13, color: NAVY },
  scrollContent: { padding: 18, paddingTop: 6, paddingBottom: 100, gap: 12 },
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  title: { fontSize: 15, fontWeight: '800', color: NAVY },
  meta: { fontSize: 11.5, color: MUTED, marginTop: 6 },
  tagRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EFE9',
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusPublished: { backgroundColor: '#E1F5EA' },
  statusDraft: { backgroundColor: '#FDF1DC' },
  statusText: { fontSize: 10.5, fontWeight: '800' },
  statusTextPublished: { color: '#2E9E5B' },
  statusTextDraft: { color: GOLD },
  freeTag: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#2E9E5B',
    backgroundColor: '#E1F5EA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  paidTag: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  linkRow: { flexDirection: 'row', gap: 16 },
  linkText: { fontSize: 12.5, fontWeight: '700', color: NAVY },
  emptyText: { textAlign: 'center', color: MUTED, marginTop: 30, paddingHorizontal: 20 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: NAVY,
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  fabText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
});
