import { isAxiosError } from 'axios';
import api from '../config/api';

export interface DashboardStats {
  totalTests: number;
  attempted: number;
  avgScore: number;
  rank: number | null;
}

export interface ContinueTest {
  attemptId: string;
  testId: string;
  title: string;
  totalQuestions: number;
  questionsCompleted: number;
  percent: number;
}

export interface TestSeries {
  id: string;
  title: string;
  category: string;
  totalPapers: number;
  unitLabel: string;
  isAvailable: boolean;
  bannerImage: string | null;
}

export interface DashboardCategory {
  name: string;
  iconImage: string | null;
}

export interface BannerItem {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  linkUrl?: string;
  tag?: string;
}

export interface TeacherInfoData {
  name: string;
  title: string;
  designation: string;
  imageUrl?: string;
  bio?: string;
}

export interface LiveMockItem {
  id: string;
  title: string;
  badgeText: string;
  totalQuestions: number;
  durationMinutes: number;
  totalMarks: number;
  isLive: boolean;
  category: string;
}

export interface TrendingExamItem {
  id: string;
  name: string;
  code: string;
  icon?: string;
}

export interface ActivityItem {
  attemptId: string;
  testId: string;
  title: string;
  categoryTag: string;
  totalQuestions: number;
  questionsCompleted: number;
  durationMinutes: number;
  percent: number;
}

export interface SuccessStoryItem {
  id: string;
  studentName: string;
  studentImage?: string;
  examTag: string;
  reviewText: string;
}

export interface DashboardData {
  stats: DashboardStats;
  continueTest: ContinueTest | null;
  categories: DashboardCategory[];
  popularSeries: TestSeries[];
  banners?: BannerItem[];
  teacherInfo?: TeacherInfoData;
  liveMocks?: LiveMockItem[];
  trendingExams?: TrendingExamItem[];
  myActivities?: ActivityItem[];
  successStories?: SuccessStoryItem[];
}

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return fallback;
};

export const getDashboard = async (token: string, category?: string): Promise<DashboardData> => {
  try {
    const response = await api.get<DashboardData>('/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
      params: category ? { category } : undefined,
    });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load dashboard. Please try again.'));
  }
};
