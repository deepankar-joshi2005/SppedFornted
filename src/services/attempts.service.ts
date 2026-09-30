import { isAxiosError } from 'axios';
import api from '../config/api';

export interface AttemptQuestion {
  id: string;
  subject: string;
  text: string;
  textHindi: string | null;
  image: string | null;
  options: string[];
  optionsHindi: string[] | null;
  optionImages: (string | null)[] | null;
  order: number;
}

export interface AttemptAnswer {
  questionId: string;
  selectedOption: number | null;
  markedForReview: boolean;
}

export interface SubjectSection {
  name: string;
  startNo: number;
  endNo: number;
  durationMinutes?: number;
}

export type SectionProgressStatus = 'pending' | 'active' | 'submitted';

export interface SectionProgress {
  name: string;
  startNo: number;
  endNo: number;
  durationSeconds: number | null;
  status: SectionProgressStatus;
  startedAt: string | null;
  submittedAt: string | null;
}

export interface StartAttemptResponse {
  attemptId: string;
  attemptStatus: 'in-progress' | 'completed';
  test: {
    id: string;
    title: string;
    totalQuestions: number;
    durationMinutes: number;
    totalMarks: number;
    negativeMarks: number;
    subjectSections: SubjectSection[];
    divideSectionsByTime: boolean;
  };
  startedAt: string;
  sectionProgress: SectionProgress[];
  activeSectionName: string | null;
  questions: AttemptQuestion[];
  answers: AttemptAnswer[];
}

export interface SectionBreakdown {
  name: string;
  correct: number;
  wrong: number;
  attempted: number;
  total: number;
  score: number;
  timeSpentSeconds: number;
  rank: number;
  topScore: number;
}

export interface ScoreDistributionPoint {
  score: number;
  percentile: number;
}

export interface AttemptResult {
  attemptId: string;
  testId: string;
  title: string;
  score: number;
  totalMarks: number;
  scorePercent: number;
  passed: boolean;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  accuracy: number;
  timeTakenSeconds: number;
  rank: number | null;
  totalCandidates: number | null;
  topScore: number;
  canReattempt: boolean;
  sectionBreakdown: SectionBreakdown[];
  scoreDistribution: ScoreDistributionPoint[];
}

export interface SolutionQuestion {
  index: number;
  total: number;
  id: string;
  subject: string;
  text: string;
  textHindi: string | null;
  image: string | null;
  options: string[];
  optionsHindi: string[] | null;
  optionImages: (string | null)[] | null;
  correctOptionIndex: number;
  explanation: string;
  explanationHindi: string | null;
  explanationImage: string | null;
  selectedOption: number | null;
  isCorrect: boolean | null;
}

export interface SolutionsResponse {
  testTitle: string;
  subjectSections: SubjectSection[];
  questions: SolutionQuestion[];
}

export interface HistoryItem {
  attemptId: string;
  title: string;
  score: number;
  scorePercent: number;
  rank: number | null;
  totalCandidates: number | null;
  passed: boolean;
  submittedAt: string;
}

export class CoachingOnlyError extends Error {}
export class SectionLockedError extends Error {
  activeSectionName: string | null;
  sectionProgress: SectionProgress[];
  constructor(message: string, activeSectionName: string | null, sectionProgress: SectionProgress[]) {
    super(message);
    this.activeSectionName = activeSectionName;
    this.sectionProgress = sectionProgress;
  }
}
export class TestSeriesPaidError extends Error {
  seriesId: string;
  price: number;
  isCoachingStudent: boolean;
  constructor(message: string, seriesId: string, price: number, isCoachingStudent: boolean) {
    super(message);
    this.seriesId = seriesId;
    this.price = price;
    this.isCoachingStudent = isCoachingStudent;
  }
}

const authHeaders = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return fallback;
};

export const startAttempt = async (
  token: string,
  testId: string
): Promise<StartAttemptResponse> => {
  try {
    const response = await api.post<StartAttemptResponse>(
      '/attempts/start',
      { testId },
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.data?.code === 'COACHING_ONLY') {
      throw new CoachingOnlyError(error.response.data.message);
    }
    if (isAxiosError(error) && error.response?.data?.code === 'TEST_SERIES_PAID') {
      const d = error.response.data;
      throw new TestSeriesPaidError(d.message, d.seriesId, d.price, d.isCoachingStudent);
    }
    throw new Error(extractErrorMessage(error, 'Failed to start test. Please try again.'));
  }
};

export const saveAnswer = async (
  token: string,
  attemptId: string,
  payload: {
    questionId: string;
    selectedOption: number | null;
    markedForReview: boolean;
    timeSpentSeconds?: number;
  }
): Promise<void> => {
  try {
    await api.patch(`/attempts/${attemptId}/answer`, payload, authHeaders(token));
  } catch (error) {
    if (isAxiosError(error) && error.response?.data?.code === 'SECTION_LOCKED') {
      const d = error.response.data;
      throw new SectionLockedError(d.message, d.activeSectionName, d.sectionProgress);
    }
    throw new Error(extractErrorMessage(error, 'Failed to save answer.'));
  }
};

export const submitSection = async (
  token: string,
  attemptId: string,
  name: string
): Promise<{
  completed: boolean;
  activeSectionName: string | null;
  sectionProgress: SectionProgress[];
  result?: AttemptResult;
}> => {
  try {
    const response = await api.post(
      `/attempts/${attemptId}/section/submit`,
      { name },
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to submit section.'));
  }
};

export const submitAttempt = async (token: string, attemptId: string): Promise<AttemptResult> => {
  try {
    const response = await api.post<AttemptResult>(
      `/attempts/${attemptId}/submit`,
      {},
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to submit test. Please try again.'));
  }
};

export const getResult = async (token: string, attemptId: string): Promise<AttemptResult> => {
  try {
    const response = await api.get<AttemptResult>(
      `/attempts/${attemptId}/result`,
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load result. Please try again.'));
  }
};

export const getSolutions = async (
  token: string,
  attemptId: string
): Promise<SolutionsResponse> => {
  try {
    const response = await api.get<SolutionsResponse>(
      `/attempts/${attemptId}/solutions`,
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load solutions. Please try again.'));
  }
};

export const getHistory = async (token: string): Promise<HistoryItem[]> => {
  try {
    const response = await api.get<HistoryItem[]>('/attempts/history', authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load test history. Please try again.'));
  }
};
