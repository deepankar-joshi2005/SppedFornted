import { isAxiosError } from 'axios';
import api from '../config/api';

export interface TestSeriesSummary {
  category: string;
  iconImage: string | null;
  totalTests: number;
  totalQuestions: number;
  durationMinutes: number;
  difficulty: string;
  percentCompleted: number;
}

export interface TestListItem {
  id: string;
  title: string;
  totalQuestions: number;
  durationMinutes: number;
  totalMarks: number;
  difficulty: string;
  status: 'not-attempted' | 'in-progress' | 'completed';
  attemptId: string | null;
  score: number | null;
  scorePercent: number | null;
  maxAttempts: number;
  attemptsUsed: number;
  canReattempt: boolean;
}

export interface TestListResponse {
  category: string;
  seriesTitle: string;
  bannerImage: string | null;
  tests: TestListItem[];
}

export interface TestInstructions {
  id: string;
  title: string;
  seriesTitle: string;
  category: string;
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  negativeMarks: number;
}

const authHeaders = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return fallback;
};

export const getTestSeriesSummary = async (token: string): Promise<TestSeriesSummary[]> => {
  try {
    const response = await api.get<TestSeriesSummary[]>('/tests/summary', authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load test series. Please try again.'));
  }
};

export const getTestsByCategory = async (
  token: string,
  category: string
): Promise<TestListResponse> => {
  try {
    const response = await api.get<TestListResponse>(
      `/tests/category/${category}`,
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load tests. Please try again.'));
  }
};

export const getTestInstructions = async (
  token: string,
  testId: string
): Promise<TestInstructions> => {
  try {
    const response = await api.get<TestInstructions>(
      `/tests/${testId}/instructions`,
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load instructions. Please try again.'));
  }
};
