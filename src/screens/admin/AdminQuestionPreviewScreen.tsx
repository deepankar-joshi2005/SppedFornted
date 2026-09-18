import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminHeader from '../../components/admin/AdminHeader';
import PrimaryButton from '../../components/PrimaryButton';
import { AdminNav } from '../../navigation/adminTypes';
import { AdminQuestion, addToTest, getQuestion } from '../../services/admin/questions.service';
import { MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  questionId: string;
  testId?: string;
  nav: AdminNav;
};

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function AdminQuestionPreviewScreen({ token, questionId, testId, nav }: Props) {
  const [question, setQuestion] = useState<AdminQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getQuestion(token, questionId);
      setQuestion(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load question.');
    } finally {
      setLoading(false);
    }
  }, [token, questionId]);

  useEffect(() => {
    load();
  }, [load]);

  const alreadyInTest = !!testId && question?.test === testId;

  const handleAddToTest = async () => {
    if (!testId) return;
    setAdding(true);
    try {
      await addToTest(token, questionId, testId);
      Alert.alert('Added', 'Question added to the test.', [
        { text: 'OK', onPress: () => nav.pop() },
      ]);
    } catch (err) {
      Alert.alert('Failed to add question', err instanceof Error ? err.message : '');
    } finally {
      setAdding(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <AdminHeader title="Question Preview" onBack={() => nav.pop()} />

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={NAVY} size="large" />
        </View>
      )}

      {!!error && !question && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={load}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </Pressable>
        </View>
      )}

      {question && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.simBadge}>
            <Text style={styles.simBadgeText}>STUDENT VIEW SIMULATION</Text>
          </View>

          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={styles.subjectBadge}>
                <Text style={styles.subjectBadgeText}>{question.subject.toUpperCase()}</Text>
              </View>
              <Text style={styles.marksText}>
                +{question.marks.toFixed(1)} Marks • -{question.negativeMarks.toFixed(1)} Neg
              </Text>
            </View>
            <Text style={styles.questionText}>{question.text}</Text>
          </View>

          {question.options.map((opt, idx) => {
            const isCorrect = idx === question.correctOptionIndex;
            return (
              <View key={idx} style={[styles.optionRow, isCorrect && styles.optionRowCorrect]}>
                <View style={[styles.optionCircle, isCorrect && styles.optionCircleCorrect]}>
                  {isCorrect ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.optionLetter}>{OPTION_LABELS[idx]}</Text>
                  )}
                </View>
                <Text style={styles.optionText}>{opt}</Text>
                {isCorrect && <Text style={styles.correctTag}>CORRECT</Text>}
              </View>
            );
          })}

          {!!question.explanation && (
            <View style={styles.explanationBox}>
              <Text style={styles.explanationTitle}>EXPLANATION</Text>
              <Text style={styles.explanationText}>{question.explanation}</Text>
            </View>
          )}

          <View style={styles.actionsRow}>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => nav.replace({ name: 'addQuestion', questionId, testId })}
            >
              <Text style={styles.secondaryBtnText}>Edit Question</Text>
            </Pressable>
            {!!testId && (
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label={alreadyInTest ? 'ALREADY IN TEST' : 'ADD TO TEST SERIES'}
                  onPress={handleAddToTest}
                  loading={adding}
                  disabled={alreadyInTest}
                />
              </View>
            )}
          </View>
        </ScrollView>
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
  scrollContent: { padding: 18, paddingBottom: 40 },
  simBadge: {
    backgroundColor: '#EEF1F7',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 14,
  },
  simBadgeText: { fontSize: 11, fontWeight: '800', color: NAVY, letterSpacing: 0.5 },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    marginBottom: 14,
  },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subjectBadge: { backgroundColor: '#F1F0EA', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  subjectBadgeText: { fontSize: 10.5, fontWeight: '800', color: MUTED },
  marksText: { fontSize: 11.5, fontWeight: '700', color: '#2E9E5B' },
  questionText: { fontSize: 15, fontWeight: '700', color: NAVY, marginTop: 12, lineHeight: 21 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 10,
  },
  optionRowCorrect: { borderColor: '#2E9E5B', backgroundColor: '#F1FAF4' },
  optionCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F0EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCircleCorrect: { backgroundColor: '#2E9E5B' },
  optionLetter: { fontSize: 12, fontWeight: '800', color: NAVY },
  optionText: { flex: 1, fontSize: 13.5, color: NAVY },
  correctTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    backgroundColor: '#2E9E5B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  explanationBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    marginTop: 6,
    marginBottom: 20,
  },
  explanationTitle: { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 0.5 },
  explanationText: { fontSize: 13, color: NAVY, marginTop: 8, lineHeight: 19 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  secondaryBtn: {
    paddingHorizontal: 18,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#D9D6CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '700', color: NAVY },
});
