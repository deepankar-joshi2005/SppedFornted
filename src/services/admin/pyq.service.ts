import { isAxiosError } from 'axios';
import { Platform } from 'react-native';
import api from '../../config/api';

export interface AdminPyq {
  id: string;
  title: string;
  category: string;
  examName: string;
  year: number;
  fileUrl: string;
  fileSize: number;
  accessType: 'free' | 'paid';
  price: number;
  coachingPrice: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface PyqPayload {
  title: string;
  category: string;
  examName: string;
  year: number;
  fileUrl: string;
  fileSize?: number;
  accessType?: 'free' | 'paid';
  price?: number;
  coachingPrice?: number;
  displayOrder?: number;
  isActive?: boolean;
}

export interface PyqUploadResult {
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

export const getAdminPyqs = async (token: string): Promise<AdminPyq[]> => {
  try {
    const response = await api.get<AdminPyq[]>('/admin/pyq', authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load PYQ papers.'));
  }
};

export const createAdminPyq = async (token: string, payload: PyqPayload): Promise<AdminPyq> => {
  try {
    const response = await api.post<AdminPyq>('/admin/pyq', payload, authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to save PYQ paper.'));
  }
};

export const updateAdminPyq = async (
  token: string,
  id: string,
  payload: Partial<PyqPayload>
): Promise<AdminPyq> => {
  try {
    const response = await api.put<AdminPyq>(`/admin/pyq/${id}`, payload, authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update PYQ paper.'));
  }
};

export const deleteAdminPyq = async (token: string, id: string): Promise<void> => {
  try {
    await api.delete(`/admin/pyq/${id}`, authHeaders(token));
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete PYQ paper.'));
  }
};

export const uploadPyqPdf = async (
  token: string,
  file: { uri: string; name: string; mimeType?: string | null }
): Promise<PyqUploadResult> => {
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

    const response = await api.post<PyqUploadResult>('/admin/pyq/upload', formData, {
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
