import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Nav } from '../navigation/types';
import { useLanguage } from '../context/LanguageContext';
import { getHistory, HistoryItem } from '../services/attempts.service';
import { getPerformance, PerformanceData } from '../services/performance.service';
import { CARD_SHADOW, ERROR, GOLD, GOLD_GRADIENT, MUTED, NAVY, SOFT_SHADOW } from '../theme/colors';

type Props = {
  token: string;
  nav: Nav;
};

const masteryColor = (label: string): string => {
  if (label === 'Strong') return '#2E9E5B';
  if (label === 'Average') return GOLD;
  return ERROR;
};

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function ResultsTabScreen({ token, nav }: Props) {
  const { t } = useLanguage();
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [history, setHistory] = useState<HistoryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (isRefresh?: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const [perf, hist] = await Promise.all([getPerformance(token), getHistory(token)]);
        setPerformance(perf);
        setHistory(hist);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load results.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Text style={styles.headerTitle}>{t('results_performance', 'My Performance')}</Text>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={NAVY} />
        }
      >
        {loading && !performance && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={NAVY} size="large" />
          </View>
        )}

        {!!error && !performance && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {performance && (
          <>
            <View style={styles.statsGrid}>
              <StatCard label={t('tests_attempted', 'Attempted')} value={`${performance.attempted} ${t('tests_in_category', 'Tests')}`} />
              <StatCard label={t('avg_score', 'Avg Score')} value={`${performance.avgScore}%`} />
              <StatCard label={`${t('avg_score', 'Best Score')}`} value={`${performance.bestScore}%`} valueColor="#2E9E5B" />
              <StatCard
                label="Improvement"
                value={`${performance.improvement >= 0 ? '+' : ''}${performance.improvement}%`}
                valueColor={performance.improvement >= 0 ? NAVY : ERROR}
              />
            </View>

            {performance.scoreTrend.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  Mock Score Trend (Last {performance.scoreTrend.length} Tests)
                </Text>
                <View style={styles.chartWrap}>
                  {performance.scoreTrend.map((score, idx) => (
                    <View style={styles.barCol} key={idx}>
                      <View style={styles.barTrack}>
                        <LinearGradient
                          colors={GOLD_GRADIENT}
                          style={[styles.bar, { height: `${Math.max(score, 4)}%` }]}
                        />
                      </View>
                      <Text style={styles.barLabel}>{score}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {performance.subjectMastery.length > 0 && (
              <View style={styles.card}>
                <View style={styles.subjectHeaderRow}>
                  <Text style={styles.cardTitle}>Subject Mastery</Text>
                  <View style={styles.accuracyPill}>
                    <Text style={styles.accuracyPillText}>
                      {performance.overallAccuracy}% {t('accuracy', 'Accuracy')}
                    </Text>
                  </View>
                </View>
                {performance.subjectMastery.map((s) => (
                  <View key={s.subject} style={styles.subjectRow}>
                    <View style={styles.subjectLabelRow}>
                      <Text style={styles.subjectName}>{s.subject}</Text>
                      <Text style={[styles.subjectPercent, { color: masteryColor(s.label) }]}>
                        {s.accuracy}% ({s.label})
                      </Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${s.accuracy}%`, backgroundColor: masteryColor(s.label) },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <Text style={styles.sectionTitle}>{t('test_history', 'Test History')}</Text>
        {history?.length === 0 && (
          <Text style={styles.emptyText}>{t('no_history_yet', "You haven't completed any tests yet.")}</Text>
        )}
        {history?.map((item) => (
          <View style={styles.historyCard} key={item.attemptId}>
            <View style={styles.historyTopRow}>
              <Text style={styles.historyTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.historyDate}>{formatDate(item.submittedAt)}</Text>
            </View>
            <Text style={styles.historyMeta}>
              {t('score', 'Score')}: <Text style={styles.historyMetaBold}>{item.score}/100 ({item.scorePercent}%)</Text>
              {'   '}{t('rank_of', 'Rank')}: <Text style={styles.historyMetaBold}>#{item.rank}</Text>
            </Text>
            <View style={styles.historyBottomRow}>
              <Text style={[styles.passedText, !item.passed && styles.failedText]}>
                {item.passed ? t('passed', 'Passed') : t('failed', 'Not Passed')}
              </Text>
              <Pressable
                style={styles.viewResultBtn}
                onPress={() => nav.push({ name: 'testResult', attemptId: item.attemptId })}
              >
                <Text style={styles.viewResultText}>{t('test_result_title', 'View Result')}</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
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
    paddingBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 30,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FBEAE8',
  },
  errorText: {
    color: ERROR,
    fontSize: 13,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 6,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    ...SOFT_SHADOW,
  },
  statLabel: {
    fontSize: 12,
    color: MUTED,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: NAVY,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    ...CARD_SHADOW,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: NAVY,
  },
  chartWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 130,
    marginTop: 18,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    width: 16,
    height: 100,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    backgroundColor: NAVY,
    borderRadius: 5,
  },
  barLabel: {
    fontSize: 9.5,
    color: MUTED,
    marginTop: 6,
  },
  subjectHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accuracyPill: {
    backgroundColor: '#E4F5EA',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  accuracyPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E9E5B',
  },
  subjectRow: {
    marginTop: 16,
  },
  subjectLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  subjectName: {
    fontSize: 13,
    fontWeight: '700',
    color: NAVY,
  },
  subjectPercent: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EEEDE6',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
    marginTop: 26,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    color: MUTED,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    ...SOFT_SHADOW,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  historyTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: NAVY,
  },
  historyDate: {
    fontSize: 11,
    color: MUTED,
  },
  historyMeta: {
    fontSize: 12.5,
    color: MUTED,
    marginTop: 8,
  },
  historyMetaBold: {
    fontWeight: '700',
    color: NAVY,
  },
  historyBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  passedText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2E9E5B',
  },
  failedText: {
    color: ERROR,
  },
  viewResultBtn: {
    backgroundColor: NAVY,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  viewResultText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
