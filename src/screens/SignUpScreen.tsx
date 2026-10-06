import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import { sendOtp, verifyOtp, registerUser, AuthResponse } from '../services/auth.service';
import { updateProfileImage } from '../services/profile.service';
import { uploadImage } from '../services/upload.service';
import { GOLD, MUTED, NAVY } from '../theme/colors';
import { isValidEmail, isValidMobile, isStrongPassword, PASSWORD_HINT } from '../utils/validation';

type Props = {
  onBack: () => void;
  onSignUpSuccess: (result: AuthResponse) => void;
  onGoToLogin: () => void;
};

type Step = 'otp_target' | 'otp_code' | 'register_details';

type Errors = Partial<
  Record<'otpTarget' | 'otpCode' | 'name' | 'email' | 'mobile' | 'city' | 'state' | 'password' | 'confirmPassword', string>
>;

export default function SignUpScreen({ onBack, onSignUpSuccess, onGoToLogin }: Props) {
  const [step, setStep] = useState<Step>('otp_target');

  // OTP step states
  const [targetInput, setTargetInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpTarget, setOtpTarget] = useState('');
  const [otpType, setOtpType] = useState<'email' | 'mobile'>('email');
  const [verificationToken, setVerificationToken] = useState('');

  // Register details states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState<string | null | undefined>(null);

  const [errors, setErrors] = useState<Errors>({});
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    setApiError('');
    setSuccessMsg('');
    const val = targetInput.trim();
    if (!val) {
      setErrors({ otpTarget: 'Enter an Email or 10-digit Mobile number' });
      return;
    }
    if (!isValidEmail(val) && !isValidMobile(val)) {
      setErrors({ otpTarget: 'Enter a valid Email address or 10-digit Mobile number' });
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const res = await sendOtp(val);
      setOtpTarget(res.target);
      setOtpType(res.type);
      setSuccessMsg(res.message);
      setStep('otp_code');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setApiError('');
    setSuccessMsg('');
    const code = otpCode.trim();
    if (!code || code.length !== 6) {
      setErrors({ otpCode: 'Enter 6-digit OTP code' });
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const res = await verifyOtp(otpTarget, code);
      setVerificationToken(res.verificationToken);
      setSuccessMsg('OTP Verified Successfully! Please complete your registration details.');
      
      // Auto fill verified target
      if (res.type === 'email') {
        setEmail(res.target);
      } else {
        setMobile(res.target);
      }

      setStep('register_details');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to add a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]) return;
    setPhotoUri(result.assets[0].uri);
    setPhotoMimeType(result.assets[0].mimeType);
  };

  const validateRegister = (): boolean => {
    const next: Errors = {};
    if (!name.trim()) next.name = 'Student name is required';
    if (!email.trim()) next.email = 'Email is required';
    else if (!isValidEmail(email)) next.email = 'Enter a valid email address';
    if (!mobile.trim()) next.mobile = 'Mobile number is required';
    else if (!isValidMobile(mobile)) next.mobile = 'Enter a valid 10-digit mobile number';
    if (!city.trim()) next.city = 'City is required';
    if (!state.trim()) next.state = 'State is required';
    if (!password) next.password = 'Password is required';
    else if (!isStrongPassword(password)) next.password = PASSWORD_HINT;
    if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegisterSubmit = async () => {
    setApiError('');
    if (!validateRegister()) return;

    setLoading(true);
    try {
      const result = await registerUser({
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        city: city.trim(),
        state: state.trim(),
        password,
        verificationToken,
      });

      if (photoUri) {
        try {
          const url = await uploadImage(result.token, {
            uri: photoUri,
            name: `profile-${Date.now()}.jpg`,
            mimeType: photoMimeType,
          });
          await updateProfileImage(result.token, url);
        } catch {
          // Account creation already succeeded — photo can be added later
        }
      }

      onSignUpSuccess(result);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      onBack={step === 'otp_target' ? onBack : () => setStep('otp_target')}
      title={
        step === 'register_details'
          ? 'Create Account'
          : step === 'otp_code'
          ? 'Enter OTP'
          : 'OTP Verification'
      }
      subtitle={
        step === 'register_details'
          ? 'Fill in your details to complete registration.'
          : step === 'otp_code'
          ? `Enter the 6-digit OTP sent to ${otpTarget}`
          : 'Enter your Email or Mobile Number to receive a 6-digit OTP'
      }
      footerText="Already have an account?"
      footerActionText="Login"
      onFooterAction={onGoToLogin}
    >
      {!!apiError && (
        <View style={styles.apiErrorBox}>
          <Text style={styles.apiErrorText}>{apiError}</Text>
        </View>
      )}

      {!!successMsg && (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#065F46" style={{ marginRight: 6 }} />
          <Text style={styles.successText}>{successMsg}</Text>
        </View>
      )}

      {/* STEP 1: Enter Target (Email/Mobile) */}
      {step === 'otp_target' && (
        <View>
          <FormInput
            icon="call-outline"
            placeholder="Email Address or 10-digit Mobile No."
            value={targetInput}
            onChangeText={setTargetInput}
            error={errors.otpTarget}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <PrimaryButton label="SEND 6-DIGIT OTP" onPress={handleSendOtp} loading={loading} />
        </View>
      )}

      {/* STEP 2: Enter 6-digit OTP Code */}
      {step === 'otp_code' && (
        <View>
          <FormInput
            icon="key-outline"
            placeholder="Enter 6-digit OTP Code"
            value={otpCode}
            onChangeText={setOtpCode}
            error={errors.otpCode}
            keyboardType="number-pad"
            maxLength={6}
          />

          <PrimaryButton label="VERIFY OTP" onPress={handleVerifyOtp} loading={loading} />

          <View style={styles.resendRow}>
            <Pressable onPress={handleSendOtp} disabled={loading} hitSlop={8}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </Pressable>
            <Text style={styles.divider}>|</Text>
            <Pressable onPress={() => setStep('otp_target')} disabled={loading} hitSlop={8}>
              <Text style={styles.resendText}>Change Email / Mobile</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* STEP 3: Register Form Details */}
      {step === 'register_details' && (
        <View>
          <View style={styles.photoRow}>
            <Pressable style={styles.photoCircle} onPress={pickPhoto} disabled={loading}>
              {loading && photoUri ? (
                <ActivityIndicator color={NAVY} />
              ) : photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoImage} />
              ) : (
                <Ionicons name="camera-outline" size={30} color={MUTED} />
              )}
            </Pressable>
            <Text style={styles.photoHint}>Profile Photo (optional)</Text>
          </View>

          <FormInput
            icon="person-outline"
            placeholder="Student Name"
            value={name}
            onChangeText={setName}
            error={errors.name}
            autoCapitalize="words"
          />

          <FormInput
            icon="mail-outline"
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            autoCapitalize="none"
            keyboardType="email-address"
            verified={otpType === 'email'}
            editable={otpType !== 'email'}
          />

          <FormInput
            icon="call-outline"
            placeholder="Mobile Number"
            value={mobile}
            onChangeText={setMobile}
            error={errors.mobile}
            keyboardType="phone-pad"
            maxLength={10}
            verified={otpType === 'mobile'}
            editable={otpType !== 'mobile'}
          />

          <FormInput
            icon="location-outline"
            placeholder="City"
            value={city}
            onChangeText={setCity}
            error={errors.city}
            autoCapitalize="words"
          />

          <FormInput
            icon="map-outline"
            placeholder="State"
            value={state}
            onChangeText={setState}
            error={errors.state}
            autoCapitalize="words"
          />

          <FormInput
            icon="lock-closed-outline"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            isPassword
          />
          {!errors.password && <Text style={styles.hint}>{PASSWORD_HINT}</Text>}

          <FormInput
            icon="lock-closed-outline"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
            isPassword
          />

          <PrimaryButton label="CREATE ACCOUNT" onPress={handleRegisterSubmit} loading={loading} />
        </View>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  photoRow: {
    alignItems: 'center',
    marginBottom: 18,
  },
  photoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F1F0EA',
    borderWidth: 1.5,
    borderColor: '#D9D6CC',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoHint: {
    marginTop: 8,
    fontSize: 11.5,
    color: MUTED,
  },
  hint: {
    marginTop: -8,
    marginBottom: 14,
    marginLeft: 4,
    fontSize: 11,
    color: MUTED,
    lineHeight: 15,
  },
  apiErrorBox: {
    backgroundColor: '#FBEAE8',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F0C4BE',
  },
  apiErrorText: {
    color: '#C0392B',
    fontSize: 12.5,
    textAlign: 'center',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successText: {
    color: '#065F46',
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 10,
  },
  resendText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: GOLD,
  },
  divider: {
    marginHorizontal: 12,
    color: MUTED,
  },
});
