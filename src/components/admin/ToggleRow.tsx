import { StyleSheet, Switch, Text, View } from 'react-native';
import { GOLD, MUTED, NAVY } from '../../theme/colors';

type Props = {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export default function ToggleRow({ label, description, value, onChange }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.textWrap}>
        <Text style={styles.label}>{label}</Text>
        {!!description && <Text style={styles.description}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#D9D6CC', true: GOLD }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textWrap: {
    flexShrink: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: NAVY,
  },
  description: {
    fontSize: 11.5,
    color: MUTED,
    marginTop: 2,
  },
});
