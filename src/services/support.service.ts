import { isAxiosError } from 'axios';
import api from '../config/api';

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  createdAt: string;
}

const authHeaders = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return fallback;
};

export const getTickets = async (token: string): Promise<SupportTicket[]> => {
  try {
    const response = await api.get<SupportTicket[]>('/support/tickets', authHeaders(token));
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load support tickets.'));
  }
};

export const createTicket = async (
  token: string,
  payload: { subject: string; message: string }
): Promise<SupportTicket> => {
  try {
    const response = await api.post<SupportTicket>(
      '/support/tickets',
      payload,
      authHeaders(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to submit your request. Please try again.'));
  }
};
