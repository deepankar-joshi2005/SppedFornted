import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import { Nav } from '../navigation/types';
import { changePassword } from '../services/auth.service';
import { ERROR, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  nav: Nav;
};

type Errors = Partial<Record<'currentPassword' | 'newPassword' | 'confirmPassword', string>>;

export default function ChangePasswordScreen({ token, nav }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [apiError, setApiError] = useState('');
  const [saving, setSaving] = useState(false);

  const validate = (): boolean => {
    const next: Errors = {};
    if (!currentPassword) next.currentPassword = 'Current password is required';
    if (!newPassword) next.newPassword = 'New password is required';
    if (!confirmPassword) next.confirmPassword = 'Please confirm your new password';
    else if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      next.confirmPassword = 'Passwords do not match';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    setApiError('');
    if (!validate()) return;
    setSaving(true);
    try {
      const message = await changePassword(token, {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      Alert.alert('Success', message, [{ text: 'OK', onPress: () => nav.pop() }]);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {!!apiError && (
          <View style={styles.apiErrorBox}>
            <Text style={styles.apiErrorText}>{apiError}</Text>
          </View>
        )}

        <Text style={styles.subtitle}>
          Enter your current password, then choose a new password for your account.
        </Text>

        <Text style={styles.label}>Current Password</Text>
        <FormInput
          icon="lock-closed-outline"
          placeholder="Enter current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          error={errors.currentPassword}
          isPassword
        />

        <Text style={styles.label}>New Password</Text>
        <FormInput
          icon="key-outline"
          placeholder="Enter new password"
          value={newPassword}
          onChangeText={setNewPassword}
          error={errors.newPassword}
          isPassword
        />

        <Text style={styles.label}>Confirm New Password</Text>
        <FormInput
          icon="key-outline"
          placeholder="Re-enter new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={errors.confirmPassword}
          isPassword
        />

        <PrimaryButton label="UPDATE PASSWORD" onPress={handleSave} loading={saving} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F4EF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },
  subtitle: {
    fontSize: 12.5,
    color: MUTED,
    marginBottom: 18,
    lineHeight: 18,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: MUTED,
    marginBottom: 6,
    marginLeft: 2,
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
    color: ERROR,
    fontSize: 12.5,
    textAlign: 'center',
  },
});
