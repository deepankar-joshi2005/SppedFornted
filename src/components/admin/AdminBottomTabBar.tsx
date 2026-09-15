import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminTabKey } from '../../navigation/adminTypes';
import { GOLD, MUTED, NAVY } from '../../theme/colors';

const TABS: { key: AdminTabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'home', label: 'Home', icon: 'home-outline' },
  { key: 'tests', label: 'Tests', icon: 'document-text-outline' },
  { key: 'students', label: 'Students', icon: 'people-outline' },
  { key: 'results', label: 'Results', icon: 'ribbon-outline' },
  { key: 'more', label: 'More', icon: 'menu-outline' },
];

type Props = {
  active: AdminTabKey;
  onChange: (tab: AdminTabKey) => void;
};

export default function AdminBottomTabBar({ active, onChange }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable key={tab.key} style={styles.tab} onPress={() => onChange(tab.key)}>
            <Ionicons
              name={isActive ? (tab.icon.replace('-outline', '') as typeof tab.icon) : tab.icon}
              size={21}
              color={isActive ? NAVY : MUTED}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
            {isActive && <View style={styles.dot} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EDEBE4',
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '600',
    color: MUTED,
  },
  labelActive: {
    color: NAVY,
  },
  dot: {
    position: 'absolute',
    top: -10,
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: GOLD,
  },
});
