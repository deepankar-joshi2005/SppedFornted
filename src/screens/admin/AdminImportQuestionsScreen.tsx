import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminHeader from '../../components/admin/AdminHeader';
import PrimaryButton from '../../components/PrimaryButton';
import { AdminNav } from '../../navigation/adminTypes';
import { ImportResult, importQuestions } from '../../services/admin/questions.service';
import { ERROR, GOLD, MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  testId: string;
  nav: AdminNav;
};

type PickedFile = { uri: string; name: string; mimeType?: string | null };

export default function AdminImportQuestionsScreen({ token, testId, nav }: Props) {
  const [fileType, setFileType] = useState<'excel' | 'csv'>('excel');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [validateError, setValidateError] = useState('');
  const [importError, setImportError] = useState('');
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const pickFile = async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      type:
        fileType === 'excel'
          ? [
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.ms-excel',
            ]
          : ['text/csv', 'text/comma-separated-values'],
      copyToCacheDirectory: true,
    });
    if (picked.canceled || !picked.assets?.[0]) return;

    const asset = picked.assets[0];
    const nextFile: PickedFile = { uri: asset.uri, name: asset.name, mimeType: asset.mimeType };
    setFile(nextFile);
    setResult(null);
    setImportedCount(null);
    setValidateError('');
    setImportError('');
    setValidating(true);
    try {
      const validation = await importQuestions(token, testId, nextFile, false);
      setResult(validation);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      setValidateError(err instanceof Error ? err.message : 'Could not read this file.');
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImportError('');
    setImporting(true);
    try {
      const final = await importQuestions(token, testId, file, true);
      setImportedCount(final.imported ?? final.valid);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import questions.');
    } finally {
      setImporting(false);
    }
  };

  const errorsToShow = result ? (showAllErrors ? result.errors : result.errors.slice(0, 5)) : [];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <AdminHeader title="Import Questions" subtitle="Bulk add via spreadsheets" onBack={() => nav.pop()} />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent}>
        <View style={styles.typeRow}>
          <Pressable
            style={[styles.typeCard, fileType === 'excel' && styles.typeCardActive]}
            onPress={() => setFileType('excel')}
          >
            <Text style={styles.recommendedTag}>RECOMMENDED</Text>
            <Text style={styles.typeTitle}>Upload Excel</Text>
            <Text style={styles.typeDesc}>Supports .xlsx and .xls formats</Text>
          </Pressable>
          <Pressable
            style={[styles.typeCard, fileType === 'csv' && styles.typeCardActive]}
            onPress={() => setFileType('csv')}
          >
            <Text style={styles.typeTitle}>Upload CSV</Text>
            <Text style={styles.typeDesc}>Standard comma separated values</Text>
          </Pressable>
        </View>

        <View style={styles.columnsBox}>
          <Text style={styles.columnsTitle}>REQUIRED COLUMN HEADERS:</Text>
          <View style={styles.columnsRow}>
            {['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Explanation', 'Marks'].map(
              (col) => (
                <View key={col} style={styles.columnTag}>
                  <Text style={styles.columnTagText}>{col}</Text>
                </View>
              )
            )}
          </View>
        </View>

        <Text style={styles.helperText}>
          Step 1: pick a file below — it will be checked automatically. Step 2: review the
          results and tap "Import" to actually save the questions into this test.
        </Text>

        <Pressable style={styles.dropzone} onPress={pickFile} disabled={validating}>
          {validating ? (
            <>
              <ActivityIndicator color={NAVY} />
              <Text style={styles.dropzoneHint}>Checking file...</Text>
            </>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={26} color={NAVY} />
              <Text style={styles.dropzoneBtnText}>
                {fileType === 'excel' ? 'Choose Excel File' : 'Choose CSV File'}
              </Text>
              <Text style={styles.dropzoneHint}>Max size 10MB</Text>
              {!!file && <Text style={styles.fileName}>{file.name}</Text>}
            </>
          )}
        </Pressable>

        {!!validateError && (
          <View style={styles.statusBanner}>
            <Ionicons name="close-circle" size={18} color={ERROR} />
            <Text style={styles.statusBannerErrorText}>{validateError}</Text>
          </View>
        )}

        {result && importedCount === null && (
          <>
            <View style={styles.statusBanner}>
              <Ionicons
                name={result.valid > 0 ? 'checkmark-circle' : 'alert-circle'}
                size={18}
                color={result.valid > 0 ? '#2E9E5B' : GOLD}
              />
              <Text style={styles.statusBannerText}>
                File checked — {result.found} question{result.found === 1 ? '' : 's'} found,{' '}
                {result.valid} valid{result.errors.length > 0 ? `, ${result.errors.length} error(s)` : ''}
                . Not saved yet — tap "Import" below.
              </Text>
            </View>

            <View style={styles.summaryBox}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Upload Summary</Text>
                {result.errors.length > 0 && (
                  <Text style={styles.summaryErrorsTag}>{result.errors.length} Errors Found</Text>
                )}
              </View>
              <View style={styles.summaryStatsRow}>
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryStatValue}>{result.found}</Text>
                  <Text style={styles.summaryStatLabel}>Found</Text>
                </View>
                <View style={[styles.summaryStat, styles.summaryStatValid]}>
                  <Text style={[styles.summaryStatValue, styles.summaryStatValidText]}>
                    {result.valid}
                  </Text>
                  <Text style={styles.summaryStatLabel}>Valid</Text>
                </View>
                <View style={[styles.summaryStat, styles.summaryStatError]}>
                  <Text style={[styles.summaryStatValue, styles.summaryStatErrorText]}>
                    {result.errors.length}
                  </Text>
                  <Text style={styles.summaryStatLabel}>Errors</Text>
                </View>
              </View>

              {errorsToShow.map((e, idx) => (
                <Text key={idx} style={styles.errorRow}>
                  Row {e.row} — <Text style={styles.errorRowMessage}>{e.message}</Text>
                </Text>
              ))}

              {result.valid === 0 ? (
                <Text style={styles.zeroValidText}>
                  0 valid rows — nothing to import. Check the file format matches the required
                  columns above and try again.
                </Text>
              ) : (
                <PrimaryButton
                  label={`Import ${result.valid} Valid Questions`}
                  onPress={handleImport}
                  loading={importing}
                />
              )}

              {!!importError && (
                <View style={[styles.statusBanner, { marginTop: 12 }]}>
                  <Ionicons name="close-circle" size={18} color={ERROR} />
                  <Text style={styles.statusBannerErrorText}>{importError}</Text>
                </View>
              )}

              <View style={styles.footerRow}>
                {result.errors.length > 5 && (
                  <Pressable onPress={() => setShowAllErrors((s) => !s)}>
                    <Text style={styles.footerLink}>
                      {showAllErrors ? 'Show Less' : 'View All Errors'}
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => {
                    setFile(null);
                    setResult(null);
                  }}
                >
                  <Text style={[styles.footerLink, { color: ERROR }]}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}

        {importedCount !== null && (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={30} color="#2E9E5B" />
            <Text style={styles.successTitle}>{importedCount} Questions Imported</Text>
            <Text style={styles.successDesc}>
              They have been saved to this test and now count toward its total questions.
            </Text>
            <PrimaryButton label="Done" onPress={() => nav.pop()} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  scrollContent: { padding: 18, paddingBottom: 40 },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  typeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EDEBE4',
    padding: 14,
  },
  typeCardActive: { borderColor: NAVY },
  recommendedTag: {
    fontSize: 9,
    fontWeight: '800',
    color: NAVY,
    backgroundColor: '#EEF1F7',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  typeTitle: { fontSize: 13.5, fontWeight: '800', color: NAVY },
  typeDesc: { fontSize: 10.5, color: MUTED, marginTop: 4 },
  columnsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    marginBottom: 16,
  },
  columnsTitle: { fontSize: 10.5, fontWeight: '800', color: MUTED, marginBottom: 10 },
  columnsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  columnTag: { backgroundColor: '#F1F0EA', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  columnTagText: { fontSize: 10.5, fontWeight: '700', color: NAVY },
  helperText: { fontSize: 12, color: MUTED, marginBottom: 12, lineHeight: 17 },
  dropzone: {
    borderWidth: 1.5,
    borderColor: NAVY,
    borderStyle: 'dashed',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 6,
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
  },
  dropzoneBtnText: { fontSize: 14, fontWeight: '800', color: NAVY, marginTop: 4 },
  dropzoneHint: { fontSize: 11, color: MUTED },
  fileName: { fontSize: 11.5, color: NAVY, fontWeight: '600', marginTop: 6 },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    padding: 12,
    marginBottom: 14,
  },
  statusBannerText: { flex: 1, fontSize: 12, color: NAVY, lineHeight: 17 },
  statusBannerErrorText: { flex: 1, fontSize: 12, color: ERROR, lineHeight: 17 },
  summaryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTitle: { fontSize: 14.5, fontWeight: '800', color: NAVY },
  summaryErrorsTag: { fontSize: 12, fontWeight: '700', color: ERROR },
  summaryStatsRow: { flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 14 },
  summaryStat: {
    flex: 1,
    backgroundColor: '#F1F0EA',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  summaryStatValid: { backgroundColor: '#E1F5EA' },
  summaryStatError: { backgroundColor: '#FBEAE8' },
  summaryStatValue: { fontSize: 16, fontWeight: '800', color: NAVY },
  summaryStatValidText: { color: '#2E9E5B' },
  summaryStatErrorText: { color: ERROR },
  summaryStatLabel: { fontSize: 10.5, color: MUTED, marginTop: 2 },
  errorRow: { fontSize: 12, color: ERROR, marginBottom: 6 },
  errorRowMessage: { color: MUTED },
  zeroValidText: { fontSize: 12.5, color: ERROR, lineHeight: 18, marginTop: 4 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  footerLink: { fontSize: 12.5, fontWeight: '700', color: NAVY },
  successBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    alignItems: 'center',
    gap: 8,
  },
  successTitle: { fontSize: 16, fontWeight: '800', color: NAVY, marginTop: 4 },
  successDesc: { fontSize: 12.5, color: MUTED, textAlign: 'center', marginBottom: 10 },
});
