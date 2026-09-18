import { Ionicons } from '@expo/vector-icons';
import * as ScreenCapture from 'expo-screen-capture';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Nav } from '../navigation/types';
import {
  AttemptQuestion,
  saveAnswer,
  StartAttemptResponse,
  startAttempt,
  submitAttempt,
} from '../services/attempts.service';
import { ERROR, GOLD, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  testId: string;
  nav: Nav;
};

type AnswerState = { selectedOption: number | null; markedForReview: boolean };

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

const formatTime = (totalSeconds: number): string => {
  const clamped = Math.max(0, totalSeconds);
  const mins = Math.floor(clamped / 60);
  const secs = Math.floor(clamped % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export default function TestTakingScreen({ token, testId, nav }: Props) {
  const [session, setSession] = useState<StartAttemptResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [showPalette, setShowPalette] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);
  const questionTimeRef = useRef<Record<string, number>>({});
  const questionEnteredAtRef = useRef<number>(Date.now());
  const pendingSavesRef = useRef<Promise<unknown>[]>([]);

  const trackSave = (promise: Promise<unknown>) => {
    pendingSavesRef.current.push(promise);
  };

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
        const result = await startAttempt(token, testId);
        setSession(result);
        const initialAnswers: Record<string, AnswerState> = {};
        result.questions.forEach((q) => {
          const existing = result.answers.find((a) => a.questionId === q.id);
          initialAnswers[q.id] = {
            selectedOption: existing?.selectedOption ?? null,
            markedForReview: existing?.markedForReview ?? false,
          };
        });
        setAnswers(initialAnswers);
        const elapsed = (Date.now() - new Date(result.startedAt).getTime()) / 1000;
        setRemainingSeconds(Math.max(0, result.test.durationMinutes * 60 - elapsed));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load test.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, testId]);

  const handleSubmit = useCallback(async () => {
    if (!session || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const activeQuestion = session.questions[index];
      if (activeQuestion) {
        const elapsed = (Date.now() - questionEnteredAtRef.current) / 1000;
        const total = (questionTimeRef.current[activeQuestion.id] ?? 0) + elapsed;
        questionTimeRef.current[activeQuestion.id] = total;
        const answer = answers[activeQuestion.id];
        await saveAnswer(token, session.attemptId, {
          questionId: activeQuestion.id,
          selectedOption: answer?.selectedOption ?? null,
          markedForReview: answer?.markedForReview ?? false,
          timeSpentSeconds: total,
        }).catch(() => {});
      }
      // Earlier saveAnswer calls (from navigating between questions) fire
      // without waiting so the UI stays snappy. On a slow connection some of
      // those can still be in flight here — wait for all of them so the
      // server has every question's real time before it scores the attempt.
      await Promise.allSettled(pendingSavesRef.current);
      await submitAttempt(token, session.attemptId);
      nav.replace({ name: 'testResult', attemptId: session.attemptId });
    } catch (err) {
      submittedRef.current = false;
      setError(err instanceof Error ? err.message : 'Failed to submit test.');
      setSubmitting(false);
    }
  }, [session, token, nav, index, answers]);

  useEffect(() => {
    if (!session) return;
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [session, handleSubmit]);

  const currentQuestion: AttemptQuestion | undefined = session?.questions[index];

  const persistAnswer = (questionId: string, patch: Partial<AnswerState>) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: { ...prev[questionId], ...patch } };
      if (session) {
        // Don't send timeSpentSeconds here — this fires on every tap (select,
        // clear, mark-for-review) while still on the question, before the
        // real elapsed time is known. commitCurrentQuestionTime/handleSubmit
        // are the only places that compute and persist the actual time, once
        // the question is left. Sending a stale 0 here can race with those
        // writes and overwrite the correct value.
        trackSave(
          saveAnswer(token, session.attemptId, {
            questionId,
            selectedOption: next[questionId].selectedOption,
            markedForReview: next[questionId].markedForReview,
          }).catch(() => {})
        );
      }
      return next;
    });
  };

  const commitCurrentQuestionTime = () => {
    if (!currentQuestion || !session) return;
    const elapsed = (Date.now() - questionEnteredAtRef.current) / 1000;
    const total = (questionTimeRef.current[currentQuestion.id] ?? 0) + elapsed;
    questionTimeRef.current[currentQuestion.id] = total;
    questionEnteredAtRef.current = Date.now();

    const answer = answers[currentQuestion.id];
    trackSave(
      saveAnswer(token, session.attemptId, {
        questionId: currentQuestion.id,
        selectedOption: answer?.selectedOption ?? null,
        markedForReview: answer?.markedForReview ?? false,
        timeSpentSeconds: total,
      }).catch(() => {})
    );
  };

  const goToIndex = (newIndex: number) => {
    commitCurrentQuestionTime();
    setIndex(newIndex);
  };

  const answeredCount = useMemo(
    () => Object.values(answers).filter((a) => a.selectedOption !== null).length,
    [answers]
  );
  const markedCount = useMemo(
    () => Object.values(answers).filter((a) => a.markedForReview).length,
    [answers]
  );
  const totalQuestions = session?.questions.length ?? 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={NAVY} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.loadingBox}>
          <Text style={styles.errorText}>{error || 'Unable to load test.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentAnswer = answers[currentQuestion.id] ?? { selectedOption: null, markedForReview: false };
  const isLast = index === totalQuestions - 1;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <View style={styles.timerWrap}>
          <View style={styles.recordDot} />
          <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
        </View>
        <Text style={styles.testTitle} numberOfLines={1}>
          {session.test.title}
        </Text>
        <Pressable style={styles.paletteBtn} onPress={() => setShowPalette(true)} hitSlop={8}>
          <Ionicons name="grid-outline" size={20} color={NAVY} />
        </Pressable>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[styles.progressFill, { width: `${((index + 1) / totalQuestions) * 100}%` }]}
        />
      </View>

      {session.test.subjectSections.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.subjectTabsScroll}
          contentContainerStyle={styles.subjectTabsRow}
        >
          {session.test.subjectSections.map((section, i) => {
            const isActive = index + 1 >= section.startNo && index + 1 <= section.endNo;
            return (
              <Pressable
                key={`${section.name}-${i}`}
                style={[styles.subjectTab, isActive && styles.subjectTabActive]}
                onPress={() => goToIndex(section.startNo - 1)}
              >
                <Text style={[styles.subjectTabText, isActive && styles.subjectTabTextActive]}>
                  {section.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.subjectRow}>
          <Text style={styles.subjectLabel}>{currentQuestion.subject.toUpperCase()}</Text>
          <Text style={styles.questionCounter}>
            Q. {index + 1} of {totalQuestions}
          </Text>
        </View>

        <Text style={styles.questionText}>{currentQuestion.text}</Text>

        <View style={styles.optionsList}>
          {currentQuestion.options.map((option, optIdx) => {
            const selected = currentAnswer.selectedOption === optIdx;
            return (
              <Pressable
                key={optIdx}
                style={[styles.optionRow, selected && styles.optionRowSelected]}
                onPress={() => persistAnswer(currentQuestion.id, { selectedOption: optIdx })}
              >
                <View style={[styles.optionBadge, selected && styles.optionBadgeSelected]}>
                  <Text style={[styles.optionLetter, selected && styles.optionLetterSelected]}>
                    {OPTION_LETTERS[optIdx]}
                  </Text>
                </View>
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={styles.clearBtn}
          onPress={() => persistAnswer(currentQuestion.id, { selectedOption: null })}
          disabled={currentAnswer.selectedOption === null}
          hitSlop={8}
        >
          <Ionicons
            name="close-circle-outline"
            size={15}
            color={currentAnswer.selectedOption === null ? '#C7C4BA' : ERROR}
          />
          <Text
            style={[
              styles.clearBtnText,
              currentAnswer.selectedOption === null && styles.clearBtnTextDisabled,
            ]}
          >
            Clear Response
          </Text>
        </Pressable>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          style={[styles.navBtn, styles.navBtnOutline]}
          onPress={() => goToIndex(Math.max(0, index - 1))}
          disabled={index === 0}
        >
          <Text style={[styles.navBtnOutlineText, index === 0 && styles.navBtnTextDisabled]}>
            Previous
          </Text>
        </Pressable>
        <Pressable
          style={[styles.navBtn, styles.navBtnGold]}
          onPress={() =>
            persistAnswer(currentQuestion.id, { markedForReview: !currentAnswer.markedForReview })
          }
        >
          <Text style={styles.navBtnGoldText}>
            {currentAnswer.markedForReview ? 'Unmark' : 'Mark for Review'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.navBtn, styles.navBtnPrimary]}
          onPress={() => {
            if (isLast) {
              commitCurrentQuestionTime();
              setShowSubmitModal(true);
            } else {
              goToIndex(index + 1);
            }
          }}
        >
          <Text style={styles.navBtnPrimaryText}>{isLast ? 'Submit Test' : 'Save & Next'}</Text>
        </Pressable>
      </View>

      <Modal visible={showPalette} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.paletteSheet}>
            <View style={styles.paletteHeaderRow}>
              <Text style={styles.paletteTitle}>Question Navigator</Text>
              <Pressable onPress={() => setShowPalette(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={NAVY} />
              </Pressable>
            </View>
            <Text style={styles.paletteSummary}>
              Answered {answeredCount} • Marked {markedCount} • Unanswered{' '}
              {totalQuestions - answeredCount}
            </Text>
            <View style={styles.paletteGrid}>
              {session.questions.map((q, i) => {
                const a = answers[q.id];
                const isCurrent = i === index;
                return (
                  <Pressable
                    key={q.id}
                    style={[
                      styles.paletteCell,
                      a?.selectedOption !== null && styles.paletteCellAnswered,
                      a?.markedForReview && styles.paletteCellMarked,
                      isCurrent && styles.paletteCellCurrent,
                    ]}
                    onPress={() => {
                      goToIndex(i);
                      setShowPalette(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.paletteCellText,
                        (a?.selectedOption !== null || a?.markedForReview) &&
                          styles.paletteCellTextLight,
                      ]}
                    >
                      {i + 1}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              style={styles.paletteSubmitBtn}
              onPress={() => {
                setShowPalette(false);
                setShowSubmitModal(true);
              }}
            >
              <Text style={styles.paletteSubmitText}>SUBMIT TEST</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showSubmitModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, styles.confirmOverlay]}>
          <View style={styles.confirmCard}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.confirmScrollContent}
          >
            <View style={styles.warnIconWrap}>
              <Ionicons name="alert-circle-outline" size={30} color={NAVY} />
            </View>
            <Text style={styles.confirmTitle}>Submit Test?</Text>
            <Text style={styles.confirmSubtitle}>Are you sure you want to end and submit the test?</Text>

            <View style={styles.confirmStatsBox}>
              <View style={styles.confirmStatRow}>
                <Text style={styles.confirmStatLabel}>Answered</Text>
                <Text style={[styles.confirmStatValue, { color: '#2E9E5B' }]}>
                  {answeredCount} Questions
                </Text>
              </View>
              <View style={styles.confirmStatDivider} />
              <View style={styles.confirmStatRow}>
                <Text style={styles.confirmStatLabel}>Unanswered</Text>
                <Text style={[styles.confirmStatValue, { color: GOLD }]}>
                  {totalQuestions - answeredCount} Questions
                </Text>
              </View>
              <View style={styles.confirmStatDivider} />
              <View style={styles.confirmStatRow}>
                <Text style={styles.confirmStatLabel}>Marked for Review</Text>
                <Text style={[styles.confirmStatValue, { color: NAVY }]}>
                  {markedCount} Questions
                </Text>
              </View>
            </View>

            <View style={styles.confirmWarnBox}>
              <Text style={styles.confirmWarnText}>
                Unanswered questions will remain unattempted and will not be scored.
              </Text>
            </View>

            {!!error && <Text style={styles.errorTextSmall}>{error}</Text>}

            <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Yes, Submit Test</Text>
              )}
            </Pressable>
            <Pressable
              style={styles.cancelBtn}
              onPress={() => setShowSubmitModal(false)}
              disabled={submitting}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F4EF',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: ERROR,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  errorTextSmall: {
    color: ERROR,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  timerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 70,
  },
  recordDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ERROR,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: ERROR,
  },
  testTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: NAVY,
  },
  paletteBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#EEEDE6',
  },
  progressFill: {
    height: '100%',
    backgroundColor: NAVY,
  },
  subjectTabsScroll: {
    maxHeight: 46,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDEBE4',
  },
  subjectTabsRow: {
    flexDirection: 'row',
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
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.5,
  },
  questionCounter: {
    fontSize: 12,
    color: MUTED,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E2937',
    marginTop: 14,
    lineHeight: 24,
  },
  optionsList: {
    marginTop: 22,
    gap: 12,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 5,
    marginTop: 14,
    paddingVertical: 4,
  },
  clearBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: ERROR,
  },
  clearBtnTextDisabled: {
    color: '#C7C4BA',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#EDEBE4',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  optionRowSelected: {
    borderColor: NAVY,
    backgroundColor: '#EEF1F7',
  },
  optionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEEDE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBadgeSelected: {
    backgroundColor: NAVY,
  },
  optionLetter: {
    fontSize: 12.5,
    fontWeight: '800',
    color: MUTED,
  },
  optionLetterSelected: {
    color: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    fontSize: 14.5,
    color: '#1E2937',
  },
  optionTextSelected: {
    color: NAVY,
    fontWeight: '700',
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDEBE4',
    backgroundColor: '#FFFFFF',
  },
  navBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnOutline: {
    borderWidth: 1.3,
    borderColor: '#D8D5CC',
  },
  navBtnOutlineText: {
    color: NAVY,
    fontWeight: '700',
    fontSize: 12.5,
  },
  navBtnTextDisabled: {
    color: '#B7B3A8',
  },
  navBtnGold: {
    borderWidth: 1.3,
    borderColor: GOLD,
  },
  navBtnGoldText: {
    color: GOLD,
    fontWeight: '700',
    fontSize: 12,
  },
  navBtnPrimary: {
    backgroundColor: NAVY,
  },
  navBtnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.28)',
    justifyContent: 'flex-end',
  },
  paletteSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
  },
  paletteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paletteTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
  },
  paletteSummary: {
    fontSize: 12,
    color: MUTED,
    marginTop: 8,
    marginBottom: 16,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paletteCell: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1.3,
    borderColor: '#EDEBE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteCellAnswered: {
    backgroundColor: '#2E9E5B',
    borderColor: '#2E9E5B',
  },
  paletteCellMarked: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  paletteCellCurrent: {
    borderColor: NAVY,
    borderWidth: 2,
  },
  paletteCellText: {
    fontSize: 13,
    fontWeight: '700',
    color: NAVY,
  },
  paletteCellTextLight: {
    color: '#FFFFFF',
  },
  paletteSubmitBtn: {
    marginTop: 20,
    backgroundColor: NAVY,
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: 'center',
  },
  paletteSubmitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  confirmOverlay: {
    justifyContent: 'center',
  },
  confirmCard: {
    margin: 24,
    maxHeight: '86%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
  },
  confirmScrollContent: {
    alignItems: 'center',
  },
  warnIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EEF1F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: NAVY,
  },
  confirmSubtitle: {
    fontSize: 12.5,
    color: MUTED,
    textAlign: 'center',
    marginTop: 6,
  },
  confirmStatsBox: {
    width: '100%',
    backgroundColor: '#F7F6F1',
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
  },
  confirmStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  confirmStatDivider: {
    height: 1,
    backgroundColor: '#E5E3DA',
  },
  confirmStatLabel: {
    fontSize: 12.5,
    color: '#334155',
  },
  confirmStatValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  confirmWarnBox: {
    width: '100%',
    backgroundColor: '#FBEAE8',
    borderRadius: 10,
    padding: 10,
    marginTop: 14,
  },
  confirmWarnText: {
    fontSize: 11.5,
    color: ERROR,
    textAlign: 'center',
  },
  submitBtn: {
    width: '100%',
    backgroundColor: NAVY,
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  cancelBtn: {
    width: '100%',
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1.3,
    borderColor: '#D8D5CC',
  },
  cancelBtnText: {
    color: NAVY,
    fontWeight: '700',
    fontSize: 14,
  },
});
