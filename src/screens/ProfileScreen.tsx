import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import NotificationBell from '../components/NotificationBell';
import { Nav, Route } from '../navigation/types';
import { getProfile, ProfileData } from '../services/profile.service';
import { ERROR, GOLD_TINT, MUTED, NAVY, SOFT_SHADOW } from '../theme/colors';

type Props = {
  token: string;
  nav: Nav;
  onLogout: () => void;
};

const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export default function ProfileScreen({ token, nav, onLogout }: Props) {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const menuItems: { icon: keyof typeof Ionicons.glyphMap; label: string; route: Route }[] = [
    { icon: 'person-outline', label: t('edit_profile', 'Edit Profile'), route: { name: 'editProfile' } },
    { icon: 'notifications-outline', label: t('notifications_title', 'Notifications'), route: { name: 'notifications' } },
    { icon: 'language-outline', label: t('language_preferences', 'Language Preferences'), route: { name: 'language' } },
    { icon: 'help-circle-outline', label: t('help_support', 'Help & Support'), route: { name: 'help' } },
  ];

  useEffect(() => {
    (async () => {
      try {
        const result = await getProfile(token);
        setProfile(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{t('student_profile', 'My Profile')}</Text>
        <NotificationBell
          token={token}
          style={styles.iconBtn}
          onPress={() => nav.push({ name: 'notifications' })}
        />
      </View>

      {loading && (
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(profile.name)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.contactText}>{profile.mobile}</Text>
              <Text style={styles.contactText}>{profile.email}</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <StatCard label={t('tests_attempted', 'Tests Attempted')} value={String(profile.testsAttempted)} />
            <StatCard label={t('accuracy', 'Avg Accuracy')} value={`${profile.avgAccuracy}%`} valueColor={NAVY} />
            <StatCard
              label={t('overall_rank', 'Best Rank')}
              value={profile.bestRank ? `#${profile.bestRank}` : '—'}
              valueColor="#2E9E5B"
            />
          </View>

          <View style={styles.menuList}>
            {menuItems.map((item) => (
              <Pressable
                key={item.label}
                style={styles.menuRow}
                onPress={() => nav.push(item.route)}
              >
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.icon} size={17} color={NAVY} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={MUTED} />
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutText}>{t('logout', 'Logout')}</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
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
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: NAVY,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SOFT_SHADOW,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FBEAE8',
  },
  errorText: {
    color: ERROR,
    fontSize: 13,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 30,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: NAVY,
    backgroundColor: '#EEF1F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: NAVY,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: NAVY,
  },
  contactText: {
    fontSize: 12.5,
    color: MUTED,
    marginTop: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    ...SOFT_SHADOW,
  },
  statLabel: {
    fontSize: 10.5,
    color: MUTED,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
    marginTop: 4,
  },
  menuList: {
    marginTop: 22,
    gap: 10,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    ...SOFT_SHADOW,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: GOLD_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E2937',
  },
  logoutBtn: {
    marginTop: 22,
    borderWidth: 1.4,
    borderColor: ERROR,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#FDF0EF',
  },
  logoutText: {
    color: ERROR,
    fontWeight: '700',
    fontSize: 14,
  },
});
