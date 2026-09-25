import { isAxiosError } from 'axios';
import api from '../config/api';

export interface EbookItem {
  id: string;
  title: string;
  category: string;
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
  createdAt: string;
  isNew: boolean;
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
