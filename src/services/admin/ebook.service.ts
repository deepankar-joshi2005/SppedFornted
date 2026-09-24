import { isAxiosError } from 'axios';
import { Platform } from 'react-native';
import api from '../../config/api';

export interface AdminEbook {
  id: string;
  title: string;
  category: string;
  author: string;
  description: string;
  coverImage: string | null;
  fileUrl: string;
  fileSize: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface EbookPayload {
  title: string;
  category: string;
  author?: string;
  description?: string;
  coverImage?: string | null;
  fileUrl: string;
  fileSize?: number;
  displayOrder?: number;
  isActive?: boolean;
}

export interface EbookUploadResult {
  url: string;
  fileName: string;
  fileSize: number;
}

const authHeaders = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return fallback;
};

export const getAdminEbooks = async (token: string): Promise<AdminEbook[]> => {
  try {
    const response = await api.get<AdminEbook[]>('/admin/ebooks', authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load e-books.'));
  }
};

export const createAdminEbook = async (
  token: string,
  payload: EbookPayload
): Promise<AdminEbook> => {
  try {
    const response = await api.post<AdminEbook>('/admin/ebooks', payload, authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to save e-book.'));
  }
};

export const updateAdminEbook = async (
  token: string,
  id: string,
  payload: Partial<EbookPayload>
): Promise<AdminEbook> => {
  try {
    const response = await api.put<AdminEbook>(`/admin/ebooks/${id}`, payload, authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update e-book.'));
  }
};

export const deleteAdminEbook = async (token: string, id: string): Promise<void> => {
  try {
    await api.delete(`/admin/ebooks/${id}`, authHeaders(token));
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete e-book.'));
  }
};

export const uploadEbookPdf = async (
  token: string,
  file: { uri: string; name: string; mimeType?: string | null }
): Promise<EbookUploadResult> => {
  try {
    const formData = new FormData();
    if (Platform.OS === 'web') {
      const blob = await (await fetch(file.uri)).blob();
      formData.append('file', blob, file.name);
    } else {
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType ?? 'application/pdf',
      } as unknown as Blob);
    }

    const response = await api.post<EbookUploadResult>('/admin/ebooks/upload', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to upload PDF.'));
  }
};
