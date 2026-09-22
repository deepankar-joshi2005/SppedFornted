import { isAxiosError } from 'axios';
import api from '../config/api';

export interface PurchaseItem {
  _id: string;
  user: string;
  testSeries: string;
  amountPaid: number;
  isCoachingStudent: boolean;
  paymentId: string;
  status: string;
  createdAt: string;
}

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  title: string;
  testSeriesId: string;
}

export interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  testSeriesId: string;
}

export interface RevenueSummary {
  totalRevenue: number;
  totalSalesCount: number;
  coachingRevenue: number;
  outsiderRevenue: number;
  seriesBreakdown: Array<{
    title: string;
    count: number;
    total: number;
  }>;
}

const authHeaders = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

const extractError = (err: unknown, fallback: string): string => {
  if (isAxiosError(err) && typeof err.response?.data?.message === 'string') {
    return err.response.data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
};

export const createRazorpayOrder = async (
  token: string,
  testSeriesId: string
): Promise<RazorpayOrderResponse> => {
  try {
    const res = await api.post('/purchases/create-order', { testSeriesId }, authHeaders(token));
    return res.data;
  } catch (err) {
    throw new Error(extractError(err, 'Failed to create payment order.'));
  }
};

export const verifyRazorpayPayment = async (
  token: string,
  payload: VerifyPaymentPayload
): Promise<{ success: boolean; message: string; purchasedSeries?: string[] }> => {
  try {
    const res = await api.post('/purchases/verify-payment', payload, authHeaders(token));
    return res.data;
  } catch (err) {
    throw new Error(extractError(err, 'Payment verification failed.'));
  }
};

export const buyTestSeries = async (
  token: string,
  testSeriesId: string
): Promise<{ message: string; purchase: PurchaseItem; purchasedSeries: string[] }> => {
  try {
    const res = await api.post('/purchases/buy', { testSeriesId }, authHeaders(token));
    return res.data;
  } catch (err) {
    throw new Error(extractError(err, 'Failed to complete test series purchase.'));
  }
};

export const getMyPurchases = async (token: string): Promise<string[]> => {
  try {
    const res = await api.get('/purchases/my-purchases', authHeaders(token));
    return res.data.purchasedSeriesIds || [];
  } catch (err) {
    return [];
  }
};

export const getRevenueSummary = async (token: string): Promise<RevenueSummary> => {
  try {
    const res = await api.get('/purchases/revenue-summary', authHeaders(token));
    return res.data;
  } catch (err) {
    throw new Error(extractError(err, 'Failed to load revenue summary.'));
  }
};
