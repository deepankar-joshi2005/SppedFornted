import { isAxiosError } from 'axios';
import api from '../../config/api';

export interface AdminCategory {
  id: string;
  name: string;
  description: string;
  iconKey: string;
  iconImage: string | null;
  bannerImage: string | null;
  displayOrder: number;
  isActive: boolean;
  seriesCount: number;
  testCount: number;
}

export interface AdminCategorySeriesItem {
  id: string;
  title: string;
  totalTests: number;
  totalQuestions: number;
  status: 'draft' | 'published';
}

export interface AdminCategoryDetail {
  id: string;
  name: string;
  description: string;
  iconKey: string;
  iconImage: string | null;
  bannerImage: string | null;
  isActive: boolean;
  seriesCount: number;
  testCount: number;
  studentCount: number;
  series: AdminCategorySeriesItem[];
}

export interface CategoryPayload {
  name: string;
  description?: string;
  iconKey?: string;
  iconImage?: string | null;
  bannerImage?: string | null;
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

export const getCategories = async (token: string): Promise<AdminCategory[]> => {
  try {
    const response = await api.get<AdminCategory[]>('/admin/categories', authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load categories.'));
  }
};

export const getCategoryDetail = async (
  token: string,
  categoryId: string
): Promise<AdminCategoryDetail> => {
  try {
    const response = await api.get<AdminCategoryDetail>(
      `/admin/categories/${categoryId}`,
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load category.'));
  }
};

export const createCategory = async (
  token: string,
  payload: CategoryPayload
): Promise<AdminCategory> => {
  try {
    const response = await api.post<AdminCategory>('/admin/categories', payload, authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to save category.'));
  }
};

export const updateCategory = async (
  token: string,
  categoryId: string,
  payload: Partial<CategoryPayload>
): Promise<AdminCategory> => {
  try {
    const response = await api.put<AdminCategory>(
      `/admin/categories/${categoryId}`,
      payload,
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update category.'));
  }
};

export const setCategoryStatus = async (
  token: string,
  categoryId: string,
  isActive: boolean
): Promise<AdminCategory> => {
  try {
    const response = await api.patch<AdminCategory>(
      `/admin/categories/${categoryId}/status`,
      { isActive },
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update category status.'));
  }
};

export const deleteCategory = async (token: string, categoryId: string): Promise<void> => {
  try {
    await api.delete(`/admin/categories/${categoryId}`, authHeaders(token));
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete category.'));
  }
};
