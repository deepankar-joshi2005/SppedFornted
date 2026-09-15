import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AdminHeader from '../../components/admin/AdminHeader';
import PrimaryButton from '../../components/PrimaryButton';
import { AdminNav } from '../../navigation/adminTypes';
import { getSeriesDetail } from '../../services/admin/series.service';
import { getPublishChecklist, getTestDetail, PublishChecklist, publishTest } from '../../services/admin/tests.service';
import { GOLD, MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  testId: string;
  nav: AdminNav;
};

export default function AdminPublishTestScreen({ token, testId, nav }: Props) {
  const [checklist, setChecklist] = useState<PublishChecklist | null>(null);
  const [path, setPath] = useState<{ category: string; series: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [checklistResult, test] = await Promise.all([
        getPublishChecklist(token, testId),
        getTestDetail(token, testId),
      ]);
      setChecklist(checklistResult);
      const series = await getSeriesDetail(token, test.series);
      setPath({ category: series.category, series: series.title });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load publish checklist.');
    } finally {
      setLoading(false);
    }
  }, [token, testId]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await publishTest(token, testId);
      nav.replace({ name: 'publishSuccess', testId });
    } catch (err) {
      Alert.alert('Failed to publish', err instanceof Error ? err.message : '');
    } finally {
      setPublishing(false);
    }
  };

  const checklistItems = checklist
    ? [
        { label: 'Test Name Added', ok: checklist.checklist.nameAdded },
        { label: `${checklist.questionCount} Questions Added`, ok: checklist.checklist.questionsAdded },
        { label: `Duration Set (${checklist.summary.durationMinutes} mins)`, ok: checklist.checklist.durationSet },
        { label: `Marks Configured (${checklist.summary.totalMarks} total)`, ok: checklist.checklist.marksConfigured },
        { label: 'Negative Marking Enabled', ok: checklist.checklist.negativeMarkingConfigured },
        { label: 'All Questions Validated', ok: checklist.checklist.allValidated },
      ]
    : [];

  const canPublish = checklist?.checklist.questionsAdded ?? false;

  return (
    <View style={styles.root}>
      <AdminHeader title="Publish Test" subtitle="Verify checklist to go live" onBack={() => nav.pop()} />

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={NAVY} size="large" />
        </View>
      )}

      {!!error && !checklist && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={load}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </Pressable>
        </View>
      )}

      {checklist && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ready to Publish?</Text>
            {checklistItems.map((item) => (
              <View key={item.label} style={styles.checkRow}>
                <Ionicons
                  name={item.ok ? 'checkmark-circle' : 'close-circle'}
                  size={18}
                  color={item.ok ? '#2E9E5B' : '#C0392B'}
                />
                <Text style={styles.checkLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          {path && (
            <View style={styles.pathCard}>
              <Text style={styles.pathLabel}>STUDENT APP DISPLAY PATH</Text>
              <Text style={styles.pathText}>
                {path.category} <Text style={styles.pathArrow}>›</Text> {path.series}{' '}
                <Text style={styles.pathArrow}>›</Text> {checklist.title}
              </Text>
            </View>
          )}

          <View style={styles.warningBox}>
            <Ionicons name="lock-closed" size={16} color={GOLD} />
            <Text style={styles.warningText}>
              Once published, this test will become immediately visible to students on the Portal.
              It cannot be reverted back to draft status easily.
            </Text>
          </View>

          <PrimaryButton
            label="PUBLISH TEST NOW"
            onPress={handlePublish}
            loading={publishing}
            disabled={!canPublish}
          />
          <Pressable style={styles.cancelBtn} onPress={() => nav.pop()}>
            <Text style={styles.cancelBtnText}>Cancel & Return</Text>
          </Pressable>
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
  scrollContent: { padding: 18, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    marginBottom: 16,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: NAVY, marginBottom: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  checkLabel: { fontSize: 13.5, color: NAVY },
  pathCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    marginBottom: 16,
  },
  pathLabel: { fontSize: 10.5, fontWeight: '800', color: MUTED, marginBottom: 8 },
  pathText: { fontSize: 13, fontWeight: '700', color: NAVY },
  pathArrow: { color: MUTED },
  warningBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FDF1DC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  warningText: { flex: 1, fontSize: 12, color: '#8A6416', lineHeight: 17 },
  cancelBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelBtnText: { fontSize: 13.5, fontWeight: '700', color: MUTED },
});
