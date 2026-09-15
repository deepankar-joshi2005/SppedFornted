import { isAxiosError } from 'axios';
import api from '../../config/api';

export interface AdminMetrics {
  totalStudents: number;
  totalSeries: number;
  totalTests: number;
  totalQuestions: number;
  todaysAttempts: number;
  todaysNewStudents: number;
}

export interface AdminRecentActivity {
  id: string;
  title: string;
  totalQuestions: number;
  status: 'draft' | 'published';
}

export interface AdminDashboardData {
  metrics: AdminMetrics;
  recentActivity: AdminRecentActivity[];
}

const authHeaders = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return fallback;
};

export const getAdminDashboard = async (token: string): Promise<AdminDashboardData> => {
  try {
    const response = await api.get<AdminDashboardData>('/admin/dashboard', authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load dashboard. Please try again.'));
  }
};
