import { getAuth, signInWithPhoneNumber, signOut, ConfirmationResult } from '@react-native-firebase/auth';

export type OtpConfirmation = ConfirmationResult;

export const sendFirebaseOtp = async (mobile: string): Promise<OtpConfirmation> => {
  return signInWithPhoneNumber(getAuth(), `+91${mobile}`);
};

export const confirmFirebaseOtp = async (
  confirmation: OtpConfirmation,
  code: string
): Promise<string> => {
  const credential = await confirmation.confirm(code);
  const idToken = await credential?.user.getIdToken();
  if (!idToken) {
    throw new Error('Could not verify OTP. Please try again.');
  }
  // Only used to prove phone ownership to our backend during signup —
  // sign out right away so it doesn't linger as a separate Firebase session.
  await signOut(getAuth());
  return idToken;
};

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-phone-number': 'Enter a valid 10-digit mobile number',
  'auth/too-many-requests': 'Too many attempts. Please wait a while and try again.',
  'auth/invalid-verification-code': 'Incorrect OTP. Please try again.',
  'auth/code-expired': 'OTP has expired. Please request a new one.',
  'auth/network-request-failed': 'Network error. Please check your internet connection.',
  'auth/missing-phone-number': 'Enter a valid 10-digit mobile number',
  'auth/quota-exceeded': 'SMS limit reached for today. Please try again later.',
};

export const describeOtpError = (error: unknown, fallback: string): string => {
  const code = (error as { code?: string })?.code;
  if (code && FIREBASE_ERROR_MESSAGES[code]) return FIREBASE_ERROR_MESSAGES[code];
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};
