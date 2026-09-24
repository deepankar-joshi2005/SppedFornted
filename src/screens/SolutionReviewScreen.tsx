import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as ScreenCapture from 'expo-screen-capture';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationBell from '../components/NotificationBell';
import { Nav } from '../navigation/types';
import { getSolutions, SolutionQuestion, SolutionsResponse } from '../services/attempts.service';
import { ERROR, MUTED, NAVY } from '../theme/colors';

const DOWNLOAD_DIR_KEY = 'speedEducation.pdfDownloadDirUri';

const sanitizeFileName = (name: string): string => name.trim().replace(/[\\/:*?"<>|]+/g, '-');

// Writes the generated PDF straight into a folder the user picked once
// (via Android's Storage Access Framework), so repeat downloads need no
// dialog at all — no share sheet, no app picker.
const saveToDownloadsAndroid = async (sourceUri: string, fileName: string): Promise<boolean> => {
  const { StorageAccessFramework } = FileSystem;
  const base64 = await FileSystem.readAsStringAsync(sourceUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const writeInto = async (directoryUri: string): Promise<boolean> => {
    try {
      const destUri = await StorageAccessFramework.createFileAsync(
        directoryUri,
        fileName,
        'application/pdf'
      );
      await FileSystem.writeAsStringAsync(destUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return true;
    } catch {
      return false;
    }
  };

  const savedDirectoryUri = await AsyncStorage.getItem(DOWNLOAD_DIR_KEY);
  if (savedDirectoryUri && (await writeInto(savedDirectoryUri))) {
    return true;
  }

  const permission = await StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permission.granted) return false;

  await AsyncStorage.setItem(DOWNLOAD_DIR_KEY, permission.directoryUri);
  return writeInto(permission.directoryUri);
};

type Props = {
  token: string;
  attemptId: string;
  nav: Nav;
};

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const buildPaperHtml = (testTitle: string, questions: SolutionQuestion[]): string => {
  const rows = questions
    .map((q) => {
      const optionsHtml = q.options
        .map((opt, i) => {
          const isCorrect = i === q.correctOptionIndex;
          const isSelected = i === q.selectedOption;
          const style = isCorrect
            ? 'color:#2E9E5B;font-weight:700;'
            : isSelected
              ? 'color:#C0392B;font-weight:700;'
              : '';
          const tag = isCorrect ? ' (Correct)' : isSelected ? ' (Your Answer)' : '';
          return `<div style="margin:2px 0;${style}">${OPTION_LETTERS[i]}. ${escapeHtml(opt)}${tag}</div>`;
        })
        .join('');
      const status =
        q.isCorrect === null ? 'Skipped' : q.isCorrect ? 'Correct' : 'Incorrect';
      return `
        <div style="margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid #EDEBE4;">
          <div style="font-weight:700;font-size:14px;color:#16315C;">Q${q.index}. ${escapeHtml(q.text)}</div>
          <div style="margin-top:6px;font-size:13px;">${optionsHtml}</div>
          <div style="margin-top:6px;font-size:12px;color:#5B6577;">Status: ${status}</div>
          ${
            q.explanation
              ? `<div style="margin-top:6px;font-size:12px;color:#2E5B41;background:#E9F8EF;padding:8px;border-radius:6px;">${escapeHtml(q.explanation)}</div>`
              : ''
          }
        </div>`;
    })
    .join('');

  return `
    <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family:Helvetica,Arial,sans-serif;padding:20px;">
        <h2 style="color:#16315C;margin-bottom:4px;">${escapeHtml(testTitle)}</h2>
        <p style="color:#5B6577;font-size:12px;margin-top:0;">Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        ${rows}
      </body>
    </html>`;
};

export default function SolutionReviewScreen({ token, attemptId, nav }: Props) {
  const [data, setData] = useState<SolutionsResponse | null>(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fullView, setFullView] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [language, setLanguage] = useState<'Hindi' | 'English'>('English');

  useEffect(() => {
    if (Platform.OS === 'web') return;
    ScreenCapture.preventScreenCaptureAsync();
    return () => {
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const result = await getSolutions(token, attemptId);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load solutions.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, attemptId]);

  const question = data?.questions[index];

  const handleDownloadPdf = async () => {
    if (!data) return;
    setDownloading(true);
    try {
      const html = buildPaperHtml(data.testTitle, data.questions);
      const { uri } = await Print.printToFileAsync({ html });
      const fileName = `${sanitizeFileName(data.testTitle)}.Speed.pdf`;

      if (Platform.OS === 'android') {
        const saved = await saveToDownloadsAndroid(uri, fileName);
        if (saved) {
          Alert.alert('Downloaded', `${fileName} has been saved to your chosen folder.`);
        } else if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: fileName });
        }
      } else if (await Sharing.isAvailableAsync()) {
        // iOS sandboxes app files — "Save to Files" via the share sheet is
        // the only way for the user to get the PDF onto their device.
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: fileName });
      } else {
        Alert.alert('Saved', 'PDF generated, but sharing is not available on this device.');
      }
    } catch (err) {
      Alert.alert('Failed', err instanceof Error ? err.message : 'Could not generate PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Solution Review</Text>
          {!!data && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {data.testTitle}
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {!!data && (
            <>
              <View style={styles.langToggle}>
                <Pressable
                  style={[styles.langToggleBtn, language === 'English' && styles.langToggleBtnActive]}
                  onPress={() => setLanguage('English')}
                >
                  <Text
                    style={[styles.langToggleText, language === 'English' && styles.langToggleTextActive]}
                  >
                    EN
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.langToggleBtn, language === 'Hindi' && styles.langToggleBtnActive]}
                  onPress={() => setLanguage('Hindi')}
                >
                  <Text
                    style={[styles.langToggleText, language === 'Hindi' && styles.langToggleTextActive]}
                  >
                    हिं
                  </Text>
                </Pressable>
              </View>
              <Pressable
                style={styles.iconBtn}
                onPress={() => setFullView((v) => !v)}
                hitSlop={8}
              >
                <Ionicons
                  name={fullView ? 'reader-outline' : 'list-outline'}
                  size={20}
                  color={NAVY}
                />
              </Pressable>
              <Pressable
                style={styles.iconBtn}
                onPress={handleDownloadPdf}
                disabled={downloading}
                hitSlop={8}
              >
                {downloading ? (
                  <ActivityIndicator color={NAVY} size="small" />
                ) : (
                  <Ionicons name="download-outline" size={20} color={NAVY} />
                )}
              </Pressable>
            </>
          )}
          <NotificationBell
            token={token}
            style={styles.iconBtn}
            onPress={() => nav.push({ name: 'notifications' })}
          />
        </View>
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={NAVY} size="large" />
        </View>
      )}

      {!!error && !data && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!fullView && !!data && data.subjectSections.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.subjectTabsScroll}
          contentContainerStyle={styles.subjectTabsRow}
        >
          {data.subjectSections.map((section, i) => {
            const isActive =
              !!question && question.index >= section.startNo && question.index <= section.endNo;
            return (
              <Pressable
                key={`${section.name}-${i}`}
                style={[styles.subjectTab, isActive && styles.subjectTabActive]}
                onPress={() => setIndex(section.startNo - 1)}
              >
                <Text style={[styles.subjectTabText, isActive && styles.subjectTabTextActive]}>
                  {section.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {!fullView && question && (
        <>
          <View style={styles.statusRow}>
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    question.isCorrect === null ? MUTED : question.isCorrect ? '#2E9E5B' : ERROR,
                },
              ]}
            >
              {question.isCorrect === null
                ? 'Skipped'
                : question.isCorrect
                  ? 'Correct'
                  : `Incorrect (Option ${OPTION_LETTERS[question.selectedOption ?? 0]} selected)`}
            </Text>
            <Text style={styles.counterText}>
              Question {question.index} of {question.total}
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <QuestionBlock question={question} language={language} />
          </ScrollView>

          <View style={styles.bottomBar}>
            <Pressable
              style={[styles.navBtn, styles.navBtnOutline]}
              onPress={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
            >
              <Text style={styles.navBtnOutlineText}>Previous</Text>
            </Pressable>
            <Pressable
              style={[styles.navBtn, styles.navBtnPrimary]}
              onPress={() => setIndex((i) => Math.min((data?.questions.length ?? 1) - 1, i + 1))}
              disabled={index === (data?.questions.length ?? 1) - 1}
            >
              <Text style={styles.navBtnPrimaryText}>Next Question</Text>
            </Pressable>
          </View>
        </>
      )}

      {fullView && !!data && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {data.questions.map((q) => (
            <View key={q.id} style={styles.fullViewBlock}>
              <View style={[styles.statusRow, styles.statusRowNested]}>
                <Text
                  style={[
                    styles.statusText,
                    { color: q.isCorrect === null ? MUTED : q.isCorrect ? '#2E9E5B' : ERROR },
                  ]}
                >
                  {q.isCorrect === null ? 'Skipped' : q.isCorrect ? 'Correct' : 'Incorrect'}
                </Text>
                <Text style={styles.counterText}>
                  Question {q.index} of {q.total}
                </Text>
              </View>
              <QuestionBlock question={q} language={language} />
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function QuestionBlock({
  question,
  language,
}: {
  question: SolutionQuestion;
  language: 'Hindi' | 'English';
}) {
  const displayedText =
    language === 'Hindi' && question.textHindi ? question.textHindi : question.text;
  const displayedOptions =
    language === 'Hindi' && question.optionsHindi ? question.optionsHindi : question.options;
  const displayedExplanation =
    language === 'Hindi' && question.explanationHindi ? question.explanationHindi : question.explanation;

  return (
    <>
      <Text style={styles.questionText}>{displayedText}</Text>

      <View style={styles.optionsList}>
        {displayedOptions.map((option, optIdx) => {
          const isCorrectOption = optIdx === question.correctOptionIndex;
          const isSelected = optIdx === question.selectedOption;
          const showWrong = isSelected && !isCorrectOption;
          return (
            <View
              key={optIdx}
              style={[
                styles.optionRow,
                isCorrectOption && styles.optionRowCorrect,
                showWrong && styles.optionRowWrong,
              ]}
            >
              <View
                style={[
                  styles.optionBadge,
                  isCorrectOption && styles.optionBadgeCorrect,
                  showWrong && styles.optionBadgeWrong,
                ]}
              >
                <Text
                  style={[
                    styles.optionLetter,
                    (isCorrectOption || showWrong) && styles.optionLetterLight,
                  ]}
                >
                  {OPTION_LETTERS[optIdx]}
                </Text>
              </View>
              <Text style={styles.optionText}>
                {option}
                {isCorrectOption ? ' (Correct Answer)' : showWrong ? ' (Your Answer)' : ''}
              </Text>
              {isCorrectOption && <Ionicons name="checkmark-circle" size={18} color="#2E9E5B" />}
              {showWrong && <Ionicons name="close-circle" size={18} color={ERROR} />}
            </View>
          );
        })}
      </View>

      {!!displayedExplanation && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>Detailed Solution & Concept:</Text>
          <Text style={styles.explanationText}>{displayedExplanation}</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F4EF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  langToggle: {
    flexDirection: 'row',
    backgroundColor: '#EEEDE6',
    borderRadius: 14,
    padding: 2,
    marginRight: 4,
  },
  langToggleBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },
  langToggleBtnActive: {
    backgroundColor: NAVY,
  },
  langToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: MUTED,
  },
  langToggleTextActive: {
    color: '#FFFFFF',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
  },
  headerSubtitle: {
    fontSize: 11,
    color: MUTED,
    marginTop: 1,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FBEAE8',
  },
  errorText: {
    color: ERROR,
    fontSize: 13,
    textAlign: 'center',
  },
  subjectTabsScroll: {
    flexGrow: 0,
    flexShrink: 0,
    height: 56,
    borderTopWidth: 1,
    borderTopColor: '#EDEBE4',
    borderBottomWidth: 1,
    borderBottomColor: '#EDEBE4',
    backgroundColor: '#FFFFFF',
  },
  subjectTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  subjectTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F5F4EF',
  },
  subjectTabActive: {
    backgroundColor: NAVY,
  },
  subjectTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: MUTED,
  },
  subjectTabTextActive: {
    color: '#FFFFFF',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  statusText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  counterText: {
    fontSize: 12,
    color: MUTED,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E2937',
    lineHeight: 22,
  },
  optionsList: {
    marginTop: 16,
    gap: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#EDEBE4',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  optionRowCorrect: {
    borderColor: '#2E9E5B',
    backgroundColor: '#E9F8EF',
  },
  optionRowWrong: {
    borderColor: ERROR,
    backgroundColor: '#FBEAE8',
  },
  optionBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EEEDE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBadgeCorrect: {
    backgroundColor: '#2E9E5B',
  },
  optionBadgeWrong: {
    backgroundColor: ERROR,
  },
  optionLetter: {
    fontSize: 12,
    fontWeight: '800',
    color: MUTED,
  },
  optionLetterLight: {
    color: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    fontSize: 13.5,
    color: '#1E2937',
  },
  explanationBox: {
    marginTop: 18,
    backgroundColor: '#E9F8EF',
    borderRadius: 14,
    padding: 16,
  },
  explanationTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E9E5B',
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 13,
    color: '#2E5B41',
    lineHeight: 19,
  },
  fullViewBlock: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEBE4',
  },
  statusRowNested: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDEBE4',
    backgroundColor: '#FFFFFF',
  },
  navBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  navBtnOutline: {
    borderWidth: 1.3,
    borderColor: '#D8D5CC',
  },
  navBtnOutlineText: {
    color: NAVY,
    fontWeight: '700',
    fontSize: 13,
  },
  navBtnPrimary: {
    backgroundColor: NAVY,
  },
  navBtnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
