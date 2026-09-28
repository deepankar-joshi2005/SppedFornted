import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import { resetPassword } from '../services/auth.service';
import { isValidEmail } from '../utils/validation';

type Props = {
  onBack: () => void;
  onSuccess: () => void;
};

type Errors = Partial<Record<'email' | 'newPassword' | 'confirmPassword', string>>;

export default function ForgotPasswordScreen({ onBack, onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const next: Errors = {};

    if (!email.trim()) next.email = 'Email is required';
    else if (!isValidEmail(email)) next.email = 'Enter a valid email address';

    if (!newPassword) next.newPassword = 'New password is required';

    if (!confirmPassword) next.confirmPassword = 'Please confirm your password';
    else if (newPassword && confirmPassword && newPassword !== confirmPassword)
      next.confirmPassword = 'Passwords do not match';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    setApiError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const message = await resetPassword({
        email: email.trim(),
        newPassword,
        confirmPassword,
      });
      Alert.alert('Success', message, [{ text: 'Login Now', onPress: onSuccess }]);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      onBack={onBack}
      title="Reset Password"
      subtitle="Enter your registered email and set a new password."
      footerText="Remembered your password?"
      footerActionText="Login"
      onFooterAction={onBack}
    >
      {!!apiError && (
        <View style={styles.apiErrorBox}>
          <Text style={styles.apiErrorText}>{apiError}</Text>
        </View>
      )}

      <FormInput
        icon="mail-outline"
        placeholder="Registered Email Address"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <FormInput
        icon="lock-closed-outline"
        placeholder="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        error={errors.newPassword}
        isPassword
      />
      <FormInput
        icon="lock-closed-outline"
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        error={errors.confirmPassword}
        isPassword
      />

      <PrimaryButton label="SAVE PASSWORD" onPress={handleSave} loading={loading} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
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
