import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

export interface UnlockBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  type?: 'series' | 'sectional' | 'ebook' | 'pyq' | 'test';
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  seedKey?: string;
  features?: string[];
  accessDuration?: string;
  onPay: () => void | Promise<void>;
  loading?: boolean;
}

export function calculateDynamicDiscount(realPrice: number, key?: string) {
  const p = Math.max(1, Math.round(realPrice));
  const rates = [60, 50, 40];
  let seed = p;
  if (key) {
    for (let i = 0; i < key.length; i++) {
      seed = (seed * 33 + key.charCodeAt(i)) >>> 0;
    }
  }
  const discountPercent = rates[seed % rates.length];
  const rawOriginal = p / (1 - discountPercent / 100);

  let originalPrice = Math.round(rawOriginal);
  if (originalPrice >= 150) {
    const rem = originalPrice % 100;
    if (rem < 25) originalPrice = Math.floor(originalPrice / 100) * 100 - 1;
    else if (rem < 75) originalPrice = Math.floor(originalPrice / 100) * 100 + 49;
    else originalPrice = Math.floor(originalPrice / 100) * 100 + 99;
  } else if (originalPrice >= 30) {
    originalPrice = Math.ceil(originalPrice / 10) * 10 - 1;
  }

  if (originalPrice <= p) {
    originalPrice = Math.round(p / (1 - discountPercent / 100));
    if (originalPrice <= p) originalPrice = p + 50;
  }

  return {
    realPrice: p,
    originalPrice,
    discountPercent,
  };
}

function TrophySvgIcon({ size = 52 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Defs>
        <SvgLinearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FDE047" />
          <Stop offset="50%" stopColor="#F59E0B" />
          <Stop offset="100%" stopColor="#D97706" />
        </SvgLinearGradient>
        <SvgLinearGradient id="cupInner" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#F59E0B" />
          <Stop offset="100%" stopColor="#B45309" />
        </SvgLinearGradient>
        <SvgLinearGradient id="baseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#1E293B" />
          <Stop offset="50%" stopColor="#334155" />
          <Stop offset="100%" stopColor="#1E293B" />
        </SvgLinearGradient>
        <SvgLinearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FEF08A" />
          <Stop offset="100%" stopColor="#F59E0B" />
        </SvgLinearGradient>
      </Defs>

      {/* Left handle */}
      <Path
        d="M20 18C14 18 10 23 10 29C10 36 15 40 21 41"
        stroke="url(#goldGrad)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Right handle */}
      <Path
        d="M44 18C50 18 54 23 54 29C54 36 49 40 43 41"
        stroke="url(#goldGrad)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Main Cup Body */}
      <Path
        d="M18 16C18 14.8954 18.8954 14 20 14H44C45.1046 14 46 14.8954 46 16V30C46 37.732 39.732 44 32 44C24.268 44 18 37.732 18 30V16Z"
        fill="url(#goldGrad)"
      />
      {/* Cup Rim Highlight */}
      <Path
        d="M17 15C17 13.8954 17.8954 13 19 13H45C46.1046 13 47 13.8954 47 15C47 16.1046 46.1046 17 45 17H19C17.8954 17 17 16.1046 17 15Z"
        fill="#FEF08A"
      />
      {/* Cup center star emblem */}
      <Circle cx="32" cy="27" r="5" fill="#FEF08A" opacity={0.85} />
      <Path
        d="M32 23.5L33.3 26.2L36.2 26.5L34 28.5L34.7 31.4L32 29.8L29.3 31.4L30 28.5L27.8 26.5L30.7 26.2L32 23.5Z"
        fill="#D97706"
      />

      {/* Stem / Neck */}
      <Path d="M29 44H35V49H29V44Z" fill="url(#goldGrad)" />
      <Path d="M26 49H38V51H26V49Z" fill="#FDE047" />

      {/* Base */}
      <Rect x="23" y="51" width="18" height="4" rx="1.5" fill="#B45309" />
      <Rect x="20" y="54" width="24" height="6" rx="2" fill="url(#baseGrad)" />
      <Rect x="25" y="55.5" width="14" height="2" rx="1" fill="#FDE047" opacity={0.8} />

      {/* Sparkles */}
      <Path
        d="M12 11L13.2 13.8L16 15L13.2 16.2L12 19L10.8 16.2L8 15L10.8 13.8L12 11Z"
        fill="url(#starGrad)"
      />
      <Path
        d="M51 8L52 10.3L54.3 11.2L52 12.2L51 14.5L50 12.2L47.7 11.2L50 10.3L51 8Z"
        fill="url(#starGrad)"
      />
    </Svg>
  );
}

