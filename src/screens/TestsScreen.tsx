import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationBell from '../components/NotificationBell';
import { resolveAssetUrl } from '../config/api';
import { Nav } from '../navigation/types';
import { useLanguage } from '../context/LanguageContext';
import { getTestSeriesSummary, TestSeriesSummary } from '../services/tests.service';
import { CARD_SHADOW, GOLD, GOLD_TINT, MUTED, NAVY, SOFT_SHADOW } from '../theme/colors';

type Props = {
  token: string;
  nav: Nav;
};

export default function TestsScreen({ token, nav }: Props) {
  const { t } = useLanguage();
  const [series, setSeries] = useState<TestSeriesSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (isRefresh?: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const result = await getTestSeriesSummary(token);
        setSeries(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load test series.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{t('test_series_title', 'Test Series')}</Text>
        <NotificationBell
          token={token}
          size={22}
          style={styles.bellBtn}
          onPress={() => nav.push({ name: 'notifications' })}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={NAVY} />
        }
      >
        {loading && !series && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={NAVY} size="large" />
          </View>
        )}

        {!!error && !series && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => load()}>
              <Text style={styles.retryText}>{t('retry', 'Tap to retry')}</Text>
            </Pressable>
          </View>
        )}

        {series?.map((item) => (
          <Pressable
            style={styles.card}
            key={item.category}
            onPress={() => nav.push({ name: 'testList', category: item.category })}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.cardTitleRow}>
                <View style={styles.categoryIconWrap}>
                  {item.iconImage ? (
                    <Image
                      source={{ uri: resolveAssetUrl(item.iconImage) }}
                      style={styles.categoryIconImg}
                    />
                  ) : (
                    <Ionicons name="reader-outline" size={16} color={NAVY} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.category} {t('test_series_title', 'Test Series')}</Text>
                  {item.isPaid ? (
                    item.isPurchased ? (
                      <View style={[styles.priceTag, { backgroundColor: '#DCFCE7' }]}>
                        <Ionicons name="checkmark-circle" size={12} color="#166534" />
                        <Text style={[styles.priceTagText, { color: '#166534' }]}>Unlocked</Text>
                      </View>
                    ) : (
                      <View style={[styles.priceTag, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="lock-closed" size={11} color="#92400E" />
                        <Text style={[styles.priceTagText, { color: '#92400E' }]}>
                          ₹{item.price}
                        </Text>
                      </View>
                    )
                  ) : (
                    <View style={[styles.priceTag, { backgroundColor: '#E0F2FE' }]}>
                      <Text style={[styles.priceTagText, { color: '#0369A1' }]}>FREE</Text>
                    </View>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={NAVY} />
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="reader-outline" size={14} color={NAVY} />
                <Text style={styles.metaText}>{item.totalTests} {t('tests_in_category', 'Tests')}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="help-circle-outline" size={14} color={NAVY} />
                <Text style={styles.metaText}>{item.totalQuestions} {t('questions', 'Qs')}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={NAVY} />
                <Text style={styles.metaText}>{item.durationMinutes} {t('minutes', 'mins')}</Text>
              </View>
            </View>

            <View style={styles.progressLabelRow}>
              <Text style={styles.difficultyText}>{item.difficulty}</Text>
              <Text style={styles.percentText}>{item.percentCompleted}% {t('completed', 'Completed')}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${item.percentCompleted}%` }]} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F4EF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: NAVY,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SOFT_SHADOW,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 14,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FBEAE8',
    alignItems: 'center',
  },
  errorText: {
    color: '#C0392B',
    fontSize: 13,
    textAlign: 'center',
  },
  retryText: {
    marginTop: 8,
    color: NAVY,
    fontWeight: '700',
    fontSize: 12.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    ...CARD_SHADOW,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  categoryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GOLD_TINT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  categoryIconImg: {
    width: 30,
    height: 30,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: NAVY,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  priceTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: MUTED,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 6,
  },
  difficultyText: {
    fontSize: 11.5,
    color: MUTED,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
    color: NAVY,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EEEDE6',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: GOLD,
  },
});
