import { isAxiosError } from 'axios';
import api from '../config/api';

export interface EbookItem {
  id: string;
  title: string;
  category: string;
  categoryIcon?: string | null;
  author: string;
  description: string;
  coverImage: string | null;
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
  isNew: boolean;
}

export interface DownloadedEbookItem {
  id: string;
  title: string;
  category: string;
  categoryIcon?: string | null;
  author: string;
  coverImage: string | null;
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

export const getEbooks = async (token: string): Promise<EbookItem[]> => {
  try {
    const response = await api.get<EbookItem[]>('/ebooks', authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load e-books.'));
  }
};

export const markEbookViewed = async (token: string, id: string): Promise<void> => {
  try {
    await api.patch(`/ebooks/${id}/view`, null, authHeaders(token));
  } catch {
    // best-effort; NEW badge will just remain until a future successful call
  }
};

export const markEbookDownloaded = async (token: string, id: string): Promise<void> => {
  try {
    await api.patch(`/ebooks/${id}/download`, null, authHeaders(token));
  } catch {
    // best-effort; it'll just be missing from My Downloads until retried
  }
};

export const getMyDownloadedEbooks = async (token: string): Promise<DownloadedEbookItem[]> => {
  try {
    const response = await api.get<DownloadedEbookItem[]>('/ebooks/my-downloads', authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load your downloads.'));
  }
};
