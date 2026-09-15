import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AdminHeader from '../../components/admin/AdminHeader';
import StepProgressHeader from '../../components/admin/StepProgressHeader';
import ToggleRow from '../../components/admin/ToggleRow';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import { AdminNav } from '../../navigation/adminTypes';
import {
  AccessType,
  getSeriesDetail,
  updateSeries,
} from '../../services/admin/series.service';
import { MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  seriesId: string;
  nav: AdminNav;
};

export default function AdminCreateSeriesStep2Screen({ token, seriesId, nav }: Props) {
  const [totalPapers, setTotalPapers] = useState('');
  const [validityMonths, setValidityMonths] = useState('12');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [accessType, setAccessType] = useState<AccessType>('paid');
  const [price, setPrice] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const detail = await getSeriesDetail(token, seriesId);
        setTotalPapers(String(detail.totalPapers || ''));
        setValidityMonths(String(detail.validityMonths || 12));
        setStartDate(detail.startDate ? detail.startDate.slice(0, 10) : '');
        setEndDate(detail.endDate ? detail.endDate.slice(0, 10) : '');
        setAccessType(detail.accessType);
        setPrice(String(detail.price || ''));
        setIsPublic(detail.isPublic);
      } catch (err) {
        Alert.alert('Failed to load test series', err instanceof Error ? err.message : '');
      } finally {
        setLoading(false);
      }
    })();
  }, [seriesId, token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSeries(token, seriesId, {
        totalPapers: totalPapers ? Number(totalPapers) : 0,
        validityMonths: validityMonths ? Number(validityMonths) : 12,
        startDate: startDate || null,
        endDate: endDate || null,
        accessType,
        price: accessType === 'free' ? 0 : Number(price) || 0,
        isPublic,
      });
      nav.replace({ name: 'seriesPreview', seriesId });
    } catch (err) {
      Alert.alert('Failed to save configuration', err instanceof Error ? err.message : '');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <AdminHeader title="Series Configuration" onBack={() => nav.pop()} />
      <StepProgressHeader steps={['Basic Info', 'Config', 'Preview']} currentIndex={1} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Total Mock Tests Count</Text>
          <FormInput
            icon="reader-outline"
            placeholder="e.g. 20"
            value={totalPapers}
            onChangeText={setTotalPapers}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Validity (in Months)</Text>
          <FormInput
            icon="calendar-outline"
            placeholder="12"
            value={validityMonths}
            onChangeText={setValidityMonths}
            keyboardType="number-pad"
          />

          <View style={styles.dateRow}>
            <View style={styles.dateCol}>
              <Text style={styles.label}>Start Date</Text>
              <FormInput
                icon="calendar-outline"
                placeholder="YYYY-MM-DD"
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.label}>End Date</Text>
              <FormInput
                icon="calendar-outline"
                placeholder="Optional"
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
          </View>

          <Text style={styles.label}>Access Settings</Text>
          <View style={styles.accessRow}>
            <Pressable
              style={[styles.accessOption, accessType === 'free' && styles.accessOptionActive]}
              onPress={() => setAccessType('free')}
            >
              <Text style={[styles.accessText, accessType === 'free' && styles.accessTextActive]}>
                Free Series
              </Text>
            </Pressable>
            <Pressable
              style={[styles.accessOption, accessType === 'paid' && styles.accessOptionActive]}
              onPress={() => setAccessType('paid')}
            >
              <Text style={[styles.accessText, accessType === 'paid' && styles.accessTextActive]}>
                Paid (Dynamic)
              </Text>
            </Pressable>
          </View>

          {accessType === 'paid' && (
            <>
              <Text style={styles.label}>Course/Series Base Price (₹)</Text>
              <FormInput
                icon="pricetag-outline"
                placeholder="499"
                value={price}
                onChangeText={setPrice}
                keyboardType="number-pad"
              />
            </>
          )}

          <View style={{ marginTop: 6 }}>
            <ToggleRow label="Public Visibility" value={isPublic} onChange={setIsPublic} />
          </View>

          <PrimaryButton
            label="GENERATE PREVIEW & SAVE"
            onPress={handleSave}
            loading={saving || loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  scrollContent: { padding: 18, paddingBottom: 40 },
  label: { fontSize: 12.5, fontWeight: '700', color: NAVY, marginBottom: 8, marginTop: 4 },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateCol: { flex: 1 },
  accessRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  accessOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9D6CC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  accessOptionActive: { borderColor: NAVY, backgroundColor: '#EEF1F7' },
  accessText: { fontSize: 13, fontWeight: '700', color: MUTED },
  accessTextActive: { color: NAVY },
});
