import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import { loginUser, AuthResponse } from '../services/auth.service';
import { GOLD } from '../theme/colors';
import { isValidEmail, isValidMobile } from '../utils/validation';

type Props = {
  onLoginSuccess: (result: AuthResponse) => void;
  onGoToSignUp: () => void;
  onForgotPassword: () => void;
  initialEmail?: string;
};

type Errors = Partial<Record<'identifier' | 'password', string>>;

export default function SignInScreen({ onLoginSuccess, onGoToSignUp, onForgotPassword, initialEmail }: Props) {
  const [identifier, setIdentifier] = useState(initialEmail ?? '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const next: Errors = {};
    const val = identifier.trim();
    if (!val) {
      next.identifier = 'Email or Mobile number is required';
    } else if (!isValidEmail(val) && !isValidMobile(val)) {
      next.identifier = 'Enter a valid Email or 10-digit Mobile number';
    }

    if (!password) {
      next.password = 'Password is required';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    setApiError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await loginUser({ identifier: identifier.trim(), password });
      onLoginSuccess(result);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Login to continue your preparation with The Speed Education."
      footerText="Don't have an account?"
      footerActionText="Sign Up"
      onFooterAction={onGoToSignUp}
    >
      {!!apiError && (
        <View style={styles.apiErrorBox}>
          <Text style={styles.apiErrorText}>{apiError}</Text>
        </View>
      )}

      <FormInput
        icon="person-outline"
        placeholder="Email Address or Mobile Number"
        value={identifier}
        onChangeText={setIdentifier}
        error={errors.identifier}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <FormInput
        icon="lock-closed-outline"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        isPassword
      />

      <Pressable
        style={styles.forgotWrap}
        onPress={onForgotPassword}
        hitSlop={8}
      >
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </Pressable>

      <PrimaryButton label="LOGIN" onPress={handleSubmit} loading={loading} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: -6,
    marginBottom: 18,
  },
  forgotText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: GOLD,
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
});
