import { isAxiosError } from 'axios';
import api from '../config/api';

export interface NotificationItem {
  id: string;
  type: 'result' | 'system';
  title: string;
  message: string;
  testId?: string | null;
  attemptId?: string | null;
  category?: string | null;
  targetScreen?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  unreadCount: number;
  notifications: NotificationItem[];
}

const authHeaders = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return fallback;
};

export const getNotifications = async (token: string): Promise<NotificationsResponse> => {
  try {
    const response = await api.get<NotificationsResponse>('/notifications', authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, 'Failed to load notifications. Please try again.')
    );
  }
};

export const markNotificationRead = async (token: string, id: string): Promise<void> => {
  try {
    await api.patch(`/notifications/${id}/read`, {}, authHeaders(token));
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update notification.'));
  }
};

export const markAllNotificationsRead = async (token: string): Promise<void> => {
  try {
    await api.patch('/notifications/read-all', {}, authHeaders(token));
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update notifications.'));
  }
};
