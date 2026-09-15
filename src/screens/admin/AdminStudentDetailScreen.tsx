import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AdminHeader from '../../components/admin/AdminHeader';
import { AdminNav } from '../../navigation/adminTypes';
import { AdminStudentDetail, getStudentDetail } from '../../services/admin/students.service';
import { GOLD, MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  studentId: string;
  nav: AdminNav;
};

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function AdminStudentDetailScreen({ token, studentId, nav }: Props) {
  const [detail, setDetail] = useState<AdminStudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <View style={styles.root}>
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
            <Text style={styles.infoRow}>Joined: {formatDate(detail.joinedAt)}</Text>
            <Text style={styles.infoRow}>Total Attempts: {detail.attempts.length}</Text>
          </View>

          <Text style={styles.sectionTitle}>Attempt History</Text>
          {detail.attempts.length === 0 && (
            <Text style={styles.emptyText}>No attempts yet.</Text>
          )}
          {detail.attempts.map((a) => (
            <View key={a.attemptId} style={styles.card}>
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardTitle}>{a.title}</Text>
                <Text style={styles.cardMeta}>
                  {a.status === 'completed' ? formatDate(a.submittedAt) : 'In Progress'}
                </Text>
              </View>
              {a.status === 'completed' ? (
                <Text style={styles.score}>{a.scorePercent}%</Text>
              ) : (
                <Text style={styles.inProgress}>In Progress</Text>
              )}
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
  scrollContent: { padding: 18, paddingBottom: 40 },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    marginBottom: 22,
    gap: 6,
  },
  infoRow: { fontSize: 13, color: NAVY, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: NAVY, marginBottom: 12 },
  emptyText: { fontSize: 12.5, color: MUTED },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    marginBottom: 10,
  },
  cardTextWrap: { flexShrink: 1 },
  cardTitle: { fontSize: 13.5, fontWeight: '700', color: NAVY },
  cardMeta: { fontSize: 11.5, color: MUTED, marginTop: 3 },
  score: { fontSize: 15, fontWeight: '800', color: GOLD },
  inProgress: { fontSize: 11.5, fontWeight: '700', color: MUTED },
});
