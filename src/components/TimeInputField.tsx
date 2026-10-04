import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MUTED, NAVY } from '../theme/colors';

interface Props {
  label?: string;
  value: string; // 'HH:mm' (24-hour) or ''
  onChange: (time: string) => void;
  placeholder?: string;
}

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,...,55

function parseValue(val: string): { hour12: number; minute: number; period: 'AM' | 'PM' } {
  if (val && /^\d{2}:\d{2}$/.test(val)) {
    const [h, m] = val.split(':').map(Number);
    const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return { hour12, minute: m, period };
  }
  return { hour12: 9, minute: 0, period: 'AM' };
}

function toValue(hour12: number, minute: number, period: 'AM' | 'PM'): string {
  let h24 = hour12 % 12;
  if (period === 'PM') h24 += 12;
  return `${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export default function TimeInputField({ value, onChange, placeholder = 'Optional' }: Props) {
  const [open, setOpen] = useState(false);
  const parsed = parseValue(value);
  const [hour12, setHour12] = useState(parsed.hour12);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(parsed.period);

  const openPicker = () => {
    const p = parseValue(value);
    setHour12(p.hour12);
    setMinute(p.minute);
    setPeriod(p.period);
    setOpen(true);
  };

  const handleConfirm = () => {
    onChange(toValue(hour12, minute, period));
    setOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setOpen(false);
  };

  const displayText = value
    ? (() => {
        const p = parseValue(value);
        return `${String(p.hour12).padStart(2, '0')}:${String(p.minute).padStart(2, '0')} ${p.period}`;
      })()
    : '';

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity style={styles.inputRow} onPress={openPicker} activeOpacity={0.7}>
        <Ionicons name="time-outline" size={18} color={NAVY} style={styles.icon} />
        <Text style={[styles.inputText, !displayText && styles.placeholderText]}>
          {displayText || placeholder}
        </Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setOpen(false)} />

          <View style={styles.card}>
            <Text style={styles.title}>Select Time</Text>

            <View style={styles.pickerRow}>
              <ScrollView style={styles.pickerCol} showsVerticalScrollIndicator={false}>
                {HOURS_12.map((h) => (
                  <Pressable
                    key={h}
                    style={[styles.pickerCell, hour12 === h && styles.pickerCellActive]}
                    onPress={() => setHour12(h)}
                  >
                    <Text style={[styles.pickerText, hour12 === h && styles.pickerTextActive]}>
                      {String(h).padStart(2, '0')}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.colon}>:</Text>

              <ScrollView style={styles.pickerCol} showsVerticalScrollIndicator={false}>
                {MINUTES.map((m) => (
                  <Pressable
                    key={m}
                    style={[styles.pickerCell, minute === m && styles.pickerCellActive]}
                    onPress={() => setMinute(m)}
                  >
                    <Text style={[styles.pickerText, minute === m && styles.pickerTextActive]}>
                      {String(m).padStart(2, '0')}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <View style={styles.periodCol}>
                {(['AM', 'PM'] as const).map((p) => (
                  <Pressable
                    key={p}
                    style={[styles.periodCell, period === p && styles.pickerCellActive]}
                    onPress={() => setPeriod(p)}
                  >
                    <Text style={[styles.pickerText, period === p && styles.pickerTextActive]}>{p}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.actionsRow}>
              <Pressable style={styles.clearBtn} onPress={handleClear}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </Pressable>
              <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
                <Text style={styles.confirmBtnText}>Set Time</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E7E5DE',
    paddingHorizontal: 12,
    height: 48,
  },
  icon: { marginRight: 8 },
  inputText: { flex: 1, fontSize: 13.5, fontWeight: '600', color: NAVY },
  placeholderText: { color: '#9AA3B2', fontWeight: '400' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 14, textAlign: 'center' },
  pickerRow: { flexDirection: 'row', height: 180, alignItems: 'center' },
  pickerCol: { flex: 1 },
  periodCol: { width: 52, gap: 8 },
  colon: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginHorizontal: 4 },
  pickerCell: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 2,
    marginHorizontal: 4,
  },
  periodCell: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  pickerCellActive: { backgroundColor: '#2563EB' },
  pickerText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  pickerTextActive: { color: '#FFFFFF', fontWeight: '800' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  clearBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E7E5DE',
    alignItems: 'center',
  },
  clearBtnText: { fontSize: 13, fontWeight: '700', color: MUTED },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: NAVY,
    alignItems: 'center',
  },
  confirmBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});
