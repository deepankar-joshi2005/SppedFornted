import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { ERROR, GOLD, MUTED, NAVY } from '../theme/colors';

type Props = TextInputProps & {
  icon: keyof typeof Ionicons.glyphMap;
  error?: string;
  isPassword?: boolean;
};

export default function FormInput({ icon, error, isPassword, ...rest }: Props) {
  const [hidden, setHidden] = useState(isPassword);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          focused && styles.containerFocused,
          !!error && styles.containerError,
        ]}
      >
        <Ionicons name={icon} size={18} color={focused ? GOLD : MUTED} style={styles.icon} />
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
          style={styles.input}
        />
        {isPassword && (
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
  containerFocused: {
    borderColor: GOLD,
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
  errorText: {
    marginTop: 5,
    marginLeft: 4,
    fontSize: 11.5,
    color: ERROR,
  },
});
