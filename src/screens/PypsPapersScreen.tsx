import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { getPyqs, markPyqDownloaded, PyqItem } from '../services/pyq.service';
import { ContentOrderResponse, createContentOrder, verifyContentPayment } from '../services/contentPurchases.service';
import { getStreakDays } from '../services/dashboard.service';
import { downloadAndSharePdf } from '../utils/pdfDownload';
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
  const [streakDays, setStreakDays] = useState(0);

  const [howItWorksVisible, setHowItWorksVisible] = useState(false);

  const [buyTarget, setBuyTarget] = useState<PyqItem | null>(null);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState('');
  const [razorpayOrder, setRazorpayOrder] = useState<ContentOrderResponse | null>(null);
  const [razorpayVisible, setRazorpayVisible] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh?: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const [result, streak] = await Promise.all([
          getPyqs(token),
          getStreakDays(token),
        ]);
        setPapers(result);
        setStreakDays(streak);
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

  const categoryLogo = filtered[0]?.categoryIcon;

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

  const handleDownload = async (paper: PyqItem) => {
    if (!paper.fileUrl || downloadingId) return;
    const absoluteUrl = resolveAssetUrl(paper.fileUrl);
    if (!absoluteUrl) return;
    setDownloadingId(paper.id);
    try {
      await downloadAndSharePdf(absoluteUrl, paper.title);
      markPyqDownloaded(token, paper.id);
      setPapers((prev) =>
        prev ? prev.map((p) => (p.id === paper.id ? { ...p, isDownloaded: true } : p)) : prev
      );
    } catch (err) {
      Alert.alert(
        'Download Failed',
        err instanceof Error ? err.message : 'Could not download this paper. Please try again.'
      );
    } finally {
      setDownloadingId(null);
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
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#1E1E1E" />
        </Pressable>

        <View style={styles.headerLogoWrap}>
          {categoryLogo ? (
            <Image
              source={{ uri: resolveAssetUrl(categoryLogo) }}
              style={styles.headerLogoImg}
              resizeMode="contain"
            />
          ) : (
            <Ionicons name="document-text" size={18} color="#FDE68A" />
          )}
        </View>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {examName} PYQ Papers
        </Text>
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
            <Text style={styles.statEmoji}>📝</Text>
            <Text style={styles.statValue}>{filtered.length > 0 ? 1 : 0}</Text>
            <Text style={styles.statLabel}>papers solved</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statEmoji}>🎯</Text>
            <Text style={styles.statValue}>{filtered.length}</Text>
            <Text style={styles.statLabel}>total papers</Text>
          </View>
        </View>

        {/* Section Header Row */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWrap}>
            <Text style={styles.sectionTitle}>Previous Year Papers</Text>
            <Text style={styles.sectionCount}>{filtered.length}</Text>
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

        {/* PYQ Papers Cards List */}
        {filtered.map((paper, index) => {
          const logoUri = paper.categoryIcon || categoryLogo;
          const priceDisplay = paper.isCoachingStudent && paper.coachingPrice > 0 ? paper.coachingPrice : paper.price;

          return (
            <Pressable key={paper.id} style={styles.card} onPress={() => handleOpen(paper)}>
              {/* Left Badge: Category Logo Image */}
              <View style={styles.cardLogoBadge}>
                {logoUri ? (
                  <Image
                    source={{ uri: resolveAssetUrl(logoUri) }}
                    style={styles.cardLogoImg}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons name="document-text-outline" size={24} color={NAVY} />
                )}
              </View>

              {/* Middle Info Column */}
              <View style={styles.cardMiddleContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {paper.title}
                </Text>

                <Text style={styles.cardSubText}>
                  {paper.year} {paper.fileSize ? `• ${formatFileSize(paper.fileSize)}` : ''}
                </Text>
              </View>

              {/* Right Action Button Pill */}
              <View style={styles.cardRightAction}>
                {paper.isLocked ? (
                  <View style={[styles.actionPill, styles.actionPillLocked]}>
                    <Text style={styles.actionPillTextLocked}>₹{priceDisplay}</Text>
                    <Ionicons name="chevron-down" size={14} color="#92400E" />
                  </View>
                ) : (
                  <>
                    <Pressable
                      style={styles.downloadBtn}
                      onPress={() => handleDownload(paper)}
                      disabled={downloadingId === paper.id}
                      hitSlop={6}
                    >
                      {downloadingId === paper.id ? (
                        <ActivityIndicator size="small" color={NAVY} />
                      ) : (
                        <Ionicons
                          name={paper.isDownloaded ? 'checkmark-circle' : 'download-outline'}
                          size={18}
                          color={paper.isDownloaded ? '#166534' : NAVY}
                        />
                      )}
                    </Pressable>
                    <View style={[styles.actionPill, styles.actionPillOpen]}>
                      <Text style={styles.actionPillTextOpen}>Open</Text>
                      <Ionicons name="chevron-down" size={14} color="#1E1E1E" />
                    </View>
                  </>
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
              <Text style={styles.infoModalTitle}>About PYQ Papers</Text>
              <Pressable onPress={() => setHowItWorksVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#1E1E1E" />
              </Pressable>
            </View>

            <View style={styles.infoStepRow}>
              <Text style={styles.infoStepIcon}>📄</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoStepTitle}>Authentic Exam Papers</Text>
                <Text style={styles.infoStepDesc}>
                  Practice with genuine previous year question papers solved and verified by top faculty.
                </Text>
              </View>
            </View>

            <View style={styles.infoStepRow}>
              <Text style={styles.infoStepIcon}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoStepTitle}>Instant PDF Download & View</Text>
                <Text style={styles.infoStepDesc}>
                  View official exam question papers instantly in high resolution.
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
  cardRightAction: {
    marginLeft: 8,
    alignItems: 'flex-end',
    gap: 6,
  },
  downloadBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
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
