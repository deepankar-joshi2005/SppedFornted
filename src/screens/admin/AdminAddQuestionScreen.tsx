import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AdminHeader from '../../components/admin/AdminHeader';
import ImagePickerBox from '../../components/admin/ImagePickerBox';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import { AdminNav } from '../../navigation/adminTypes';
import {
  createQuestion,
  getQuestion,
  QuestionDifficulty,
  updateQuestion,
} from '../../services/admin/questions.service';
import { GOLD, MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  testId?: string;
  questionId?: string;
  initialSubject?: string;
  nav: AdminNav;
};

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const DIFFICULTIES: QuestionDifficulty[] = ['Easy', 'Moderate', 'Hard'];

export default function AdminAddQuestionScreen({
  token,
  testId,
  questionId,
  initialSubject,
  nav,
}: Props) {
  const isEdit = !!questionId;
  const [subject, setSubject] = useState(initialSubject ?? '');
  const [topic, setTopic] = useState('');
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number | null>(null);
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('Moderate');
  const [marks, setMarks] = useState('2');
  const [negativeMarks, setNegativeMarks] = useState('0.25');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!questionId) return;
    (async () => {
      try {
        const q = await getQuestion(token, questionId);
        setSubject(q.subject);
        setTopic(q.topic);
        setText(q.text);
        setImage(q.image);
        setOptions(q.options);
        setCorrectOptionIndex(q.correctOptionIndex);
        setExplanation(q.explanation);
        setDifficulty(q.difficulty);
        setMarks(String(q.marks));
        setNegativeMarks(String(q.negativeMarks));
      } catch (err) {
        Alert.alert('Failed to load question', err instanceof Error ? err.message : '');
      } finally {
        setLoading(false);
      }
    })();
  }, [questionId, token]);

  const resetForm = () => {
    setText('');
    setImage(null);
    setShowImagePicker(false);
    setOptions(['', '', '', '']);
    setCorrectOptionIndex(null);
    setExplanation('');
  };

  const validate = (): boolean => {
    if (!subject.trim()) {
      Alert.alert('Subject is required');
      return false;
    }
    if (!text.trim()) {
      Alert.alert('Question text is required');
      return false;
    }
    if (options.some((o) => !o.trim())) {
      Alert.alert('All four options are required');
      return false;
    }
    if (correctOptionIndex === null) {
      Alert.alert('Please mark the correct option');
      return false;
    }
    return true;
  };

  const buildPayload = () => ({
    testId,
    subject: subject.trim(),
    topic: topic.trim(),
    text: text.trim(),
    image,
    options,
    correctOptionIndex: correctOptionIndex as number,
    explanation,
    difficulty,
    marks: Number(marks) || 2,
    negativeMarks: Number(negativeMarks) || 0.25,
  });

  const handleSave = async (andNext: boolean) => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit && questionId) {
        await updateQuestion(token, questionId, buildPayload());
        nav.pop();
      } else {
        await createQuestion(token, buildPayload());
        if (andNext) {
          resetForm();
        } else {
          nav.pop();
        }
      }
    } catch (err) {
      Alert.alert('Failed to save question', err instanceof Error ? err.message : '');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <AdminHeader title="Add Question" onBack={() => nav.pop()} />
        <View style={styles.loadingBox}>
          <ActivityIndicator color={NAVY} size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AdminHeader
        title={isEdit ? 'Edit Question' : 'Add Question'}
        subtitle={subject || 'Select a subject'}
        onBack={() => nav.pop()}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Subject</Text>
              <FormInput
                icon="book-outline"
                placeholder="e.g. Reasoning"
                value={subject}
                onChangeText={setSubject}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Topic</Text>
              <FormInput
                icon="pricetag-outline"
                placeholder="e.g. LCM & HCF"
                value={topic}
                onChangeText={setTopic}
              />
            </View>
          </View>

          <Text style={styles.label}>Question Text</Text>
          <View style={styles.questionCard}>
            <TextInput
              style={styles.questionInput}
              placeholder="Enter the question text..."
              placeholderTextColor="#9AA3B2"
              value={text}
              onChangeText={setText}
              multiline
            />
            <View style={styles.questionActions}>
              <Pressable
                style={styles.chip}
                onPress={() => setShowImagePicker((s) => !s)}
              >
                <Ionicons name="image-outline" size={14} color={NAVY} />
                <Text style={styles.chipText}>+ Add Image</Text>
              </Pressable>
            </View>
            {showImagePicker && (
              <View style={{ marginTop: 10 }}>
                <ImagePickerBox
                  token={token}
                  label="Question Image"
                  value={image}
                  onChange={setImage}
                  aspectRatio={16 / 9}
                />
              </View>
            )}
          </View>

          <Text style={styles.label}>Options (Mark Correct Option)</Text>
          {options.map((opt, idx) => (
            <Pressable
              key={idx}
              style={[styles.optionRow, correctOptionIndex === idx && styles.optionRowCorrect]}
              onPress={() => setCorrectOptionIndex(idx)}
            >
              <Ionicons
                name={correctOptionIndex === idx ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={correctOptionIndex === idx ? '#2E9E5B' : MUTED}
              />
              <Text style={styles.optionLetter}>{OPTION_LABELS[idx]}</Text>
              <TextInput
                style={styles.optionInput}
                placeholder={`Option ${OPTION_LABELS[idx]}`}
                placeholderTextColor="#9AA3B2"
                value={opt}
                onChangeText={(v) =>
                  setOptions((prev) => prev.map((o, i) => (i === idx ? v : o)))
                }
              />
              {correctOptionIndex === idx && <Text style={styles.correctLabel}>Correct</Text>}
            </Pressable>
          ))}

          <Text style={styles.label}>Explanation / Solution</Text>
          <View style={styles.explanationBox}>
            <TextInput
              style={styles.explanationInput}
              placeholder="Explain the correct answer..."
              placeholderTextColor="#9AA3B2"
              value={explanation}
              onChangeText={setExplanation}
              multiline
            />
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Difficulty</Text>
              <View style={styles.pillRow}>
                {DIFFICULTIES.map((d) => (
                  <Pressable
                    key={d}
                    style={[styles.pill, difficulty === d && styles.pillActive]}
                    onPress={() => setDifficulty(d)}
                  >
                    <Text style={[styles.pillText, difficulty === d && styles.pillTextActive]}>
                      {d}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Marks</Text>
              <FormInput
                icon="ribbon-outline"
                placeholder="2"
                value={marks}
                onChangeText={setMarks}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Negative Marks</Text>
              <FormInput
                icon="remove-circle-outline"
                placeholder="0.25"
                value={negativeMarks}
                onChangeText={setNegativeMarks}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.buttonsRow}>
            {!isEdit && (
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => handleSave(true)}
                disabled={saving}
              >
                <Text style={styles.secondaryBtnText}>Save & Next</Text>
              </Pressable>
            )}
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label={isEdit ? 'UPDATE QUESTION' : 'SAVE QUESTION'}
                onPress={() => handleSave(false)}
                loading={saving}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  loadingBox: { paddingVertical: 60, alignItems: 'center' },
  scrollContent: { padding: 18, paddingBottom: 40 },
  label: { fontSize: 12.5, fontWeight: '700', color: NAVY, marginBottom: 8, marginTop: 4 },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E7E5DE',
    padding: 14,
    marginBottom: 16,
  },
  questionInput: { fontSize: 14, color: NAVY, minHeight: 70, textAlignVertical: 'top' },
  questionActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0EFE9',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF1F7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: { fontSize: 11.5, fontWeight: '700', color: NAVY },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E7E5DE',
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 10,
  },
  optionRowCorrect: { borderColor: '#2E9E5B', backgroundColor: '#F1FAF4' },
  optionLetter: { fontSize: 13, fontWeight: '800', color: NAVY, width: 16 },
  optionInput: { flex: 1, fontSize: 14, color: NAVY },
  correctLabel: { fontSize: 10.5, fontWeight: '800', color: '#2E9E5B' },
  explanationBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E7E5DE',
    padding: 14,
    marginBottom: 16,
  },
  explanationInput: { fontSize: 13.5, color: NAVY, minHeight: 60, textAlignVertical: 'top' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D9D6CC',
    backgroundColor: '#FFFFFF',
  },
  pillActive: { backgroundColor: NAVY, borderColor: NAVY },
  pillText: { fontSize: 12.5, fontWeight: '600', color: MUTED },
  pillTextActive: { color: '#FFFFFF' },
  buttonsRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
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
