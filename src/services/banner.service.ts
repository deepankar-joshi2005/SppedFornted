import { isAxiosError } from 'axios';
import api from '../config/api';
import { BannerItem, TeacherInfoData, SuccessStoryItem } from './dashboard.service';

const authHeaders = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return fallback;
};

// Banners Admin API
export const getAdminBanners = async (token: string): Promise<BannerItem[]> => {
  try {
    const res = await api.get<BannerItem[]>('/admin/banners', authHeaders(token));
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Failed to fetch banners'));
  }
};

export const createAdminBanner = async (
  token: string,
  data: Partial<BannerItem>
): Promise<BannerItem> => {
  try {
    const res = await api.post<BannerItem>('/admin/banners', data, authHeaders(token));
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Failed to create banner'));
  }
};

export const updateAdminBanner = async (
  token: string,
  id: string,
  data: Partial<BannerItem>
): Promise<BannerItem> => {
  try {
    const res = await api.put<BannerItem>(`/admin/banners/${id}`, data, authHeaders(token));
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Failed to update banner'));
  }
};

export const deleteAdminBanner = async (token: string, id: string): Promise<void> => {
  try {
    await api.delete(`/admin/banners/${id}`, authHeaders(token));
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Failed to delete banner'));
  }
};

// Teacher Info Admin API
export const getAdminTeacherInfo = async (token: string): Promise<TeacherInfoData> => {
  try {
    const res = await api.get<TeacherInfoData>('/admin/teacher-info', authHeaders(token));
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Failed to fetch teacher info'));
  }
};

export const updateAdminTeacherInfo = async (
  token: string,
  data: Partial<TeacherInfoData>
): Promise<TeacherInfoData> => {
  try {
    const res = await api.put<TeacherInfoData>('/admin/teacher-info', data, authHeaders(token));
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Failed to update teacher info'));
  }
};

// Success Stories Admin API
export const getAdminSuccessStories = async (token: string): Promise<SuccessStoryItem[]> => {
  try {
    const res = await api.get<SuccessStoryItem[]>('/admin/success-stories', authHeaders(token));
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Failed to fetch success stories'));
  }
};

export const createAdminSuccessStory = async (
  token: string,
  data: Partial<SuccessStoryItem>
): Promise<SuccessStoryItem> => {
  try {
    const res = await api.post<SuccessStoryItem>('/admin/success-stories', data, authHeaders(token));
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Failed to create success story'));
  }
};

export const updateAdminSuccessStory = async (
  token: string,
  id: string,
  data: Partial<SuccessStoryItem>
): Promise<SuccessStoryItem> => {
  try {
    const res = await api.put<SuccessStoryItem>(`/admin/success-stories/${id}`, data, authHeaders(token));
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Failed to update success story'));
  }
};

export const deleteAdminSuccessStory = async (token: string, id: string): Promise<void> => {
  try {
    await api.delete(`/admin/success-stories/${id}`, authHeaders(token));
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Failed to delete success story'));
  }
};
