import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminHeader from '../../components/admin/AdminHeader';
import StepProgressHeader from '../../components/admin/StepProgressHeader';
import PrimaryButton from '../../components/PrimaryButton';
import { AdminNav } from '../../navigation/adminTypes';
import { AdminQuestion, deleteQuestion, getByTest } from '../../services/admin/questions.service';
import { AdminTestDetail, getTestDetail } from '../../services/admin/tests.service';
import { GOLD, MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  testId: string;
  nav: AdminNav;
};

export default function AdminManageQuestionsScreen({ token, testId, nav }: Props) {
  const [test, setTest] = useState<AdminTestDetail | null>(null);
  const [questions, setQuestions] = useState<AdminQuestion[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [testDetail, qs] = await Promise.all([
        getTestDetail(token, testId),
        getByTest(token, testId),
      ]);
      setTest(testDetail);
      setQuestions(qs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions.');
    } finally {
      setLoading(false);
    }
  }, [token, testId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRemove = (questionId: string) => {
    Alert.alert('Remove question', 'Remove this question from the test?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteQuestion(token, questionId);
            load();
          } catch (err) {
            Alert.alert('Failed to remove', err instanceof Error ? err.message : '');
          }
        },
      },
    ]);
  };

  const target = test?.totalQuestions || questions?.length || 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <AdminHeader
        title="Manage Questions"
        subtitle={test?.title}
        onBack={() => nav.pop()}
      />
      <StepProgressHeader
        steps={['Basic Info', 'Config', 'Questions', 'Preview', 'Publish']}
        currentIndex={2}
      />

      {loading && !questions && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={NAVY} size="large" />
        </View>
      )}

      {!!error && !questions && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={load}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </Pressable>
        </View>
      )}

      {questions && (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.selectedBox}>
              <Text style={styles.selectedLabel}>Selected Questions</Text>
              <Text style={styles.selectedValue}>
                {String(questions.length).padStart(2, '0')} / {target || '—'}
              </Text>
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                style={styles.actionCard}
                onPress={() => nav.push({ name: 'addQuestion', testId })}
              >
                <Ionicons name="add-circle-outline" size={20} color={NAVY} />
                <Text style={styles.actionLabel}>Create New</Text>
              </Pressable>
              <Pressable
                style={styles.actionCard}
                onPress={() => nav.push({ name: 'questionBank', testId })}
              >
                <Ionicons name="folder-open-outline" size={20} color={NAVY} />
                <Text style={styles.actionLabel}>Select Bank</Text>
              </Pressable>
            </View>
            <Pressable
              style={styles.importRow}
              onPress={() => nav.push({ name: 'importQuestions', testId })}
            >
              <Ionicons name="cloud-upload-outline" size={18} color={NAVY} />
              <Text style={styles.importLabel}>Import Questions (Excel/CSV)</Text>
            </Pressable>

            <Text style={styles.sectionTitle}>Added Questions ({questions.length})</Text>
            {questions.length === 0 && (
              <Text style={styles.emptyText}>No questions added yet.</Text>
            )}
            {questions.map((q, idx) => (
              <View key={q._id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.qIndex}>Q{idx + 1}</Text>
                  <Text style={styles.qText} numberOfLines={3}>
                    {q.text}
                  </Text>
                </View>
                <View style={styles.tagsRow}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{q.subject}</Text>
                  </View>
                  {!!q.topic && (
                    <View style={[styles.tag, styles.tagAlt]}>
                      <Text style={[styles.tagText, styles.tagAltText]}>{q.topic}</Text>
                    </View>
                  )}
                  <View style={[styles.tag, styles.tagMarks]}>
                    <Text style={[styles.tagText, styles.tagMarksText]}>{q.marks} Marks</Text>
                  </View>
                </View>
                <View style={styles.cardFooter}>
                  <Pressable onPress={() => handleRemove(q._id)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => nav.push({ name: 'addQuestion', testId, questionId: q._id })}
                  >
                    <Text style={styles.editText}>Edit Details</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.bottomBar}>
            <PrimaryButton
              label="Continue to Preview"
              onPress={() => nav.push({ name: 'subjectSections', testId })}
              disabled={questions.length === 0}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  loadingBox: { paddingVertical: 60, alignItems: 'center' },
  errorBox: { margin: 18, padding: 16, borderRadius: 12, backgroundColor: '#FBEAE8', alignItems: 'center' },
  errorText: { color: '#C0392B', fontSize: 13, textAlign: 'center' },
  retryText: { marginTop: 8, color: NAVY, fontWeight: '700', fontSize: 12.5 },
  scrollContent: { padding: 18, paddingBottom: 30 },
  selectedBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EEF1F7',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D7DFF2',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
  },
  selectedLabel: { fontSize: 13, fontWeight: '700', color: NAVY },
  selectedValue: { fontSize: 15, fontWeight: '800', color: NAVY },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    paddingVertical: 16,
  },
  actionLabel: { fontSize: 12.5, fontWeight: '700', color: NAVY },
  importRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    paddingVertical: 13,
    marginBottom: 22,
  },
  importLabel: { fontSize: 12.5, fontWeight: '700', color: NAVY },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: NAVY, marginBottom: 12 },
  emptyText: { fontSize: 12.5, color: MUTED },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', gap: 10 },
  qIndex: { fontSize: 13, fontWeight: '800', color: GOLD },
  qText: { flex: 1, fontSize: 13, color: NAVY, fontWeight: '600' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { backgroundColor: '#F1F0EA', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  tagAlt: { backgroundColor: '#EEF1F7' },
  tagMarks: { backgroundColor: '#E1F5EA' },
  tagText: { fontSize: 10.5, fontWeight: '700', color: MUTED },
  tagAltText: { color: NAVY },
  tagMarksText: { color: '#2E9E5B' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 18,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0EFE9',
  },
  removeText: { fontSize: 12.5, fontWeight: '700', color: '#C0392B' },
  editText: { fontSize: 12.5, fontWeight: '700', color: NAVY },
  bottomBar: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EDEBE4',
  },
});
