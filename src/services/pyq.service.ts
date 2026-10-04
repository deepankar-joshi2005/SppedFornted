import { isAxiosError } from 'axios';
import api from '../config/api';

export interface PyqItem {
  id: string;
  title: string;
  category: string;
  categoryIcon?: string | null;
  examName: string;
  year: number;
  fileUrl: string | null;
  fileSize: number;
  accessType: 'free' | 'paid';
  price: number;
  coachingPrice: number;
  isCoachingStudent: boolean;
  isPurchased: boolean;
  isLocked: boolean;
  isDownloaded?: boolean;
  createdAt: string;
}

export interface DownloadedPyqItem {
  id: string;
  title: string;
  category: string;
  categoryIcon?: string | null;
  examName: string;
  year: number;
  fileUrl: string | null;
  isLocked: boolean;
}

const authHeaders = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return fallback;
};

export const getPyqs = async (token: string): Promise<PyqItem[]> => {
  try {
    const response = await api.get<PyqItem[]>('/pyq', authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load previous year papers.'));
  }
};

export const markPyqDownloaded = async (token: string, id: string): Promise<void> => {
  try {
    await api.patch(`/pyq/${id}/download`, null, authHeaders(token));
  } catch {
    // best-effort; it'll just be missing from My Downloads until retried
  }
};

export const getMyDownloadedPyqs = async (token: string): Promise<DownloadedPyqItem[]> => {
  try {
    const response = await api.get<DownloadedPyqItem[]>('/pyq/my-downloads', authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load your downloads.'));
  }
};
