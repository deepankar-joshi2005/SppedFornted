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
  createRazorpayOrder,
  RazorpayOrderResponse,
  verifyRazorpayPayment,
} from '../services/purchases.service';
import { getSectionalSeriesTests } from '../services/sectional.service';
import { getTestsByCategory, TestListItem, TestListResponse } from '../services/tests.service';
import { ERROR, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  category?: string;
  seriesId?: string;
  seriesIcon?: string;
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

export default function TestListScreen({ token, category, seriesId, seriesIcon, nav }: Props) {
  const [seriesData, setSeriesData] = useState<TestListResponse | null>(null);
  const [seriesTitle, setSeriesTitle] = useState('');
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [tests, setTests] = useState<TestListItem[] | null>(null);
  const [filter, setFilter] = useState<Filter>('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Info Modal ("How it works")
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);

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
        const result = seriesId
          ? await getSectionalSeriesTests(token, seriesId)
          : await getTestsByCategory(token, category as string);
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
    [token, category, seriesId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleBuySeries = async () => {
    if (!seriesData?.seriesId) return;
    setBuying(true);
    setBuyError('');
    try {
      const order = await createRazorpayOrder(token, seriesData.seriesId);
      setRazorpayOrder(order);
      setBuyModalVisible(false);
      setRazorpayVisible(true);
    } catch (err) {
      setBuyError(err instanceof Error ? err.message : 'Payment order creation failed.');
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
      load(true);
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
    if (test.status === 'completed') {
      handleViewResult(test);
      return;
    }
    if (test.status === 'in-progress' && test.attemptId) {
      nav.push({ name: 'testTaking', attemptId: test.attemptId, testId: test.id });
      return;
    }
    nav.push({ name: 'testInstructions', testId: test.id });
  };

  const handleViewResult = (test: TestListItem) => {
    if (test.attemptId) nav.push({ name: 'testResult', attemptId: test.attemptId });
  };

  const filteredTests = tests?.filter((t) => filterMatches(filter, t.status)) ?? [];

  const streakDays = seriesData?.userStats?.streakDays ?? 0;
  const mocksTaken = seriesData?.userStats?.mocksTaken ?? (tests?.filter((t) => t.status === 'completed').length || 1);
  const totalAttempts = seriesData?.userStats?.totalAttempts ?? (tests?.filter((t) => t.status === 'completed').length || 1);

  // seriesIcon arrives as a full URL (already resolved in TestsScreen)
  // categoryIcon / bannerImage are raw server paths — resolve them here
  const categoryLogo = seriesIcon
    || (seriesData?.categoryIcon ? resolveAssetUrl(seriesData.categoryIcon) : null)
    || (seriesData?.bannerImage ? resolveAssetUrl(seriesData.bannerImage) : null)
    || null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header Row matching screenshot */}
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#1E1E1E" />
        </Pressable>

        {/* Category Logo Badge in Header */}
        <View style={styles.headerLogoWrap}>
          {categoryLogo ? (
            <Image
              source={{ uri: categoryLogo }}
              style={styles.headerLogoImg}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.headerLogoFallback}>
              {(category || seriesTitle || 'B').charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {seriesTitle || (category ? `${category} Mocks` : 'Mock Tests')}
        </Text>

        <Pressable
          style={styles.iconBtn}
          hitSlop={8}
          onPress={() => nav.push({ name: 'notifications' })}
        >
          <Ionicons name="notifications-outline" size={20} color="#1E1E1E" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={NAVY} />
        }
      >
        {!!bannerImage?.trim() && (
          <Image
            source={{ uri: resolveAssetUrl(bannerImage) }}
            style={styles.banner}
            resizeMode="cover"
          />
        )}

        {/* Top Stats Banner Card matching screenshot exactly */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{streakDays}</Text>
            <Text style={styles.statLabel}>day streak</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statEmoji}>📝</Text>
            <Text style={styles.statValue}>{mocksTaken}</Text>
            <Text style={styles.statLabel}>mock taken</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statEmoji}>🎯</Text>
            <Text style={styles.statValue}>{totalAttempts}</Text>
            <Text style={styles.statLabel}>attempts</Text>
          </View>
        </View>

        {/* Section Header Row */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWrap}>
            <Text style={styles.sectionTitle}>Editorial Mocks</Text>
            <Text style={styles.sectionCount}>{tests?.length ?? 0}</Text>
          </View>
          <Pressable
            style={styles.howItWorksBtn}
            onPress={() => setHowItWorksVisible(true)}
            hitSlop={8}
          >
            <Ionicons name="information-circle-outline" size={16} color="#64748B" />
            <Text style={styles.howItWorksText}>How it works</Text>
          </Pressable>
        </View>

        {/* Filter Pills */}
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

        {/* Mocks Cards List matching screenshot design */}
        {filteredTests.map((test, index) => {
          const catStr = (category || seriesTitle || '').toLowerCase();
          return (
            <Pressable
              key={test.id}
              style={[styles.card, test.isLocked && { opacity: 0.95 }]}
              onPress={() => handleStartOrResume(test)}
            >
              {/* Left Badge: Category / Series Logo Image */}
              <View style={styles.cardLogoBadge}>
                {categoryLogo ? (
                  <Image
                    source={{ uri: categoryLogo }}
                    style={styles.cardLogoImg}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.cardLogoFallback}>
                    {catStr.includes('agniveer') || catStr.includes('defence') || catStr.includes('army') ? (
                      <Ionicons name="shield" size={24} color="#1E1E1E" />
                    ) : catStr.includes('railway') || catStr.includes('rrb') ? (
                      <Ionicons name="train" size={24} color="#1E1E1E" />
                    ) : catStr.includes('bank') || catStr.includes('po') ? (
                      <Ionicons name="business" size={24} color="#1E1E1E" />
                    ) : catStr.includes('police') || catStr.includes('si') ? (
                      <Ionicons name="shield-checkmark" size={24} color="#1E1E1E" />
                    ) : catStr.includes('ssc') || catStr.includes('cgl') ? (
                      <Ionicons name="school" size={24} color="#1E1E1E" />
                    ) : (
                      <Ionicons name="ribbon" size={24} color="#1E1E1E" />
                    )}
                  </View>
                )}
              </View>

              {/* Middle Info Column */}
              <View style={styles.cardMiddleContent}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {test.title}
                  </Text>
                </View>

                <Text style={styles.cardSubText}>
                  {test.totalQuestions} Questions • {test.durationMinutes} mins
                </Text>

                {test.status === 'completed' && (
                  <View style={styles.completedInfoRow}>
                    <Text style={styles.yourBestText}>
                      Your best {test.score !== null ? test.score : 0}
                    </Text>
                  </View>
                )}
              </View>

              {/* Right Action Button Pill */}
              <View style={styles.cardRightAction}>
                {test.isLocked ? (
                  <View style={[styles.actionPill, styles.actionPillLocked]}>
                    <Text style={styles.actionPillTextLocked}>Locked 🔒</Text>
                    <Ionicons name="chevron-down" size={14} color="#92400E" />
                  </View>
                ) : test.status === 'completed' ? (
                  <View style={[styles.actionPill, styles.actionPillDone]}>
                    <Ionicons name="checkmark-circle" size={14} color="#166534" />
                    <Text style={styles.actionPillTextDone}>Done</Text>
                    <Ionicons name="chevron-down" size={14} color="#166534" />
                  </View>
                ) : test.status === 'in-progress' ? (
                  <View style={[styles.actionPill, styles.actionPillOpen]}>
                    <Text style={styles.actionPillTextOpen}>Open</Text>
                    <Ionicons name="chevron-down" size={14} color="#1E1E1E" />
                  </View>
                ) : (
                  <View style={[styles.actionPill, styles.actionPillOpen]}>
                    <Text style={styles.actionPillTextOpen}>New</Text>
                    <Ionicons name="chevron-down" size={14} color="#1E1E1E" />
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* How It Works Modal */}
      <Modal visible={howItWorksVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.infoModalCard}>
            <View style={styles.infoModalHeader}>
              <Text style={styles.infoModalTitle}>How Editorial Mocks Work</Text>
              <Pressable onPress={() => setHowItWorksVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#1E1E1E" />
              </Pressable>
            </View>

            <View style={styles.infoStepRow}>
              <Text style={styles.infoStepIcon}>🔥</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoStepTitle}>Day Streak</Text>
                <Text style={styles.infoStepDesc}>
                  Attempt mock tests daily to keep your daily learning streak alive!
                </Text>
              </View>
            </View>

            <View style={styles.infoStepRow}>
              <Text style={styles.infoStepIcon}>📝</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoStepTitle}>Mock Taken</Text>
                <Text style={styles.infoStepDesc}>
                  Count of distinct mock test papers you have completed in this series.
                </Text>
              </View>
            </View>

            <View style={styles.infoStepRow}>
              <Text style={styles.infoStepIcon}>🎯</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoStepTitle}>Total Attempts</Text>
                <Text style={styles.infoStepDesc}>
                  Total number of test attempts submitted including reattempts.
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.infoCloseBtn}
              onPress={() => setHowItWorksVisible(false)}
            >
              <Text style={styles.infoCloseBtnText}>Got It</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 10,
    backgroundColor: '#FAF6F0',
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogoWrap: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerLogoImg: {
    width: 24,
    height: 24,
  },
  headerLogoFallback: {
    color: '#FDE68A',
    fontWeight: '800',
    fontSize: 15,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  banner: {
    width: '100%',
    height: 130,
    marginBottom: 12,
    backgroundColor: '#EEF1F7',
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFDF6',
    borderWidth: 1.2,
    borderColor: '#F0D688',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  statLabel: {
    fontSize: 11,
    color: '#78716C',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#EFE9D8',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#78716C',
  },
  howItWorksBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  howItWorksText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  filterScroll: {
    flexGrow: 0,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#1E1E1E',
    borderColor: '#1E1E1E',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorBox: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
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
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#1E1E1E',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLogoBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    overflow: 'hidden',
  },
  cardLogoImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  cardLogoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLogoFallbackText: {
    fontSize: 18,
    fontWeight: '800',
    color: NAVY,
  },
  cardMiddleContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  cardSubText: {
    fontSize: 11.5,
    color: '#78716C',
    marginTop: 2,
  },
  attemptedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  attemptedText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  completedInfoRow: {
    marginTop: 4,
  },
  yourBestText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#166534',
  },
  cardRightAction: {
    marginLeft: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.2,
  },
  actionPillOpen: {
    backgroundColor: '#FEF3C7',
    borderColor: '#1E1E1E',
  },
  actionPillTextOpen: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  actionPillDone: {
    backgroundColor: '#DCFCE7',
    borderColor: '#166534',
  },
  actionPillTextDone: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  actionPillLocked: {
    backgroundColor: '#FEF3C7',
    borderColor: '#92400E',
  },
  actionPillTextLocked: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#92400E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#1E1E1E',
  },
  infoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  infoStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  infoStepIcon: {
    fontSize: 22,
  },
  infoStepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  infoStepDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  infoCloseBtn: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  infoCloseBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
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
