import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminHeader from '../../components/admin/AdminHeader';
import { AdminNav } from '../../navigation/adminTypes';
import {
  AdminStudentDetail,
  deleteStudent,
  getStudentDetail,
  setCoachingTag,
} from '../../services/admin/students.service';
import { ERROR, GOLD, MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  studentId: string;
  nav: AdminNav;
};

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
};

const weakAreaColor = (accuracy: number): string => {
  if (accuracy >= 75) return '#2E9E5B';
  if (accuracy >= 50) return GOLD;
  return ERROR;
};

export default function AdminStudentDetailScreen({ token, studentId, nav }: Props) {
  const [detail, setDetail] = useState<AdminStudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tagBusy, setTagBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getStudentDetail(token, studentId);
      setDetail(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load student.');
    } finally {
      setLoading(false);
    }
  }, [token, studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleTag = async () => {
    if (!detail) return;
    const next = !detail.isCoachingStudent;
    setTagBusy(true);
    try {
      await setCoachingTag(token, studentId, next);
      setDetail((prev) => (prev ? { ...prev, isCoachingStudent: next } : prev));
    } catch (err) {
      Alert.alert('Failed', err instanceof Error ? err.message : 'Could not update tag.');
    } finally {
      setTagBusy(false);
    }
  };

  const handleDelete = () => {
    if (!detail) return;
    Alert.alert(
      'Delete Student',
      `Are you sure you want to permanently delete ${detail.name}? This will remove their account and all attempt history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleteBusy(true);
            try {
              await deleteStudent(token, studentId);
              nav.pop();
            } catch (err) {
              Alert.alert('Failed', err instanceof Error ? err.message : 'Could not delete student.');
              setDeleteBusy(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <AdminHeader title={detail?.name ?? 'Student'} subtitle={detail?.email} onBack={() => nav.pop()} />

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={NAVY} size="large" />
        </View>
      )}

      {!!error && !detail && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={load}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </Pressable>
        </View>
      )}

      {detail && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.infoCard}>
            <Text style={styles.infoRow}>Mobile: {detail.mobile}</Text>
            <Text style={styles.infoRow}>
              Location: {[detail.city, detail.state].filter(Boolean).join(', ') || '—'}
            </Text>
            <Text style={styles.infoRow}>Joined: {formatDate(detail.joinedAt)}</Text>
            <View style={styles.tagRow}>
              <View
                style={[
                  styles.tagPill,
                  detail.isCoachingStudent ? styles.tagPillOn : styles.tagPillOff,
                ]}
              >
                <Ionicons
                  name={detail.isCoachingStudent ? 'checkmark-circle' : 'close-circle-outline'}
                  size={14}
                  color={detail.isCoachingStudent ? '#2E9E5B' : MUTED}
                />
                <Text
                  style={[
                    styles.tagPillText,
                    { color: detail.isCoachingStudent ? '#2E9E5B' : MUTED },
                  ]}
                >
                  {detail.isCoachingStudent ? 'Coaching Student' : 'Not Tagged'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionBtn, styles.actionBtnPrimary]}
              onPress={handleToggleTag}
              disabled={tagBusy}
            >
              {tagBusy ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.actionBtnPrimaryText}>
                  {detail.isCoachingStudent ? 'Remove Coaching Tag' : 'Grant Coaching Student Tag'}
                </Text>
              )}
            </Pressable>
            <Pressable
              style={[styles.actionBtn, styles.actionBtnDanger]}
              onPress={handleDelete}
              disabled={deleteBusy}
            >
              {deleteBusy ? (
                <ActivityIndicator color={ERROR} size="small" />
              ) : (
                <Text style={styles.actionBtnDangerText}>Delete Student</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{detail.stats.attemptCount}</Text>
              <Text style={styles.statLabel}>Tests Attempted</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{detail.stats.avgScore}%</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#2E9E5B' }]}>₹{detail.stats.totalSpent || 0}</Text>
              <Text style={styles.statLabel}>Total Spent ({detail.stats.purchasesCount || 0} bought)</Text>
            </View>
          </View>

          {detail.purchasedSeries && detail.purchasedSeries.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Purchased Test Series</Text>
              <View style={{ marginBottom: 20, gap: 10 }}>
                {detail.purchasedSeries.map((p) => (
                  <View key={p.purchaseId} style={styles.card}>
                    <View style={styles.cardTopRow}>
                      <View style={styles.cardTextWrap}>
                        <Text style={styles.cardTitle}>{p.title}</Text>
                        <Text style={styles.cardMeta}>Purchased on {formatDate(p.purchasedAt)}</Text>
                      </View>
                      <Text style={[styles.score, { color: '#2E9E5B' }]}>₹{p.amountPaid}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {detail.weakAreas.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Section-wise Analysis (Weakest First)</Text>
              <View style={styles.weakCard}>
                {detail.weakAreas.map((w) => (
                  <View key={w.name} style={styles.weakRow}>
                    <View style={styles.weakLabelRow}>
                      <Text style={styles.weakName}>{w.name}</Text>
                      <Text style={[styles.weakPercent, { color: weakAreaColor(w.accuracy) }]}>
                        {w.accuracy}% ({w.correct}/{w.total})
                      </Text>
                    </View>
                    <View style={styles.weakTrack}>
                      <View
                        style={[
                          styles.weakFill,
                          { width: `${w.accuracy}%`, backgroundColor: weakAreaColor(w.accuracy) },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>Attempt History</Text>
          {detail.attempts.length === 0 && (
            <Text style={styles.emptyText}>No attempts yet.</Text>
          )}
          {detail.attempts.map((a) => (
            <View key={a.attemptId} style={styles.card}>
              <View style={styles.cardTopRow}>
                <View style={styles.cardTextWrap}>
                  <Text style={styles.cardTitle}>{a.title}</Text>
                  <Text style={styles.cardMeta}>
                    {a.status === 'completed' ? formatDate(a.submittedAt) : 'In Progress'}
                    {a.status === 'completed' &&
                      a.timeTakenSeconds !== null &&
                      ` • ${formatDuration(a.timeTakenSeconds)}`}
                  </Text>
                </View>
                {a.status === 'completed' ? (
                  <Text style={styles.score}>{a.scorePercent}%</Text>
                ) : (
                  <Text style={styles.inProgress}>In Progress</Text>
                )}
              </View>

              {a.sectionBreakdown.length > 0 && (
                <View style={styles.sectionBreakdownWrap}>
                  {a.sectionBreakdown.map((s) => (
                    <View key={s.name} style={styles.sectionBreakdownRow}>
                      <Text style={styles.sectionBreakdownName} numberOfLines={1}>
                        {s.name}
                      </Text>
                      <Text style={styles.sectionBreakdownValue}>
                        {s.correct}/{s.total} • {formatDuration(s.timeSpentSeconds)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  loadingBox: { paddingVertical: 60, alignItems: 'center' },
  errorBox: { margin: 18, padding: 16, borderRadius: 12, backgroundColor: '#FBEAE8', alignItems: 'center' },
  errorText: { color: '#C0392B', fontSize: 13, textAlign: 'center' },
  retryText: { marginTop: 8, color: NAVY, fontWeight: '700', fontSize: 12.5 },
  scrollContent: { padding: 18, paddingBottom: 40 },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    marginBottom: 14,
    gap: 6,
  },
  infoRow: { fontSize: 13, color: NAVY, fontWeight: '600' },
  tagRow: { marginTop: 4, flexDirection: 'row' },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagPillOn: { backgroundColor: '#E4F5EA' },
  tagPillOff: { backgroundColor: '#EEEDE6' },
  tagPillText: { fontSize: 11.5, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  actionBtnPrimary: { backgroundColor: NAVY },
  actionBtnPrimaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12.5 },
  actionBtnDanger: { borderWidth: 1.4, borderColor: ERROR, backgroundColor: '#FDF0EF' },
  actionBtnDangerText: { color: ERROR, fontWeight: '700', fontSize: 12.5 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  statValue: { fontSize: 17, fontWeight: '800', color: NAVY },
  statLabel: { fontSize: 10.5, color: MUTED, marginTop: 3, textAlign: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: NAVY, marginBottom: 12 },
  weakCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    marginBottom: 22,
    gap: 14,
  },
  weakRow: {},
  weakLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  weakName: { fontSize: 13, fontWeight: '700', color: NAVY, flexShrink: 1 },
  weakPercent: { fontSize: 12, fontWeight: '800' },
  weakTrack: { height: 6, borderRadius: 3, backgroundColor: '#EEEDE6', overflow: 'hidden' },
  weakFill: { height: '100%', borderRadius: 3 },
  emptyText: { fontSize: 12.5, color: MUTED },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    marginBottom: 10,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTextWrap: { flexShrink: 1 },
  cardTitle: { fontSize: 13.5, fontWeight: '700', color: NAVY },
  cardMeta: { fontSize: 11.5, color: MUTED, marginTop: 3 },
  score: { fontSize: 15, fontWeight: '800', color: GOLD },
  inProgress: { fontSize: 11.5, fontWeight: '700', color: MUTED },
  sectionBreakdownWrap: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0EEE7',
    gap: 6,
  },
  sectionBreakdownRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  sectionBreakdownName: { fontSize: 11.5, color: NAVY, fontWeight: '600', flexShrink: 1 },
  sectionBreakdownValue: { fontSize: 11.5, color: MUTED },
});
