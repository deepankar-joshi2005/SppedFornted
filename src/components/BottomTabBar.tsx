import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GOLD_TINT, MUTED, NAVY } from '../theme/colors';

import { useLanguage } from '../context/LanguageContext';
import { TabKey } from '../navigation/types';

type Props = {
  active: TabKey;
  onChange: (tab: TabKey) => void;
};

export default function BottomTabBar({ active, onChange }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const tabs: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'home', label: t('tab_home', 'Home'), icon: 'home-outline' },
    { key: 'tests', label: t('tab_tests', 'Tests'), icon: 'book-outline' },
    { key: 'pyps', label: "PYP's", icon: 'document-text-outline' },
    { key: 'ebook', label: 'E-Book', icon: 'library-outline' },
    { key: 'results', label: t('tab_results', 'Results'), icon: 'trophy-outline' },
    { key: 'profile', label: t('tab_profile', 'Profile'), icon: 'person-outline' },
  ];

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable key={tab.key} style={styles.tab} onPress={() => onChange(tab.key)}>
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Ionicons
                name={isActive ? (tab.icon.replace('-outline', '') as typeof tab.icon) : tab.icon}
                size={20}
                color={isActive ? NAVY : MUTED}
              />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
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
    paddingTop: 10,
    shadowColor: '#16315C',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  iconWrap: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: GOLD_TINT,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: MUTED,
  },
  labelActive: {
    color: NAVY,
    fontWeight: '700',
  },
});
