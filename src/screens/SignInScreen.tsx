import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import { loginUser, AuthResponse } from '../services/auth.service';
import { GOLD } from '../theme/colors';
import { isValidEmail } from '../utils/validation';

type Props = {
  onLoginSuccess: (result: AuthResponse) => void;
  onGoToSignUp: () => void;
  initialEmail?: string;
};

type Errors = Partial<Record<'email' | 'password', string>>;

export default function SignInScreen({ onLoginSuccess, onGoToSignUp, initialEmail }: Props) {
  const [email, setEmail] = useState(initialEmail ?? '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const next: Errors = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!isValidEmail(email)) next.email = 'Enter a valid email address';
    if (!password) next.password = 'Password is required';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    setApiError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await loginUser({ email: email.trim(), password });
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
        icon="mail-outline"
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
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
        onPress={() => Alert.alert('Coming soon', 'Password reset is not built yet.')}
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
