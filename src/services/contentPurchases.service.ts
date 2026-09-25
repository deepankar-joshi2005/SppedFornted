import { isAxiosError } from 'axios';
import api from '../config/api';

export type ContentItemType = 'pyq' | 'ebook';

export interface ContentOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  title: string;
  itemType: ContentItemType;
  itemId: string;
}

export interface VerifyContentPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  itemType: ContentItemType;
  itemId: string;
}

const authHeaders = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

const extractError = (err: unknown, fallback: string): string => {
  if (isAxiosError(err) && typeof err.response?.data?.message === 'string') {
    return err.response.data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
};

export const createContentOrder = async (
  token: string,
  itemType: ContentItemType,
  itemId: string
): Promise<ContentOrderResponse> => {
  try {
    const res = await api.post(
      '/content-purchases/create-order',
      { itemType, itemId },
      authHeaders(token)
    );
    return res.data;
  } catch (err) {
    throw new Error(extractError(err, 'Failed to create payment order.'));
  }
};

export const verifyContentPayment = async (
  token: string,
  payload: VerifyContentPaymentPayload
): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await api.post('/content-purchases/verify-payment', payload, authHeaders(token));
    return res.data;
  } catch (err) {
    throw new Error(extractError(err, 'Payment verification failed.'));
  }
};
