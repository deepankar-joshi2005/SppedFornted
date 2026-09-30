import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminHeader from '../../components/admin/AdminHeader';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import { AdminNav } from '../../navigation/adminTypes';
import { changePassword } from '../../services/auth.service';
import { MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  nav: AdminNav;
};

type Errors = Partial<Record<'currentPassword' | 'newPassword' | 'confirmPassword', string>>;

export default function AdminChangePasswordScreen({ token, nav }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
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
      Alert.alert('Failed to change password', err instanceof Error ? err.message : '');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <AdminHeader title="Change Password" onBack={() => nav.pop()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.subtitle}>
            Enter your current password, then choose a new password for your admin account.
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

          <View style={{ marginTop: 8 }}>
            <PrimaryButton label="UPDATE PASSWORD" onPress={handleSave} loading={saving} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  scrollContent: { padding: 18, paddingBottom: 40 },
  subtitle: { fontSize: 12.5, color: MUTED, marginBottom: 18, lineHeight: 18 },
  label: { fontSize: 12.5, fontWeight: '700', color: NAVY, marginBottom: 8, marginTop: 4 },
});
