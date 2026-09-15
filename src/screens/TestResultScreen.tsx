import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Nav } from '../navigation/types';
import { AttemptResult, getResult } from '../services/attempts.service';
import { ERROR, GOLD, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  attemptId: string;
  nav: Nav;
};

const formatTime = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

export default function TestResultScreen({ token, attemptId, nav }: Props) {
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await getResult(token, attemptId);
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load result.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, attemptId]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Text style={styles.headerTitle}>Test Completed 🎉</Text>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={NAVY} size="large" />
        </View>
      )}

      {!!error && !result && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {result && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.scoreCircle, !result.passed && styles.scoreCircleFail]}>
            <Text style={styles.scorePercent}>{result.scorePercent}%</Text>
            <Text style={styles.scoreFraction}>
              Score: {result.score}/{result.totalMarks}
            </Text>
          </View>

          <View style={[styles.statusPill, !result.passed && styles.statusPillFail]}>
            <Text style={[styles.statusText, !result.passed && styles.statusTextFail]}>
              Status: {result.passed ? 'PASSED' : 'NOT PASSED'}
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <StatCard icon="checkmark" label="Correct" value={`${result.correctCount} Qs`} color="#2E9E5B" />
            <StatCard icon="close" label="Wrong" value={`${result.wrongCount} Qs`} color={ERROR} />
            <StatCard icon="remove" label="Skipped" value={`${result.skippedCount} Qs`} color={MUTED} />
            <StatCard icon="radio-button-on" label="Accuracy" value={`${result.accuracy}%`} color={NAVY} />
          </View>

          {result.sectionBreakdown.length > 0 && (
            <View style={styles.sectionBox}>
              <Text style={styles.sectionBoxTitle}>Section-wise Performance</Text>
              {result.sectionBreakdown.map((section) => (
                <View key={section.name} style={styles.sectionRow}>
                  <View style={styles.sectionLabelRow}>
                    <Text style={styles.sectionName}>{section.name}</Text>
                    <Text style={styles.sectionScore}>
                      {section.correct}/{section.total} Correct
                    </Text>
                  </View>
                  <View style={styles.sectionTrack}>
                    <View
                      style={[
                        styles.sectionFill,
                        {
                          width: `${section.total > 0 ? (section.correct / section.total) * 100 : 0}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Time Taken</Text>
              <Text style={styles.infoValue}>{formatTime(result.timeTakenSeconds)}</Text>
            </View>
            {result.rank !== null && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>All India Rank</Text>
                  <Text style={styles.infoValueGold}>
                    #{result.rank} of {result.totalCandidates} candidates
                  </Text>
                </View>
              </>
            )}
          </View>

          <Pressable
            style={styles.primaryBtn}
            onPress={() => nav.push({ name: 'solutionReview', attemptId })}
          >
            <Text style={styles.primaryBtnText}>View Solutions</Text>
          </Pressable>
          <Pressable
            style={styles.outlineBtn}
            onPress={() => nav.push({ name: 'leaderboard', testId: result.testId })}
          >
            <Text style={styles.outlineBtnText}>View Leaderboard</Text>
          </Pressable>
          <Pressable style={styles.linkBtn} onPress={() => nav.resetToTab('home')}>
            <Text style={styles.linkBtnText}>Back to Home</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F4EF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: NAVY,
    paddingHorizontal: 18,
    paddingTop: 12,
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
    alignItems: 'center',
  },
  scoreCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 8,
    borderColor: NAVY,
    backgroundColor: '#EEF1F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  scoreCircleFail: {
    borderColor: ERROR,
    backgroundColor: '#FBEAE8',
  },
  scorePercent: {
    fontSize: 38,
    fontWeight: '800',
    color: NAVY,
  },
  scoreFraction: {
    fontSize: 12.5,
    color: MUTED,
    marginTop: 4,
  },
  statusPill: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E4F5EA',
    borderWidth: 1,
    borderColor: '#2E9E5B',
  },
  statusPillFail: {
    backgroundColor: '#FBEAE8',
    borderColor: ERROR,
  },
  statusText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#2E9E5B',
  },
  statusTextFail: {
    color: ERROR,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 22,
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11.5,
    color: MUTED,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  sectionBoxTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 12,
  },
  sectionRow: {
    marginTop: 10,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E2937',
    flexShrink: 1,
  },
  sectionScore: {
    fontSize: 12,
    fontWeight: '700',
    color: MUTED,
  },
  sectionTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EEEDE6',
    overflow: 'hidden',
  },
  sectionFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#2E9E5B',
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#EDEBE4',
  },
  infoLabel: {
    fontSize: 13,
    color: MUTED,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: NAVY,
  },
  infoValueGold: {
    fontSize: 13,
    fontWeight: '800',
    color: GOLD,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: NAVY,
    borderRadius: 28,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 22,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  outlineBtn: {
    width: '100%',
    borderWidth: 1.4,
    borderColor: NAVY,
    borderRadius: 28,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  outlineBtnText: {
    color: NAVY,
    fontWeight: '700',
    fontSize: 14,
  },
  linkBtn: {
    marginTop: 16,
    paddingVertical: 6,
  },
  linkBtnText: {
    color: MUTED,
    fontWeight: '600',
    fontSize: 13,
  },
});
