import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NAVY } from '../theme/colors';

interface Props {
  label?: string;
  value: string; // 'YYYY-MM-DD' or ''
  onChange: (date: string) => void;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function parseValue(val: string): { y: number; m: number; d: number } {
  if (val && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [y, m, d] = val.split('-').map(Number);
    return { y, m: m - 1, d };
  }
  const now = new Date();
  return { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };
}

export default function DateInputField({
  value,
  onChange,
  placeholder = 'Select date',
}: Props) {
  const [open, setOpen] = useState(false);
  const parsed = parseValue(value);
  const [selYear, setSelYear] = useState(parsed.y);
  const [selMonth, setSelMonth] = useState(parsed.m);

  const now = new Date();
  const todayY = now.getFullYear();
  const todayM = now.getMonth();
  const todayD = now.getDate();

  const openPicker = () => {
    const p = parseValue(value);
    setSelYear(p.y);
    setSelMonth(p.m);
    setOpen(true);
  };

  const handlePrevMonth = () => {
    if (selMonth === 0) {
      setSelMonth(11);
      setSelYear((y) => y - 1);
    } else {
      setSelMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selMonth === 11) {
      setSelMonth(0);
      setSelYear((y) => y + 1);
    } else {
      setSelMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mm = String(selMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${selYear}-${mm}-${dd}`);
    setOpen(false);
  };

  // Calendar calculations
  const totalDays = daysInMonth(selYear, selMonth);
  const firstDayOfWeek = new Date(selYear, selMonth, 1).getDay(); // 0 = Sunday
  const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

  // Active / Highlighted day check (Value date OR Present Today date)
  const isHighlighted = (day: number) => {
    if (value) {
      const p = parseValue(value);
      return p.y === selYear && p.m === selMonth && p.d === day;
    }
    // If no value set yet, highlight Present (Today) date
    return todayY === selYear && todayM === selMonth && todayD === day;
  };

  const displayText = value
    ? (() => {
        const p = parseValue(value);
        return `${String(p.d).padStart(2, '0')} ${MONTH_NAMES[p.m].slice(0, 3)} ${p.y}`;
      })()
    : '';

  return (
    <View style={styles.wrapper}>
      {/* Outer Input Row */}
      <TouchableOpacity
        style={styles.inputRow}
        onPress={openPicker}
        activeOpacity={0.7}
      >
        <Ionicons name="calendar-outline" size={18} color={NAVY} style={styles.calendarIcon} />
        <Text style={[styles.inputText, !displayText && styles.placeholderText]}>
          {displayText || placeholder}
        </Text>
      </TouchableOpacity>

      {/* Popover Calendar Modal */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          {/* Backdrop Click */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />

          {/* Compact Rounded Popover Card */}
          <View style={styles.card}>
            {/* Header: < Month Year > */}
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="chevron-back" size={20} color="#0F172A" />
              </TouchableOpacity>
              <Text style={styles.monthYearTitle}>
                {MONTH_NAMES[selMonth]} {selYear}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.arrowBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="chevron-forward" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* Weekday Header Row */}
            <View style={styles.weekHeader}>
              {WEEKDAYS.map((w) => (
                <Text key={w} style={styles.weekHeaderText}>
                  {w}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {paddingDays.map((p) => (
                <View key={`pad-${p}`} style={styles.dayCell} />
              ))}
              {daysArray.map((d) => {
                const active = isHighlighted(d);
                return (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dayCell, active && styles.dayCellActive]}
                    onPress={() => handleSelectDay(d)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dayText, active && styles.dayTextActive]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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
  calendarIcon: {
    marginRight: 8,
  },
  inputText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: NAVY,
  },
  placeholderText: {
    color: '#9AA3B2',
    fontWeight: '400',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    paddingTop: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  arrowBtn: {
    padding: 6,
    borderRadius: 8,
  },
  monthYearTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekHeaderText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginVertical: 2,
  },
  dayCellActive: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  dayTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
