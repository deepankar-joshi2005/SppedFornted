import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../../components/PrimaryButton';
import { AdminNav } from '../../navigation/adminTypes';
import { getSeriesDetail } from '../../services/admin/series.service';
import { AdminTestDetail, getTestDetail } from '../../services/admin/tests.service';
import { MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  testId: string;
  nav: AdminNav;
};

export default function AdminPublishSuccessScreen({ token, testId, nav }: Props) {
  const [test, setTest] = useState<AdminTestDetail | null>(null);
  const [context, setContext] = useState<{ category: string; series: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const testDetail = await getTestDetail(token, testId);
      setTest(testDetail);
      const series = await getSeriesDetail(token, testDetail.series);
      setContext({ category: series.category, series: series.title });
    } finally {
      setLoading(false);
    }
  }, [token, testId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading || !test ? (
          <ActivityIndicator color={NAVY} size="large" style={{ marginTop: 60 }} />
        ) : (
          <>
            <View style={styles.iconWrap}>
              <Ionicons name="checkmark" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Published Successfully!</Text>
            <Text style={styles.subtitle}>
              {test.title} is now live and available in the Student App.
            </Text>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryHeading}>PUBLISHED SUMMARY</Text>
              <SummaryRow label="Category" value={context?.category ?? '—'} />
              <SummaryRow label="Series" value={context?.series ?? '—'} />
              <SummaryRow label="Test Name" value={test.title} />
              <SummaryRow label="Questions" value={`${test.totalQuestions} Questions`} />
              <SummaryRow label="Duration" value={`${test.durationMinutes} Minutes`} />
            </View>

            <PrimaryButton label="VIEW IN STUDENT APP" onPress={() => nav.resetToTab('tests')} />
            <Pressable style={styles.backBtn} onPress={() => nav.resetToTab('home')}>
              <Text style={styles.backBtnText}>Back to Dashboard</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  scrollContent: { padding: 24, paddingTop: 50, alignItems: 'center' },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2E9E5B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 21, fontWeight: '800', color: NAVY, textAlign: 'center' },
  subtitle: { fontSize: 13, color: MUTED, textAlign: 'center', marginTop: 10, paddingHorizontal: 12 },
  summaryCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    marginTop: 26,
    marginBottom: 26,
  },
  summaryHeading: { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 0.5, marginBottom: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 13, color: MUTED },
  summaryValue: { fontSize: 13.5, fontWeight: '800', color: NAVY },
  backBtn: { paddingVertical: 16, width: '100%', alignItems: 'center' },
  backBtnText: { fontSize: 13.5, fontWeight: '700', color: MUTED },
});
