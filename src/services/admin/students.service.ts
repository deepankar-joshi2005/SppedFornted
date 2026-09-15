import { isAxiosError } from 'axios';
import api from '../../config/api';

export interface AdminStudentListItem {
  id: string;
  name: string;
  email: string;
  mobile: string;
  joinedAt: string;
  attemptCount: number;
  avgScore: number;
}

export interface AdminStudentAttempt {
  attemptId: string;
  title: string;
  status: 'in-progress' | 'completed';
  score: number | null;
  scorePercent: number | null;
  submittedAt: string | null;
}

export interface AdminStudentDetail {
  id: string;
  name: string;
  email: string;
  mobile: string;
  joinedAt: string;
  attempts: AdminStudentAttempt[];
}

const authHeaders = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return fallback;
};

export const listStudents = async (
  token: string,
  search?: string
): Promise<AdminStudentListItem[]> => {
  try {
    const response = await api.get<AdminStudentListItem[]>('/admin/students', {
      ...authHeaders(token),
      params: search ? { search } : undefined,
    });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load students.'));
  }
};

export const getStudentDetail = async (
  token: string,
  studentId: string
): Promise<AdminStudentDetail> => {
  try {
    const response = await api.get<AdminStudentDetail>(
      `/admin/students/${studentId}`,
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load student.'));
  }
};
