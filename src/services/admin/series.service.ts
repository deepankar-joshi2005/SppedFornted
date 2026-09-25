import { isAxiosError } from 'axios';
import api from '../../config/api';

export type SeriesStatus = 'draft' | 'published';
export type AccessType = 'free' | 'paid';
export type SeriesKind = 'series' | 'sectional';

export interface AdminSeriesListItem {
  id: string;
  title: string;
  category: string;
  status: SeriesStatus;
  accessType: AccessType;
  price: number;
  coachingPrice: number;
  testCount: number;
  totalQuestions: number;
  studentCount: number;
}

export interface AdminSeriesCounts {
  all: number;
  published: number;
  draft: number;
}

export interface AdminSeriesListResponse {
  series: AdminSeriesListItem[];
  counts: AdminSeriesCounts;
}

export interface AdminSeriesDetail {
  _id: string;
  title: string;
  category: string;
  examTarget: string;
  description: string;
  shortDescription: string;
  bannerImage: string | null;
  totalPapers: number;
  unitLabel: string;
  totalQuestions: number;
  durationMinutes: number;
  difficulty: string;
  accessType: AccessType;
  price: number;
  coachingPrice: number;
  freeDemoCount: number;
  validityMonths: number;
  startDate: string | null;
  endDate: string | null;
  isPublic: boolean;
  status: SeriesStatus;
  testCount: number;
  studentCount: number;
}

export interface CreateSeriesPayload {
  title: string;
  category: string;
  kind?: SeriesKind;
  examTarget?: string;
  description?: string;
  shortDescription?: string;
  bannerImage?: string | null;
  difficulty?: string;
}

export interface UpdateSeriesPayload {
  title?: string;
  category?: string;
  examTarget?: string;
  description?: string;
  shortDescription?: string;
  bannerImage?: string | null;
  difficulty?: string;
  totalPapers?: number;
  validityMonths?: number;
  startDate?: string | null;
  endDate?: string | null;
  accessType?: AccessType;
  price?: number;
  coachingPrice?: number;
  freeDemoCount?: number;
  isPublic?: boolean;
}

export interface AdminSeriesTestItem {
  id: string;
  title: string;
  totalQuestions: number;
  durationMinutes: number;
  totalMarks: number;
  status: 'draft' | 'published';
}

const authHeaders = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return fallback;
};

export const listSeries = async (
  token: string,
  params?: { status?: SeriesStatus; search?: string; kind?: SeriesKind }
): Promise<AdminSeriesListResponse> => {
  try {
    const response = await api.get<AdminSeriesListResponse>('/admin/series', {
      ...authHeaders(token),
      params,
    });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load test series.'));
  }
};

export const getSeriesDetail = async (
  token: string,
  seriesId: string
): Promise<AdminSeriesDetail> => {
  try {
    const response = await api.get<AdminSeriesDetail>(
      `/admin/series/${seriesId}`,
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load test series.'));
  }
};

export const createSeries = async (
  token: string,
  payload: CreateSeriesPayload
): Promise<AdminSeriesDetail> => {
  try {
    const response = await api.post<AdminSeriesDetail>('/admin/series', payload, authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to create test series.'));
  }
};

export const updateSeries = async (
  token: string,
  seriesId: string,
  payload: UpdateSeriesPayload
): Promise<AdminSeriesDetail> => {
  try {
    const response = await api.put<AdminSeriesDetail>(
      `/admin/series/${seriesId}`,
      payload,
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update test series.'));
  }
};

export const publishSeries = async (
  token: string,
  seriesId: string
): Promise<AdminSeriesDetail> => {
  try {
    const response = await api.patch<AdminSeriesDetail>(
      `/admin/series/${seriesId}/publish`,
      {},
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to publish test series.'));
  }
};

export const duplicateSeries = async (
  token: string,
  seriesId: string
): Promise<AdminSeriesDetail> => {
  try {
    const response = await api.post<AdminSeriesDetail>(
      `/admin/series/${seriesId}/duplicate`,
      {},
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to duplicate test series.'));
  }
};

export const deleteSeries = async (token: string, seriesId: string): Promise<void> => {
  try {
    await api.delete(`/admin/series/${seriesId}`, authHeaders(token));
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete test series.'));
  }
};

export const getSeriesTests = async (
  token: string,
  seriesId: string
): Promise<{ series: { id: string; title: string }; tests: AdminSeriesTestItem[] }> => {
  try {
    const response = await api.get(`/admin/series/${seriesId}/tests`, authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load tests for this series.'));
  }
};
