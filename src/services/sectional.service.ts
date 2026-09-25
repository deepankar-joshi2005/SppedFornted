import { isAxiosError } from 'axios';
import api from '../config/api';
import { TestListResponse } from './tests.service';

export interface SectionalCategoryItem {
  seriesId: string;
  title: string;
  category: string;
  bannerImage: string | null;
  totalTests: number;
  totalQuestions: number;
  isPaid: boolean;
  price: number;
  coachingPrice: number;
  isPurchased: boolean;
}

const authHeaders = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return fallback;
};

export const getSectionalCategories = async (token: string): Promise<SectionalCategoryItem[]> => {
  try {
    const response = await api.get<SectionalCategoryItem[]>(
      '/sectional/categories',
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load sectional tests. Please try again.'));
  }
};

export const getSectionalSeriesTests = async (
  token: string,
  seriesId: string
): Promise<TestListResponse> => {
  try {
    const response = await api.get<TestListResponse>(
      `/sectional/${seriesId}/tests`,
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load tests. Please try again.'));
  }
};
