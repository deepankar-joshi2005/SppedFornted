import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationBell from '../../components/NotificationBell';
import StatTile from '../../components/admin/StatTile';
import { AdminNav } from '../../navigation/adminTypes';
import { AdminDashboardData, getAdminDashboard } from '../../services/admin/dashboard.service';
import { AuthUser } from '../../services/auth.service';
import { GOLD, MUTED, NAVY } from '../../theme/colors';

type Props = {
  user: AuthUser;
  token: string;
  nav: AdminNav;
  onLogout: () => void;
};

type QuickAction = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export default function AdminHomeScreen({ user, token, nav }: Props) {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (isRefresh?: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const result = await getAdminDashboard(token);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load();
  }, [load]);

  const quickActions: QuickAction[] = [
    {
      key: 'addCategory',
      label: 'Add Category',
      icon: 'grid-outline',
      onPress: () => nav.push({ name: 'addCategory' }),
    },
    {
      key: 'createSeries',
      label: 'Create Test Series',
      icon: 'folder-open-outline',
      onPress: () => nav.push({ name: 'createSeriesStep1' }),
    },
    {
      key: 'createTest',
      label: 'Create Test',
      icon: 'document-text-outline',
      onPress: () => nav.push({ name: 'seriesList' }),
    },
    {
      key: 'addQuestion',
      label: 'Add Question',
      icon: 'help-circle-outline',
      onPress: () => nav.push({ name: 'questionBank' }),
    },
    {
      key: 'importQuestions',
      label: 'Import Questions (Excel/CSV)',
      icon: 'cloud-upload-outline',
      onPress: () => nav.push({ name: 'seriesList' }),
    },
  ];

  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={NAVY} />
        }
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcomeText}>Speed Education</Text>
            <Text style={styles.helloText}>Good Morning, {user.name.split(' ')[0]} 👋</Text>
          </View>
          <View style={styles.headerActions}>
            <NotificationBell token={token} onPress={() => nav.push({ name: 'notifications' })} />
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
        </View>

        {loading && !data && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={NAVY} size="large" />
          </View>
        )}

        {!!error && !data && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => load()}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </Pressable>
          </View>
        )}

        {data && (
          <>
            <Text style={styles.sectionTitle}>Key Metrics</Text>
            <View style={styles.statsGrid}>
              <StatTile label="Total Students" value={data.metrics.totalStudents} />
              <StatTile label="Test Series" value={data.metrics.totalSeries} />
              <StatTile label="Total Tests" value={data.metrics.totalTests} />
              <StatTile label="Total Questions" value={data.metrics.totalQuestions} />
              <StatTile label="Today's Attempts" value={data.metrics.todaysAttempts} />
              <StatTile label="Today's New Students" value={data.metrics.todaysNewStudents} />
            </View>

            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {quickActions.map((action) => (
                <Pressable key={action.key} style={styles.actionCard} onPress={action.onPress}>
                  <View style={styles.actionIconWrap}>
                    <Ionicons name={action.icon} size={18} color={NAVY} />
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {data.recentActivity.length === 0 && (
              <Text style={styles.emptyText}>No tests created yet.</Text>
            )}
            {data.recentActivity.map((item) => (
              <Pressable
                key={item.id}
                style={styles.activityCard}
                onPress={() => nav.push({ name: 'manageQuestions', testId: item.id })}
              >
                <View style={styles.activityTextWrap}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activitySubtext}>{item.totalQuestions} Questions</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'published' ? styles.statusPublished : styles.statusDraft,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      item.status === 'published' ? styles.statusTextPublished : styles.statusTextDraft,
                    ]}
                  >
                    {item.status === 'published' ? 'Published' : 'Draft'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  scrollContent: { padding: 18, paddingBottom: 30 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  welcomeText: { fontSize: 12.5, color: MUTED },
  helloText: { fontSize: 18, fontWeight: '800', color: NAVY, marginTop: 2 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  avatarText: { fontSize: 13, fontWeight: '800', color: NAVY },
  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  errorBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FBEAE8',
    alignItems: 'center',
  },
  errorText: { color: '#C0392B', fontSize: 13, textAlign: 'center' },
  retryText: { marginTop: 8, color: NAVY, fontWeight: '700', fontSize: 12.5 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: NAVY, marginTop: 22, marginBottom: 12 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    gap: 8,
  },
  actionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#EEF1F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 12.5, fontWeight: '700', color: NAVY },
  emptyText: { fontSize: 12.5, color: MUTED },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    marginBottom: 10,
  },
  activityTextWrap: { flexShrink: 1 },
  activityTitle: { fontSize: 13.5, fontWeight: '700', color: NAVY },
  activitySubtext: { fontSize: 11.5, color: MUTED, marginTop: 3 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusPublished: { backgroundColor: '#E1F5EA' },
  statusDraft: { backgroundColor: '#FDF1DC' },
  statusText: { fontSize: 10.5, fontWeight: '800' },
  statusTextPublished: { color: '#2E9E5B' },
  statusTextDraft: { color: GOLD },
});
