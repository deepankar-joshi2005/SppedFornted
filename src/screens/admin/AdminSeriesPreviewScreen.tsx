import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AdminHeader from '../../components/admin/AdminHeader';
import StepProgressHeader from '../../components/admin/StepProgressHeader';
import PrimaryButton from '../../components/PrimaryButton';
import { resolveAssetUrl } from '../../config/api';
import { AdminNav } from '../../navigation/adminTypes';
import { AdminSeriesDetail, getSeriesDetail, publishSeries } from '../../services/admin/series.service';
import { GOLD, MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  seriesId: string;
  nav: AdminNav;
};

export default function AdminSeriesPreviewScreen({ token, seriesId, nav }: Props) {
  const [detail, setDetail] = useState<AdminSeriesDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getSeriesDetail(token, seriesId);
      setDetail(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview.');
    } finally {
      setLoading(false);
    }
  }, [token, seriesId]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await publishSeries(token, seriesId);
      Alert.alert('Published', 'This test series is now live for students.', [
        { text: 'OK', onPress: () => nav.resetToTab('tests') },
      ]);
    } catch (err) {
      Alert.alert('Failed to publish', err instanceof Error ? err.message : '');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <View style={styles.root}>
      <AdminHeader title="Series Live Preview" onBack={() => nav.pop()} />
      <StepProgressHeader steps={['Basic Info', 'Config', 'Preview']} currentIndex={2} />

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
          <Text style={styles.hint}>
            This is how the test series appears inside the Student Portal App:
          </Text>

          <View style={styles.previewCard}>
            {detail.bannerImage ? (
              <Image
                source={{ uri: resolveAssetUrl(detail.bannerImage) }}
                style={styles.banner}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.banner, styles.bannerPlaceholder]} />
            )}

            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{detail.category}</Text>
              </View>
              {!!detail.examTarget && (
                <View style={[styles.badge, styles.badgeAlt]}>
                  <Text style={[styles.badgeText, styles.badgeAltText]}>{detail.examTarget}</Text>
                </View>
              )}
            </View>

            <Text style={styles.previewTitle}>{detail.title}</Text>
            <Text style={styles.previewDesc} numberOfLines={2}>
              {detail.description || detail.shortDescription || 'No description added yet.'}
            </Text>

            <View style={styles.previewFooter}>
              <Text style={styles.footerText}>{detail.totalPapers} Full Tests</Text>
              <Text style={styles.footerText}>
                {detail.totalQuestions} Qs • {detail.difficulty}
              </Text>
              <Text style={styles.footerPrice}>
                {detail.accessType === 'free' ? 'Free' : `₹${detail.price} Only`}
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              style={styles.editBtn}
              onPress={() => nav.replace({ name: 'createSeriesStep1', seriesId })}
            >
              <Text style={styles.editBtnText}>Edit Info</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label={detail.status === 'published' ? 'RE-PUBLISH' : 'PUBLISH LIVE'}
                onPress={handlePublish}
                loading={publishing}
              />
            </View>
          </View>
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
  hint: { fontSize: 12.5, color: MUTED, marginBottom: 14 },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    overflow: 'hidden',
    marginBottom: 20,
  },
  banner: { width: '100%', height: 130 },
  bannerPlaceholder: { backgroundColor: '#DCE3F0' },
  badgeRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, marginTop: 12 },
  badge: { backgroundColor: '#EEF1F7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeAlt: { backgroundColor: '#E1F5EA' },
  badgeText: { fontSize: 11, fontWeight: '700', color: NAVY },
  badgeAltText: { color: '#2E9E5B' },
  previewTitle: { fontSize: 16, fontWeight: '800', color: NAVY, marginTop: 10, paddingHorizontal: 14 },
  previewDesc: { fontSize: 12, color: MUTED, marginTop: 6, paddingHorizontal: 14 },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0EFE9',
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  footerText: { fontSize: 11.5, color: MUTED },
  footerPrice: { fontSize: 12.5, fontWeight: '800', color: GOLD },
  actionsRow: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  editBtn: {
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#D9D6CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: { fontSize: 13.5, fontWeight: '700', color: NAVY },
});
