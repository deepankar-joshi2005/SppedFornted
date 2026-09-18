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
import { AdminNav } from '../../navigation/adminTypes';
import { AdminStudentListItem, listStudents } from '../../services/admin/students.service';
import { GOLD, MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  nav: AdminNav;
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function AdminStudentsScreen({ token, nav }: Props) {
  const [students, setStudents] = useState<AdminStudentListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(
    async (isRefresh?: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const result = await listStudents(token);
        setStudents(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load students.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load();
  }, [load]);

  const filtered = (students ?? []).filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.mobile.includes(search)
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Students</Text>
        <Text style={styles.headerSubtitle}>{students?.length ?? 0} registered</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={MUTED} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email or mobile..."
          placeholderTextColor="#9AA3B2"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={NAVY} />
        }
      >
        {loading && !students && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={NAVY} size="large" />
          </View>
        )}

        {!!error && !students && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => load()}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </Pressable>
          </View>
        )}

        {filtered.map((student) => (
          <Pressable
            key={student.id}
            style={styles.card}
            onPress={() => nav.push({ name: 'studentDetail', studentId: student.id })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {student.name
                  .split(' ')
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase())
                  .join('')}
              </Text>
            </View>
            <View style={styles.textWrap}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{student.name}</Text>
                {student.isCoachingStudent && (
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>Coaching</Text>
                  </View>
                )}
              </View>
              <Text style={styles.meta}>
                {student.email} • {student.mobile}
              </Text>
              <Text style={styles.meta}>
                {[student.city, student.state].filter(Boolean).join(', ') || '—'} • Joined{' '}
                {formatDate(student.joinedAt)}
              </Text>
            </View>
            <View style={styles.statsCol}>
              <Text style={styles.statValue}>{student.attemptCount}</Text>
              <Text style={styles.statLabel}>Attempts</Text>
              <Text style={styles.avgScore}>{student.avgScore}% avg</Text>
            </View>
          </Pressable>
        ))}

        {students && filtered.length === 0 && (
          <Text style={styles.emptyText}>No students found.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  headerRow: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 6 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: NAVY },
  headerSubtitle: { fontSize: 12, color: MUTED, marginTop: 2 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    marginTop: 10,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  searchInput: { flex: 1, fontSize: 13, color: NAVY },
  scrollContent: { padding: 18, paddingBottom: 30, gap: 12 },
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF1F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 12.5, fontWeight: '800', color: NAVY },
  textWrap: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontSize: 13.5, fontWeight: '800', color: NAVY },
  tagBadge: {
    backgroundColor: '#E4F5EA',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tagBadgeText: { fontSize: 9.5, fontWeight: '800', color: '#2E9E5B' },
  meta: { fontSize: 11, color: MUTED, marginTop: 2 },
  statsCol: { alignItems: 'flex-end' },
  statValue: { fontSize: 15, fontWeight: '800', color: NAVY },
  statLabel: { fontSize: 10, color: MUTED },
  avgScore: { fontSize: 11, fontWeight: '700', color: GOLD, marginTop: 4 },
  emptyText: { textAlign: 'center', color: MUTED, marginTop: 30 },
});
