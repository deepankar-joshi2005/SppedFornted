import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RazorpayCheckoutModal from '../components/RazorpayCheckoutModal';
import { resolveAssetUrl } from '../config/api';
import { Nav } from '../navigation/types';
import {
  buyTestSeries,
  createRazorpayOrder,
  RazorpayOrderResponse,
  verifyRazorpayPayment,
} from '../services/purchases.service';
import { getTestsByCategory, TestListItem, TestListResponse } from '../services/tests.service';
import { ERROR, GOLD, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  category: string;
  nav: Nav;
};

type Filter = 'All' | 'New' | 'Attempted' | 'Completed';
const FILTERS: Filter[] = ['All', 'New', 'Attempted', 'Completed'];

const filterMatches = (filter: Filter, status: TestListItem['status']): boolean => {
  if (filter === 'All') return true;
  if (filter === 'New') return status === 'not-attempted';
  if (filter === 'Attempted') return status === 'in-progress';
  return status === 'completed';
};

export default function TestListScreen({ token, category, nav }: Props) {
  const [seriesData, setSeriesData] = useState<TestListResponse | null>(null);
  const [seriesTitle, setSeriesTitle] = useState('');
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [tests, setTests] = useState<TestListItem[] | null>(null);
  const [filter, setFilter] = useState<Filter>('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Purchase Modal State
  const [buyModalVisible, setBuyModalVisible] = useState(false);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState('');

  // Razorpay Checkout Modal State
  const [razorpayOrder, setRazorpayOrder] = useState<RazorpayOrderResponse | null>(null);
  const [razorpayVisible, setRazorpayVisible] = useState(false);

  const load = useCallback(
    async (isRefresh?: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const result = await getTestsByCategory(token, category);
        setSeriesData(result);
        setSeriesTitle(result.seriesTitle);
        setBannerImage(result.bannerImage);
        setTests(result.tests);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tests.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token, category]
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleBuySeries = async () => {
    if (!seriesData?.seriesId) return;
    setBuying(true);
    setBuyError('');
    try {
      // Create Razorpay Order
      const order = await createRazorpayOrder(token, seriesData.seriesId);
      setRazorpayOrder(order);
      setBuyModalVisible(false);
      setRazorpayVisible(true);
    } catch (err) {
      // Fallback to direct purchase if order creation fails or offline
      try {
        await buyTestSeries(token, seriesData.seriesId);
        setBuyModalVisible(false);
        load(true);
      } catch (fallbackErr) {
        setBuyError(
          fallbackErr instanceof Error ? fallbackErr.message : 'Payment order creation failed.'
        );
      }
    } finally {
      setBuying(false);
    }
  };

  const handleRazorpaySuccess = async (data: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => {
    if (!seriesData?.seriesId) return;
    setRazorpayVisible(false);
    setLoading(true);
    try {
      await verifyRazorpayPayment(token, {
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_order_id: data.razorpay_order_id,
        razorpay_signature: data.razorpay_signature,
        testSeriesId: seriesData.seriesId,
      });
      load(true); // reload list with unlocked series
    } catch (err) {
      setError('Payment verification failed. Please contact support if amount was deducted.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartOrResume = async (test: TestListItem) => {
    if (test.isLocked) {
      setBuyModalVisible(true);
      return;
    }
    if (test.status === 'in-progress' && test.attemptId) {
      // Resume: go directly to test taking
      nav.push({ name: 'testTaking', attemptId: test.attemptId, testId: test.id });
      return;
    }
    // New / Reattempt: go through pre-test flow (Language → Instructions → Symbols)
    nav.push({ name: 'testInstructions', testId: test.id });
  };

  const handleViewResult = (test: TestListItem) => {
    if (test.attemptId) nav.push({ name: 'testResult', attemptId: test.attemptId });
  };

  const filteredTests = tests?.filter((t) => filterMatches(filter, t.status)) ?? [];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {seriesTitle || `${category} Mock Tests`}
        </Text>
        <Pressable
          style={styles.iconBtn}
          hitSlop={8}
          onPress={() => nav.push({ name: 'notifications' })}
        >
          <Ionicons name="notifications-outline" size={20} color={NAVY} />
        </Pressable>
      </View>

      {!!bannerImage?.trim() && (
        <Image
          source={{ uri: resolveAssetUrl(bannerImage) }}
          style={styles.banner}
          resizeMode="cover"
        />
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            style={[styles.filterPill, filter === f && styles.filterPillActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={NAVY} />
        }
      >
        {loading && !tests && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={NAVY} size="large" />
          </View>
        )}

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {filteredTests.map((test) => (
          <View style={[styles.card, test.isLocked && { opacity: 0.9 }]} key={test.id}>
            <View style={styles.cardTopRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                {test.isLocked ? (
                  <Ionicons name="lock-closed" size={16} color="#92400E" />
                ) : test.isFreeDemo ? (
                  <View style={styles.demoBadge}>
                    <Text style={styles.demoBadgeText}>FREE DEMO</Text>
                  </View>
                ) : null}
                <Text style={styles.cardTitle}>{test.title}</Text>
              </View>
              <StatusBadge status={test.status} isLocked={test.isLocked} />
            </View>
            <Text style={styles.metaText}>
              {test.totalQuestions} Questions • {test.durationMinutes} Minutes •{' '}
              {test.totalMarks} Marks
            </Text>
            <View style={styles.divider} />
            <View style={styles.cardBottomRow}>
              <Text style={styles.difficultyText}>
                Difficulty: <Text style={styles.difficultyValue}>{test.difficulty}</Text>
              </Text>
              {test.isLocked ? (
                <Pressable
                  style={[styles.primaryBtn, { backgroundColor: '#92400E' }]}
                  onPress={() => setBuyModalVisible(true)}
                >
                  <Ionicons name="lock-closed-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={styles.primaryBtnText}>Unlock Test Series</Text>
                </Pressable>
              ) : test.status === 'completed' ? (
                <View style={styles.completedActions}>
                  <Text style={styles.scoreText}>
                    Score: {test.score}/{test.totalMarks}
                  </Text>
                  <View style={styles.completedBtnRow}>
                    <Pressable style={styles.outlineBtn} onPress={() => handleViewResult(test)}>
                      <Text style={styles.outlineBtnText}>View Result</Text>
                    </Pressable>
                    {test.canReattempt && (
                      <Pressable
                        style={styles.primaryBtnSmall}
                        onPress={() => handleStartOrResume(test)}
                      >
                        <Text style={styles.primaryBtnSmallText}>Reattempt</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              ) : (
                <Pressable
                  style={styles.primaryBtn}
                  onPress={() => handleStartOrResume(test)}
                >
                  <Text style={styles.primaryBtnText}>
                    {test.status === 'in-progress' ? 'Resume Test' : 'Start Test'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Purchase Modal */}
      <Modal visible={buyModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.purchaseCard}>
            <View style={styles.lockIconWrap}>
              <Ionicons name="lock-closed" size={32} color="#D97706" />
            </View>
            <Text style={styles.purchaseTitle}>Unlock {seriesTitle}</Text>
            <Text style={styles.purchaseSub}>
              This test series is paid. Purchase now to get full access to all mock tests!
            </Text>

            {seriesData?.isCoachingStudent && (
              <View style={styles.coachingPill}>
                <Ionicons name="school-outline" size={14} color="#166534" />
                <Text style={styles.coachingPillText}>Speed Coaching Student Discount Applied!</Text>
              </View>
            )}

            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Total Amount:</Text>
              <Text style={styles.priceValue}>
                ₹
                {seriesData?.isCoachingStudent
                  ? (seriesData.coachingPrice ?? seriesData.price)
                  : seriesData?.price}
              </Text>
            </View>

            {!!buyError && <Text style={styles.errorTextSmall}>{buyError}</Text>}

            <Pressable
              style={styles.buyConfirmBtn}
              onPress={handleBuySeries}
              disabled={buying}
            >
              {buying ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buyConfirmBtnText}>Confirm Purchase & Unlock</Text>
              )}
            </Pressable>

            <Pressable style={styles.cancelBuyBtn} onPress={() => setBuyModalVisible(false)}>
              <Text style={styles.cancelBuyText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Razorpay WebView Checkout Modal */}
      <RazorpayCheckoutModal
        visible={razorpayVisible}
        orderData={razorpayOrder}
        onSuccess={handleRazorpaySuccess}
        onCancel={() => setRazorpayVisible(false)}
        onError={(errMsg) => {
          setRazorpayVisible(false);
          setBuyModalVisible(true);
          setBuyError(errMsg);
        }}
      />
    </SafeAreaView>
  );
}

function StatusBadge({ status, isLocked }: { status: TestListItem['status']; isLocked?: boolean }) {
  if (isLocked) {
    return (
      <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
        <Text style={[styles.badgeText, { color: '#92400E' }]}>Locked 🔒</Text>
      </View>
    );
  }
  if (status === 'completed') {
    return (
      <View style={[styles.badge, styles.badgeCompleted]}>
        <Text style={[styles.badgeText, styles.badgeTextCompleted]}>Attempted</Text>
      </View>
    );
  }
  if (status === 'in-progress') {
    return (
      <View style={[styles.badge, styles.badgeProgress]}>
        <Text style={[styles.badgeText, styles.badgeTextProgress]}>In Progress</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, styles.badgeNew]}>
      <Text style={[styles.badgeText, styles.badgeTextNew]}>Not Attempted</Text>
    </View>
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
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
  },
  banner: {
    width: '100%',
    height: 130,
    marginBottom: 12,
    backgroundColor: '#EEF1F7',
  },
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
    height: 52,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  filterPillActive: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  filterText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: NAVY,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
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
    color: ERROR,
    fontSize: 13,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: NAVY,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeNew: { backgroundColor: '#FDF1DC' },
  badgeProgress: { backgroundColor: '#E9F0FB' },
  badgeCompleted: { backgroundColor: '#E4F5EA' },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  badgeTextNew: { color: '#B4790C' },
  badgeTextProgress: { color: NAVY },
  badgeTextCompleted: { color: '#2E9E5B' },
  metaText: {
    fontSize: 12,
    color: MUTED,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#EDEBE4',
    marginTop: 12,
    marginBottom: 12,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 12.5,
    color: MUTED,
  },
  difficultyValue: {
    fontWeight: '700',
    color: NAVY,
  },
  primaryBtn: {
    backgroundColor: NAVY,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 9,
    minWidth: 96,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },
  completedActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: NAVY,
  },
  completedBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  outlineBtn: {
    borderWidth: 1.3,
    borderColor: NAVY,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  outlineBtnText: {
    color: NAVY,
    fontWeight: '700',
    fontSize: 12,
  },
  primaryBtnSmall: {
    backgroundColor: GOLD,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
    minWidth: 84,
    alignItems: 'center',
  },
  primaryBtnSmallText: {
    color: NAVY,
    fontWeight: '700',
    fontSize: 12,
  },
  demoBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  demoBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  purchaseCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
  },
  lockIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  purchaseTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: NAVY,
  },
  purchaseSub: {
    fontSize: 12.5,
    color: MUTED,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  coachingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  coachingPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#166534',
  },
  priceContainer: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  priceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: NAVY,
  },
  errorTextSmall: {
    color: '#C0392B',
    fontSize: 11.5,
    marginTop: 8,
    textAlign: 'center',
  },
  buyConfirmBtn: {
    width: '100%',
    backgroundColor: NAVY,
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  buyConfirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
  cancelBuyBtn: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBuyText: {
    color: MUTED,
    fontWeight: '600',
    fontSize: 13,
  },
});
