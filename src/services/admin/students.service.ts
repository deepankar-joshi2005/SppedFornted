import { isAxiosError } from 'axios';
import api from '../../config/api';

export interface AdminStudentListItem {
  id: string;
  name: string;
  email: string;
  mobile: string;
  city: string;
  state: string;
  isCoachingStudent: boolean;
  joinedAt: string;
  attemptCount: number;
  avgScore: number;
}

export interface AdminSectionBreakdown {
  name: string;
  correct: number;
  total: number;
  timeSpentSeconds: number;
}

export interface AdminStudentAttempt {
  attemptId: string;
  title: string;
  status: 'in-progress' | 'completed';
  score: number | null;
  scorePercent: number | null;
  timeTakenSeconds: number | null;
  submittedAt: string | null;
  sectionBreakdown: AdminSectionBreakdown[];
}

export interface AdminStudentWeakArea {
  name: string;
  accuracy: number;
  correct: number;
  total: number;
}

export interface AdminStudentDetail {
  id: string;
  name: string;
  email: string;
  mobile: string;
  city: string;
  state: string;
  isCoachingStudent: boolean;
  joinedAt: string;
  stats: {
    attemptCount: number;
    avgScore: number;
    avgAccuracy: number;
  };
  weakAreas: AdminStudentWeakArea[];
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

export const setCoachingTag = async (
  token: string,
  studentId: string,
  isCoachingStudent: boolean
): Promise<void> => {
  try {
    await api.patch(
      `/admin/students/${studentId}/coaching-tag`,
      { isCoachingStudent },
      authHeaders(token)
    );
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update student tag.'));
  }
};

export const deleteStudent = async (token: string, studentId: string): Promise<void> => {
  try {
    await api.delete(`/admin/students/${studentId}`, authHeaders(token));
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete student.'));
  }
};
