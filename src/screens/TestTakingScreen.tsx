import { Ionicons } from '@expo/vector-icons';
import * as ScreenCapture from 'expo-screen-capture';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
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
  initialLanguage?: 'Hindi' | 'English';
  nav: Nav;
};

type AnswerState = { selectedOption: number | null; markedForReview: boolean };
type QStatus = 'attempted' | 'marked' | 'notAnswered' | 'notVisited';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const SCREEN_WIDTH = Dimensions.get('window').width;
const PALETTE_WIDTH = SCREEN_WIDTH * 0.7;

const STATUS_COLORS: Record<QStatus, string> = {
  attempted: '#22C55E',
  marked: '#EF4444',
  notAnswered: '#3B82F6',
  notVisited: '#FFFFFF',
};

const STATUS_LABELS: Record<QStatus, string> = {
  attempted: 'Attempted',
  marked: 'Marked for Review',
  notAnswered: 'Not Attempted',
  notVisited: 'Not Visited',
};

const formatTime = (totalSeconds: number): string => {
  const clamped = Math.max(0, totalSeconds);
  const mins = Math.floor(clamped / 60);
  const secs = Math.floor(clamped % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export default function TestTakingScreen({ token, testId, initialLanguage, nav }: Props) {
  const [session, setSession] = useState<StartAttemptResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [language, setLanguage] = useState<'Hindi' | 'English'>(initialLanguage ?? 'English');
  const [showPalette, setShowPalette] = useState(false);
  const [paletteTab, setPaletteTab] = useState<'grid' | 'list'>('grid');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const submittedRef = useRef(false);
  const questionTimeRef = useRef<Record<string, number>>({});
  const questionEnteredAtRef = useRef<number>(Date.now());
  const pendingSavesRef = useRef<Promise<unknown>[]>([]);
  const paletteTranslateX = useRef(new Animated.Value(PALETTE_WIDTH)).current;
  const paletteBackdropOpacity = paletteTranslateX.interpolate({
    inputRange: [0, PALETTE_WIDTH],
    outputRange: [0.4, 0],
    extrapolate: 'clamp',
  });

  const openPalette = () => {
    setShowPalette(true);
    paletteTranslateX.setValue(PALETTE_WIDTH);
    Animated.timing(paletteTranslateX, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  };

  const closePalette = () => {
    Animated.timing(paletteTranslateX, {
      toValue: PALETTE_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setShowPalette(false);
    });
  };

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
        const initialVisited: Record<string, boolean> = {};
        result.questions.forEach((q) => {
          const existing = result.answers.find((a) => a.questionId === q.id);
          initialAnswers[q.id] = {
            selectedOption: existing?.selectedOption ?? null,
            markedForReview: existing?.markedForReview ?? false,
          };
          if (existing) initialVisited[q.id] = true;
        });
        if (result.questions[0]) initialVisited[result.questions[0].id] = true;
        setAnswers(initialAnswers);
        setVisited(initialVisited);
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
    if (!session || isPaused) return;
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
  }, [session, handleSubmit, isPaused]);

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
    const targetQuestion = session?.questions[newIndex];
    if (targetQuestion) {
      setVisited((prev) => (prev[targetQuestion.id] ? prev : { ...prev, [targetQuestion.id]: true }));
    }
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

  const getStatus = (q: AttemptQuestion): QStatus => {
    const a = answers[q.id];
    const isAnswered = a?.selectedOption !== null && a?.selectedOption !== undefined;
    if (a?.markedForReview) return 'marked';
    if (isAnswered) return 'attempted';
    if (visited[q.id]) return 'notAnswered';
    return 'notVisited';
  };

  const countStatuses = (questions: AttemptQuestion[]) => {
    const counts = { attempted: 0, notVisited: 0, notAnswered: 0, marked: 0 };
    questions.forEach((q) => {
      counts[getStatus(q)]++;
    });
    return counts;
  };

  const overallCounts = session ? countStatuses(session.questions) : { attempted: 0, notVisited: 0, notAnswered: 0, marked: 0 };

  const sectionsToRender = session
    ? session.test.subjectSections.length > 0
      ? session.test.subjectSections
      : [{ name: '', startNo: 1, endNo: totalQuestions }]
    : [];

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
  const hasHindi = !!(currentQuestion.textHindi && currentQuestion.optionsHindi);
  const displayedText =
    language === 'Hindi' && currentQuestion.textHindi ? currentQuestion.textHindi : currentQuestion.text;
  const displayedOptions =
    language === 'Hindi' && currentQuestion.optionsHindi ? currentQuestion.optionsHindi : currentQuestion.options;

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
        <View style={styles.topBarRightGroup}>
          <Pressable style={styles.pauseBtn} onPress={() => setIsPaused(true)} hitSlop={8}>
            <Ionicons name="pause" size={18} color={NAVY} />
          </Pressable>
          <Pressable style={styles.paletteBtn} onPress={openPalette} hitSlop={8}>
            <Ionicons name="grid-outline" size={20} color={NAVY} />
          </Pressable>
        </View>
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
          <View style={styles.subjectRowRight}>
            {hasHindi && (
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
            )}
            <Text style={styles.questionCounter}>
              Q. {index + 1} of {totalQuestions}
            </Text>
          </View>
        </View>

        <Text style={styles.questionText}>{displayedText}</Text>

        <View style={styles.optionsList}>
          {displayedOptions.map((option, optIdx) => {
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

      <Modal visible={showPalette} transparent animationType="none" onRequestClose={closePalette}>
        <View style={styles.paletteModalRoot}>
          <Pressable style={styles.paletteBackdropTouchable} onPress={closePalette}>
            <Animated.View style={[styles.paletteBackdropFill, { opacity: paletteBackdropOpacity }]} />
          </Pressable>
          <Animated.View
            style={[
              styles.paletteAnimWrap,
              { width: PALETTE_WIDTH, transform: [{ translateX: paletteTranslateX }] },
            ]}
          >
            <SafeAreaView style={styles.paletteSheet} edges={['top', 'bottom']}>
            <View style={styles.paletteHeaderRow}>
              <Pressable onPress={closePalette} hitSlop={8}>
                <Ionicons name="arrow-back" size={22} color="#1E293B" />
              </Pressable>
              <Text style={styles.paletteTitle} numberOfLines={1}>
                {session.test.title}
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.legendGrid}>
                <View style={styles.legendGridRow}>
                  <View style={styles.legendGridItem}>
                    <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.attempted }]} />
                    <Text style={styles.legendGridText}>Attempted</Text>
                  </View>
                  <View style={styles.legendGridItem}>
                    <View style={[styles.legendDot, styles.legendDotOutline]} />
                    <Text style={styles.legendGridText}>Not Visited</Text>
                  </View>
                </View>
                <View style={styles.legendGridRow}>
                  <View style={styles.legendGridItem}>
                    <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.notAnswered }]} />
                    <Text style={styles.legendGridText}>Not Attempted</Text>
                  </View>
                  <View style={styles.legendGridItem}>
                    <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.marked }]} />
                    <Text style={styles.legendGridText}>Marked for Review</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.summaryHeading}>Test Summary</Text>
              <View style={styles.statCircleRow}>
                <View style={styles.statCircleItem}>
                  <View style={styles.statCircle}>
                    <Text style={styles.statCircleText}>{overallCounts.attempted}</Text>
                  </View>
                  <Text style={styles.statCircleLabel}>Attempted</Text>
                </View>
                <View style={styles.statCircleItem}>
                  <View style={styles.statCircle}>
                    <Text style={styles.statCircleText}>{overallCounts.notVisited}</Text>
                  </View>
                  <Text style={styles.statCircleLabel}>Not Visited</Text>
                </View>
                <View style={styles.statCircleItem}>
                  <View style={styles.statCircle}>
                    <Text style={styles.statCircleText}>{overallCounts.notAnswered}</Text>
                  </View>
                  <Text style={styles.statCircleLabel}>Not Answered</Text>
                </View>
                <View style={styles.statCircleItem}>
                  <View style={styles.statCircle}>
                    <Text style={styles.statCircleText}>{overallCounts.marked}</Text>
                  </View>
                  <Text style={styles.statCircleLabel}>Review</Text>
                </View>
              </View>

              <View style={styles.paletteTabRow}>
                <Pressable style={styles.paletteTabBtn} onPress={() => setPaletteTab('grid')}>
                  <Text style={[styles.paletteTabText, paletteTab === 'grid' && styles.paletteTabTextActive]}>
                    Grid
                  </Text>
                  {paletteTab === 'grid' && <View style={styles.paletteTabUnderline} />}
                </Pressable>
                <Pressable style={styles.paletteTabBtn} onPress={() => setPaletteTab('list')}>
                  <Text style={[styles.paletteTabText, paletteTab === 'list' && styles.paletteTabTextActive]}>
                    List
                  </Text>
                  {paletteTab === 'list' && <View style={styles.paletteTabUnderline} />}
                </Pressable>
              </View>

              {sectionsToRender.map((section, sIdx) => {
                const sectionQs = session.questions.slice(section.startNo - 1, section.endNo);
                const counts = countStatuses(sectionQs);
                return (
                  <View key={`${section.name}-${sIdx}`} style={styles.sectionBlock}>
                    {!!section.name && <Text style={styles.sectionBlockTitle}>{section.name}</Text>}
                    <View style={styles.sectionCountsRow}>
                      <View style={styles.sectionCountItem}>
                        <View style={[styles.sectionCountDot, { backgroundColor: STATUS_COLORS.attempted }]} />
                        <Text style={styles.sectionCountText}>{counts.attempted}</Text>
                      </View>
                      <View style={styles.sectionCountItem}>
                        <View style={[styles.sectionCountDot, styles.legendDotOutline]} />
                        <Text style={styles.sectionCountText}>{counts.notVisited}</Text>
                      </View>
                      <View style={styles.sectionCountItem}>
                        <View style={[styles.sectionCountDot, { backgroundColor: STATUS_COLORS.notAnswered }]} />
                        <Text style={styles.sectionCountText}>{counts.notAnswered}</Text>
                      </View>
                      <View style={styles.sectionCountItem}>
                        <View style={[styles.sectionCountDot, { backgroundColor: STATUS_COLORS.marked }]} />
                        <Text style={styles.sectionCountText}>{counts.marked}</Text>
                      </View>
                    </View>

                    {paletteTab === 'grid' ? (
                      <View style={styles.paletteGrid}>
                        {sectionQs.map((q, localIdx) => {
                          const globalIdx = section.startNo - 1 + localIdx;
                          const status = getStatus(q);
                          const isCurrent = globalIdx === index;
                          const bg = STATUS_COLORS[status];
                          return (
                            <Pressable
                              key={q.id}
                              style={[
                                styles.paletteCell,
                                { backgroundColor: bg, borderColor: status === 'notVisited' ? '#CBD5E1' : bg },
                                isCurrent && styles.paletteCellCurrent,
                              ]}
                              onPress={() => {
                                goToIndex(globalIdx);
                                closePalette();
                              }}
                            >
                              <Text style={[styles.paletteCellText, status === 'notVisited' && styles.paletteCellTextDark]}>
                                {globalIdx + 1}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : (
                      <View style={styles.paletteList}>
                        {sectionQs.map((q, localIdx) => {
                          const globalIdx = section.startNo - 1 + localIdx;
                          const status = getStatus(q);
                          const isCurrent = globalIdx === index;
                          const bg = STATUS_COLORS[status];
                          return (
                            <Pressable
                              key={q.id}
                              style={[styles.paletteListRow, isCurrent && styles.paletteListRowCurrent]}
                              onPress={() => {
                                goToIndex(globalIdx);
                                closePalette();
                              }}
                            >
                              <View
                                style={[
                                  styles.paletteListDot,
                                  { backgroundColor: bg, borderColor: status === 'notVisited' ? '#CBD5E1' : bg },
                                ]}
                              >
                                <Text style={[styles.paletteListDotText, status === 'notVisited' && styles.paletteCellTextDark]}>
                                  {globalIdx + 1}
                                </Text>
                              </View>
                              <Text style={styles.paletteListLabel} numberOfLines={1}>
                                {q.subject}
                              </Text>
                              <Text style={styles.paletteListStatus}>{STATUS_LABELS[status]}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            <Pressable
              style={styles.submitTestBtnSheet}
              onPress={() => {
                closePalette();
                setShowSubmitModal(true);
              }}
            >
              <Text style={styles.submitTestBtnSheetText}>Submit Test</Text>
            </Pressable>
            </SafeAreaView>
          </Animated.View>
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

      {isPaused && (
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseCard}>
            <View style={styles.pauseIconWrap}>
              <Ionicons name="pause" size={26} color="#FFFFFF" />
            </View>
            <Text style={styles.pauseTitle}>Test Paused</Text>
            <Text style={styles.pauseSubtitle}>Time Remaining: {formatTime(remainingSeconds)}</Text>
            <Pressable style={styles.submitBtn} onPress={() => setIsPaused(false)}>
              <Text style={styles.submitBtnText}>Resume Test</Text>
            </Pressable>
          </View>
        </View>
      )}
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
  topBarRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  pauseBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  pauseCard: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  pauseIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pauseTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: NAVY,
  },
  pauseSubtitle: {
    fontSize: 13,
    color: MUTED,
    marginTop: 6,
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
  subjectRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  langToggle: {
    flexDirection: 'row',
    backgroundColor: '#EEEDE6',
    borderRadius: 14,
    padding: 2,
  },
  langToggleBtn: {
    paddingHorizontal: 9,
    paddingVertical: 3,
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
  paletteModalRoot: {
    flex: 1,
  },
  paletteBackdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  paletteBackdropFill: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  paletteAnimWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  paletteSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 18,
    paddingBottom: 0,
  },
  paletteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  paletteTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
  },
  legendGrid: {
    marginTop: 16,
    gap: 10,
  },
  legendGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '48%',
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  legendDotOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  legendGridText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  summaryHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: NAVY,
    marginTop: 20,
    marginBottom: 4,
  },
  statCircleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statCircleItem: {
    alignItems: 'center',
    gap: 6,
  },
  statCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCircleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  statCircleLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  paletteTabRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  paletteTabBtn: {
    paddingBottom: 10,
  },
  paletteTabText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  paletteTabTextActive: {
    color: NAVY,
  },
  paletteTabUnderline: {
    marginTop: 8,
    height: 2.5,
    backgroundColor: NAVY,
    borderRadius: 2,
  },
  sectionBlock: {
    marginTop: 18,
  },
  sectionBlockTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1D4ED8',
    marginBottom: 8,
  },
  sectionCountsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  sectionCountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sectionCountDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
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
    borderWidth: 1.5,
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
  paletteCellTextDark: {
    color: '#334155',
  },
  paletteList: {
    gap: 8,
  },
  paletteListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 10,
    padding: 8,
  },
  paletteListRowCurrent: {
    borderColor: '#0F172A',
    borderWidth: 1.5,
  },
  paletteListDot: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteListDotText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  paletteListLabel: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  paletteListStatus: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  submitTestBtnSheet: {
    backgroundColor: '#22A559',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 18,
  },
  submitTestBtnSheetText: {
    fontSize: 14.5,
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
