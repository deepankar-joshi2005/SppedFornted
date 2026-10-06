import { isAxiosError } from 'axios';
import api from '../config/api';
import { Language } from './profile.service';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  city?: string;
  state?: string;
  role: 'student' | 'admin';
  preferredLanguage?: Language;
  isCoachingStudent?: boolean;
  profileImage?: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface SendOtpResponse {
  message: string;
  target: string;
  type: 'email' | 'mobile';
}

export interface VerifyOtpResponse {
  message: string;
  verificationToken: string;
  target: string;
  type: 'email' | 'mobile';
}

export interface RegisterPayload {
  name: string;
  email: string;
  mobile: string;
  password: string;
  city: string;
  state: string;
  verificationToken?: string;
}

export interface LoginPayload {
  email?: string;
  mobile?: string;
  identifier?: string;
  password: string;
}

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return fallback;
};

export const sendOtp = async (target: string): Promise<SendOtpResponse> => {
  try {
    const response = await api.post<SendOtpResponse>('/auth/send-otp', { target });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to send OTP. Please try again.'));
  }
};

export const verifyOtp = async (target: string, otp: string): Promise<VerifyOtpResponse> => {
  try {
    const response = await api.post<VerifyOtpResponse>('/auth/verify-otp', { target, otp });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Invalid or expired OTP. Please try again.'));
  }
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

export const logoutUser = async (token: string): Promise<void> => {
  try {
    await api.post('/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    // best-effort — local session is cleared regardless
  }
};

export const resetPassword = async (payload: {
  email: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<string> => {
  try {
    const response = await api.post<{ message: string }>('/auth/reset-password', payload);
    return response.data.message;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to reset password. Please try again.'));
  }
};

export const changePassword = async (
  token: string,
  payload: { currentPassword: string; newPassword: string; confirmPassword: string }
): Promise<string> => {
  try {
    const response = await api.post<{ message: string }>('/auth/change-password', payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.message;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to change password. Please try again.'));
  }
};
