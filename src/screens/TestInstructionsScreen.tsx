import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Nav } from '../navigation/types';
import { CoachingOnlyError, startAttempt } from '../services/attempts.service';
import { getTestInstructions, TestInstructions } from '../services/tests.service';
import { ERROR, GOLD, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  testId: string;
  nav: Nav;
};

const INSTRUCTIONS = [
  'The exam clock will run automatically once you begin.',
  'Make sure your internet connection remains uninterrupted.',
  'Do not close or minimize the app during the exam.',
  'Each correct answer earns marks; each incorrect answer applies negative marking.',
  'You can mark any question to review later before submitting the test.',
];

export default function TestInstructionsScreen({ token, testId, nav }: Props) {
  const [data, setData] = useState<TestInstructions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const result = await getTestInstructions(token, testId);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load instructions.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, testId]);

  const handleBegin = async () => {
    setStarting(true);
    setError('');
    try {
      const result = await startAttempt(token, testId);
      nav.push({ name: 'testTaking', attemptId: result.attemptId, testId });
    } catch (err) {
      if (err instanceof CoachingOnlyError) {
        Alert.alert('Coaching Students Only', err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to start test.');
      }
    } finally {
      setStarting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle}>Test Instructions</Text>
        <Pressable
          style={styles.iconBtn}
          hitSlop={8}
          onPress={() => nav.push({ name: 'notifications' })}
        >
          <Ionicons name="notifications-outline" size={20} color={NAVY} />
        </Pressable>
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={NAVY} size="large" />
        </View>
      )}

      {!!error && !data && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {data && (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.category}>{data.category.toUpperCase()} LEVEL TEST</Text>
            <Text style={styles.title}>{data.title}</Text>

            <View style={styles.statsGrid}>
              <StatBox label="Questions" value={`${data.totalQuestions} Qs`} />
              <StatBox label="Total Marks" value={`${data.totalMarks} Marks`} />
              <StatBox label="Duration" value={`${data.durationMinutes} Mins`} />
              <StatBox label="Negative Marking" value={`-${data.negativeMarks} Marks`} />
            </View>

            <Text style={styles.sectionTitle}>Important Instructions:</Text>
            {INSTRUCTIONS.map((line, idx) => (
              <View style={styles.instructionRow} key={idx}>
                <Text style={styles.instructionNumber}>{idx + 1}.</Text>
                <Text style={styles.instructionText}>{line}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            {!!error && <Text style={styles.errorTextSmall}>{error}</Text>}
            <Pressable style={styles.agreeRow} onPress={() => setAgreed((a) => !a)}>
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.agreeText}>
                I have read and understood all the guidelines and instructions mentioned above.
              </Text>
            </Pressable>
            <Pressable
              style={[styles.beginBtn, !agreed && styles.beginBtnDisabled]}
              onPress={handleBegin}
              disabled={!agreed || starting}
            >
              {starting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.beginBtnText}>I AM READY TO BEGIN</Text>
              )}
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F4EF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FBEAE8',
  },
  errorText: {
    color: ERROR,
    fontSize: 13,
    textAlign: 'center',
  },
  errorTextSmall: {
    color: ERROR,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  category: {
    fontSize: 12,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: NAVY,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  statBox: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  statLabel: {
    fontSize: 11.5,
    color: MUTED,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: NAVY,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: NAVY,
    marginTop: 26,
    marginBottom: 10,
  },
  instructionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  instructionNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: '#EDEBE4',
    backgroundColor: '#FFFFFF',
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: NAVY,
  },
  agreeText: {
    flex: 1,
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  beginBtn: {
    backgroundColor: NAVY,
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
  },
  beginBtnDisabled: {
    opacity: 0.5,
  },
  beginBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
