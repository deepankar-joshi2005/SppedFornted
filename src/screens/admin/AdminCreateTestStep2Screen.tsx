import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminHeader from '../../components/admin/AdminHeader';
import StepProgressHeader from '../../components/admin/StepProgressHeader';
import ToggleRow from '../../components/admin/ToggleRow';
import FormInput from '../../components/FormInput';
import DateInputField from '../../components/DateInputField';
import PrimaryButton from '../../components/PrimaryButton';
import { AdminNav } from '../../navigation/adminTypes';
import {
  getTestDetail,
  TestAccessLevel,
  updateTestConfig,
} from '../../services/admin/tests.service';
import { MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  testId: string;
  nav: AdminNav;
};

type AttemptsMode = '1' | 'unlimited' | 'custom';

export default function AdminCreateTestStep2Screen({ token, testId, nav }: Props) {
  const [totalQuestions, setTotalQuestions] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [passingMarks, setPassingMarks] = useState('');
  const [negativeMarkingEnabled, setNegativeMarkingEnabled] = useState(true);
  const [negativeMarks, setNegativeMarks] = useState('0.25');
  const [attemptsMode, setAttemptsMode] = useState<AttemptsMode>('1');
  const [customAttempts, setCustomAttempts] = useState('');
  const [accessLevel, setAccessLevel] = useState<TestAccessLevel>('coachingOnly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const test = await getTestDetail(token, testId);
        setTotalQuestions(String(test.totalQuestions || ''));
        setTotalMarks(String(test.totalMarks || ''));
        setDurationMinutes(String(test.durationMinutes || 60));
        setPassingMarks(String(test.passingMarks || ''));
        setNegativeMarkingEnabled(test.negativeMarkingEnabled);
        setNegativeMarks(String(test.negativeMarks ?? 0.25));
        setAccessLevel(test.accessLevel ?? 'coachingOnly');
        setStartDate(test.startDate ? test.startDate.slice(0, 10) : '');
        setEndDate(test.endDate ? test.endDate.slice(0, 10) : '');
        if (test.maxAttempts === 0) setAttemptsMode('unlimited');
        else if (test.maxAttempts === 1) setAttemptsMode('1');
        else {
          setAttemptsMode('custom');
          setCustomAttempts(String(test.maxAttempts));
        }
      } catch (err) {
        Alert.alert('Failed to load test', err instanceof Error ? err.message : '');
      } finally {
        setLoading(false);
      }
    })();
  }, [testId, token]);

  const handleSave = async () => {
    const maxAttempts =
      attemptsMode === 'unlimited' ? 0 : attemptsMode === '1' ? 1 : Number(customAttempts) || 1;

    setSaving(true);
    try {
      await updateTestConfig(token, testId, {
        totalQuestions: totalQuestions ? Number(totalQuestions) : 0,
        totalMarks: totalMarks ? Number(totalMarks) : 0,
        durationMinutes: durationMinutes ? Number(durationMinutes) : 60,
        passingMarks: passingMarks ? Number(passingMarks) : 0,
        negativeMarkingEnabled,
        negativeMarks: negativeMarks ? Number(negativeMarks) : 0,
        maxAttempts,
        accessLevel,
        startDate: startDate || null,
        endDate: endDate || null,
      });
      nav.replace({ name: 'manageQuestions', testId });
    } catch (err) {
      Alert.alert('Failed to save configuration', err instanceof Error ? err.message : '');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <AdminHeader title="Test Configuration" subtitle="Step 2 of 5" onBack={() => nav.pop()} />
      <StepProgressHeader
        steps={['Basic Info', 'Config', 'Questions', 'Preview', 'Publish']}
        currentIndex={1}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Total Questions</Text>
              <FormInput
                icon="help-circle-outline"
                placeholder="50"
                value={totalQuestions}
                onChangeText={setTotalQuestions}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Total Marks</Text>
              <FormInput
                icon="ribbon-outline"
                placeholder="100"
                value={totalMarks}
                onChangeText={setTotalMarks}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Duration (mins)</Text>
              <FormInput
                icon="time-outline"
                placeholder="60"
                value={durationMinutes}
                onChangeText={setDurationMinutes}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Passing Marks</Text>
              <FormInput
                icon="checkmark-circle-outline"
                placeholder="40"
                value={passingMarks}
                onChangeText={setPassingMarks}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <ToggleRow
            label="Negative Marking"
            description="Deduct marks for wrong answers"
            value={negativeMarkingEnabled}
            onChange={setNegativeMarkingEnabled}
          />

          {negativeMarkingEnabled && (
            <>
              <Text style={[styles.label, { marginTop: 14 }]}>Negative Marks per Question</Text>
              <FormInput
                icon="remove-circle-outline"
                placeholder="0.25"
                value={negativeMarks}
                onChangeText={setNegativeMarks}
                keyboardType="decimal-pad"
              />
            </>
          )}

          <Text style={[styles.label, { marginTop: 10 }]}>Maximum Attempts</Text>
          <View style={styles.pillRow}>
            {(['1', 'unlimited', 'custom'] as AttemptsMode[]).map((mode) => (
              <Pressable
                key={mode}
                style={[styles.pill, attemptsMode === mode && styles.pillActive]}
                onPress={() => setAttemptsMode(mode)}
              >
                <Text style={[styles.pillText, attemptsMode === mode && styles.pillTextActive]}>
                  {mode === '1' ? '1 Attempt' : mode === 'unlimited' ? 'Unlimited' : 'Custom'}
                </Text>
              </Pressable>
            ))}
          </View>
          {attemptsMode === 'custom' && (
            <FormInput
              icon="repeat-outline"
              placeholder="e.g. 3"
              value={customAttempts}
              onChangeText={setCustomAttempts}
              keyboardType="number-pad"
            />
          )}

          <Text style={[styles.label, { marginTop: 10 }]}>Who Can Access This Test</Text>
          <View style={styles.pillRow}>
            {(['coachingOnly', 'all'] as TestAccessLevel[]).map((level) => (
              <Pressable
                key={level}
                style={[styles.pill, accessLevel === level && styles.pillActive]}
                onPress={() => setAccessLevel(level)}
              >
                <Text style={[styles.pillText, accessLevel === level && styles.pillTextActive]}>
                  {level === 'coachingOnly' ? 'Coaching Students Only' : 'Everyone'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.helperText}>
            {accessLevel === 'coachingOnly'
              ? 'Only students tagged as "Coaching Student" can attempt this test. Others will see it but get an alert to contact the Coaching Admin.'
              : 'Any signed-up student can attempt this test.'}
          </Text>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Start Date</Text>
              <DateInputField
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                placeholder="Select start date"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>End Date</Text>
              <DateInputField
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                placeholder="Optional"
              />
            </View>
          </View>

          <PrimaryButton label="SAVE & CONTINUE" onPress={handleSave} loading={saving || loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  scrollContent: { padding: 18, paddingBottom: 40 },
  label: { fontSize: 12.5, fontWeight: '700', color: NAVY, marginBottom: 8, marginTop: 4 },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
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
  helperText: { fontSize: 11.5, color: MUTED, marginTop: -6, marginBottom: 14, lineHeight: 16 },
});
