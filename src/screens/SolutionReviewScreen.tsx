import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationBell from '../components/NotificationBell';
import { Nav } from '../navigation/types';
import { getSolutions, SolutionsResponse } from '../services/attempts.service';
import { ERROR, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  attemptId: string;
  nav: Nav;
};

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export default function SolutionReviewScreen({ token, attemptId, nav }: Props) {
  const [data, setData] = useState<SolutionsResponse | null>(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        <NotificationBell
          token={token}
          style={styles.iconBtn}
          onPress={() => nav.push({ name: 'notifications' })}
        />
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

      {!!data && data.subjectSections.length > 0 && (
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

      {question && (
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
            <Text style={styles.questionText}>{question.text}</Text>

            <View style={styles.optionsList}>
              {question.options.map((option, optIdx) => {
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
                    {isCorrectOption && (
                      <Ionicons name="checkmark-circle" size={18} color="#2E9E5B" />
                    )}
                    {showWrong && <Ionicons name="close-circle" size={18} color={ERROR} />}
                  </View>
                );
              })}
            </View>

            {!!question.explanation && (
              <View style={styles.explanationBox}>
                <Text style={styles.explanationTitle}>Detailed Solution & Concept:</Text>
                <Text style={styles.explanationText}>{question.explanation}</Text>
              </View>
            )}
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
    </SafeAreaView>
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
