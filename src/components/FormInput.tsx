import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { ERROR, GOLD, MUTED, NAVY } from '../theme/colors';

type Props = TextInputProps & {
  icon: keyof typeof Ionicons.glyphMap;
  error?: string;
  isPassword?: boolean;
  verified?: boolean;
};

export default function FormInput({ icon, error, isPassword, verified, ...rest }: Props) {
  const [hidden, setHidden] = useState(isPassword);
  const [focused, setFocused] = useState(false);

  const isEditable = rest.editable !== false;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          !isEditable && styles.containerDisabled,
          focused && styles.containerFocused,
          verified && styles.containerVerified,
          !!error && styles.containerError,
        ]}
      >
        <Ionicons name={icon} size={18} color={verified ? '#10B981' : focused ? GOLD : MUTED} style={styles.icon} />
        <TextInput
          {...rest}
          secureTextEntry={hidden}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor="#9AA3B2"
          style={[styles.input, !isEditable && styles.inputDisabled]}
        />
        {verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
        {isPassword && !verified && (
          <Ionicons
            name={hidden ? 'eye-outline' : 'eye-off-outline'}
            size={18}
            color={MUTED}
            onPress={() => setHidden((h) => !h)}
            suppressHighlighting
          />
        )}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E7E5DE',
    paddingHorizontal: 14,
    height: 50,
  },
  containerDisabled: {
    backgroundColor: '#F8FAF9',
    borderColor: '#D1E7DD',
  },
  containerFocused: {
    borderColor: GOLD,
  },
  containerVerified: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  containerError: {
    borderColor: ERROR,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: NAVY,
    height: '100%',
  },
  inputDisabled: {
    color: '#065F46',
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 6,
  },
  verifiedText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#065F46',
    marginLeft: 4,
  },
  errorText: {
    marginTop: 5,
    marginLeft: 4,
    fontSize: 11.5,
    color: ERROR,
  },
});
