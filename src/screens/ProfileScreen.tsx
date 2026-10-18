import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import NotificationBell from '../components/NotificationBell';
import { resolveAssetUrl } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { Nav, Route } from '../navigation/types';
import { getProfile, ProfileData, updateProfileImage } from '../services/profile.service';
import { uploadImage } from '../services/upload.service';
import { ERROR, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  nav: Nav;
  onLogout: () => void;
};

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  iconBg: string;
  iconColor: string;
  route: Route;
}

export default function ProfileScreen({ token, nav, onLogout }: Props) {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');

  const menuGroup1: MenuItem[] = [
    {
      icon: 'download-outline',
      label: 'My Downloads',
      iconBg: '#DDF0FF',
      iconColor: '#0284C7',
      route: { name: 'myDownloads' },
    },
    {
      icon: 'receipt-outline',
      label: 'My Orders',
      iconBg: '#DCFCE7',
      iconColor: '#16A34A',
      route: { name: 'myOrders' },
    },
  ];

  const menuGroup2: MenuItem[] = [
    {
      icon: 'person-outline',
      label: t('edit_profile', 'Edit Profile'),
      iconBg: '#FFEDD5',
      iconColor: '#EA580C',
      route: { name: 'editProfile' },
    },
    {
      icon: 'key-outline',
      label: t('change_password', 'Change Password'),
      iconBg: '#F3E8FF',
      iconColor: '#9333EA',
      route: { name: 'changePassword' },
    },
    {
      icon: 'notifications-outline',
      label: t('notifications_title', 'Notifications'),
      iconBg: '#FEF9C3',
      iconColor: '#CA8A04',
      route: { name: 'notifications' },
    },
    {
      icon: 'language-outline',
      label: t('language_preferences', 'Language Preferences'),
      iconBg: '#CCFBF1',
      iconColor: '#0D9488',
      route: { name: 'language' },
    },
    {
      icon: 'help-circle-outline',
      label: t('help_support', 'Help & Support'),
      iconBg: '#FEE2E2',
      iconColor: '#EF4444',
      route: { name: 'help' },
    },
  ];

  const fetchProfileData = async () => {
    try {
      const result = await getProfile(token);
      setProfile(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [token]);

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to set a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploadingPhoto(true);
    try {
      const uploadedUrl = await uploadImage(token, {
        uri: asset.uri,
        name: asset.fileName ?? `profile-${Date.now()}.jpg`,
        mimeType: asset.mimeType,
      });
      await updateProfileImage(token, uploadedUrl);
      setProfile((prev) => (prev ? { ...prev, profileImage: uploadedUrl } : prev));
      Alert.alert('Success', 'Profile photo updated successfully.');
    } catch (err) {
      Alert.alert('Upload failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Accuracy circular progress calculation
  const accuracyPercent = Math.min(Math.max(profile?.avgAccuracy ?? 0, 0), 100);
  const ringRadius = 20;
  const strokeWidth = 4.5;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = circumference - (accuracyPercent / 100) * circumference;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Student Profile</Text>
        <NotificationBell
          token={token}
          style={styles.bellButton}
          size={21}
          color="#101F42"
          onPress={() => nav.push({ name: 'notifications' })}
        />
      </View>

      {loading && !profile && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={NAVY} size="large" />
        </View>
      )}

      {!!error && !profile && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {profile && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top Hero Student Profile Card */}
          <LinearGradient
            colors={['#0F1B3B', '#172B5E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.avatarColumn}>
              <View style={styles.avatarWrapper}>
                {uploadingPhoto ? (
                  <View style={styles.avatarLoading}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  </View>
                ) : profile.profileImage ? (
                  <Image
                    source={{ uri: resolveAssetUrl(profile.profileImage) }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Image
                    source={require('../../assets/default-student-avatar.png')}
                    style={styles.avatarImage}
                  />
                )}
                {/* Mini Camera Badge */}
                <Pressable
                  style={styles.miniCameraBadge}
                  onPress={handlePickPhoto}
                  disabled={uploadingPhoto}
                  hitSlop={6}
                >
                  <Ionicons name="camera" size={13} color="#101F42" />
                </Pressable>
              </View>

              <Pressable
                style={styles.cameraEditBtn}
                onPress={handlePickPhoto}
                disabled={uploadingPhoto}
                hitSlop={6}
              >
                <Ionicons name="camera-outline" size={13} color="#FFFFFF" />
                <Text style={styles.cameraEditText}>कैमरा / एडिट</Text>
              </Pressable>
            </View>

            <View style={styles.studentInfoColumn}>
              <Text style={styles.studentName} numberOfLines={1}>
                {profile.name ? profile.name.toUpperCase() : 'STUDENT'}
              </Text>
              <Text style={styles.studentContact}>{profile.mobile || '—'}</Text>
              <Text style={styles.studentEmail} numberOfLines={1}>
                {profile.email || '—'}
              </Text>

              <View style={styles.targetPill}>
                <Text style={styles.targetPillText} numberOfLines={1}>
                  Target: {profile.targetExam || 'SSC CGL / Railway'}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Performance / Stats Card */}
          <View style={styles.statsCard}>
            {/* Column 1: Tests Attempted */}
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Tests Attempted</Text>
              <Text style={styles.testsAttemptedValue}>
                {profile.testsAttempted} 🔥
              </Text>
            </View>

            <View style={styles.statDivider} />

            {/* Column 2: Accuracy (Circular Gauge) */}
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Accuracy</Text>
              <View style={styles.gaugeContainer}>
                <Svg width={50} height={50} style={styles.gaugeSvg}>
                  {/* Background Track */}
                  <Circle
                    cx="25"
                    cy="25"
                    r={ringRadius}
                    stroke="#E2E8F0"
                    strokeWidth={strokeWidth}
                    fill="none"
                  />
                  {/* Active Progress */}
                  <Circle
                    cx="25"
                    cy="25"
                    r={ringRadius}
                    stroke="#142C66"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="none"
                    transform="rotate(-90 25 25)"
                  />
                </Svg>
                <Text style={styles.gaugeText}>{accuracyPercent}%</Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            {/* Column 3: Overall Rank */}
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Overall Rank</Text>
              <Text style={styles.trophyEmoji}>🏆</Text>
              <Text style={styles.rankValue}>
                {profile.bestRank ? `#${profile.bestRank}` : '#1'}
              </Text>
            </View>
          </View>

          {/* Menu Card 1: My Downloads, My Orders */}
          <View style={styles.menuCard}>
            {menuGroup1.map((item, index) => (
              <Pressable
                key={item.label}
                style={[styles.menuItemRow, index > 0 && styles.menuItemBorderTop]}
                onPress={() => nav.push(item.route)}
              >
                <View style={[styles.menuIconBox, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon} size={22} color={item.iconColor} />
                </View>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </Pressable>
            ))}
          </View>

          {/* Menu Card 2: Settings & Preferences */}
          <View style={styles.menuCard}>
            {menuGroup2.map((item, index) => (
              <Pressable
                key={item.label}
                style={[styles.menuItemRow, index > 0 && styles.menuItemBorderTop]}
                onPress={() => nav.push(item.route)}
              >
                <View style={[styles.menuIconBox, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon} size={22} color={item.iconColor} />
                </View>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </Pressable>
            ))}
          </View>

          {/* Logout Button */}
          <Pressable style={styles.logoutBtn} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={18} color={ERROR} />
            <Text style={styles.logoutText}>{t('logout', 'Logout')}</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#F7F8FA',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#101F42',
    letterSpacing: -0.3,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8ECF2',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    margin: 20,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FBEAE8',
  },
  errorText: {
    color: ERROR,
    fontSize: 13,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 32,
  },
  heroCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F1B3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarColumn: {
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#EEF2F6',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarLoading: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#101F42',
  },
  cameraEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  cameraEditText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  studentInfoColumn: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  studentName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  studentContact: {
    fontSize: 13,
    color: '#CBD5E1',
    marginTop: 3,
  },
  studentEmail: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 2,
  },
  targetPill: {
    backgroundColor: '#D4A237',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  targetPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 6,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECF2',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#EEF2F6',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 6,
    textAlign: 'center',
  },
  testsAttemptedValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#101F42',
    marginTop: 2,
  },
  gaugeContainer: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeSvg: {
    position: 'absolute',
  },
  gaugeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#101F42',
  },
  trophyEmoji: {
    fontSize: 18,
    marginTop: -2,
  },
  rankValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#101F42',
    marginTop: 1,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E8ECF2',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  menuItemBorderTop: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    flex: 1,
    marginLeft: 14,
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    color: ERROR,
    fontWeight: '700',
    fontSize: 13.5,
  },
});
