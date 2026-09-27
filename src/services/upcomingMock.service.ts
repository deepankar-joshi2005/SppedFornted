import { isAxiosError } from 'axios';
import api from '../config/api';

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

const authHeaders = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

export const getUpcomingMocks = async (token: string): Promise<UpcomingMockItem[]> => {
  try {
    const res = await api.get('/upcoming-mocks', authHeaders(token));
    return res.data;
  } catch (err) {
    return [];
  }
};
