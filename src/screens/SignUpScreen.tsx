import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import { registerUser, AuthResponse } from '../services/auth.service';
import { MUTED } from '../theme/colors';
import { isValidEmail, isValidMobile, isStrongPassword, PASSWORD_HINT } from '../utils/validation';

type Props = {
  onBack: () => void;
  onSignUpSuccess: (result: AuthResponse) => void;
  onGoToLogin: () => void;
};

type Errors = Partial<
  Record<'name' | 'email' | 'mobile' | 'city' | 'state' | 'password' | 'confirmPassword', string>
>;

export default function SignUpScreen({ onBack, onSignUpSuccess, onGoToLogin }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
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

  const handleSubmit = async () => {
    setApiError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await registerUser({
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        city: city.trim(),
        state: state.trim(),
        password,
      });
      onSignUpSuccess(result);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      onBack={onBack}
      title="Create Account"
      subtitle="Join Speed Education and start your journey to success."
      footerText="Already have an account?"
      footerActionText="Login"
      onFooterAction={onGoToLogin}
    >
      {!!apiError && (
        <View style={styles.apiErrorBox}>
          <Text style={styles.apiErrorText}>{apiError}</Text>
        </View>
      )}

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
      />
      <FormInput
        icon="call-outline"
        placeholder="Mobile Number"
        value={mobile}
        onChangeText={setMobile}
        error={errors.mobile}
        keyboardType="phone-pad"
        maxLength={10}
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

      <PrimaryButton label="SIGN UP" onPress={handleSubmit} loading={loading} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
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
});
