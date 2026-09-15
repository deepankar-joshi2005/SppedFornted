import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import ThreeDotMenu from '../../components/admin/ThreeDotMenu';
import { AdminNav } from '../../navigation/adminTypes';
import {
  AdminCategory,
  getCategories,
  setCategoryStatus,
} from '../../services/admin/categories.service';
import { GOLD, MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  nav: AdminNav;
};

export default function AdminCategoriesScreen({ token, nav }: Props) {
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(
    async (isRefresh?: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const result = await getCategories(token);
        setCategories(result);
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

  const toggleActive = async (category: AdminCategory) => {
    try {
      await setCategoryStatus(token, category.id, !category.isActive);
      load(true);
    } catch (err) {
      // no-op: list will simply not reflect the change; user can retry
    }
  };

  const filtered = (categories ?? []).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <AdminHeader
        title="Test Categories"
        subtitle="Manage all exam verticals"
        right={
          <Pressable style={styles.searchBtn} onPress={() => setSearchOpen((s) => !s)} hitSlop={8}>
            <Ionicons name="search" size={20} color={NAVY} />
          </Pressable>
        }
      />
      {searchOpen && (
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={MUTED} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            placeholderTextColor="#9AA3B2"
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>
      )}

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
            <Pressable onPress={() => load()}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </Pressable>
          </View>
        )}

        {filtered.map((category) => (
          <Pressable
            key={category.id}
            style={styles.card}
            onPress={() => nav.push({ name: 'categoryDetail', categoryId: category.id })}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={category.iconKey as keyof typeof Ionicons.glyphMap} size={20} color={NAVY} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.name}>{category.name}</Text>
              <Text style={styles.meta}>
                {category.seriesCount} Test Series • {category.testCount} Tests
              </Text>
            </View>
            <View
              style={[styles.statusBadge, category.isActive ? styles.statusActive : styles.statusInactive]}
            >
              <Text style={[styles.statusText, category.isActive && styles.statusTextActive]}>
                {category.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
            <ThreeDotMenu
              actions={[
                {
                  key: 'edit',
                  label: 'Edit',
                  icon: 'create-outline',
                  onPress: () => nav.push({ name: 'addCategory', categoryId: category.id }),
                },
                {
                  key: 'toggle',
                  label: category.isActive ? 'Deactivate' : 'Activate',
                  icon: category.isActive ? 'eye-off-outline' : 'eye-outline',
                  onPress: () => toggleActive(category),
                },
              ]}
            />
          </Pressable>
        ))}

        {categories && filtered.length === 0 && (
          <Text style={styles.emptyText}>No categories found.</Text>
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => nav.push({ name: 'addCategory' })}>
        <Ionicons name="add" size={18} color="#FFFFFF" />
        <Text style={styles.fabText}>Add Category</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  searchBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  searchInput: { flex: 1, fontSize: 13, color: NAVY },
  scrollContent: { padding: 16, paddingBottom: 100, gap: 12 },
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF1F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  name: { fontSize: 14.5, fontWeight: '800', color: NAVY },
  meta: { fontSize: 11.5, color: MUTED, marginTop: 3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusActive: { backgroundColor: '#E1F5EA' },
  statusInactive: { backgroundColor: '#F1F0EA' },
  statusText: { fontSize: 10, fontWeight: '800', color: MUTED },
  statusTextActive: { color: '#2E9E5B' },
  emptyText: { textAlign: 'center', color: MUTED, marginTop: 30 },
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
