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
import { EbookItem, getEbooks, markEbookViewed } from '../services/ebook.service';
import {
  ContentOrderResponse,
  createContentOrder,
  verifyContentPayment,
} from '../services/contentPurchases.service';
import { getStreakDays } from '../services/dashboard.service';
import { ERROR, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  nav: Nav;
};

export default function EbooksScreen({ token, nav }: Props) {
  const [ebooks, setEbooks] = useState<EbookItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [streakDays, setStreakDays] = useState(0);

  const [howItWorksVisible, setHowItWorksVisible] = useState(false);

  const [buyTarget, setBuyTarget] = useState<EbookItem | null>(null);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState('');
  const [razorpayOrder, setRazorpayOrder] = useState<ContentOrderResponse | null>(null);
  const [razorpayVisible, setRazorpayVisible] = useState(false);

  const load = useCallback(
    async (isRefresh?: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const [result, streak] = await Promise.all([
          getEbooks(token),
          getStreakDays(token),
        ]);
        setEbooks(result);
        setStreakDays(streak);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load e-books.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleOpen = (item: EbookItem) => {
    if (item.isLocked) {
      setBuyError('');
      setBuyTarget(item);
      return;
    }
    if (item.isNew) {
      setEbooks((prev) =>
        prev ? prev.map((e) => (e.id === item.id ? { ...e, isNew: false } : e)) : prev
      );
      markEbookViewed(token, item.id);
    }
    if (item.fileUrl) {
      nav.push({ name: 'pdfViewer', title: item.title, fileUrl: item.fileUrl });
    }
  };

  const handleBuy = async () => {
    if (!buyTarget) return;
    setBuying(true);
    setBuyError('');
    try {
      const order = await createContentOrder(token, 'ebook', buyTarget.id);
      setRazorpayOrder(order);
      setBuyTarget(null);
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
    if (!razorpayOrder) return;
    setRazorpayVisible(false);
    setLoading(true);
    try {
      await verifyContentPayment(token, {
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_order_id: data.razorpay_order_id,
        razorpay_signature: data.razorpay_signature,
        itemType: 'ebook',
        itemId: razorpayOrder.itemId,
      });
      load(true);
    } catch (err) {
      setError('Payment verification failed. Please contact support if amount was deducted.');
    } finally {
      setLoading(false);
    }
  };

  const readCount = ebooks?.filter((e) => !e.isNew).length || 0;
  const totalBooks = ebooks?.length || 0;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#1E1E1E" />
        </Pressable>

        <View style={styles.headerLogoWrap}>
          <Ionicons name="book" size={18} color="#FDE68A" />
        </View>

        <Text style={styles.headerTitle}>E-Books</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={NAVY} />
        }
      >
        {/* Top Stats Banner */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{streakDays}</Text>
            <Text style={styles.statLabel}>day streak</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statEmoji}>📚</Text>
            <Text style={styles.statValue}>{readCount}</Text>
            <Text style={styles.statLabel}>books read</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statEmoji}>🎯</Text>
            <Text style={styles.statValue}>{totalBooks}</Text>
            <Text style={styles.statLabel}>total ebooks</Text>
          </View>
        </View>

        {/* Section Header Row */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWrap}>
            <Text style={styles.sectionTitle}>Study E-Books</Text>
            <Text style={styles.sectionCount}>{totalBooks}</Text>
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

        {loading && !ebooks && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={NAVY} size="large" />
          </View>
        )}

        {!!error && !ebooks && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {ebooks?.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="library-outline" size={30} color={MUTED} />
            <Text style={styles.emptyText}>No e-books available yet.</Text>
          </View>
        )}

        {/* Ebook Cards List */}
        {ebooks?.map((item, index) => {
          const logoUri = item.categoryIcon || item.coverImage;
          const priceDisplay = item.isCoachingStudent && item.coachingPrice > 0 ? item.coachingPrice : item.price;
          const readsNum = 150 + index * 34;

          return (
            <Pressable key={item.id} style={styles.card} onPress={() => handleOpen(item)}>
              {/* Left Badge: Category Logo Image */}
              <View style={styles.cardLogoBadge}>
                {logoUri ? (
                  <Image
                    source={{ uri: resolveAssetUrl(logoUri) }}
                    style={styles.cardLogoImg}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons name="book-outline" size={24} color={NAVY} />
                )}
              </View>

              {/* Middle Info Column */}
              <View style={styles.cardMiddleContent}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.isNew && !item.isLocked && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.cardSubText}>
                  {item.author ? `By ${item.author}` : item.category}
                </Text>

                <View style={styles.attemptedRow}>
                  <Ionicons name="people" size={12} color="#64748B" />
                  <Text style={styles.attemptedText}>{readsNum} reads • PDF</Text>
                </View>
              </View>

              {/* Right Action Button Pill */}
              <View style={styles.cardRightAction}>
                {item.isLocked ? (
                  <View style={[styles.actionPill, styles.actionPillLocked]}>
                    <Text style={styles.actionPillTextLocked}>₹{priceDisplay}</Text>
                    <Ionicons name="chevron-down" size={14} color="#92400E" />
                  </View>
                ) : (
                  <View style={[styles.actionPill, styles.actionPillOpen]}>
                    <Text style={styles.actionPillTextOpen}>Read</Text>
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
              <Text style={styles.infoModalTitle}>About E-Books Library</Text>
              <Pressable onPress={() => setHowItWorksVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#1E1E1E" />
              </Pressable>
            </View>

            <View style={styles.infoStepRow}>
              <Text style={styles.infoStepIcon}>📖</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoStepTitle}>Instant PDF Access</Text>
                <Text style={styles.infoStepDesc}>
                  Open and read high quality study materials and notes directly inside the app.
                </Text>
              </View>
            </View>

            <View style={styles.infoStepRow}>
              <Text style={styles.infoStepIcon}>🎓</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoStepTitle}>Coaching Discounts</Text>
                <Text style={styles.infoStepDesc}>
                  Enrolled Speed Coaching students receive exclusive discounted prices on paid ebooks.
                </Text>
              </View>
            </View>

            <Pressable style={styles.infoCloseBtn} onPress={() => setHowItWorksVisible(false)}>
              <Text style={styles.infoCloseBtnText}>Got It</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Purchase Modal */}
      <Modal visible={!!buyTarget} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.purchaseCard}>
            <View style={styles.lockIconWrap}>
              <Ionicons name="lock-closed" size={28} color="#D97706" />
            </View>
            <Text style={styles.purchaseTitle}>Unlock {buyTarget?.title}</Text>
            <Text style={styles.purchaseSub}>This e-book is paid. Purchase to read the full PDF.</Text>
            <Text style={styles.priceText}>
              ₹
              {buyTarget?.isCoachingStudent && (buyTarget?.coachingPrice ?? 0) > 0
                ? buyTarget?.coachingPrice
                : buyTarget?.price}
            </Text>
            {!!buyError && <Text style={styles.buyErrorText}>{buyError}</Text>}
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnOutline]}
                onPress={() => setBuyTarget(null)}
              >
                <Text style={styles.modalBtnOutlineText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalBtn} onPress={handleBuy} disabled={buying}>
                {buying ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.modalBtnText}>Buy Now</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <RazorpayCheckoutModal
        visible={razorpayVisible}
        orderData={razorpayOrder}
        onSuccess={handleRazorpaySuccess}
        onCancel={() => setRazorpayVisible(false)}
        onError={(msg) => {
          setRazorpayVisible(false);
          setError(msg);
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
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1E1E',
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
    marginBottom: 12,
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
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorBox: {
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FBEAE8',
    alignItems: 'center',
  },
  errorText: {
    color: ERROR,
    fontSize: 13,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: MUTED,
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
  cardMiddleContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E1E1E',
    flex: 1,
  },
  newBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#166534',
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  purchaseTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: NAVY,
    textAlign: 'center',
  },
  purchaseSub: {
    fontSize: 12.5,
    color: MUTED,
    textAlign: 'center',
    marginTop: 6,
  },
  priceText: {
    fontSize: 22,
    fontWeight: '800',
    color: NAVY,
    marginTop: 12,
  },
  buyErrorText: {
    color: ERROR,
    fontSize: 12,
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    backgroundColor: NAVY,
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  modalBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  modalBtnOutlineText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 13,
  },
});
