import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AdminHeader from '../../components/admin/AdminHeader';
import PrimaryButton from '../../components/PrimaryButton';
import { AdminNav } from '../../navigation/adminTypes';
import { AdminSeriesTestItem, getSeriesTests } from '../../services/admin/series.service';
import { publishTest } from '../../services/admin/tests.service';
import { GOLD, MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  seriesId: string;
  nav: AdminNav;
};

export default function AdminSeriesTestsScreen({ token, seriesId, nav }: Props) {
  const [seriesTitle, setSeriesTitle] = useState('');
  const [tests, setTests] = useState<AdminSeriesTestItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getSeriesTests(token, seriesId);
      setSeriesTitle(result.series.title);
      setTests(result.tests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tests.');
    } finally {
      setLoading(false);
    }
  }, [token, seriesId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDirectPublish = async (testId: string, testTitle: string) => {
    try {
      await publishTest(token, testId);
      Alert.alert('Published', `"${testTitle}" is now live and all students have received a notification!`);
      load();
    } catch (err) {
      Alert.alert('Cannot Publish', err instanceof Error ? err.message : 'Failed to publish test.');
    }
  };

  const totalQuestions = (tests ?? []).reduce((sum, t) => sum + t.totalQuestions, 0);

  return (
    <View style={styles.root}>
      <AdminHeader
        title={seriesTitle || 'Test Series'}
        subtitle="Manage all tests in this series"
        onBack={() => nav.pop()}
      />

      {loading && !tests && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={NAVY} size="large" />
        </View>
      )}

      {!!error && !tests && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={load}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </Pressable>
        </View>
      )}

      {tests && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Tests</Text>
              <Text style={styles.statValue}>{tests.length}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Questions</Text>
              <Text style={styles.statValue}>{totalQuestions}</Text>
            </View>
          </View>

          <PrimaryButton
            label="+ Add Test"
            onPress={() => nav.push({ name: 'createTestStep1', seriesId })}
          />

          {tests.length === 0 && (
            <Text style={styles.emptyText}>No tests added yet. Tap "Add Test" to create one.</Text>
          )}

          {tests.map((t) => (
            <View key={t.id} style={styles.card}>
              <Text style={styles.title}>{t.title}</Text>
              <Text style={styles.meta}>
                {t.totalQuestions} Questions • {t.durationMinutes} Minutes • {t.totalMarks} Marks
              </Text>
              <View style={styles.cardFooter}>
                <View
                  style={[
                    styles.statusBadge,
                    t.status === 'published' ? styles.statusPublished : styles.statusDraft,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      t.status === 'published' ? styles.statusTextPublished : styles.statusTextDraft,
                    ]}
                  >
                    {t.status === 'published' ? 'Published' : 'Draft'}
                  </Text>
                </View>
                <View style={styles.linkRow}>
                  {t.status === 'draft' && (
                    <Pressable onPress={() => handleDirectPublish(t.id, t.title)}>
                      <Text style={[styles.linkText, { color: '#2E9E5B' }]}>Publish</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => nav.push({ name: 'createTestStep1', seriesId, testId: t.id })}
                  >
                    <Text style={styles.linkText}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => nav.push({ name: 'manageQuestions', testId: t.id })}>
                    <Text style={styles.linkText}>Questions</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  loadingBox: { paddingVertical: 60, alignItems: 'center' },
  errorBox: { margin: 18, padding: 16, borderRadius: 12, backgroundColor: '#FBEAE8', alignItems: 'center' },
  errorText: { color: '#C0392B', fontSize: 13, textAlign: 'center' },
  retryText: { marginTop: 8, color: NAVY, fontWeight: '700', fontSize: 12.5 },
  scrollContent: { padding: 18, paddingBottom: 40, gap: 12 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  statLabel: { fontSize: 11.5, color: MUTED },
  statValue: { fontSize: 18, fontWeight: '800', color: NAVY, marginTop: 4 },
  emptyText: { fontSize: 12.5, color: MUTED, textAlign: 'center', marginTop: 10 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  title: { fontSize: 14, fontWeight: '800', color: NAVY },
  meta: { fontSize: 11.5, color: MUTED, marginTop: 5 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0EFE9',
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusPublished: { backgroundColor: '#E1F5EA' },
  statusDraft: { backgroundColor: '#FDF1DC' },
  statusText: { fontSize: 10, fontWeight: '800' },
  statusTextPublished: { color: '#2E9E5B' },
  statusTextDraft: { color: GOLD },
  linkRow: { flexDirection: 'row', gap: 16 },
  linkText: { fontSize: 12.5, fontWeight: '700', color: NAVY },
});
