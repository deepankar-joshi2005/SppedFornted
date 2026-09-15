import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ERROR, MUTED, NAVY } from '../../theme/colors';

export type MenuAction = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  onPress: () => void;
};

type Props = {
  actions: MenuAction[];
};

export default function ThreeDotMenu({ actions }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)} hitSlop={8}>
        <Ionicons name="ellipsis-vertical" size={18} color={MUTED} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            {actions.map((action) => (
              <Pressable
                key={action.key}
                style={styles.row}
                onPress={() => {
                  setOpen(false);
                  action.onPress();
                }}
              >
                <Ionicons
                  name={action.icon}
                  size={18}
                  color={action.destructive ? ERROR : NAVY}
                />
                <Text style={[styles.label, action.destructive && styles.labelDestructive]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(22,49,92,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingVertical: 10,
    paddingBottom: 28,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  label: {
    fontSize: 14.5,
    fontWeight: '600',
    color: NAVY,
  },
  labelDestructive: {
    color: ERROR,
  },
});
