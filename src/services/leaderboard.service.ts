import { isAxiosError } from 'axios';
import api from '../config/api';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  initials: string;
  score: number;
  scorePercent: number;
  isCurrentUser: boolean;
}

export interface LeaderboardResponse {
  testTitle: string;
  totalMarks: number;
  top: LeaderboardEntry[];
  currentUser: (LeaderboardEntry & { percentile: number }) | null;
}

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return fallback;
};

export const getLeaderboard = async (
  token: string,
  testId: string
): Promise<LeaderboardResponse> => {
  try {
    const response = await api.get<LeaderboardResponse>(`/tests/${testId}/leaderboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load leaderboard. Please try again.'));
  }
};
