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
import FilterPillTabs from '../../components/admin/FilterPillTabs';
import { AdminNav } from '../../navigation/adminTypes';
import {
  AdminQuestion,
  addToTest,
  getStats,
  listBank,
  QuestionStats,
} from '../../services/admin/questions.service';
import { GOLD, MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  testId?: string;
  nav: AdminNav;
};

const DIFFICULTY_OPTIONS = [
  { key: 'all', label: 'Difficulty' },
  { key: 'Easy', label: 'Easy' },
  { key: 'Moderate', label: 'Moderate' },
  { key: 'Hard', label: 'Hard' },
];

export default function AdminQuestionBankScreen({ token, testId, nav }: Props) {
  const [questions, setQuestions] = useState<AdminQuestion[] | null>(null);
  const [stats, setStats] = useState<QuestionStats | null>(null);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh?: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const [qs, s] = await Promise.all([
          listBank(token, {
            search: search || undefined,
            difficulty: difficulty === 'all' ? undefined : difficulty,
          }),
          getStats(token),
        ]);
        setQuestions(qs);
        setStats(s);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load question bank.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token, search, difficulty]
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleAddToTest = async (questionId: string) => {
    if (!testId) return;
    setAddingId(questionId);
    try {
      await addToTest(token, questionId, testId);
      Alert.alert('Added', 'Question added to the test.', [
        { text: 'OK', onPress: () => nav.pop() },
      ]);
    } catch (err) {
      Alert.alert('Failed to add question', err instanceof Error ? err.message : '');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Question Bank</Text>
          <Text style={styles.headerSubtitle}>Repository of all added questions</Text>
        </View>
        <Pressable onPress={() => nav.pop()} hitSlop={8}>
          <Ionicons name="close" size={22} color={NAVY} />
        </Pressable>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={MUTED} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search questions..."
          placeholderTextColor="#9AA3B2"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Questions</Text>
            <Text style={styles.statValue}>{stats.total}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active</Text>
            <Text style={styles.statValue}>{stats.active}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Unused</Text>
            <Text style={styles.statValue}>{stats.unused}</Text>
          </View>
        </View>
      )}

      <FilterPillTabs options={DIFFICULTY_OPTIONS} active={difficulty} onChange={setDifficulty} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={NAVY} />
        }
      >
        {loading && !questions && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={NAVY} size="large" />
          </View>
        )}

        {!!error && !questions && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => load()}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </Pressable>
          </View>
        )}

        {questions?.map((q) => (
          <View key={q._id} style={styles.card}>
            <Pressable onPress={() => nav.push({ name: 'questionPreview', questionId: q._id, testId })}>
              <Text style={styles.qText} numberOfLines={3}>
                {q.text}
              </Text>
            </Pressable>
            <View style={styles.tagsRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{q.subject}</Text>
              </View>
              {!!q.topic && (
                <View style={[styles.tag, styles.tagAlt]}>
                  <Text style={[styles.tagText, styles.tagAltText]}>{q.topic}</Text>
                </View>
              )}
              <View style={[styles.tag, styles.tagDifficulty]}>
                <Text style={[styles.tagText, styles.tagDifficultyText]}>{q.difficulty}</Text>
              </View>
            </View>
            <View style={styles.usageRow}>
              <Ionicons name="lock-closed-outline" size={12} color={MUTED} />
              <Text style={styles.usageText}>Used in: {q.usageCount ?? 0} Tests</Text>
            </View>
            <View style={styles.cardFooter}>
              <Pressable onPress={() => nav.push({ name: 'addQuestion', questionId: q._id, testId })}>
                <Text style={styles.editText}>Edit</Text>
              </Pressable>
              {!!testId && (
                <Pressable
                  style={styles.addBtn}
                  onPress={() => handleAddToTest(q._id)}
                  disabled={addingId === q._id}
                >
                  <Text style={styles.addBtnText}>
                    {addingId === q._id ? 'Adding...' : 'Add to Test'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}

        {questions && questions.length === 0 && (
          <Text style={styles.emptyText}>No questions found.</Text>
        )}
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => nav.push({ name: 'addQuestion', testId })}
      >
        <Ionicons name="add" size={18} color="#FFFFFF" />
        <Text style={styles.fabText}>Create New</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: NAVY },
  headerSubtitle: { fontSize: 12, color: MUTED, marginTop: 2 },
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
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 18, marginTop: 14 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  statLabel: { fontSize: 10.5, color: MUTED, textAlign: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', color: NAVY, marginTop: 3 },
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
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  qText: { fontSize: 13.5, color: NAVY, fontWeight: '600' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { backgroundColor: '#F1F0EA', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  tagAlt: { backgroundColor: '#EEF1F7' },
  tagDifficulty: { backgroundColor: '#FDF1DC' },
  tagText: { fontSize: 10.5, fontWeight: '700', color: MUTED },
  tagAltText: { color: NAVY },
  tagDifficultyText: { color: GOLD },
  usageRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  usageText: { fontSize: 11, color: MUTED },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0EFE9',
  },
  editText: { fontSize: 12.5, fontWeight: '700', color: NAVY },
  addBtn: { backgroundColor: NAVY, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
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
