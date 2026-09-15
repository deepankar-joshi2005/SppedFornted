import { StyleSheet, Text, View } from 'react-native';
import { MUTED, NAVY } from '../../theme/colors';

type Props = {
  label: string;
  value: string | number;
  width?: 'half' | 'third' | 'full';
};

export default function StatTile({ label, value, width = 'half' }: Props) {
  return (
    <View style={[styles.card, styles[width]]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  half: { width: '47%' },
  third: { width: '31%' },
  full: { width: '100%' },
  label: {
    fontSize: 11.5,
    color: MUTED,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: NAVY,
    marginTop: 4,
  },
});
