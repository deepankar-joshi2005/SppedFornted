import { StyleSheet, Text, View } from 'react-native';
import { GOLD, MUTED, NAVY } from '../../theme/colors';

type Props = {
  steps: string[];
  currentIndex: number;
};

export default function StepProgressHeader({ steps, currentIndex }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.trackRow}>
        {steps.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.track,
              idx <= currentIndex && styles.trackActive,
              idx === 0 && styles.trackFirst,
              idx === steps.length - 1 && styles.trackLast,
            ]}
          />
        ))}
      </View>
      <View style={styles.labelRow}>
        {steps.map((label, idx) => (
          <Text
            key={label}
            style={[styles.label, idx === currentIndex && styles.labelActive]}
            numberOfLines={1}
          >
            {idx + 1}. {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDEBE4',
  },
  trackRow: {
    flexDirection: 'row',
    gap: 4,
  },
  track: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#EEEDE6',
  },
  trackActive: {
    backgroundColor: GOLD,
  },
  trackFirst: {},
  trackLast: {},
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 6,
  },
  label: {
    flex: 1,
    fontSize: 10.5,
    fontWeight: '600',
    color: MUTED,
  },
  labelActive: {
    color: NAVY,
    fontWeight: '800',
  },
});
