import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
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
  bulkAddToTest,
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

type QuestionCardProps = {
  question: AdminQuestion;
  isSelected: boolean;
  testId?: string;
  onCardPress: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onEditPress: (id: string) => void;
};

const QuestionCard = memo(function QuestionCard({
  question,
  isSelected,
  testId,
  onCardPress,
  onToggleSelect,
  onEditPress,
}: QuestionCardProps) {
  return (
    <View style={[styles.card, isSelected && styles.cardSelected]}>
      <Pressable style={styles.cardContent} onPress={() => onCardPress(question._id)}>
        <View style={styles.cardTopRow}>
          {/* Checkbox — only when testId present */}
          {!!testId && (
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Ionicons name="checkmark" size={13} color="#FFF" />}
            </View>
          )}
          <Text style={[styles.qText, { flex: 1 }]} numberOfLines={3}>
            {question.text}
          </Text>
        </View>

        <View style={styles.tagsRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{question.subject}</Text>
          </View>
          {!!question.topic && (
            <View style={[styles.tag, styles.tagAlt]}>
              <Text style={[styles.tagText, styles.tagAltText]}>{question.topic}</Text>
            </View>
          )}
          <View style={[styles.tag, styles.tagDifficulty]}>
            <Text style={[styles.tagText, styles.tagDifficultyText]}>{question.difficulty}</Text>
          </View>
        </View>
        <View style={styles.usageRow}>
          <Ionicons name="lock-closed-outline" size={12} color={MUTED} />
          <Text style={styles.usageText}>Used in: {question.usageCount ?? 0} Tests</Text>
        </View>
      </Pressable>

      <View style={styles.cardFooter}>
        <Pressable hitSlop={6} onPress={() => onEditPress(question._id)}>
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
        {!!testId && (
          <Pressable
            style={[styles.addBtn, isSelected && styles.addBtnSelected]}
            onPress={() => onToggleSelect(question._id)}
          >
            <Text style={styles.addBtnText}>{isSelected ? '✓ Selected' : 'Select'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
});

export default function AdminQuestionBankScreen({ token, testId, nav }: Props) {
  const [questions, setQuestions] = useState<AdminQuestion[] | null>(null);
  const [stats, setStats] = useState<QuestionStats | null>(null);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
        setSelectedIds(new Set()); // reset selection on reload
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

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!questions) return;
    setSelectedIds((prev) => {
      if (prev.size === questions.length) {
        return new Set();
      }
      return new Set(questions.map((q) => q._id));
    });
  }, [questions]);

  const handleCardPress = useCallback(
    (id: string) => {
      if (testId) {
        toggleSelect(id);
      } else {
        nav.push({ name: 'questionPreview', questionId: id, testId });
      }
    },
    [testId, toggleSelect, nav]
  );

  const handleEditPress = useCallback(
    (id: string) => {
      nav.push({ name: 'addQuestion', questionId: id, testId });
    },
    [testId, nav]
  );

  const handleBulkAdd = async () => {
    if (!testId || selectedIds.size === 0) return;
    setAdding(true);
    try {
      const result = await bulkAddToTest(token, Array.from(selectedIds), testId);
      Alert.alert('Done!', result.message, [{ text: 'OK', onPress: () => nav.pop() }]);
    } catch (err) {
      Alert.alert('Failed', err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setAdding(false);
    }
  };

  const allSelected = !!questions && questions.length > 0 && selectedIds.size === questions.length;

  const renderItem = useCallback(
    ({ item }: { item: AdminQuestion }) => {
      const isSelected = selectedIds.has(item._id);
      return (
        <QuestionCard
          question={item}
          isSelected={isSelected}
          testId={testId}
          onCardPress={handleCardPress}
          onToggleSelect={toggleSelect}
          onEditPress={handleEditPress}
        />
      );
    },
    [selectedIds, testId, handleCardPress, toggleSelect, handleEditPress]
  );

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
            <Text style={styles.statLabel}>Total</Text>
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
          {selectedIds.size > 0 && (
            <View style={[styles.statCard, styles.statCardSelected]}>
              <Text style={styles.statLabel}>Selected</Text>
              <Text style={[styles.statValue, { color: '#2563EB' }]}>{selectedIds.size}</Text>
            </View>
          )}
        </View>
      )}

      <FilterPillTabs options={DIFFICULTY_OPTIONS} active={difficulty} onChange={setDifficulty} />

      {/* Select All bar — only when testId is present */}
      {!!testId && !!questions && questions.length > 0 && (
        <View style={styles.selectAllBar}>
          <Pressable style={styles.selectAllBtn} onPress={selectAll}>
            <View style={[styles.checkbox, allSelected && styles.checkboxSelected]}>
              {allSelected && <Ionicons name="checkmark" size={13} color="#FFF" />}
            </View>
            <Text style={styles.selectAllText}>
              {allSelected ? 'Deselect All' : 'Select All'} ({questions.length})
            </Text>
          </Pressable>
          {selectedIds.size > 0 && (
            <View style={styles.addSelectedGroup}>
              <Pressable style={styles.addSelectedBtn} onPress={handleBulkAdd} disabled={adding}>
                {adding ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.addSelectedText}>Add {selectedIds.size} to Test</Text>
                )}
              </Pressable>
              <Pressable
                style={styles.clearSelBtn}
                onPress={() => setSelectedIds(new Set())}
                hitSlop={8}
              >
                <Ionicons name="close" size={15} color="#FFF" />
              </Pressable>
            </View>
          )}
        </View>
      )}

      {loading && !questions ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={NAVY} size="large" />
        </View>
      ) : !!error && !questions ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => load()}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={questions || []}
          keyExtractor={(item) => item._id}
          extraData={selectedIds}
          renderItem={renderItem}
          initialNumToRender={15}
          maxToRenderPerBatch={20}
          windowSize={10}
          removeClippedSubviews={Platform.OS === 'android'}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={NAVY} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No questions found.</Text>
          }
        />
      )}

      {/* FAB — Create New */}
      <Pressable style={styles.fab} onPress={() => nav.push({ name: 'addQuestion', testId })}>
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
  statCardSelected: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  statLabel: { fontSize: 10.5, color: MUTED, textAlign: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', color: NAVY, marginTop: 3 },
  selectAllBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 18,
    marginTop: 10,
    marginBottom: 6,
  },
  selectAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectAllText: { fontSize: 13, fontWeight: '700', color: NAVY },
  addSelectedGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    overflow: 'hidden',
  },
  addSelectedBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  addSelectedText: { color: '#FFF', fontSize: 12.5, fontWeight: '800' },
  clearSelBtn: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.3)',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: NAVY, borderColor: NAVY },
  scrollContent: { padding: 18, paddingTop: 6, paddingBottom: 120, gap: 12 },
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
    borderWidth: 1,
    borderColor: '#EDEBE4',
    overflow: 'hidden',
  },
  cardSelected: { borderColor: '#2563EB', backgroundColor: '#F0F7FF' },
  cardContent: { padding: 14, paddingBottom: 6 },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0EFE9',
  },
  editText: { fontSize: 12.5, fontWeight: '700', color: NAVY },
  addBtn: { backgroundColor: NAVY, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnSelected: { backgroundColor: '#2563EB' },
  addBtnText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  emptyText: { textAlign: 'center', color: MUTED, marginTop: 30 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  fabText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
});

