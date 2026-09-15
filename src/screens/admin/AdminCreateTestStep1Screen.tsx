import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AdminHeader from '../../components/admin/AdminHeader';
import StepProgressHeader from '../../components/admin/StepProgressHeader';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import { AdminNav } from '../../navigation/adminTypes';
import { getSeriesDetail } from '../../services/admin/series.service';
import { createTest, getTestDetail, updateTestConfig } from '../../services/admin/tests.service';
import { MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  seriesId: string;
  testId?: string;
  nav: AdminNav;
};

const DIFFICULTIES = ['Easy', 'Moderate', 'Hard', 'Mixed'];

export default function AdminCreateTestStep1Screen({ token, seriesId, testId, nav }: Props) {
  const [seriesTitle, setSeriesTitle] = useState('');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Multiple Subjects');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Mixed');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const series = await getSeriesDetail(token, seriesId);
        setSeriesTitle(series.title);
        if (testId) {
          const test = await getTestDetail(token, testId);
          setTitle(test.title);
          setSubject(test.subject);
          setDescription(test.description);
          setDifficulty(test.difficulty);
        }
      } catch (err) {
        Alert.alert('Failed to load', err instanceof Error ? err.message : '');
      } finally {
        setLoading(false);
      }
    })();
  }, [seriesId, testId, token]);

  const handleContinue = async () => {
    if (!title.trim()) {
      Alert.alert('Test name is required');
      return;
    }
    setSaving(true);
    try {
      let resolvedTestId = testId;
      if (testId) {
        await updateTestConfig(token, testId, {
          title: title.trim(),
          subject,
          description,
          difficulty,
        });
      } else {
        const created = await createTest(token, {
          title: title.trim(),
          series: seriesId,
          subject,
          description,
          difficulty,
        });
        resolvedTestId = created._id;
      }
      nav.replace({ name: 'createTestStep2', testId: resolvedTestId! });
    } catch (err) {
      Alert.alert('Failed to save test', err instanceof Error ? err.message : '');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <AdminHeader title="Create Test" subtitle="Step 1 of 5" onBack={() => nav.pop()} />
      <StepProgressHeader
        steps={['Basic Info', 'Config', 'Questions', 'Preview', 'Publish']}
        currentIndex={0}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Test Name</Text>
          <FormInput
            icon="document-text-outline"
            placeholder="SSC CGL Mock Test – 01"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Select Test Series</Text>
          <View style={styles.readonlyField}>
            <Text style={styles.readonlyText}>{seriesTitle || 'Loading...'}</Text>
          </View>

          <Text style={styles.label}>Subject</Text>
          <FormInput
            icon="book-outline"
            placeholder="Multiple Subjects"
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={styles.label}>Description</Text>
          <FormInput
            icon="reader-outline"
            placeholder="Enter detailed test instructions and guidelines for students..."
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Text style={[styles.label, { marginTop: 6 }]}>Difficulty Level</Text>
          <View style={styles.pillRow}>
            {DIFFICULTIES.map((d) => (
              <Pressable
                key={d}
                style={[styles.pill, difficulty === d && styles.pillActive]}
                onPress={() => setDifficulty(d)}
              >
                <Text style={[styles.pillText, difficulty === d && styles.pillTextActive]}>{d}</Text>
              </Pressable>
            ))}
          </View>

          <PrimaryButton label="SAVE & CONTINUE" onPress={handleContinue} loading={saving || loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  scrollContent: { padding: 18, paddingBottom: 40 },
  label: { fontSize: 12.5, fontWeight: '700', color: NAVY, marginBottom: 8, marginTop: 4 },
  readonlyField: {
    backgroundColor: '#F1F0EA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7E5DE',
    paddingHorizontal: 14,
    height: 50,
    justifyContent: 'center',
    marginBottom: 14,
  },
  readonlyText: { fontSize: 14, color: NAVY, fontWeight: '600' },
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
});
