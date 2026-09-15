import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import { Nav } from '../navigation/types';
import { getProfile, updateProfile } from '../services/profile.service';
import { ERROR, MUTED, NAVY } from '../theme/colors';
import { isValidEmail, isValidMobile } from '../utils/validation';

type Props = {
  token: string;
  nav: Nav;
};

type Errors = Partial<Record<'name' | 'email' | 'mobile', string>>;

export default function EditProfileScreen({ token, nav }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const profile = await getProfile(token);
        setName(profile.name);
        setEmail(profile.email);
        setMobile(profile.mobile);
      } catch (err) {
        setApiError(err instanceof Error ? err.message : 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const validate = (): boolean => {
    const next: Errors = {};
    if (!name.trim()) next.name = 'Name is required';
    if (!email.trim()) next.email = 'Email is required';
    else if (!isValidEmail(email)) next.email = 'Enter a valid email address';
    if (!mobile.trim()) next.mobile = 'Mobile number is required';
    else if (!isValidMobile(mobile)) next.mobile = 'Enter a valid 10-digit mobile number';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    setApiError('');
    if (!validate()) return;
    setSaving(true);
    try {
      await updateProfile(token, { name: name.trim(), email: email.trim(), mobile: mobile.trim() });
      Alert.alert('Saved', 'Your profile has been updated.');
      nav.pop();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.iconBtn} />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={NAVY} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {!!apiError && (
            <View style={styles.apiErrorBox}>
              <Text style={styles.apiErrorText}>{apiError}</Text>
            </View>
          )}

          <Text style={styles.label}>Full Name</Text>
          <FormInput
            icon="person-outline"
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            error={errors.name}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Email Address</Text>
          <FormInput
            icon="mail-outline"
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Mobile Number</Text>
          <FormInput
            icon="call-outline"
            placeholder="Mobile Number"
            value={mobile}
            onChangeText={setMobile}
            error={errors.mobile}
            keyboardType="phone-pad"
            maxLength={10}
          />

          <PrimaryButton label="SAVE CHANGES" onPress={handleSave} loading={saving} />
        </ScrollView>
      )}
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
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
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
