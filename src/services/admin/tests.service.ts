import { isAxiosError } from 'axios';
import api from '../../config/api';

export interface SubjectSection {
  name: string;
  startNo: number;
  endNo: number;
}

export interface AdminTestDetail {
  _id: string;
  series: string;
  title: string;
  subject: string;
  description: string;
  totalQuestions: number;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  negativeMarkingEnabled: boolean;
  negativeMarks: number;
  maxAttempts: number;
  difficulty: string;
  startDate: string | null;
  endDate: string | null;
  status: 'draft' | 'published';
  subjectSections: SubjectSection[];
}

export interface CreateTestPayload {
  title: string;
  series: string;
  subject?: string;
  description?: string;
  difficulty?: string;
}

export interface UpdateTestConfigPayload {
  title?: string;
  subject?: string;
  description?: string;
  difficulty?: string;
  totalQuestions?: number;
  totalMarks?: number;
  durationMinutes?: number;
  passingMarks?: number;
  negativeMarkingEnabled?: boolean;
  negativeMarks?: number;
  maxAttempts?: number;
  startDate?: string | null;
  endDate?: string | null;
}

export interface AdminTestListItem {
  id: string;
  title: string;
  seriesTitle: string;
  status: 'draft' | 'published';
  totalQuestions: number;
  attemptCount: number;
}

export interface PublishChecklist {
  testId: string;
  title: string;
  questionCount: number;
  checklist: {
    nameAdded: boolean;
    questionsAdded: boolean;
    durationSet: boolean;
    marksConfigured: boolean;
    negativeMarkingConfigured: boolean;
    allValidated: boolean;
  };
  summary: {
    questionCount: number;
    durationMinutes: number;
    totalMarks: number;
    negativeMarks: number;
  };
}

const authHeaders = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return fallback;
};

export const listAllTests = async (
  token: string,
  search?: string
): Promise<AdminTestListItem[]> => {
  try {
    const response = await api.get<AdminTestListItem[]>('/admin/tests', {
      ...authHeaders(token),
      params: search ? { search } : undefined,
    });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load tests.'));
  }
};

export const createTest = async (
  token: string,
  payload: CreateTestPayload
): Promise<AdminTestDetail> => {
  try {
    const response = await api.post<AdminTestDetail>('/admin/tests', payload, authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to create test.'));
  }
};

export const getTestDetail = async (token: string, testId: string): Promise<AdminTestDetail> => {
  try {
    const response = await api.get<AdminTestDetail>(`/admin/tests/${testId}`, authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load test.'));
  }
};

export const updateTestConfig = async (
  token: string,
  testId: string,
  payload: UpdateTestConfigPayload
): Promise<AdminTestDetail> => {
  try {
    const response = await api.put<AdminTestDetail>(
      `/admin/tests/${testId}`,
      payload,
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update test configuration.'));
  }
};

export const getPublishChecklist = async (
  token: string,
  testId: string
): Promise<PublishChecklist> => {
  try {
    const response = await api.get<PublishChecklist>(
      `/admin/tests/${testId}/checklist`,
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load publish checklist.'));
  }
};

export const publishTest = async (token: string, testId: string): Promise<AdminTestDetail> => {
  try {
    const response = await api.patch<AdminTestDetail>(
      `/admin/tests/${testId}/publish`,
      {},
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to publish test.'));
  }
};

export const deleteTest = async (token: string, testId: string): Promise<void> => {
  try {
    await api.delete(`/admin/tests/${testId}`, authHeaders(token));
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete test.'));
  }
};

export const setSubjectSections = async (
  token: string,
  testId: string,
  payload: { enabled: boolean; sections: SubjectSection[] }
): Promise<AdminTestDetail> => {
  try {
    const response = await api.put<AdminTestDetail>(
      `/admin/tests/${testId}/subject-sections`,
      payload,
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to save subject sections.'));
  }
};
