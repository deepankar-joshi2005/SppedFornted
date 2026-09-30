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
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [textHindi, setTextHindi] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [options, setOptions] = useState(['', '', '', '']);
  const [optionsHindi, setOptionsHindi] = useState(['', '', '', '']);
  const [optionImages, setOptionImages] = useState<(string | null)[]>([null, null, null, null]);
  const [showOptionImagePicker, setShowOptionImagePicker] = useState([false, false, false, false]);
  const [optionsMode, setOptionsMode] = useState<'text' | 'image'>('text');
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number | null>(null);
  const [explanation, setExplanation] = useState('');
  const [explanationHindi, setExplanationHindi] = useState('');
  const [explanationImage, setExplanationImage] = useState<string | null>(null);
  const [showExplanationImagePicker, setShowExplanationImagePicker] = useState(false);
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
        setTextHindi(q.textHindi ?? '');
        setImage(q.image);
        setShowImagePicker(!!q.image);
        setOptions(q.options);
        setOptionsHindi(q.optionsHindi?.length === 4 ? q.optionsHindi : ['', '', '', '']);
        const loadedOptionImages =
          q.optionImages?.length === 4 ? q.optionImages : [null, null, null, null];
        setOptionImages(loadedOptionImages);
        setShowOptionImagePicker(loadedOptionImages.map((img) => !!img));
        setOptionsMode(loadedOptionImages.some((img) => img) ? 'image' : 'text');
        setCorrectOptionIndex(q.correctOptionIndex);
        setExplanation(q.explanation);
        setExplanationHindi(q.explanationHindi ?? '');
        setExplanationImage(q.explanationImage ?? null);
        setShowExplanationImagePicker(!!q.explanationImage);
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
    setTextHindi('');
    setImage(null);
    setShowImagePicker(false);
    setOptions(['', '', '', '']);
    setOptionsHindi(['', '', '', '']);
    setOptionImages([null, null, null, null]);
    setShowOptionImagePicker([false, false, false, false]);
    setOptionsMode('text');
    setCorrectOptionIndex(null);
    setExplanation('');
    setExplanationHindi('');
    setExplanationImage(null);
    setShowExplanationImagePicker(false);
  };

  const validate = (): boolean => {
    if (!subject.trim()) {
      Alert.alert('Subject is required');
      return false;
    }
    if (!text.trim() && !image) {
      Alert.alert('Add a question text or a question image (or both)');
      return false;
    }
    if (optionsMode === 'image') {
      if (optionImages.some((img) => !img)) {
        Alert.alert('Please add an image for all four options');
        return false;
      }
    } else if (options.some((o) => !o.trim())) {
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
    textHindi: textHindi.trim(),
    image,
    options: optionsMode === 'image' ? ['', '', '', ''] : options.map((o) => o.trim()),
    optionsHindi: optionsHindi.every((o) => o.trim()) ? optionsHindi : [],
    optionImages: optionsMode === 'image' ? optionImages : [null, null, null, null],
    correctOptionIndex: correctOptionIndex as number,
    explanation,
    explanationHindi,
    explanationImage,
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
      <SafeAreaView style={styles.root} edges={['top']}>
        <AdminHeader title="Add Question" onBack={() => nav.pop()} />
        <View style={styles.loadingBox}>
          <ActivityIndicator color={NAVY} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
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

          <Text style={styles.label}>Question (text, image, or both)</Text>
          <View style={styles.questionCard}>
            <TextInput
              style={styles.questionInput}
              placeholder="Enter the question text... (optional if you add an image)"
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
                <Text style={styles.chipText}>{image ? 'Change Image' : '+ Add Image'}</Text>
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

          <View style={styles.optionsHeaderRow}>
            <Text style={styles.optionsHeaderLabel}>Options (Mark Correct Option)</Text>
            <View style={styles.optionTabGroup}>
              <Pressable
                style={[styles.optionTab, optionsMode === 'text' && styles.optionTabActive]}
                onPress={() => setOptionsMode('text')}
              >
                <Text
                  style={[styles.optionTabText, optionsMode === 'text' && styles.optionTabTextActive]}
                >
                  Text
                </Text>
              </Pressable>
              <Pressable
                style={[styles.optionTab, optionsMode === 'image' && styles.optionTabActive]}
                onPress={() => setOptionsMode('image')}
              >
                <Text
                  style={[styles.optionTabText, optionsMode === 'image' && styles.optionTabTextActive]}
                >
                  Image
                </Text>
              </Pressable>
            </View>
          </View>

          {optionsMode === 'text'
            ? options.map((opt, idx) => {
                const isCorrect = correctOptionIndex === idx;
                return (
                  <Pressable
                    key={idx}
                    style={[styles.optionRow, isCorrect && styles.optionRowCorrect]}
                    onPress={() => setCorrectOptionIndex(idx)}
                  >
                    <Ionicons
                      name={isCorrect ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={isCorrect ? '#2E9E5B' : MUTED}
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
                    {isCorrect && <Text style={styles.correctLabel}>Correct</Text>}
                  </Pressable>
                );
              })
            : options.map((_opt, idx) => {
                const isCorrect = correctOptionIndex === idx;
                return (
                  <View
                    key={idx}
                    style={[styles.optionImageCard, isCorrect && styles.optionRowCorrect]}
                  >
                    <Pressable
                      style={styles.optionRadioTapZone}
                      onPress={() => setCorrectOptionIndex(idx)}
                    >
                      <Ionicons
                        name={isCorrect ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={isCorrect ? '#2E9E5B' : MUTED}
                      />
                      <Text style={styles.optionImageHint}>Option {OPTION_LABELS[idx]}</Text>
                      {isCorrect && <Text style={styles.correctLabel}>Correct</Text>}
                    </Pressable>

                    <View style={styles.questionActions}>
                      <Pressable
                        style={styles.chip}
                        onPress={() =>
                          setShowOptionImagePicker((prev) =>
                            prev.map((v, i) => (i === idx ? !v : v))
                          )
                        }
                      >
                        <Ionicons name="image-outline" size={14} color={NAVY} />
                        <Text style={styles.chipText}>
                          {optionImages[idx] ? 'Change Image' : '+ Add Image'}
                        </Text>
                      </Pressable>
                    </View>

                    {showOptionImagePicker[idx] && (
                      <View style={{ marginTop: 10 }}>
                        <ImagePickerBox
                          token={token}
                          label={`Option ${OPTION_LABELS[idx]} Image`}
                          value={optionImages[idx]}
                          onChange={(url) =>
                            setOptionImages((prev) => prev.map((img, i) => (i === idx ? url : img)))
                          }
                          aspectRatio={16 / 9}
                        />
                      </View>
                    )}
                  </View>
                );
              })}

          <Text style={styles.label}>Explanation / Solution (text, image, or both)</Text>
          <View style={styles.explanationBox}>
            <TextInput
              style={styles.explanationInput}
              placeholder="Explain the correct answer... (optional if you add an image)"
              placeholderTextColor="#9AA3B2"
              value={explanation}
              onChangeText={setExplanation}
              multiline
            />
            <View style={styles.questionActions}>
              <Pressable
                style={styles.chip}
                onPress={() => setShowExplanationImagePicker((s) => !s)}
              >
                <Ionicons name="image-outline" size={14} color={NAVY} />
                <Text style={styles.chipText}>
                  {explanationImage ? 'Change Image' : '+ Add Image'}
                </Text>
              </Pressable>
            </View>
            {showExplanationImagePicker && (
              <View style={{ marginTop: 10 }}>
                <ImagePickerBox
                  token={token}
                  label="Explanation Image"
                  value={explanationImage}
                  onChange={setExplanationImage}
                  aspectRatio={16 / 9}
                />
              </View>
            )}
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
    </SafeAreaView>
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
  optionsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  optionsHeaderLabel: { fontSize: 12.5, fontWeight: '700', color: NAVY },
  optionTabGroup: { flexDirection: 'row', gap: 6 },
  optionTab: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D9D6CC',
    backgroundColor: '#FFFFFF',
  },
  optionTabActive: { backgroundColor: NAVY, borderColor: NAVY },
  optionTabText: { fontSize: 11, fontWeight: '700', color: MUTED },
  optionTabTextActive: { color: '#FFFFFF' },
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
  optionImageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E7E5DE',
    padding: 14,
    marginBottom: 10,
  },
  optionRadioTapZone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionImageHint: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: NAVY,
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
