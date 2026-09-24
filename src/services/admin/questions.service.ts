import { isAxiosError } from 'axios';
import { Platform } from 'react-native';
import api from '../../config/api';

export type QuestionDifficulty = 'Easy' | 'Moderate' | 'Hard';

export interface AdminQuestion {
  _id: string;
  test: string | null;
  bankId: string;
  subject: string;
  topic: string;
  text: string;
  textHindi: string;
  image: string | null;
  options: string[];
  optionsHindi: string[];
  correctOptionIndex: number;
  explanation: string;
  explanationHindi: string;
  difficulty: QuestionDifficulty;
  marks: number;
  negativeMarks: number;
  order: number;
  usageCount?: number;
}

export interface QuestionStats {
  total: number;
  active: number;
  unused: number;
}

export interface QuestionPayload {
  testId?: string;
  subject: string;
  topic?: string;
  text: string;
  textHindi?: string;
  image?: string | null;
  options: string[];
  optionsHindi?: string[];
  correctOptionIndex: number;
  explanation?: string;
  explanationHindi?: string;
  difficulty?: QuestionDifficulty;
  marks?: number;
  negativeMarks?: number;
}

export interface ImportResult {
  found: number;
  valid: number;
  imported?: number;
  errors: { row: number; message: string }[];
}

const authHeaders = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return fallback;
};

export const listBank = async (
  token: string,
  params?: { search?: string; subject?: string; difficulty?: string; unused?: boolean }
): Promise<AdminQuestion[]> => {
  try {
    const response = await api.get<AdminQuestion[]>('/admin/questions', {
      ...authHeaders(token),
      params: params
        ? { ...params, unused: params.unused ? 'true' : undefined }
        : undefined,
    });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load question bank.'));
  }
};

export const getStats = async (token: string): Promise<QuestionStats> => {
  try {
    const response = await api.get<QuestionStats>('/admin/questions/stats', authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load question stats.'));
  }
};

export const getByTest = async (token: string, testId: string): Promise<AdminQuestion[]> => {
  try {
    const response = await api.get<AdminQuestion[]>(
      `/admin/questions/by-test/${testId}`,
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load test questions.'));
  }
};

export const getQuestion = async (token: string, questionId: string): Promise<AdminQuestion> => {
  try {
    const response = await api.get<AdminQuestion>(
      `/admin/questions/${questionId}`,
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load question.'));
  }
};

export const createQuestion = async (
  token: string,
  payload: QuestionPayload
): Promise<AdminQuestion> => {
  try {
    const response = await api.post<AdminQuestion>('/admin/questions', payload, authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to save question.'));
  }
};

export const updateQuestion = async (
  token: string,
  questionId: string,
  payload: Partial<QuestionPayload>
): Promise<AdminQuestion> => {
  try {
    const response = await api.put<AdminQuestion>(
      `/admin/questions/${questionId}`,
      payload,
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update question.'));
  }
};

export const deleteQuestion = async (token: string, questionId: string): Promise<void> => {
  try {
    await api.delete(`/admin/questions/${questionId}`, authHeaders(token));
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to remove question.'));
  }
};

export const bulkAddToTest = async (
  token: string,
  questionIds: string[],
  testId: string
): Promise<{ added: number; message: string }> => {
  try {
    const response = await api.post<{ added: number; message: string }>(
      '/admin/questions/bulk-add-to-test',
      { testId, questionIds },
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to bulk add questions to test.'));
  }
};

export const addToTest = async (
  token: string,
  questionId: string,
  testId: string,
  marks?: number
): Promise<AdminQuestion> => {
  try {
    const response = await api.post<AdminQuestion>(
      `/admin/questions/${questionId}/add-to-test`,
      { testId, marks },
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to add question to test.'));
  }
};

export const importQuestions = async (
  token: string,
  testId: string,
  file: { uri: string; name: string; mimeType?: string | null },
  commit: boolean
): Promise<ImportResult> => {
  try {
    const formData = new FormData();
    if (Platform.OS === 'web') {
      // On web, expo-document-picker returns a blob: URI. FormData there needs a
      // real Blob/File — the { uri, name, type } shim only works on native RN.
      const blob = await (await fetch(file.uri)).blob();
      formData.append('file', blob, file.name);
    } else {
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType ?? 'application/octet-stream',
      } as unknown as Blob);
    }

    const response = await api.post<ImportResult>(
      `/admin/questions/by-test/${testId}/import`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        params: { commit: commit ? 'true' : 'false' },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to import questions.'));
  }
};
