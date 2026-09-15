import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthUser } from '../../services/auth.service';
import { ERROR, MUTED, NAVY } from '../../theme/colors';

type Props = {
  user: AuthUser;
  onLogout: () => void;
};

export default function AdminMoreScreen({ user, onLogout }: Props) {
  const confirmLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out of the admin panel?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: onLogout },
    ]);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>More</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.name
              .split(' ')
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase())
              .join('')}
          </Text>
        </View>
        <View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.meta}>{user.email}</Text>
          <Text style={styles.roleBadge}>Administrator</Text>
        </View>
      </View>

      <View style={styles.menu}>
        <Pressable style={styles.menuRow} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={20} color={ERROR} />
          <Text style={[styles.menuLabel, { color: ERROR }]}>Log Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  headerRow: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: NAVY },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EEF1F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: NAVY },
  name: { fontSize: 15, fontWeight: '800', color: NAVY },
  meta: { fontSize: 12, color: MUTED, marginTop: 2 },
  roleBadge: { fontSize: 11, fontWeight: '700', color: '#2E9E5B', marginTop: 4 },
  menu: {
    marginTop: 18,
    marginHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  menuLabel: { fontSize: 14, fontWeight: '700' },
});
