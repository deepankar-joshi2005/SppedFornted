import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { ContentOrderResponse, createContentOrder, verifyContentPayment } from '../services/contentPurchases.service';
import { Nav } from '../navigation/types';
import { getPyqs, PyqItem } from '../services/pyq.service';
import { ERROR, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  category: string;
  examName: string;
  nav: Nav;
};

const formatFileSize = (bytes: number): string => {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

export default function PypsPapersScreen({ token, category, examName, nav }: Props) {
  const [papers, setPapers] = useState<PyqItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [buyTarget, setBuyTarget] = useState<PyqItem | null>(null);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState('');
  const [razorpayOrder, setRazorpayOrder] = useState<ContentOrderResponse | null>(null);
  const [razorpayVisible, setRazorpayVisible] = useState(false);

  const load = useCallback(
    async (isRefresh?: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const result = await getPyqs(token);
        setPapers(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load papers.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load();
  }, [load]);

  const filtered = (papers ?? [])
    .filter((p) => p.category === category && p.examName === examName)
    .sort((a, b) => b.year - a.year);

  const handleOpen = (paper: PyqItem) => {
    if (paper.isLocked) {
      setBuyError('');
      setBuyTarget(paper);
      return;
    }
    if (paper.fileUrl) {
      nav.push({ name: 'pdfViewer', title: paper.title, fileUrl: paper.fileUrl });
    }
  };

  const handleBuy = async () => {
    if (!buyTarget) return;
    setBuying(true);
    setBuyError('');
    try {
      const order = await createContentOrder(token, 'pyq', buyTarget.id);
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
        itemType: 'pyq',
        itemId: razorpayOrder.itemId,
      });
      load(true);
    } catch (err) {
      setError('Payment verification failed. Please contact support if amount was deducted.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {examName}
        </Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={NAVY} />
        }
      >
        {loading && !papers && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={NAVY} size="large" />
          </View>
        )}

        {!!error && !papers && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {papers && filtered.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="document-text-outline" size={30} color={MUTED} />
            <Text style={styles.emptyText}>No papers available yet.</Text>
          </View>
        )}

        {filtered.map((paper) => (
          <Pressable key={paper.id} style={styles.card} onPress={() => handleOpen(paper)}>
            <View style={styles.cardIconWrap}>
              <Ionicons
                name={paper.isLocked ? 'lock-closed' : 'document-outline'}
                size={18}
                color={paper.isLocked ? '#92400E' : NAVY}
              />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{paper.title}</Text>
              <Text style={styles.cardSubtitle}>
                {paper.year}
                {paper.fileSize ? ` • ${formatFileSize(paper.fileSize)}` : ''}
              </Text>
            </View>
            {paper.isLocked ? (
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>
                  ₹{paper.isCoachingStudent && paper.coachingPrice > 0 ? paper.coachingPrice : paper.price}
                </Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={16} color={MUTED} />
            )}
          </Pressable>
        ))}
      </ScrollView>

      <Modal visible={!!buyTarget} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.purchaseCard}>
            <View style={styles.lockIconWrap}>
              <Ionicons name="lock-closed" size={28} color="#D97706" />
            </View>
            <Text style={styles.purchaseTitle}>Unlock {buyTarget?.title}</Text>
            <Text style={styles.purchaseSub}>This paper is paid. Purchase to view the full PDF.</Text>
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
    minWidth: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
    textAlign: 'center',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorBox: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FBEAE8',
  },
  errorText: {
    color: ERROR,
    fontSize: 13,
    textAlign: 'center',
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
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FCE4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: NAVY,
  },
  cardSubtitle: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  priceBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  priceBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  purchaseCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
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
    fontSize: 16,
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
    fontSize: 24,
    fontWeight: '800',
    color: NAVY,
    marginTop: 14,
  },
  buyErrorText: {
    fontSize: 12,
    color: ERROR,
    marginTop: 10,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 18,
  },
  modalBtn: {
    flex: 1,
    backgroundColor: NAVY,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13.5,
  },
  modalBtnOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.3,
    borderColor: '#D8D5CC',
  },
  modalBtnOutlineText: {
    color: NAVY,
    fontWeight: '700',
    fontSize: 13.5,
  },
});
