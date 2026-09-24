import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Fragment, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Polygon,
  Polyline,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { Nav } from '../navigation/types';
import { AttemptResult, getResult, ScoreDistributionPoint, SectionBreakdown } from '../services/attempts.service';
import { ERROR, GOLD, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  attemptId: string;
  nav: Nav;
};

type Tab = 'summary' | 'comparison';

const formatTime = (totalSeconds: number): string => {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, Math.round(totalSeconds)) : 0;
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

const RATING_COLORS = {
  Poor: '#E4483C',
  Average: '#F5A623',
  Good: '#22A559',
  Excellent: '#22B8CF',
} as const;

const getRatingTier = (percent: number): { label: keyof typeof RATING_COLORS; color: string } => {
  if (percent >= 80) return { label: 'Excellent', color: RATING_COLORS.Excellent };
  if (percent >= 60) return { label: 'Good', color: RATING_COLORS.Good };
  if (percent >= 40) return { label: 'Average', color: RATING_COLORS.Average };
  return { label: 'Poor', color: RATING_COLORS.Poor };
};

const SECTION_HEADER_COLORS = ['#2F6FED', '#E8A33D'];

const GAUGE_START_ANGLE = 135;
const GAUGE_SWEEP = 270;

export default function TestResultScreen({ token, attemptId, nav }: Props) {
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('summary');

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

  const handleReattempt = () => {
    if (!result) return;
    nav.push({ name: 'testInstructions', testId: result.testId });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {result?.title ?? 'Result'}
        </Text>
        {result?.canReattempt ? (
          <Pressable style={styles.reattemptPill} onPress={handleReattempt}>
            <Text style={styles.reattemptPillText}>Reattempt</Text>
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      {!!result && (
        <View style={styles.tabsRow}>
          <Pressable style={styles.tabBtn} onPress={() => setActiveTab('summary')}>
            <Text style={[styles.tabText, activeTab === 'summary' && styles.tabTextActive]}>Summary</Text>
            {activeTab === 'summary' && <View style={styles.tabUnderline} />}
          </Pressable>
          <Pressable style={styles.tabBtn} onPress={() => setActiveTab('comparison')}>
            <Text style={[styles.tabText, activeTab === 'comparison' && styles.tabTextActive]}>
              Comparison
            </Text>
            {activeTab === 'comparison' && <View style={styles.tabUnderline} />}
          </Pressable>
        </View>
      )}

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

      {!!result && (
        <View style={styles.bodyWrap}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {activeTab === 'summary' ? <SummaryTab result={result} /> : <ComparisonTab result={result} />}
          </ScrollView>

          <Pressable
            style={styles.solutionsBtn}
            onPress={() => nav.push({ name: 'solutionReview', attemptId })}
          >
            <Text style={styles.solutionsBtnText}>Solutions</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Summary Tab ────────────────────────────────────────────────────────────

function SummaryTab({ result }: { result: AttemptResult }) {
  const totalQuestions = result.correctCount + result.wrongCount + result.skippedCount;
  const attempted = result.correctCount + result.wrongCount;
  const myPoint = result.scoreDistribution.find((p) => p.score === result.score);
  const percentile = myPoint?.percentile ?? 0;
  const marksPerQuestion = totalQuestions > 0 ? result.totalMarks / totalQuestions : 0;
  const tier = getRatingTier(result.scorePercent);

  const totalAsSection: SectionBreakdown = {
    name: 'Total',
    correct: result.correctCount,
    wrong: result.wrongCount,
    attempted,
    total: totalQuestions,
    score: result.score,
    timeSpentSeconds: result.timeTakenSeconds,
    rank: result.rank ?? 0,
    topScore: result.topScore,
  };

  return (
    <>
      <Text style={[styles.sectionHeading, styles.firstSectionHeading]}>Summary</Text>
      <View style={styles.card}>
        <View style={styles.statGrid}>
          <StatCell
            icon="clipboard-text-outline"
            iconColor={NAVY}
            label="Attempted"
            value={`${attempted}/${totalQuestions}`}
          />
          <StatCell icon="check-decagram" iconColor="#22A559" label="Correct" value={String(result.correctCount)} />
          <StatCell icon="close-octagon" iconColor={ERROR} label="Wrong" value={String(result.wrongCount)} />
          <StatCell icon="file-document-outline" iconColor={GOLD} label="Total Score" value={result.score.toFixed(2)} />
          <StatCell
            icon="speedometer"
            iconColor="#3B82F6"
            label="Rank"
            value={result.rank && result.totalCandidates ? `${result.rank}/${result.totalCandidates}` : '—'}
          />
          <StatCell
            icon="medal-outline"
            iconColor={GOLD}
            label="Top Score"
            value={`${result.topScore.toFixed(2)}/${result.totalMarks}`}
          />
        </View>
      </View>

      <Text style={styles.sectionHeading}>Performance</Text>
      <View style={styles.card}>
        <View style={styles.performanceRow}>
          <SpeedGauge percent={result.scorePercent} size={116} strokeWidth={13} />
          <View style={styles.performanceBox}>
            <Text style={styles.performanceBoxLabel}>Performance</Text>
            <Text style={styles.performanceBoxValue}>{result.scorePercent}%</Text>
          </View>
        </View>
        <View style={styles.perfStatsRow}>
          <View style={styles.perfStatItem}>
            <MaterialCommunityIcons name="chart-line" size={17} color={NAVY} />
            <Text style={styles.perfStatText}>Percentile : {percentile}%</Text>
          </View>
          <View style={styles.perfStatItem}>
            <MaterialCommunityIcons name="target" size={17} color="#22A559" />
            <Text style={styles.perfStatText}>Accuracy : {result.accuracy}%</Text>
          </View>
        </View>
      </View>

      {result.sectionBreakdown.length > 0 && (
        <>
          <Text style={styles.sectionHeading}>Sectional Summary</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sectionalScrollRow}
          >
            {result.sectionBreakdown.map((sec, i) => (
              <SectionalCard key={sec.name} section={sec} colorIndex={i} />
            ))}
            <SectionalCard section={totalAsSection} colorIndex={0} isTotal />
          </ScrollView>

          <Text style={styles.sectionHeading}>Sectional Scores</Text>
          <View style={styles.card}>
            <View style={styles.ratingLegendRow}>
              {(Object.keys(RATING_COLORS) as (keyof typeof RATING_COLORS)[]).map((key) => (
                <View key={key} style={styles.ratingLegendItem}>
                  <View style={[styles.ratingLegendDot, { backgroundColor: RATING_COLORS[key] }]} />
                  <Text style={styles.ratingLegendText}>{key}</Text>
                </View>
              ))}
            </View>

            <View style={styles.totalScoreWrap}>
              <RingGauge percent={result.scorePercent} color={tier.color} size={92} strokeWidth={9}>
                <Text style={styles.totalScoreRingLabel}>Total Score</Text>
                <Text style={styles.totalScoreRingValue}>
                  {result.score.toFixed(1)}/{result.totalMarks.toFixed(1)}
                </Text>
              </RingGauge>
              <Text style={[styles.totalScoreTierLabel, { color: tier.color }]}>{tier.label}</Text>
            </View>

            <View style={styles.scoreBarsList}>
              {[...result.sectionBreakdown, totalAsSection].map((sec) => {
                const maxScore = marksPerQuestion * sec.total;
                const secPercent = maxScore > 0 ? (sec.score / maxScore) * 100 : 0;
                const secTier = getRatingTier(secPercent);
                const fillPercent = Math.max(0, Math.min(100, secPercent));
                return (
                  <View key={sec.name} style={styles.scoreBarRow}>
                    <Text style={styles.scoreBarLabel}>{sec.name}</Text>
                    <View style={styles.scoreBarTrack}>
                      <View
                        style={[
                          styles.scoreBarFill,
                          { width: `${fillPercent}%`, backgroundColor: secTier.color },
                        ]}
                      />
                    </View>
                    <Text style={[styles.scoreBarValue, { color: secTier.color }]}>
                      {sec.score.toFixed(2)} - {secTier.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </>
      )}
    </>
  );
}

function StatCell({
  icon,
  iconColor,
  label,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCell}>
      <View style={[styles.statIconWrap, { backgroundColor: `${iconColor}1A` }]}>
        <MaterialCommunityIcons name={icon} size={19} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statCellLabel}>{label}</Text>
        <Text style={styles.statCellValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function SectionalCard({
  section,
  colorIndex,
  isTotal,
}: {
  section: SectionBreakdown;
  colorIndex: number;
  isTotal?: boolean;
}) {
  const headerColor = isTotal ? SECTION_HEADER_COLORS[0] : SECTION_HEADER_COLORS[colorIndex % 2];
  const correctFraction = section.total > 0 ? (section.correct / section.total) * 100 : 0;

  return (
    <View style={styles.sectionalCard}>
      <View style={[styles.sectionalCardHeader, { backgroundColor: headerColor }]}>
        <Text style={styles.sectionalCardHeaderText} numberOfLines={1}>
          {section.name}
        </Text>
      </View>
      <View style={styles.sectionalCardBody}>
        <RingGauge percent={correctFraction} color={headerColor} size={68} strokeWidth={6}>
          <Text style={styles.sectionalRingLabel}>Correct</Text>
          <Text style={styles.sectionalRingValue}>
            {section.correct}/{section.total}
          </Text>
        </RingGauge>

        <View style={styles.sectionalStatsGrid}>
          <SectionalStat label="Attempted" value={String(section.attempted)} />
          <SectionalStat
            label="C/W"
            valueNode={
              <Text style={styles.sectionalStatValue}>
                <Text style={{ color: '#22A559' }}>{section.correct}</Text>
                <Text>/</Text>
                <Text style={{ color: ERROR }}>{section.wrong}</Text>
              </Text>
            }
          />
          <SectionalStat label="Score" value={section.score.toFixed(2)} />
          <SectionalStat label="Rank" value={String(section.rank)} />
          <SectionalStat label="Top Score" value={section.topScore.toFixed(2)} />
          <SectionalStat label="Time" value={formatTime(section.timeSpentSeconds)} />
        </View>
      </View>
    </View>
  );
}

function SectionalStat({
  label,
  value,
  valueNode,
}: {
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionalStatItem}>
      <Text style={styles.sectionalStatLabel}>{label}</Text>
      {valueNode ?? <Text style={styles.sectionalStatValue}>{value}</Text>}
    </View>
  );
}

// ─── Comparison Tab ─────────────────────────────────────────────────────────

function ComparisonTab({ result }: { result: AttemptResult }) {
  const myPoint: ScoreDistributionPoint = result.scoreDistribution.find(
    (p) => p.score === result.score
  ) ?? { score: result.score, percentile: 0 };

  return (
    <>
      <Text style={styles.sectionHeading}>Comparison</Text>
      <View style={styles.card}>
        <Text style={styles.chartCardTitle}>Percentile vs Score</Text>
        {result.scoreDistribution.length > 1 ? (
          <>
            <PercentileChart
              data={result.scoreDistribution}
              maxScore={result.totalMarks}
              myPoint={myPoint}
            />
            <Text style={styles.chartCaption}>
              Your Score: {myPoint.score} • Percentile: {myPoint.percentile}%
            </Text>
          </>
        ) : (
          <Text style={styles.chartEmptyText}>
            Not enough attempts yet to compare against other students.
          </Text>
        )}
      </View>
    </>
  );
}

const CHART_VB_W = 320;
const CHART_VB_H = 200;
const CHART_PAD_L = 30;
const CHART_PAD_R = 14;
const CHART_PAD_T = 14;
const CHART_PAD_B = 22;

function PercentileChart({
  data,
  maxScore,
  myPoint,
}: {
  data: ScoreDistributionPoint[];
  maxScore: number;
  myPoint: ScoreDistributionPoint;
}) {
  const safeMax = maxScore > 0 ? maxScore : Math.max(...data.map((d) => d.score), 1);
  const plotW = CHART_VB_W - CHART_PAD_L - CHART_PAD_R;
  const plotH = CHART_VB_H - CHART_PAD_T - CHART_PAD_B;
  const scaleX = (score: number) =>
    CHART_PAD_L + (Math.max(0, Math.min(score, safeMax)) / safeMax) * plotW;
  const scaleY = (pct: number) => CHART_PAD_T + plotH - (Math.max(0, Math.min(pct, 100)) / 100) * plotH;

  const sorted = [...data].sort((a, b) => a.score - b.score);
  const linePoints = sorted.map((p) => `${scaleX(p.score)},${scaleY(p.percentile)}`).join(' ');
  const areaPoints = `${scaleX(sorted[0].score)},${scaleY(0)} ${linePoints} ${scaleX(
    sorted[sorted.length - 1].score
  )},${scaleY(0)}`;

  const gridLines = [0, 25, 50, 75, 100];
  const myX = scaleX(myPoint.score);
  const myY = scaleY(myPoint.percentile);

  return (
    <Svg width="100%" height={CHART_VB_H} viewBox={`0 0 ${CHART_VB_W} ${CHART_VB_H}`}>
      <Defs>
        <LinearGradient id="percentileGradient" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={NAVY} stopOpacity={0.55} />
          <Stop offset="1" stopColor={NAVY} stopOpacity={0.04} />
        </LinearGradient>
      </Defs>

      {gridLines.map((g) => (
        <Fragment key={g}>
          <Line
            x1={CHART_PAD_L}
            x2={CHART_VB_W - CHART_PAD_R}
            y1={scaleY(g)}
            y2={scaleY(g)}
            stroke="#EDEBE4"
            strokeWidth={1}
          />
          <SvgText x={CHART_PAD_L - 6} y={scaleY(g) + 3} fontSize={8} fill={MUTED} textAnchor="end">
            {g}
          </SvgText>
        </Fragment>
      ))}
      <SvgText x={CHART_PAD_L} y={CHART_VB_H - 6} fontSize={8} fill={MUTED}>
        0
      </SvgText>
      <SvgText x={CHART_VB_W - CHART_PAD_R} y={CHART_VB_H - 6} fontSize={8} fill={MUTED} textAnchor="end">
        {safeMax}
      </SvgText>

      <Polygon points={areaPoints} fill="url(#percentileGradient)" />
      <Polyline points={linePoints} fill="none" stroke={NAVY} strokeWidth={2} />
      <G>
        <Circle cx={myX} cy={myY} r={5} fill="#FFFFFF" stroke={GOLD} strokeWidth={2.5} />
      </G>
    </Svg>
  );
}

// ─── Shared: Ring Gauge ─────────────────────────────────────────────────────

function RingGauge({
  percent,
  color,
  size,
  strokeWidth,
  children,
}: {
  percent: number;
  color: string;
  size: number;
  strokeWidth: number;
  children?: React.ReactNode;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G transform={`rotate(-90 ${center} ${center})`}>
          <Circle cx={center} cy={center} r={radius} stroke="#EEEDE6" strokeWidth={strokeWidth} fill="transparent" />
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
      </Svg>
      <View style={styles.ringCenter} pointerEvents="none">
        {children}
      </View>
    </View>
  );
}

// ─── Speedometer-style gauge with a live needle (Performance card) ─────────

function SpeedGauge({
  percent,
  size,
  strokeWidth,
}: {
  percent: number;
  size: number;
  strokeWidth: number;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLen = (GAUGE_SWEEP / 360) * circumference;
  const fillLen = (clamped / 100) * arcLen;
  const center = size / 2;
  const needleLength = radius - strokeWidth / 2 - 2;

  const [needleAngle, setNeedleAngle] = useState(GAUGE_START_ANGLE);
  const animatedPercent = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const listenerId = animatedPercent.addListener(({ value }) => {
      setNeedleAngle(GAUGE_START_ANGLE + (value / 100) * GAUGE_SWEEP);
    });
    animatedPercent.setValue(0);
    Animated.timing(animatedPercent, {
      toValue: clamped,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => animatedPercent.removeListener(listenerId);
  }, [clamped]);

  const needleAngleRad = (needleAngle * Math.PI) / 180;
  const needleX = center + needleLength * Math.cos(needleAngleRad);
  const needleY = center + needleLength * Math.sin(needleAngleRad);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation={GAUGE_START_ANGLE} origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#EEEDE6"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLen} ${circumference - arcLen}`}
            strokeLinecap="round"
            fill="transparent"
          />
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#22A559"
            strokeWidth={strokeWidth}
            strokeDasharray={`${fillLen} ${circumference - fillLen}`}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
        <Line
          x1={center}
          y1={center}
          x2={needleX}
          y2={needleY}
          stroke="#334155"
          strokeWidth={3.5}
          strokeLinecap="round"
        />
        <Circle cx={center} cy={center} r={6.5} fill="#334155" />
        <Circle cx={center} cy={center} r={2.5} fill="#FFFFFF" />
      </Svg>
      <View style={styles.speedGaugeLabel} pointerEvents="none">
        <Text style={styles.gaugeValue}>{Math.round(clamped)}%</Text>
      </View>
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
    paddingHorizontal: 6,
  },
  reattemptPill: {
    borderWidth: 1.3,
    borderColor: NAVY,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  reattemptPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: NAVY,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 24,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEBE4',
    backgroundColor: '#FFFFFF',
  },
  tabBtn: {
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: MUTED,
  },
  tabTextActive: {
    color: NAVY,
  },
  tabUnderline: {
    marginTop: 8,
    height: 2.5,
    backgroundColor: NAVY,
    borderRadius: 2,
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
  bodyWrap: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
    marginTop: 16,
    marginBottom: 8,
  },
  firstSectionHeading: {
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 16,
  },
  statCell: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 8,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCellLabel: {
    fontSize: 12,
    color: MUTED,
  },
  statCellValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E2937',
    marginTop: 2,
  },
  performanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedGaugeLabel: {
    position: 'absolute',
    top: '56%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  gaugeValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  performanceBox: {
    flex: 1,
    backgroundColor: '#1E2937',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  performanceBoxLabel: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  performanceBoxValue: {
    fontSize: 23,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  perfStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0EEE7',
  },
  perfStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  perfStatText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
  },
  sectionalScrollRow: {
    gap: 12,
    paddingBottom: 4,
  },
  sectionalCard: {
    width: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  sectionalCardHeader: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  sectionalCardHeaderText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  sectionalCardBody: {
    padding: 14,
    alignItems: 'center',
  },
  sectionalRingLabel: {
    fontSize: 9,
    color: MUTED,
    fontWeight: '600',
  },
  sectionalRingValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionalStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    width: '100%',
  },
  sectionalStatItem: {
    width: '50%',
    marginBottom: 10,
  },
  sectionalStatLabel: {
    fontSize: 10.5,
    color: MUTED,
  },
  sectionalStatValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  ratingLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 18,
  },
  ratingLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ratingLegendDot: {
    width: 9,
    height: 9,
    borderRadius: 2,
  },
  ratingLegendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  totalScoreWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  totalScoreRingLabel: {
    fontSize: 9.5,
    color: MUTED,
    fontWeight: '600',
  },
  totalScoreRingValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  totalScoreTierLabel: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
  },
  scoreBarsList: {
    gap: 14,
  },
  scoreBarRow: {
    gap: 5,
  },
  scoreBarLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
  },
  scoreBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EEEDE6',
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreBarValue: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  chartCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 10,
  },
  chartCaption: {
    fontSize: 12,
    color: MUTED,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
  },
  chartEmptyText: {
    fontSize: 12.5,
    color: MUTED,
    textAlign: 'center',
    paddingVertical: 30,
  },
  solutionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: NAVY,
    paddingVertical: 15,
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
    borderRadius: 28,
  },
  solutionsBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14.5,
  },
});
