import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';
import { Nav } from '../navigation/types';
import { AttemptResult, getResult } from '../services/attempts.service';
import { ERROR, GOLD, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  attemptId: string;
  nav: Nav;
};

const formatTime = (totalSeconds: number): string => {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, Math.round(totalSeconds)) : 0;
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

type PerformanceTier = { label: string; color: string; bg: string };

const getPerformanceTier = (scorePercent: number): PerformanceTier => {
  if (scorePercent >= 90) return { label: 'Excellent', color: '#2E9E5B', bg: '#E4F5EA' };
  if (scorePercent >= 75) return { label: 'Very Good', color: '#2E9E5B', bg: '#E4F5EA' };
  if (scorePercent >= 60) return { label: 'Good', color: GOLD, bg: '#FBF2DE' };
  if (scorePercent >= 40) return { label: 'Average', color: '#B4790C', bg: '#FDF1DC' };
  return { label: 'Needs Improvement', color: ERROR, bg: '#FBEAE8' };
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
          <ResultBody result={result} />

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
                  <Text style={styles.sectionTime}>
                    Time Spent: {formatTime(section.timeSpentSeconds)}
                  </Text>
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

function ResultBody({ result }: { result: AttemptResult }) {
  const tier = getPerformanceTier(result.scorePercent);
  const totalQs = result.correctCount + result.wrongCount + result.skippedCount;
  const attemptRate =
    totalQs > 0 ? Math.round(((result.correctCount + result.wrongCount) / totalQs) * 100) : 0;

  return (
    <>
      <View style={[styles.scoreCircle, { borderColor: tier.color, backgroundColor: tier.bg }]}>
        <Text style={[styles.scoreNumber, { color: tier.color }]}>{result.score}</Text>
        <Text style={styles.scoreFraction}>out of {result.totalMarks}</Text>
      </View>

      <View style={[styles.statusPill, { backgroundColor: tier.bg }]}>
        <Text style={[styles.statusText, { color: tier.color }]}>{tier.label}</Text>
      </View>

      <View style={styles.analysisCard}>
        <Text style={styles.analysisTitle}>Attempt Analysis (Overall)</Text>
        <View style={styles.analysisRow}>
          <View style={styles.donutWrap}>
            <AttemptDonut
              correct={result.correctCount}
              wrong={result.wrongCount}
              skipped={result.skippedCount}
            />
            <View style={styles.donutCenter} pointerEvents="none">
              <Text style={styles.donutTotal}>{totalQs}</Text>
              <Text style={styles.donutTotalLabel}>Total Qs</Text>
            </View>
          </View>
          <View style={styles.legendCol}>
            <LegendRow color="#2E9E5B" label="Correct" value={result.correctCount} total={totalQs} />
            <LegendRow color={ERROR} label="Incorrect" value={result.wrongCount} total={totalQs} />
            <LegendRow
              color="#D9D6CC"
              label="Not Answered"
              value={result.skippedCount}
              total={totalQs}
            />
          </View>
        </View>
        <View style={styles.analysisStatsRow}>
          <View style={styles.analysisStatBox}>
            <Text style={styles.analysisStatLabel}>Attempt Rate</Text>
            <Text style={styles.analysisStatValue}>{attemptRate}%</Text>
          </View>
          <View style={styles.analysisStatBox}>
            <Text style={styles.analysisStatLabel}>Accuracy</Text>
            <Text style={[styles.analysisStatValue, { color: NAVY }]}>{result.accuracy}%</Text>
          </View>
        </View>
      </View>
    </>
  );
}

function AttemptDonut({
  correct,
  wrong,
  skipped,
  size = 140,
  strokeWidth = 16,
}: {
  correct: number;
  wrong: number;
  skipped: number;
  size?: number;
  strokeWidth?: number;
}) {
  const total = correct + wrong + skipped;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const segments = [
    { value: correct, color: '#2E9E5B' },
    { value: wrong, color: ERROR },
    { value: skipped, color: '#D9D6CC' },
  ];

  let cumulative = 0;

  return (
    <Svg width={size} height={size}>
      <G transform={`rotate(-90 ${center} ${center})`}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#EEEDE6"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {total > 0 &&
          segments.map((seg, i) => {
            if (seg.value === 0) return null;
            const segLen = (seg.value / total) * circumference;
            const dashOffset = -cumulative;
            cumulative += segLen;
            return (
              <Circle
                key={i}
                cx={center}
                cy={center}
                r={radius}
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segLen} ${circumference - segLen}`}
                strokeDashoffset={dashOffset}
                strokeLinecap={segLen < circumference ? 'butt' : 'round'}
                fill="transparent"
              />
            );
          })}
      </G>
    </Svg>
  );
}

function LegendRow({
  color,
  label,
  value,
  total,
}: {
  color: string;
  label: string;
  value: number;
  total: number;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendValue}>
        {value} ({percent}%)
      </Text>
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
  scoreNumber: {
    fontSize: 44,
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
  },
  statusText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  analysisCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 22,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 16,
  },
  analysisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  donutWrap: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  donutTotal: {
    fontSize: 24,
    fontWeight: '800',
    color: NAVY,
  },
  donutTotalLabel: {
    fontSize: 11,
    color: MUTED,
  },
  legendCol: {
    flex: 1,
    gap: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
    fontSize: 12.5,
    color: '#334155',
    fontWeight: '600',
  },
  legendValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: NAVY,
  },
  analysisStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0EEE7',
  },
  analysisStatBox: {
    flex: 1,
    backgroundColor: '#F8F7F2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  analysisStatLabel: {
    fontSize: 11,
    color: MUTED,
  },
  analysisStatValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2E9E5B',
    marginTop: 3,
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
  sectionTime: {
    fontSize: 11,
    color: MUTED,
    marginTop: 6,
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
