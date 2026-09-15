import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CREAM, GOLD, MUTED, NAVY } from '../theme/colors';

type Props = {
  onBack?: () => void;
  title: string;
  subtitle: string;
  children: ReactNode;
  footerText: string;
  footerActionText: string;
  onFooterAction: () => void;
};

export default function AuthLayout({
  onBack,
  title,
  subtitle,
  children,
  footerText,
  footerActionText,
  onFooterAction,
}: Props) {
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Image
        source={require('../../assets/corner-top-left.png')}
        style={styles.cornerTopLeft}
        resizeMode="contain"
      />
      <Image
        source={require('../../assets/corner-top-right.png')}
        style={styles.cornerTopRight}
        resizeMode="contain"
      />
      <Image
        source={require('../../assets/corner-bottom-left.png')}
        style={styles.cornerBottomLeft}
        resizeMode="contain"
      />
      <Image
        source={require('../../assets/corner-bottom-right.png')}
        style={styles.cornerBottomRight}
        resizeMode="contain"
      />

      {onBack && (
        <View style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={onBack} hitSlop={10}>
            <Ionicons name="arrow-back" size={20} color={NAVY} />
          </Pressable>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <Image
          source={require('../../assets/logo-speed-coaching.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.form}>{children}</View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>{footerText} </Text>
          <Pressable onPress={onFooterAction} hitSlop={8}>
            <Text style={styles.footerAction}>{footerActionText}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CREAM,
  },
  topBar: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 132,
    height: 136,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 132,
    height: 136,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 92,
    height: 144,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 92,
    height: 144,
  },
  title: {
    marginTop: 18,
    fontSize: 26,
    fontWeight: '800',
    color: NAVY,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  form: {
    marginTop: 28,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  footerText: {
    fontSize: 13,
    color: MUTED,
  },
  footerAction: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD,
  },
});