export default function UnlockBottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  type = 'series',
  price,
  originalPrice: propOriginalPrice,
  discountPercent: propDiscountPercent,
  seedKey,
  features,
  accessDuration = 'Complete Access Pass (1 Year)',
  onPay,
  loading = false,
}: UnlockBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [couponExpanded, setCouponExpanded] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  // Compute dynamic pricing (cut original price and discount percent)
  const pricing = calculateDynamicDiscount(price, seedKey || title);
  const finalRealPrice = pricing.realPrice;
  const finalOriginalPrice = propOriginalPrice || pricing.originalPrice;
  const finalDiscountPercent = propDiscountPercent || pricing.discountPercent;

  // Formatting display title: e.g. "Unlock Math Test Series Pro"
  const cleanTitle = title.replace(/\bPro\b/gi, '').trim();
  const modalHeading = `Unlock ${cleanTitle} Pro`;

  // Default subtitle per type matching screenshot spirit
  const modalSubtitle =
    subtitle ||
    (type === 'ebook'
      ? 'Get instant access to this full complete e-book with offline reading & updates'
      : type === 'pyq'
      ? 'Get instant access to complete solved previous year papers with explanations'
      : 'Get instant access to all 50+ SSC Graduate & Matric level mocks with detailed solutions');

  // Default features matching screenshot
  const featureList = features || [
    '100% Latest Exam Pattern',
    'Detailed Hindi/English Solutions',
    type === 'ebook'
      ? 'Full E-Book Unlocked Instantly'
      : type === 'pyq'
      ? 'All Solved Papers Unlocked Instantly'
      : 'All Locked Mocks Unlocked Instantly',
  ];

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      Alert.alert('Coupon Code', 'Please enter a coupon code.');
      return;
    }
    setCouponApplied(true);
    Alert.alert(
      'Coupon Applied',
      `Coupon "${couponCode.trim().toUpperCase()}" will be verified during checkout.`
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 16) + 10 }]}>
          {/* Top Drag Handle Bar */}
          <View style={styles.handleBar} />

          {/* Header Row: Trophy + Title/Subtitle */}
          <View style={styles.headerRow}>
            <View style={styles.trophyWrapper}>
              <TrophySvgIcon size={52} />
            </View>

            <View style={styles.headerTextCol}>
              <Text style={styles.modalHeading}>{modalHeading}</Text>
              <Text style={styles.modalSubtitle} numberOfLines={2}>
                {modalSubtitle}
              </Text>
            </View>
          </View>

          {/* Features Checkmarks */}
          <View style={styles.featuresContainer}>
            {featureList.map((item, index) => (
              <View key={index} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={19} color="#22C55E" />
                <Text style={styles.featureText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Pricing Card with Golden Border and BEST VALUE badge */}
          <View style={styles.pricingCard}>
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>BEST VALUE</Text>
            </View>

            <View style={styles.cardContentRow}>
              {/* Left Column: Pass duration & Strikethrough price */}
              <View style={styles.cardLeftCol}>
                <Text style={styles.accessPassTitle}>{accessDuration}</Text>
                <Text style={styles.strikethroughPrice}>₹{finalOriginalPrice}</Text>
              </View>

              {/* Right Column: Discount Tag & Real Bold Price */}
              <View style={styles.cardRightCol}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{finalDiscountPercent}% OFF</Text>
                </View>
                <Text style={styles.realPrice}>₹{finalRealPrice}</Text>
              </View>
            </View>
          </View>

          {/* Coupon Code Section */}
          {!couponExpanded && !couponApplied ? (
            <Pressable
              style={styles.couponBox}
              onPress={() => setCouponExpanded(true)}
              hitSlop={6}
            >
              <Text style={styles.couponPrompt}>
                Have a coupon code? <Text style={styles.couponApplyLink}>Apply</Text>
              </Text>
            </Pressable>
          ) : (
            <View style={styles.couponInputContainer}>
              <TextInput
                style={styles.couponInput}
                placeholder="ENTER COUPON CODE"
                placeholderTextColor="#94A3B8"
                value={couponCode}
                onChangeText={(text) => {
                  setCouponCode(text);
                  if (couponApplied) setCouponApplied(false);
                }}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Pressable
                style={[styles.couponApplyBtn, couponApplied && styles.couponApplyBtnActive]}
                onPress={handleApplyCoupon}
              >
                <Text style={styles.couponApplyBtnText}>
                  {couponApplied ? 'Applied ✓' : 'Apply'}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Pay Button with Gradient */}
          <Pressable
            style={[styles.payButtonWrapper, loading && { opacity: 0.8 }]}
            onPress={onPay}
            disabled={loading}
          >
            <LinearGradient
              colors={['#072A54', '#0E447E', '#185B9E', '#EAA510']}
              locations={[0, 0.45, 0.72, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.payGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.payBtnRow}>
                  <Text style={styles.payButtonText}>
                    PAY ₹{finalRealPrice} & UNLOCK NOW
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </View>
              )}
            </LinearGradient>
          </Pressable>

          {/* Security Footer Notice */}
          <View style={styles.footerRow}>
            <Ionicons name="lock-closed-outline" size={13} color="#475569" />
            <Text style={styles.footerText}>
              100% Secure Checkout | UPI, GPay, Cards
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    backgroundColor: '#FFFEFC',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  handleBar: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  trophyWrapper: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
    paddingTop: 2,
  },
  modalHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1E2B4C',
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 12.5,
    lineHeight: 17,
    color: '#475569',
    marginTop: 4,
    fontWeight: '400',
  },
  featuresContainer: {
    marginTop: 16,
    gap: 9,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  pricingCard: {
    marginTop: 20,
    backgroundColor: '#FFFDF0',
    borderWidth: 1.2,
    borderColor: '#FACC15',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: 'relative',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -11,
    alignSelf: 'center',
    backgroundColor: '#D97706',
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeftCol: {
    flex: 1,
    paddingRight: 8,
  },
  accessPassTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  strikethroughPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    textDecorationLine: 'line-through',
    marginTop: 4,
  },
  cardRightCol: {
    alignItems: 'flex-end',
  },
  discountBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  realPrice: {
    fontSize: 27,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  couponBox: {
    marginTop: 15,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  couponPrompt: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  couponApplyLink: {
    fontWeight: '700',
    color: '#1D4ED8',
  },
  couponInputContainer: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  couponApplyBtn: {
    height: 42,
    paddingHorizontal: 16,
    backgroundColor: '#0F3A7A',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponApplyBtnActive: {
    backgroundColor: '#16A34A',
  },
  couponApplyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  payButtonWrapper: {
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#0A3464',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  payGradient: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  payBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 5,
  },
  footerText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#475569',
  },
});
