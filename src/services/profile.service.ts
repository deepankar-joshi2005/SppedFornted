import { isAxiosError } from 'axios';
import api from '../config/api';

export const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali'] as const;
export type Language = (typeof LANGUAGES)[number];

export interface ProfileData {
  name: string;
  email: string;
  mobile: string;
  preferredLanguage: Language;
  profileImage: string | null;
  testsAttempted: number;
  avgAccuracy: number;
  bestRank: number | null;
}

const authHeaders = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return fallback;
};

export const getProfile = async (token: string): Promise<ProfileData> => {
  try {
    const response = await api.get<ProfileData>('/profile', authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load profile. Please try again.'));
  }
};

export const updateProfile = async (
  token: string,
  payload: { name: string; email: string; mobile: string }
): Promise<{ id: string; name: string; email: string; mobile: string }> => {
  try {
    const response = await api.patch('/profile', payload, authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update profile. Please try again.'));
  }
};

export const updateProfileImage = async (
  token: string,
  profileImage: string | null
): Promise<{ profileImage: string | null }> => {
  try {
    const response = await api.patch('/profile/photo', { profileImage }, authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update profile photo. Please try again.'));
  }
};

export const updateLanguage = async (
  token: string,
  language: Language
): Promise<{ preferredLanguage: Language }> => {
  try {
    const response = await api.patch('/profile/language', { language }, authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update language. Please try again.'));
  }
};
