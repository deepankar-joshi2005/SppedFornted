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
import { SafeAreaView } from 'react-native-safe-area-context';
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

type SectionRow = { name: string; startNo: string; endNo: string; durationMinutes: string };

const toRows = (sections: SubjectSection[]): SectionRow[] =>
  sections.map((s) => ({
    name: s.name,
    startNo: String(s.startNo),
    endNo: String(s.endNo),
    durationMinutes: s.durationMinutes != null ? String(s.durationMinutes) : '',
  }));

export default function AdminSubjectSectionsScreen({ token, testId, nav }: Props) {
  const [test, setTest] = useState<AdminTestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [rows, setRows] = useState<SectionRow[]>([
    { name: '', startNo: '1', endNo: '', durationMinutes: '' },
  ]);
  const [divideByTime, setDivideByTime] = useState(false);
  const [orderedIndexes, setOrderedIndexes] = useState<number[]>([0]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const detail = await getTestDetail(token, testId);
        setTest(detail);
        if (detail.subjectSections && detail.subjectSections.length > 0) {
          setEnabled(true);
          setRows(toRows(detail.subjectSections));
          setDivideByTime(detail.divideSectionsByTime);
          if (
            detail.divideSectionsByTime &&
            detail.sectionOrder.length === detail.subjectSections.length
          ) {
            const nameToIndex = new Map(detail.subjectSections.map((s, i) => [s.name, i]));
            setOrderedIndexes(detail.sectionOrder.map((n) => nameToIndex.get(n) ?? 0));
          } else {
            setOrderedIndexes(detail.subjectSections.map((_, i) => i));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load test.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, testId]);

  const totalQuestions = test?.totalQuestions ?? 0;
  const totalDuration = test?.durationMinutes ?? 0;
  const sumMinutes = rows.reduce((sum, r) => sum + (Number(r.durationMinutes) || 0), 0);
  const durationMismatch = divideByTime && sumMinutes !== totalDuration;
  const durationDiff = totalDuration - sumMinutes;

  const addRow = () => {
    const lastEnd = rows.length > 0 ? Number(rows[rows.length - 1].endNo) || 0 : 0;
    setOrderedIndexes((idxs) => [...idxs, rows.length]);
    setRows((r) => [...r, { name: '', startNo: String(lastEnd + 1), endNo: '', durationMinutes: '' }]);
  };

  const removeRow = (idx: number) => {
    setRows((r) => r.filter((_, i) => i !== idx));
    setOrderedIndexes((idxs) => idxs.filter((i) => i !== idx).map((i) => (i > idx ? i - 1 : i)));
  };

  const updateRow = (idx: number, patch: Partial<SectionRow>) => {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const moveOrder = (pos: number, dir: -1 | 1) => {
    setOrderedIndexes((idxs) => {
      const target = pos + dir;
      if (target < 0 || target >= idxs.length) return idxs;
      const next = [...idxs];
      [next[pos], next[target]] = [next[target], next[pos]];
      return next;
    });
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
          durationMinutes: divideByTime ? Number(r.durationMinutes) || 0 : undefined,
        }));
        await setSubjectSections(token, testId, {
          enabled: true,
          sections,
          divideSectionsByTime: divideByTime,
          sectionOrder: divideByTime ? orderedIndexes.map((i) => rows[i].name.trim()) : [],
        });
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
      <SafeAreaView style={styles.root} edges={['top']}>
        <AdminHeader title="Subject Sections" onBack={() => nav.pop()} />
        <View style={styles.loadingBox}>
          <ActivityIndicator color={NAVY} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
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

            <View style={{ marginBottom: 14 }}>
              <ToggleRow
                label="Divide by Time?"
                description="Give each section its own time limit. Students get locked into the current section until its time ends or they submit it."
                value={divideByTime}
                onChange={setDivideByTime}
              />
            </View>

            {divideByTime && (
              <Text style={styles.totalDurationText}>
                Total test duration: {totalDuration} minute{totalDuration === 1 ? '' : 's'}
              </Text>
            )}

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
                {divideByTime && (
                  <View style={styles.rangeField}>
                    <Text style={styles.rangeLabel}>Duration (minutes)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      placeholder="e.g. 30"
                      placeholderTextColor="#9AA3B2"
                      value={row.durationMinutes}
                      onChangeText={(v) => updateRow(idx, { durationMinutes: v.replace(/[^0-9]/g, '') })}
                    />
                  </View>
                )}
              </View>
            ))}

            <Pressable style={styles.addRowBtn} onPress={addRow}>
              <Ionicons name="add-circle-outline" size={18} color={NAVY} />
              <Text style={styles.addRowText}>Add Another Subject</Text>
            </Pressable>

            {divideByTime && durationMismatch && (
              <View style={styles.mismatchBanner}>
                <Text style={styles.mismatchText}>
                  Section durations add up to {sumMinutes} minute{sumMinutes === 1 ? '' : 's'}, but
                  the test is {totalDuration} minute{totalDuration === 1 ? '' : 's'}.{' '}
                  {durationDiff > 0
                    ? `Add ${durationDiff} more minute${durationDiff === 1 ? '' : 's'} to the sections.`
                    : `Remove ${-durationDiff} minute${-durationDiff === 1 ? '' : 's'} from the sections.`}
                </Text>
              </View>
            )}

            {divideByTime && !durationMismatch && (
              <>
                <Text style={[styles.hint, { marginTop: 20 }]}>
                  Choose the order in which students will see the sections:
                </Text>
                {orderedIndexes.map((rowIdx, pos) => (
                  <View key={rowIdx} style={styles.orderRow}>
                    <Text style={styles.orderPosition}>{pos + 1}</Text>
                    <Text style={styles.orderName} numberOfLines={1}>
                      {rows[rowIdx]?.name || `Section ${rowIdx + 1}`}
                    </Text>
                    <View style={styles.orderArrows}>
                      <Pressable
                        style={styles.orderArrowBtn}
                        onPress={() => moveOrder(pos, -1)}
                        disabled={pos === 0}
                        hitSlop={8}
                      >
                        <Ionicons name="chevron-up" size={18} color={pos === 0 ? '#C7C4BA' : NAVY} />
                      </Pressable>
                      <Pressable
                        style={styles.orderArrowBtn}
                        onPress={() => moveOrder(pos, 1)}
                        disabled={pos === orderedIndexes.length - 1}
                        hitSlop={8}
                      >
                        <Ionicons
                          name="chevron-down"
                          size={18}
                          color={pos === orderedIndexes.length - 1 ? '#C7C4BA' : NAVY}
                        />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </>
            )}
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
          disabled={durationMismatch}
        />
      </View>
    </SafeAreaView>
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
  totalDurationText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 12,
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
  mismatchBanner: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FBEAE8',
  },
  mismatchText: {
    color: ERROR,
    fontSize: 12.5,
    lineHeight: 18,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  orderPosition: {
    fontSize: 13,
    fontWeight: '800',
    color: NAVY,
    width: 18,
  },
  orderName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: NAVY,
  },
  orderArrows: {
    flexDirection: 'row',
    gap: 4,
  },
  orderArrowBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
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
