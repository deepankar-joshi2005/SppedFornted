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
  const [showSymbolsModal, setShowSymbolsModal] = useState(false);
  const [showOverallSummaryModal, setShowOverallSummaryModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
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

  const currentSection = useMemo(() => {
    if (!session?.test.subjectSections || session.test.subjectSections.length === 0) return null;
    return session.test.subjectSections.find((s) => index + 1 >= s.startNo && index + 1 <= s.endNo);
  }, [session, index]);

  const currentSectionName = currentSection
    ? currentSection.name
    : currentQuestion?.subject
    ? currentQuestion.subject.toUpperCase()
    : 'SECTION';

  const sectionQuestions = useMemo(() => {
    if (!session) return [];
    if (!currentSection) return session.questions;
    return session.questions.slice(currentSection.startNo - 1, currentSection.endNo);
  }, [session, currentSection]);

  const sectionAnsweredCount = useMemo(() => {
    return sectionQuestions.filter(
      (q) => answers[q.id]?.selectedOption !== null && answers[q.id]?.selectedOption !== undefined
    ).length;
  }, [sectionQuestions, answers]);

  const sectionUnansweredCount = sectionQuestions.length - sectionAnsweredCount;

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
              <Text style={styles.paletteTitle} numberOfLines={1}>
                {session.test.title}
              </Text>
              <Pressable onPress={() => setShowPalette(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color="#1E293B" />
              </Pressable>
            </View>

            <Text style={styles.paletteSectionTitle}>{currentSectionName}</Text>

            <ScrollView
              style={styles.paletteGridScroll}
              contentContainerStyle={styles.paletteGrid}
              showsVerticalScrollIndicator={false}
            >
              {session.questions.map((q, i) => {
                const a = answers[q.id];
                const isCurrent = i === index;
                const isAnswered = a?.selectedOption !== null && a?.selectedOption !== undefined;
                const isMarked = a?.markedForReview;

                let cellBg = '#3B82F6'; // Default Blue (Not attempted)
                if (isMarked) {
                  cellBg = '#EF4444'; // Red (Marked for review)
                } else if (isAnswered) {
                  cellBg = '#22C55E'; // Green (Answered)
                }

                return (
                  <Pressable
                    key={q.id}
                    style={[
                      styles.paletteCell,
                      { backgroundColor: cellBg, borderColor: cellBg },
                      isCurrent && styles.paletteCellCurrent,
                    ]}
                    onPress={() => {
                      goToIndex(i);
                      setShowPalette(false);
                    }}
                  >
                    <Text style={styles.paletteCellText}>{i + 1}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.sectionAnalysisBar}>
              <Text style={styles.sectionAnalysisText}>{currentSectionName} Analysis</Text>
            </View>

            <View style={styles.sectionAnalysisBody}>
              <View style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>Answered</Text>
                <View style={styles.analysisBadge}>
                  <Text style={styles.analysisBadgeText}>{sectionAnsweredCount}</Text>
                </View>
              </View>
              <View style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>Not-Answered</Text>
                <View style={styles.analysisBadge}>
                  <Text style={styles.analysisBadgeText}>{sectionUnansweredCount}</Text>
                </View>
              </View>
            </View>

            <Pressable
              style={styles.greyActionBtn}
              onPress={() => setShowOverallSummaryModal(true)}
            >
              <Text style={styles.greyActionBtnText}>Overall Test Summary</Text>
            </Pressable>

            <View style={styles.actionBtnRow}>
              <Pressable
                style={[styles.greyActionBtn, { flex: 1 }]}
                onPress={() => setShowSymbolsModal(true)}
              >
                <Text style={styles.greyActionBtnText}>Symbols</Text>
              </Pressable>
              <Pressable
                style={[styles.greyActionBtn, { flex: 1 }]}
                onPress={() => setShowInstructionsModal(true)}
              >
                <Text style={styles.greyActionBtnText}>Instructions</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.submitSectionBtn}
              onPress={() => {
                setShowPalette(false);
                setShowSubmitModal(true);
              }}
            >
              <Text style={styles.submitSectionBtnText}>Submit Section</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Overall Test Summary Modal */}
      <Modal visible={showOverallSummaryModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, styles.confirmOverlay]}>
          <View style={styles.confirmCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Overall Test Summary</Text>
              <Pressable onPress={() => setShowOverallSummaryModal(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={NAVY} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingVertical: 12, gap: 10 }}>
              <View style={styles.summaryItemRow}>
                <Text style={styles.summaryItemLabel}>Total Questions:</Text>
                <Text style={styles.summaryItemVal}>{totalQuestions}</Text>
              </View>
              <View style={styles.summaryItemRow}>
                <Text style={styles.summaryItemLabel}>Total Marks:</Text>
                <Text style={styles.summaryItemVal}>{session.test.totalMarks} Marks</Text>
              </View>
              <View style={styles.summaryItemRow}>
                <Text style={styles.summaryItemLabel}>Answered:</Text>
                <Text style={[styles.summaryItemVal, { color: '#22C55E' }]}>{answeredCount}</Text>
              </View>
              <View style={styles.summaryItemRow}>
                <Text style={styles.summaryItemLabel}>Not Answered:</Text>
                <Text style={[styles.summaryItemVal, { color: '#3B82F6' }]}>{totalQuestions - answeredCount}</Text>
              </View>
              <View style={styles.summaryItemRow}>
                <Text style={styles.summaryItemLabel}>Marked for Review:</Text>
                <Text style={[styles.summaryItemVal, { color: '#EF4444' }]}>{markedCount}</Text>
              </View>
              <View style={styles.summaryItemRow}>
                <Text style={styles.summaryItemLabel}>Marks / Question:</Text>
                <Text style={styles.summaryItemVal}>+{(session.test.totalMarks / (totalQuestions || 1)).toFixed(2)}</Text>
              </View>
              <View style={styles.summaryItemRow}>
                <Text style={styles.summaryItemLabel}>Negative Marks:</Text>
                <Text style={[styles.summaryItemVal, { color: session.test.negativeMarks > 0 ? ERROR : MUTED }]}>
                  {session.test.negativeMarks > 0 ? `-${session.test.negativeMarks}` : '0 (No Negative)'}
                </Text>
              </View>
              <View style={styles.summaryItemRow}>
                <Text style={styles.summaryItemLabel}>Time Remaining:</Text>
                <Text style={[styles.summaryItemVal, { color: ERROR }]}>{formatTime(remainingSeconds)}</Text>
              </View>
            </ScrollView>
            <Pressable style={styles.submitBtn} onPress={() => setShowOverallSummaryModal(false)}>
              <Text style={styles.submitBtnText}>Close Summary</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Symbols Modal */}
      <Modal visible={showSymbolsModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, styles.confirmOverlay]}>
          <View style={styles.confirmCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Symbols & Color Legend</Text>
              <Pressable onPress={() => setShowSymbolsModal(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={NAVY} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingVertical: 12, gap: 14 }}>
              <View style={styles.symbolLegendRow}>
                <View style={[styles.legendBox, { backgroundColor: '#22C55E' }]}>
                  <Text style={styles.legendBoxText}>1</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.legendTitle}>Answered (उत्तर दिया गया)</Text>
                  <Text style={styles.legendSub}>Option selected and response saved</Text>
                </View>
              </View>

              <View style={styles.symbolLegendRow}>
                <View style={[styles.legendBox, { backgroundColor: '#EF4444' }]}>
                  <Text style={styles.legendBoxText}>2</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.legendTitle}>Marked for Review (समीक्षा हेतु)</Text>
                  <Text style={styles.legendSub}>Marked to re-check before submitting</Text>
                </View>
              </View>

              <View style={styles.symbolLegendRow}>
                <View style={[styles.legendBox, { backgroundColor: '#3B82F6' }]}>
                  <Text style={styles.legendBoxText}>3</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.legendTitle}>Not Answered (उत्तर नहीं दिया)</Text>
                  <Text style={styles.legendSub}>Question visited or unattempted</Text>
                </View>
              </View>

              <View style={styles.symbolLegendRow}>
                <View style={[styles.legendBox, { backgroundColor: '#3B82F6', borderWidth: 2.5, borderColor: '#0F172A' }]}>
                  <Text style={styles.legendBoxText}>4</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.legendTitle}>Current Question (वर्तमान प्रश्न)</Text>
                  <Text style={styles.legendSub}>Thick border highlights your current question</Text>
                </View>
              </View>
            </ScrollView>
            <Pressable style={styles.submitBtn} onPress={() => setShowSymbolsModal(false)}>
              <Text style={styles.submitBtnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Instructions Modal */}
      <Modal visible={showInstructionsModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, styles.confirmOverlay]}>
          <View style={[styles.confirmCard, { maxHeight: '80%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Test Instructions</Text>
              <Pressable onPress={() => setShowInstructionsModal(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={NAVY} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingVertical: 12, gap: 14 }}>
              <View style={styles.instSection}>
                <Text style={styles.instHeading}>⏱️ Duration & Timer</Text>
                <Text style={styles.instBody}>
                  • Total Time: {session.test.durationMinutes} minutes.{'\n'}
                  • Server-controlled timer is displayed on the top left.{'\n'}
                  • Responses are automatically saved continuously.
                </Text>
              </View>

              <View style={styles.instSection}>
                <Text style={styles.instHeading}>📊 Marking Scheme</Text>
                <Text style={styles.instBody}>
                  • Correct Answer: +{(session.test.totalMarks / (totalQuestions || 1)).toFixed(2)} marks.{'\n'}
                  • Wrong Answer: {session.test.negativeMarks > 0 ? `-${session.test.negativeMarks} negative marks` : 'No negative marks'}.{'\n'}
                  • Skipped/Unanswered: 0 marks.
                </Text>
              </View>

              <View style={styles.instSection}>
                <Text style={styles.instHeading}>🎨 Color Codes</Text>
                <Text style={styles.instBody}>
                  • Green: Answered{'\n'}
                  • Red: Marked for Review{'\n'}
                  • Blue: Unattempted{'\n'}
                  • Bordered Box: Active Question
                </Text>
              </View>

              <View style={styles.instSection}>
                <Text style={styles.instHeading}>⚠️ Important Rules</Text>
                <Text style={styles.instBody}>
                  • Do not minimize or leave the app during exam.{'\n'}
                  • Click "Submit Section" or "Submit Test" to submit your attempt.
                </Text>
              </View>
            </ScrollView>
            <Pressable style={styles.submitBtn} onPress={() => setShowInstructionsModal(false)}>
              <Text style={styles.submitBtnText}>Close Instructions</Text>
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
    backgroundColor: 'rgba(15,23,42,0.38)',
    justifyContent: 'flex-end',
  },
  paletteSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: '85%',
  },
  paletteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  paletteTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: NAVY,
    marginRight: 10,
  },
  paletteSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1D4ED8',
    marginTop: 12,
    marginBottom: 12,
  },
  paletteGridScroll: {
    maxHeight: 180,
    marginBottom: 12,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paletteCell: {
    width: 44,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteCellCurrent: {
    borderWidth: 2.5,
    borderColor: '#0F172A',
  },
  paletteCellText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionAnalysisBar: {
    backgroundColor: '#D1D5DB',
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  sectionAnalysisText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
  },
  sectionAnalysisBody: {
    gap: 8,
    marginBottom: 14,
  },
  analysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analysisLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  analysisBadge: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FEF08A',
    paddingHorizontal: 16,
    paddingVertical: 3,
    borderRadius: 4,
  },
  analysisBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  greyActionBtn: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  greyActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  submitSectionBtn: {
    backgroundColor: '#0E4B94',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitSectionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  confirmOverlay: {
    justifyContent: 'center',
  },
  confirmCard: {
    margin: 20,
    maxHeight: '86%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  summaryItemLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  summaryItemVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  symbolLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendBoxText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  legendTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  legendSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  instSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
  },
  instHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 6,
  },
  instBody: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
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
