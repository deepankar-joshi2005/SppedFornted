import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AdminHeader from '../../components/admin/AdminHeader';
import PrimaryButton from '../../components/PrimaryButton';
import { AdminNav } from '../../navigation/adminTypes';
import { AdminQuestion, getByTest } from '../../services/admin/questions.service';
import { AdminTestDetail, getTestDetail } from '../../services/admin/tests.service';
import { GOLD, MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  testId: string;
  nav: AdminNav;
};

const STEPS = [
  {
    key: 'instructions',
    icon: 'book-outline' as const,
    title: 'Test Instructions Screen',
    desc: 'General guidelines and mark schemes',
  },
  {
    key: 'question',
    icon: 'add-circle-outline' as const,
    title: 'Question Screen Preview',
    desc: 'Interactive layout & timers',
  },
  {
    key: 'palette',
    icon: 'grid-outline' as const,
    title: 'Question Palette Preview',
    desc: 'Grid of answered, skipped & marked',
  },
  {
    key: 'submit',
    icon: 'cloud-upload-outline' as const,
    title: 'Submit Screen Preview',
    desc: 'Overall summary before submission',
  },
  {
    key: 'result',
    icon: 'ribbon-outline' as const,
    title: 'Result Screen Preview',
    desc: 'Scoreboards, percentiles & analytics',
  },
];

