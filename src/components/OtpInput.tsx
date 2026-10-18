import { useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import { ERROR, GOLD, GOLD_TINT, NAVY } from '../theme/colors';

const BOX_COUNT = 6;

type Props = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: string;
  autoFocus?: boolean;
  editable?: boolean;
};

export default function OtpInput({ value, onChange, onComplete, error, autoFocus, editable = true }: Props) {
  const inputs = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const digits = Array.from({ length: BOX_COUNT }, (_, i) => value[i] ?? '');

  const commit = (nextDigits: string[]) => {
    const next = nextDigits.join('');
    onChange(next);
    if (next.length === BOX_COUNT) {
      onComplete?.(next);
    }
  };

  const handleChange = (index: number, text: string) => {
    const clean = text.replace(/[^0-9]/g, '');

    if (!clean) {
      const next = [...digits];
      next[index] = '';
      commit(next);
      return;
    }

    if (clean.length > 1) {
      // Full code pasted/autofilled into one box — spread it across the remaining boxes.
      const next = [...digits];
      let i = index;
      for (const char of clean) {
        if (i >= BOX_COUNT) break;
        next[i] = char;
        i += 1;
      }
      commit(next);
      inputs.current[Math.min(i, BOX_COUNT - 1)]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = clean;
    commit(next);
    if (index < BOX_COUNT - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      commit(next);
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View>
      <View style={styles.row}>
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputs.current[index] = ref;
            }}
            value={digit}
            editable={editable}
            onChangeText={(text) => handleChange(index, text)}
            onKeyPress={(e) => handleKeyPress(index, e)}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex((prev) => (prev === index ? null : prev))}
            keyboardType="number-pad"
            textContentType={index === 0 ? 'oneTimeCode' : undefined}
            maxLength={index === 0 ? BOX_COUNT : 1}
            autoFocus={autoFocus && index === 0}
            selectTextOnFocus
            style={[
              styles.box,
              focusedIndex === index && styles.boxFocused,
              !!digit && styles.boxFilled,
              !!error && styles.boxError,
            ]}
          />
        ))}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  box: {
    width: 46,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E7E5DE',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: NAVY,
  },
  boxFocused: {
    borderColor: GOLD,
  },
  boxFilled: {
    backgroundColor: GOLD_TINT,
    borderColor: GOLD,
  },
  boxError: {
    borderColor: ERROR,
  },
  errorText: {
    marginTop: 8,
    marginLeft: 4,
    fontSize: 11.5,
    color: ERROR,
  },
});
