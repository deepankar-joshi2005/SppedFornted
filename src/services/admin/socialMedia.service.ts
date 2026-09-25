import { isAxiosError } from 'axios';
import api from '../../config/api';

export interface AdminSocialMedia {
  id: string;
  platform: string;
  label: string;
  link: string;
  displayOrder: number;
  isActive: boolean;
}

export interface SocialMediaPayload {
  platform: string;
  label: string;
  link: string;
  displayOrder?: number;
  isActive?: boolean;
}

const authHeaders = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return fallback;
};

export const getAdminSocialMedia = async (token: string): Promise<AdminSocialMedia[]> => {
  try {
    const response = await api.get<AdminSocialMedia[]>('/admin/social-media', authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load social media links.'));
  }
};

export const createAdminSocialMedia = async (
  token: string,
  payload: SocialMediaPayload
): Promise<AdminSocialMedia> => {
  try {
    const response = await api.post<AdminSocialMedia>(
      '/admin/social-media',
      payload,
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to save social media link.'));
  }
};

export const updateAdminSocialMedia = async (
  token: string,
  id: string,
  payload: Partial<SocialMediaPayload>
): Promise<AdminSocialMedia> => {
  try {
    const response = await api.put<AdminSocialMedia>(
      `/admin/social-media/${id}`,
      payload,
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update social media link.'));
  }
};

export const deleteAdminSocialMedia = async (token: string, id: string): Promise<void> => {
  try {
    await api.delete(`/admin/social-media/${id}`, authHeaders(token));
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete social media link.'));
  }
};
