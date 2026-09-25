import { isAxiosError } from 'axios';
import api from '../config/api';

export interface SocialMediaLink {
  id: string;
  platform: string;
  label: string;
  link: string;
}

const authHeaders = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return fallback;
};

export const getSocialMediaLinks = async (token: string): Promise<SocialMediaLink[]> => {
  try {
    const response = await api.get<SocialMediaLink[]>('/social-media', authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load social media links.'));
  }
};
