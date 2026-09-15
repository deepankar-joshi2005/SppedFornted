import { isAxiosError } from 'axios';
import api from '../config/api';
import { Language } from './profile.service';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'student' | 'admin';
  preferredLanguage?: Language;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  mobile: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return fallback;
};

export const registerUser = async (payload: RegisterPayload): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/register', payload);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Sign up failed. Please try again.'));
  }
};

export const loginUser = async (payload: LoginPayload): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/login', payload);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Login failed. Please try again.'));
  }
};
