import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AdminHeader from '../../components/admin/AdminHeader';
import ToggleRow from '../../components/admin/ToggleRow';
import PrimaryButton from '../../components/PrimaryButton';
import { AdminNav } from '../../navigation/adminTypes';
import {
  AdminTestDetail,
  getTestDetail,
  setSubjectSections,
  SubjectSection,
} from '../../services/admin/tests.service';
import { ERROR, MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  testId: string;
  nav: AdminNav;
};

type SectionRow = { name: string; startNo: string; endNo: string };

const toRows = (sections: SubjectSection[]): SectionRow[] =>
  sections.map((s) => ({ name: s.name, startNo: String(s.startNo), endNo: String(s.endNo) }));

export default function AdminSubjectSectionsScreen({ token, testId, nav }: Props) {
  const [test, setTest] = useState<AdminTestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [rows, setRows] = useState<SectionRow[]>([{ name: '', startNo: '1', endNo: '' }]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const detail = await getTestDetail(token, testId);
        setTest(detail);
        if (detail.subjectSections && detail.subjectSections.length > 0) {
          setEnabled(true);
          setRows(toRows(detail.subjectSections));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load test.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, testId]);

  const totalQuestions = test?.totalQuestions ?? 0;

  const addRow = () => {
    const lastEnd = rows.length > 0 ? Number(rows[rows.length - 1].endNo) || 0 : 0;
    setRows((r) => [...r, { name: '', startNo: String(lastEnd + 1), endNo: '' }]);
  };

  const removeRow = (idx: number) => {
    setRows((r) => r.filter((_, i) => i !== idx));
  };

  const updateRow = (idx: number, patch: Partial<SectionRow>) => {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const handleContinue = async () => {
    setError('');
    setSaving(true);
    try {
      if (!enabled) {
        await setSubjectSections(token, testId, { enabled: false, sections: [] });
      } else {
        const sections: SubjectSection[] = rows.map((r) => ({
          name: r.name.trim(),
          startNo: Number(r.startNo),
          endNo: Number(r.endNo),
        }));
        await setSubjectSections(token, testId, { enabled: true, sections });
      }
      nav.push({ name: 'studentPreview', testId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save subject sections.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <AdminHeader title="Subject Sections" onBack={() => nav.pop()} />
        <View style={styles.loadingBox}>
          <ActivityIndicator color={NAVY} size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AdminHeader title="Subject Sections" subtitle={test?.title} onBack={() => nav.pop()} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ToggleRow
          label="Divide this test by subject?"
          description="Students will see subject tabs on the test screen and can jump straight to a subject's first question."
          value={enabled}
          onChange={setEnabled}
        />

        {enabled && (
          <>
            <Text style={styles.hint}>
              This test has {totalQuestions} question{totalQuestions === 1 ? '' : 's'}. Enter the
              question number range for each subject — for example, 1 to 40 for General
              Knowledge, then 41 to 70 for Uttarakhand GK.
            </Text>

            {rows.map((row, idx) => (
              <View key={idx} style={styles.sectionCard}>
                <View style={styles.sectionCardHeader}>
                  <Text style={styles.sectionCardTitle}>Section {idx + 1}</Text>
                  {rows.length > 1 && (
                    <Pressable onPress={() => removeRow(idx)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={ERROR} />
                    </Pressable>
                  )}
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Subject name (e.g. Uttarakhand GK)"
                  placeholderTextColor="#9AA3B2"
                  value={row.name}
                  onChangeText={(v) => updateRow(idx, { name: v })}
                />
                <View style={styles.rangeRow}>
                  <View style={styles.rangeField}>
                    <Text style={styles.rangeLabel}>From Q. No.</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      placeholder="1"
                      placeholderTextColor="#9AA3B2"
                      value={row.startNo}
                      onChangeText={(v) => updateRow(idx, { startNo: v.replace(/[^0-9]/g, '') })}
                    />
                  </View>
                  <View style={styles.rangeField}>
                    <Text style={styles.rangeLabel}>To Q. No.</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      placeholder="40"
                      placeholderTextColor="#9AA3B2"
                      value={row.endNo}
                      onChangeText={(v) => updateRow(idx, { endNo: v.replace(/[^0-9]/g, '') })}
                    />
                  </View>
                </View>
              </View>
            ))}

            <Pressable style={styles.addRowBtn} onPress={addRow}>
              <Ionicons name="add-circle-outline" size={18} color={NAVY} />
              <Text style={styles.addRowText}>Add Another Subject</Text>
            </Pressable>
          </>
        )}

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <PrimaryButton
          label={enabled ? 'Save & Continue to Preview' : 'Continue to Preview'}
          onPress={handleContinue}
          loading={saving}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  loadingBox: { paddingVertical: 60, alignItems: 'center' },
  scrollContent: { padding: 18, paddingBottom: 30 },
  hint: {
    fontSize: 12,
    color: MUTED,
    marginTop: 14,
    marginBottom: 14,
    lineHeight: 17,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    marginBottom: 12,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: NAVY,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E7E5DE',
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: NAVY,
    marginBottom: 10,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rangeField: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: MUTED,
    marginBottom: 6,
  },
  addRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    paddingVertical: 13,
    marginTop: 4,
  },
  addRowText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: NAVY,
  },
  errorBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FBEAE8',
  },
  errorText: {
    color: ERROR,
    fontSize: 12.5,
    textAlign: 'center',
  },
  bottomBar: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EDEBE4',
  },
});
