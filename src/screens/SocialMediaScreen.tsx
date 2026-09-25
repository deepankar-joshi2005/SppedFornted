import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Nav } from '../navigation/types';
import { getSocialMediaLinks, SocialMediaLink } from '../services/socialMedia.service';
import { getSocialPlatformMeta } from '../utils/socialPlatforms';
import { ERROR, MUTED, NAVY, SOFT_SHADOW } from '../theme/colors';

type Props = {
  token: string;
  nav: Nav;
};

export default function SocialMediaScreen({ token, nav }: Props) {
  const [links, setLinks] = useState<SocialMediaLink[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getSocialMediaLinks(token);
      setLinks(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load social media links.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const handleOpenLink = async (item: SocialMediaLink) => {
    try {
      const supported = await Linking.canOpenURL(item.link);
      if (!supported) throw new Error('unsupported');
      await Linking.openURL(item.link);
    } catch {
      Alert.alert('Unable to Open', `Couldn't open ${item.label}. Please try again later.`);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle}>Social Media</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero banner */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="people-circle-outline" size={34} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>Let's Stay Connected!</Text>
          <Text style={styles.heroSubtitle}>
            Follow Speed Education on your favourite platform for live updates, tips and more.
          </Text>
        </View>

        {loading && !links && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={NAVY} size="large" />
          </View>
        )}

        {!!error && !links && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => load()}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </Pressable>
          </View>
        )}

        {links?.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="share-social-outline" size={30} color={MUTED} />
            <Text style={styles.emptyText}>No social media links added yet.</Text>
          </View>
        )}

        <View style={styles.grid}>
          {links?.map((item) => {
            const meta = getSocialPlatformMeta(item.platform);
            return (
              <Pressable
                key={item.id}
                style={styles.platformCard}
                onPress={() => handleOpenLink(item)}
              >
                <View style={[styles.platformIconCircle, { backgroundColor: meta.color }]}>
                  <Ionicons name={meta.icon} size={26} color="#FFFFFF" />
                </View>
                <Text style={styles.platformLabel} numberOfLines={1}>
                  {item.label}
                </Text>
                <View style={styles.connectPill}>
                  <Text style={styles.connectPillText}>Connect</Text>
                  <Ionicons name="arrow-forward" size={11} color={NAVY} />
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
  },
  iconBtn: {
    minWidth: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 30,
  },
  heroCard: {
    backgroundColor: NAVY,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 22,
    ...SOFT_SHADOW,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 12.5,
    color: '#CBD5E1',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FBEAE8',
    alignItems: 'center',
  },
  errorText: {
    color: ERROR,
    fontSize: 13,
    textAlign: 'center',
  },
  retryText: {
    marginTop: 8,
    color: NAVY,
    fontWeight: '700',
    fontSize: 12.5,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: MUTED,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  platformCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    ...SOFT_SHADOW,
  },
  platformIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  platformLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 10,
  },
  connectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF1F7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  connectPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: NAVY,
  },
});
