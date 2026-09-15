import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { getNotifications } from '../services/notifications.service';
import { NAVY } from '../theme/colors';

type Props = {
  token: string;
  onPress: () => void;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export default function NotificationBell({ token, onPress, size = 20, color = NAVY, style }: Props) {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const checkNotifications = async () => {
      try {
        const result = await getNotifications(token);
        if (!cancelled) setHasUnread(result.unreadCount > 0);
      } catch {
        // best-effort — badge simply won't show if this fails
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token]);

  return (
    <Pressable style={[styles.wrap, style]} onPress={onPress} hitSlop={8}>
      <Ionicons name="notifications-outline" size={size} color={color} />
      {hasUnread && <View style={styles.dot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E23744',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