export default function AdminStudentPreviewScreen({ token, testId, nav }: Props) {
  const [test, setTest] = useState<AdminTestDetail | null>(null);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, qs] = await Promise.all([getTestDetail(token, testId), getByTest(token, testId)]);
      setTest(t);
      setQuestions(qs);
    } finally {
      setLoading(false);
    }
  }, [token, testId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !test) {
    return (
      <View style={styles.root}>
        <AdminHeader title="Student Preview" onBack={() => nav.pop()} />
        <View style={styles.loadingBox}>
          <ActivityIndicator color={NAVY} size="large" />
        </View>
      </View>
    );
  }

  if (activeStep !== null) {
    return (
      <StepDetail
        step={STEPS[activeStep].key}
        test={test}
        questions={questions}
        onBack={() => setActiveStep(null)}
      />
    );
  }

  return (
    <View style={styles.root}>
      <AdminHeader title="Student Preview" subtitle={test.title} onBack={() => nav.pop()} />

      <View style={styles.banner}>
        <View style={styles.bannerDot} />
        <Text style={styles.bannerText}>PREVIEW MODE ACTIVE</Text>
        <Pressable style={styles.exitBtn} onPress={() => nav.pop()}>
          <Text style={styles.exitBtnText}>Exit Preview</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.hint}>
          As an administrator, you can walk through the exact interactive flow that students
          experience in the Student Portal app.
        </Text>

        {STEPS.map((step, idx) => (
          <Pressable key={step.key} style={styles.stepRow} onPress={() => setActiveStep(idx)}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{idx + 1}</Text>
            </View>
            <View style={styles.stepCard}>
              <View style={styles.stepIconWrap}>
                <Ionicons name={step.icon} size={18} color={NAVY} />
              </View>
              <View style={styles.stepTextWrap}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={MUTED} />
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <PrimaryButton
          label="Continue to Publish"
          onPress={() => nav.replace({ name: 'publishTest', testId })}
        />
      </View>
    </View>
  );
}

function StepDetail({
  step,
  test,
  questions,
  onBack,
}: {
  step: string;
  test: AdminTestDetail;
  questions: AdminQuestion[];
  onBack: () => void;
}) {
  return (
    <View style={styles.root}>
      <AdminHeader title="Preview" subtitle={test.title} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {step === 'instructions' && (
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>{test.title}</Text>
            <Text style={styles.detailLine}>Total Questions: {test.totalQuestions}</Text>
            <Text style={styles.detailLine}>Duration: {test.durationMinutes} minutes</Text>
            <Text style={styles.detailLine}>Total Marks: {test.totalMarks}</Text>
            <Text style={styles.detailLine}>Passing Marks: {test.passingMarks}</Text>
            <Text style={styles.detailLine}>
              Negative Marking:{' '}
              {test.negativeMarkingEnabled ? `-${test.negativeMarks} per wrong answer` : 'Disabled'}
            </Text>
            <Text style={[styles.detailLine, { marginTop: 10 }]}>
              Maximum Attempts: {test.maxAttempts === 0 ? 'Unlimited' : test.maxAttempts}
            </Text>
          </View>
        )}

        {step === 'question' && (
          <View style={styles.detailCard}>
            {questions[0] ? (
              <>
                <Text style={styles.qBadge}>{questions[0].subject.toUpperCase()}</Text>
                <Text style={styles.qText}>{questions[0].text}</Text>
                {questions[0].options.map((opt, idx) => (
                  <View key={idx} style={styles.optionRow}>
                    <Text style={styles.optionLetter}>{['A', 'B', 'C', 'D'][idx]}</Text>
                    <Text style={styles.optionText}>{opt}</Text>
                  </View>
                ))}
                <Text style={styles.timerText}>⏱ Timer shown live to students during the test</Text>
              </>
            ) : (
              <Text style={styles.detailLine}>Add a question to preview this screen.</Text>
            )}
          </View>
        )}

        {step === 'palette' && (
          <View style={styles.detailCard}>
            <View style={styles.paletteGrid}>
              {Array.from({ length: test.totalQuestions || questions.length || 0 }).map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.paletteCell,
                    idx % 3 === 0 && styles.paletteAnswered,
                    idx % 3 === 1 && styles.paletteMarked,
                  ]}
                >
                  <Text style={styles.paletteCellText}>{idx + 1}</Text>
                </View>
              ))}
            </View>
            <View style={styles.legendRow}>
              <LegendItem color="#2E9E5B" label="Answered" />
              <LegendItem color={GOLD} label="Marked for Review" />
              <LegendItem color="#D9D6CC" label="Not Visited" />
            </View>
          </View>
        )}

        {step === 'submit' && (
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Submit Summary</Text>
            <Text style={styles.detailLine}>Total Questions: {test.totalQuestions}</Text>
            <Text style={styles.detailLine}>Answered: — (shown live during a real attempt)</Text>
            <Text style={styles.detailLine}>Not Answered: — (shown live during a real attempt)</Text>
            <Text style={styles.detailLine}>Marked for Review: — (shown live during a real attempt)</Text>
          </View>
        )}

        {step === 'result' && (
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Result Summary</Text>
            <Text style={styles.detailLine}>Total Marks: {test.totalMarks}</Text>
            <Text style={styles.detailLine}>Passing Marks: {test.passingMarks}</Text>
            <Text style={styles.detailLine}>
              Score, rank & percentile are calculated once real students submit this test.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  loadingBox: { paddingVertical: 60, alignItems: 'center' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDF1DC',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bannerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GOLD },
  bannerText: { flex: 1, fontSize: 11.5, fontWeight: '800', color: '#8A6416', letterSpacing: 0.4 },
  exitBtn: { backgroundColor: NAVY, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  exitBtnText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  scrollContent: { padding: 18, paddingBottom: 40 },
  bottomBar: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EDEBE4' },
  hint: { fontSize: 12.5, color: MUTED, marginBottom: 16, lineHeight: 18 },
  stepRow: { flexDirection: 'row', alignItems: 'stretch', marginBottom: 14, gap: 10 },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  stepCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    padding: 14,
  },
  stepIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#EEF1F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTextWrap: { flex: 1 },
  stepTitle: { fontSize: 13.5, fontWeight: '800', color: NAVY },
  stepDesc: { fontSize: 11, color: MUTED, marginTop: 2 },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  detailTitle: { fontSize: 15, fontWeight: '800', color: NAVY, marginBottom: 10 },
  detailLine: { fontSize: 13, color: NAVY, marginBottom: 6 },
  qBadge: {
    fontSize: 10.5,
    fontWeight: '800',
    color: MUTED,
    backgroundColor: '#F1F0EA',
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  qText: { fontSize: 14.5, fontWeight: '700', color: NAVY, marginTop: 10, marginBottom: 12 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  optionLetter: { fontSize: 12, fontWeight: '800', color: NAVY },
  optionText: { fontSize: 13, color: NAVY, flexShrink: 1 },
  timerText: { fontSize: 11.5, color: MUTED, marginTop: 8, fontStyle: 'italic' },
  paletteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  paletteCell: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F0EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteAnswered: { backgroundColor: '#2E9E5B' },
  paletteMarked: { backgroundColor: GOLD },
  paletteCellText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  legendRow: { flexDirection: 'row', gap: 16, marginTop: 16, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 11, color: MUTED },
});
