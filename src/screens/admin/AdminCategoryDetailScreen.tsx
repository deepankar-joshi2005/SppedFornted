import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminHeader from '../../components/admin/AdminHeader';
import PrimaryButton from '../../components/PrimaryButton';
import { AdminNav } from '../../navigation/adminTypes';
import { AdminCategoryDetail, getCategoryDetail } from '../../services/admin/categories.service';
import { GOLD, MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  categoryId: string;
  nav: AdminNav;
};

export default function AdminCategoryDetailScreen({ token, categoryId, nav }: Props) {
  const [detail, setDetail] = useState<AdminCategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getCategoryDetail(token, categoryId);
      setDetail(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load category.');
    } finally {
      setLoading(false);
    }
  }, [token, categoryId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <AdminHeader
        title={detail?.name ?? 'Category'}
        subtitle={detail?.description}
        onBack={() => nav.pop()}
      />

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
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Series</Text>
              <Text style={styles.statValue}>{detail.seriesCount}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Tests</Text>
              <Text style={styles.statValue}>{detail.testCount}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Students</Text>
              <Text style={styles.statValue}>{detail.studentCount}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Active Test Series</Text>
          {detail.series.length === 0 && (
            <Text style={styles.emptyText}>No test series in this category yet.</Text>
          )}
          {detail.series.map((s) => (
            <Pressable
              key={s.id}
              style={styles.card}
              onPress={() => nav.push({ name: 'seriesTests', seriesId: s.id })}
            >
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardTitle}>{s.title}</Text>
                <Text style={styles.cardMeta}>
                  {s.totalTests} Tests • {s.totalQuestions} Questions
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  s.status === 'published' ? styles.statusPublished : styles.statusDraft,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    s.status === 'published' ? styles.statusTextPublished : styles.statusTextDraft,
                  ]}
                >
                  {s.status === 'published' ? 'Published' : 'Draft'}
                </Text>
              </View>
            </Pressable>
          ))}

          <PrimaryButton
            label="+ Add Test Series"
            onPress={() => nav.push({ name: 'createSeriesStep1', category: detail.name })}
          />
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
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
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
  sectionTitle: { fontSize: 15, fontWeight: '800', color: NAVY, marginBottom: 12 },
  emptyText: { fontSize: 12.5, color: MUTED, marginBottom: 16 },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    marginBottom: 12,
  },
  cardTextWrap: { flexShrink: 1 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: NAVY },
  cardMeta: { fontSize: 11.5, color: MUTED, marginTop: 3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusPublished: { backgroundColor: '#E1F5EA' },
  statusDraft: { backgroundColor: '#FDF1DC' },
  statusText: { fontSize: 10.5, fontWeight: '800' },
  statusTextPublished: { color: '#2E9E5B' },
  statusTextDraft: { color: GOLD },
});
