import { isAxiosError } from 'axios';
import api from '../config/api';

export interface SubjectMastery {
  subject: string;
  accuracy: number;
  label: string;
}

export interface PerformanceData {
  attempted: number;
  avgScore: number;
  bestScore: number;
  improvement: number;
  scoreTrend: number[];
  subjectMastery: SubjectMastery[];
  overallAccuracy: number;
}

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return fallback;
};

export const getPerformance = async (token: string): Promise<PerformanceData> => {
  try {
    const response = await api.get<PerformanceData>('/performance', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load performance. Please try again.'));
  }
};
