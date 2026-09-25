import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Nav } from '../navigation/types';
import { GOLD_TINT, MUTED, NAVY } from '../theme/colors';

type Props = {
  nav: Nav;
};

export default function LiveClassesScreen({ nav }: Props) {
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle}>Live Classes</Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.emptyWrap}>
        <View style={styles.iconCircle}>
          <Ionicons name="videocam-outline" size={40} color={NAVY} />
          <View style={styles.liveDot} />
        </View>
        <Text style={styles.emptyTitle}>No Live Classes Right Now</Text>
        <Text style={styles.emptySubtitle}>
          We're gearing up to bring you live classes soon.{'\n'}Stay tuned — you'll see them
          here the moment they go live!
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F6FA',
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
    minWidth: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: -40,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: GOLD_TINT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  liveDot: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 19,
  },
});
