import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { MUTED, NAVY } from '../../theme/colors';

export type PillOption = { key: string; label: string };

type Props = {
  options: PillOption[];
  active: string;
  onChange: (key: string) => void;
};

export default function FilterPillTabs({ options, active, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((opt) => {
        const isActive = opt.key === active;
        return (
          <Pressable
            key={opt.key}
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => onChange(opt.key)}
          >
            <Text style={[styles.text, isActive && styles.textActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  pillActive: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  text: {
    fontSize: 12.5,
    fontWeight: '700',
    color: MUTED,
  },
  textActive: {
    color: '#FFFFFF',
  },
});
