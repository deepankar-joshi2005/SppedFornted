import { isAxiosError } from 'axios';
import api from '../../config/api';

export interface UpcomingMockItem {
  id: string;
  testId: string;
  seriesTitle: string;
  testTitle: string;
  totalQuestions: number;
  durationMinutes: number;
  totalMarks: number;
  category: string;
  startDate: string;
}

export interface AvailableTestItem {
  id: string;
  testTitle: string;
  seriesTitle: string;
  category: string;
  totalQuestions: number;
  durationMinutes: number;
  totalMarks: number;
  startDate: string | null;
  alreadyAdded: boolean;
}

const authHeaders = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

const extractError = (err: unknown, fallback: string): string => {
  if (isAxiosError(err) && typeof err.response?.data?.message === 'string') {
    return err.response.data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
};

export const getAdminUpcomingMocks = async (token: string): Promise<UpcomingMockItem[]> => {
  try {
    const res = await api.get('/admin/upcoming-mocks', authHeaders(token));
    return res.data;
  } catch (err) {
    throw new Error(extractError(err, 'Failed to fetch upcoming mocks'));
  }
};

export const getAvailableTests = async (token: string): Promise<AvailableTestItem[]> => {
  try {
    const res = await api.get('/admin/upcoming-mocks/available-tests', authHeaders(token));
    return res.data;
  } catch (err) {
    throw new Error(extractError(err, 'Failed to fetch available tests'));
  }
};

export const addUpcomingMock = async (token: string, testId: string): Promise<UpcomingMockItem> => {
  try {
    const res = await api.post('/admin/upcoming-mocks', { testId }, authHeaders(token));
    return res.data;
  } catch (err) {
    throw new Error(extractError(err, 'Failed to add upcoming mock'));
  }
};

export const deleteUpcomingMock = async (token: string, id: string): Promise<void> => {
  try {
    await api.delete(`/admin/upcoming-mocks/${id}`, authHeaders(token));
  } catch (err) {
    throw new Error(extractError(err, 'Failed to remove upcoming mock'));
  }
};
