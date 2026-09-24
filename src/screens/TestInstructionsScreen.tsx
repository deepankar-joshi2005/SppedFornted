import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RazorpayCheckoutModal from '../components/RazorpayCheckoutModal';
import { Nav } from '../navigation/types';
import { CoachingOnlyError, TestSeriesPaidError, startAttempt } from '../services/attempts.service';
import { getTestInstructions, TestInstructions } from '../services/tests.service';
import {
  createRazorpayOrder,
  RazorpayOrderResponse,
  verifyRazorpayPayment,
} from '../services/purchases.service';
import { CARD_SHADOW, ERROR, GOLD, GOLD_TINT, MUTED, NAVY, SOFT_SHADOW } from '../theme/colors';

type Props = {
  token: string;
  testId: string;
  nav: Nav;
};

type Language = 'Hindi' | 'English';
type Step = 'language' | 'instructions' | 'symbols';

// ─── Bilingual text helper ────────────────────────────────────────────────────
const bi = (en: string, hi: string, lang: Language) => (lang === 'Hindi' ? hi : en);

// ─── Instructions content ─────────────────────────────────────────────────────
const getInstructionsContent = (data: TestInstructions, lang: Language) => ({
  timing: [
    bi(
      `Total duration: ${data.durationMinutes} minutes. The timer starts as soon as you begin.`,
      `कुल समय: ${data.durationMinutes} मिनट। परीक्षा शुरू होते ही टाइमर शुरू हो जाएगा।`,
      lang
    ),
    bi(
      data.subjectSections && data.subjectSections.length > 1
        ? `Each section has a separate timer. Once a section's time ends, you cannot revisit it.`
        : `The timer (top right) is server-controlled; you cannot pause it.`,
      data.subjectSections && data.subjectSections.length > 1
        ? `प्रत्येक सेक्शन के लिए अलग-अलग टाइमर है। सेक्शन का समय समाप्त होने पर वापस नहीं जा सकते।`
        : `टाइमर (ऊपर दाईं ओर) सर्वर द्वारा नियंत्रित है; इसे रोका नहीं जा सकता।`,
      lang
    ),
    bi(
      'Your answers are auto-saved. Submit only when you are completely done.',
      'आपके उत्तर स्वतः सहेजे जाते हैं। परीक्षा पूरी तरह समाप्त होने पर ही Submit करें।',
      lang
    ),
  ],
  language: [
    bi(
      'This test will be displayed in the language you selected.',
      'यह परीक्षा आपके द्वारा चुनी गई भाषा में प्रदर्शित होगी।',
      lang
    ),
    bi(
      'You can change the language for individual questions during the test.',
      'परीक्षा के दौरान आप प्रत्येक प्रश्न के लिए भाषा बदल सकते हैं।',
      lang
    ),
  ],
  navigation: [
    bi(
      'Use the question palette to jump to any question directly.',
      'प्रश्न पैलेट का उपयोग करके सीधे किसी भी प्रश्न पर जा सकते हैं।',
      lang
    ),
    bi(
      'You can mark questions for review and return to them before submitting.',
      'आप प्रश्नों को review के लिए mark कर सकते हैं और submit से पहले वापस आ सकते हैं।',
      lang
    ),
    bi(
      'Click "Next" to move to the next question and "Previous" to go back.',
      '"Next" दबाएं अगले प्रश्न पर जाने के लिए और "Previous" दबाएं पिछले प्रश्न पर जाने के लिए।',
      lang
    ),
  ],
  answering: [
    bi(
      `Each correct answer: +${data.marksPerQuestion ?? (data.totalMarks / data.totalQuestions).toFixed(2)} mark(s).`,
      `प्रत्येक सही उत्तर: +${data.marksPerQuestion ?? (data.totalMarks / data.totalQuestions).toFixed(2)} अंक।`,
      lang
    ),
    data.negativeMarks > 0
      ? bi(
          `Wrong answer: -${data.negativeMarks} mark(s) will be deducted (Negative Marking).`,
          `गलत उत्तर: -${data.negativeMarks} अंक काटे जाएंगे (नकारात्मक अंकन)।`,
          lang
        )
      : bi(
          'No negative marking in this test.',
          'इस परीक्षा में कोई नकारात्मक अंकन नहीं है।',
          lang
        ),
    bi(
      'Skipped/unanswered questions carry zero marks.',
      'छोड़े गए / अनुत्तरित प्रश्नों के लिए शून्य अंक मिलेंगे।',
      lang
    ),
    bi(
      'Click on your selected option again to deselect it.',
      'चयनित विकल्प पर पुनः क्लिक करके उसे हटाया जा सकता है।',
      lang
    ),
  ],
  additional: [
    bi(
      'Do not close or minimize the app during the exam — your attempt may be lost.',
      'परीक्षा के दौरान ऐप बंद या minimize न करें — आपका प्रयास खो सकता है।',
      lang
    ),
    bi(
      'Ensure a stable internet connection throughout the test.',
      'परीक्षा के दौरान स्थिर इंटरनेट कनेक्शन सुनिश्चित करें।',
      lang
    ),
    bi(
      'In case of a technical issue, contact the exam coordinator immediately.',
      'तकनीकी समस्या होने पर तुरंत परीक्षा समन्वयक से संपर्क करें।',
      lang
    ),
  ],
});

const getSymbolsContent = (lang: Language) => [
  {
    symbol: 'ellipse-outline',
    color: '#777',
    label: bi('Option Not Chosen', 'विकल्प नहीं चुना गया', lang),
  },
  {
    symbol: 'checkmark-circle',
    color: '#2E9E5B',
    label: bi(
      'Option chosen as correct. Click again to deselect.',
      'विकल्प सही के रूप में चुना गया। पुनः क्लिक करके हटाएं।',
      lang
    ),
  },
  {
    symbol: 'square',
    color: NAVY,
    label: bi(
      'Blue number: Question not yet attempted.',
      'नीला नंबर: प्रश्न अभी तक प्रयास नहीं किया गया।',
      lang
    ),
    bg: NAVY,
    num: '0',
  },
  {
    symbol: 'square',
    color: '#2E9E5B',
    label: bi(
      'Green number: Question answered.',
      'हरा नंबर: प्रश्न का उत्तर दिया जा चुका है।',
      lang
    ),
    bg: '#2E9E5B',
    num: '4',
  },
  {
    symbol: 'square',
    color: '#B45309',
    label: bi(
      'Orange number: Question marked for review.',
      'नारंगी नंबर: प्रश्न review के लिए mark किया गया।',
      lang
    ),
    bg: '#B45309',
    num: '7',
  },
  {
    symbol: 'square',
    color: '#888',
    label: bi(
      'Grey number: Question skipped/not visited.',
      'धूसर नंबर: प्रश्न छोड़ा गया / नहीं देखा गया।',
      lang
    ),
    bg: '#888',
    num: '12',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function TestInstructionsScreen({ token, testId, nav }: Props) {
  const [data, setData] = useState<TestInstructions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState<Step>('language');
  const [language, setLanguage] = useState<Language>('Hindi');
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [buying, setBuying] = useState(false);
  const [payModalInfo, setPayModalInfo] = useState({
    visible: false,
    seriesId: '',
    price: 0,
    isCoachingStudent: false,
  });

  // Razorpay Checkout Modal State
  const [razorpayOrder, setRazorpayOrder] = useState<RazorpayOrderResponse | null>(null);
  const [razorpayVisible, setRazorpayVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const result = await getTestInstructions(token, testId);
        setData(result);
        // Set default language based on what admin configured
        if (result.language === 'English') setLanguage('English');
        else setLanguage('Hindi');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load instructions.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, testId]);

  const handleBegin = async () => {
    setStarting(true);
    setError('');
    try {
      const result = await startAttempt(token, testId);
      nav.push({ name: 'testTaking', attemptId: result.attemptId, testId, language });
    } catch (err) {
      if (err instanceof CoachingOnlyError) {
        Alert.alert('Coaching Students Only', err.message);
      } else if (err instanceof TestSeriesPaidError) {
        setPayModalInfo({
          visible: true,
          seriesId: err.seriesId,
          price: err.price,
          isCoachingStudent: err.isCoachingStudent,
        });
      } else {
        setError(err instanceof Error ? err.message : 'Failed to start test.');
      }
    } finally {
      setStarting(false);
    }
  };

  const handleBuy = async () => {
    setBuying(true);
    try {
      const order = await createRazorpayOrder(token, payModalInfo.seriesId);
      setRazorpayOrder(order);
      setPayModalInfo((prev) => ({ ...prev, visible: false }));
      setRazorpayVisible(true);
    } catch (err) {
      Alert.alert(
        'Could Not Start Payment',
        err instanceof Error ? err.message : 'Could not start payment. Please try again.'
      );
    } finally {
      setBuying(false);
    }
  };

  const handleRazorpaySuccess = async (paymentData: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => {
    setRazorpayVisible(false);
    setStarting(true);
    try {
      await verifyRazorpayPayment(token, {
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_signature: paymentData.razorpay_signature,
        testSeriesId: payModalInfo.seriesId,
      });
      Alert.alert('Unlocked! 🎉', 'Test Series unlocked successfully! Starting test...');
      handleBegin();
    } catch (err) {
      Alert.alert('Verification Error', 'Payment verification failed. Please contact support if amount was deducted.');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={NAVY} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable
          style={styles.iconBtn}
          onPress={step === 'language' ? nav.pop : () => setStep(step === 'symbols' ? 'instructions' : 'language')}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {data?.title ?? 'Test'}
        </Text>
        <Pressable
          style={styles.iconBtn}
          hitSlop={8}
          onPress={() => nav.push({ name: 'notifications' })}
        >
          <Ionicons name="notifications-outline" size={20} color={NAVY} />
        </Pressable>
      </View>

      {/* Step Indicator */}
      <StepIndicator step={step} />

      {/* Content */}
      {step === 'language' && data && (
        <LanguageStep
          data={data}
          language={language}
          onSelect={setLanguage}
          onNext={() => setStep('instructions')}
        />
      )}

      {step === 'instructions' && data && (
        <InstructionsStep
          data={data}
          language={language}
          onBack={() => setStep('language')}
          onNext={() => setStep('symbols')}
        />
      )}

      {step === 'symbols' && data && (
        <SymbolsStep
          language={language}
          agreed={agreed}
          setAgreed={setAgreed}
          starting={starting}
          error={error}
          onBack={() => setStep('instructions')}
          onBegin={handleBegin}
        />
      )}

      <Modal visible={payModalInfo.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.purchaseCard}>
            <View style={styles.lockIconWrap}>
              <Ionicons name="lock-closed" size={28} color="#D97706" />
            </View>
            <Text style={styles.purchaseTitle}>Test Series Locked</Text>
            <Text style={styles.purchaseSub}>
              This test is part of a Paid Test Series. Unlock now to get unlimited access to all tests.
            </Text>

            {payModalInfo.isCoachingStudent && (
              <View style={styles.coachingPill}>
                <Ionicons name="school" size={14} color="#2E9E5B" />
                <Text style={styles.coachingPillText}>Coaching Student Discount Applied!</Text>
              </View>
            )}

            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Total Price</Text>
              <Text style={styles.priceValue}>₹{payModalInfo.price}</Text>
            </View>

            <Pressable style={styles.buyConfirmBtn} onPress={handleBuy} disabled={buying}>
              {buying ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buyConfirmBtnText}>Pay & Unlock Now (₹{payModalInfo.price})</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.cancelBuyBtn}
              onPress={() => setPayModalInfo({ visible: false, seriesId: '', price: 0, isCoachingStudent: false })}
              disabled={buying}
            >
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
          Alert.alert('Payment Failed', errMsg);
        }}
      />
    </SafeAreaView>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: Step }) {
  const steps: Step[] = ['language', 'instructions', 'symbols'];
  const labels = ['Language', 'Instructions', 'Symbols'];
  const current = steps.indexOf(step);
  return (
    <View style={styles.stepRow}>
      {steps.map((s, i) => (
        <View key={s} style={styles.stepItem}>
          <View style={[styles.stepDot, i <= current && styles.stepDotActive]}>
            {i < current ? (
              <Ionicons name="checkmark" size={11} color="#fff" />
            ) : (
              <Text style={styles.stepDotText}>{i + 1}</Text>
            )}
          </View>
          <Text style={[styles.stepLabel, i <= current && styles.stepLabelActive]}>
            {labels[i]}
          </Text>
          {i < steps.length - 1 && (
            <View style={[styles.stepLine, i < current && styles.stepLineActive]} />
          )}
        </View>
      ))}
    </View>
  );
}

// ─── Step 1: Language Selection ───────────────────────────────────────────────
function LanguageStep({
  data,
  language,
  onSelect,
  onNext,
}: {
  data: TestInstructions;
  language: Language;
  onSelect: (l: Language) => void;
  onNext: () => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Test Mode Card */}
        <View style={styles.modeCard}>
          <Text style={styles.modeCardTitle}>{data.title}</Text>
          <Text style={styles.modeCardMeta}>
            {data.totalQuestions} Questions • {data.durationMinutes} Min •{' '}
            {data.totalMarks} Marks
          </Text>
          {data.negativeMarks > 0 && (
            <View style={styles.negBadge}>
              <Ionicons name="alert-circle" size={12} color="#B45309" />
              <Text style={styles.negBadgeText}>
                Negative Marking: -{data.negativeMarks} per wrong answer
              </Text>
            </View>
          )}
        </View>

        {/* Language Heading */}
        <Text style={styles.langHeading}>Choose Language / भाषा चुनें</Text>
        <Text style={styles.langSubtitle}>
          Select the language in which you want to attempt this test.
          {'\n'}जिस भाषा में परीक्षा देना चाहते हैं उसे चुनें।
        </Text>

        {/* Language Options */}
        <View style={styles.langOptions}>
          {(['English', 'Hindi'] as Language[]).map((lang) => (
            <Pressable
              key={lang}
              style={[styles.langCard, language === lang && styles.langCardActive]}
              onPress={() => onSelect(lang)}
            >
              <View style={styles.langCardLeft}>
                <View style={[styles.radioOuter, language === lang && styles.radioOuterActive]}>
                  {language === lang && <View style={styles.radioInner} />}
                </View>
                <View>
                  <Text style={[styles.langCardName, language === lang && styles.langCardNameActive]}>
                    {lang === 'English' ? 'English' : 'हिंदी (Hindi)'}
                  </Text>
                  <Text style={styles.langCardDesc}>
                    {lang === 'English'
                      ? 'Questions in English'
                      : 'प्रश्न हिंदी में'}
                  </Text>
                </View>
              </View>
              {language === lang && (
                <Ionicons name="checkmark-circle" size={22} color={NAVY} />
              )}
            </Pressable>
          ))}
        </View>

        <View style={styles.langNote}>
          <Ionicons name="information-circle-outline" size={15} color={MUTED} />
          <Text style={styles.langNoteText}>
            You can change language for individual questions during the test.
            {'\n'}परीक्षा के दौरान प्रत्येक प्रश्न के लिए भाषा बदली जा सकती है।
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.nextBtn} onPress={onNext}>
          <Text style={styles.nextBtnText}>Next: Instructions →</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Step 2: Instructions ─────────────────────────────────────────────────────
function InstructionsStep({
  data,
  language,
  onBack,
  onNext,
}: {
  data: TestInstructions;
  language: Language;
  onBack: () => void;
  onNext: () => void;
}) {
  const content = getInstructionsContent(data, language);
  const bi = (en: string, hi: string) => (language === 'Hindi' ? hi : en);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Stats Summary */}
        <View style={styles.statsGrid}>
          <StatBox
            label={bi('Duration', 'समय')}
            value={`${data.durationMinutes} ${bi('Min', 'मिनट')}`}
            icon="time-outline"
          />
          <StatBox
            label={bi('Total Marks', 'कुल अंक')}
            value={`${data.totalMarks}`}
            icon="ribbon-outline"
          />
          <StatBox
            label={bi('Questions', 'प्रश्न')}
            value={`${data.totalQuestions}`}
            icon="help-circle-outline"
          />
          <StatBox
            label={bi('Negative Marks', 'नकारात्मक अंक')}
            value={data.negativeMarks > 0 ? `-${data.negativeMarks}` : bi('None', 'नहीं')}
            icon="remove-circle-outline"
            valueColor={data.negativeMarks > 0 ? ERROR : '#2E9E5B'}
          />
        </View>

        {/* Sections Table */}
        {data.subjectSections && data.subjectSections.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={styles.instrSectionTitle}>
              {bi('Sections Overview', 'सेक्शन विवरण')}
            </Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 0.7 }]}>
                  {bi('Section', 'सेक्शन')}
                </Text>
                <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 2 }]}>
                  {bi('Subject', 'विषय')}
                </Text>
                <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 0.8 }]}>
                  {bi('Qs', 'प्रश्न')}
                </Text>
                <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 0.8 }]}>
                  {bi('Marks', 'अंक')}
                </Text>
              </View>
              {data.subjectSections.map((sec, idx) => {
                const count = sec.endNo - sec.startNo + 1;
                const marksPerQ = data.totalMarks / data.totalQuestions;
                const sectionMarks = Math.round(count * marksPerQ);
                return (
                  <View
                    key={idx}
                    style={[styles.tableRow, idx % 2 === 0 && styles.tableRowEven]}
                  >
                    <Text style={[styles.tableCell, styles.tableCellText, { flex: 0.7 }]}>
                      {sec.name}
                    </Text>
                    <Text style={[styles.tableCell, styles.tableCellText, { flex: 2 }]}>
                      {sec.subject}
                    </Text>
                    <Text style={[styles.tableCell, styles.tableCellText, { flex: 0.8 }]}>
                      {count}
                    </Text>
                    <Text style={[styles.tableCell, styles.tableCellText, { flex: 0.8 }]}>
                      {sectionMarks}
                    </Text>
                  </View>
                );
              })}
              <View style={[styles.tableRow, styles.tableFooterRow]}>
                <Text style={[styles.tableCell, styles.tableFooterText, { flex: 0.7 }]}>
                  {bi('Total', 'कुल')}
                </Text>
                <Text style={[styles.tableCell, { flex: 2 }]} />
                <Text style={[styles.tableCell, styles.tableFooterText, { flex: 0.8 }]}>
                  {data.totalQuestions}
                </Text>
                <Text style={[styles.tableCell, styles.tableFooterText, { flex: 0.8 }]}>
                  {data.totalMarks}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 1. Timing */}
        <InstructionSection
          number="1"
          title={bi('Timing & Submission', 'समय और उत्तर जमा करना')}
          subTitle={bi('Timing & Submission / समय और उत्तर जमा करना', '')}
          items={content.timing}
        />

        {/* 2. Language */}
        <InstructionSection
          number="2"
          title={bi('Language', 'भाषा')}
          subTitle=""
          items={content.language}
        />

        {/* 3. Navigation */}
        <InstructionSection
          number="3"
          title={bi('Navigation', 'नेविगेशन')}
          subTitle=""
          items={content.navigation}
        />

        {/* 4. Answering */}
        <InstructionSection
          number="4"
          title={bi('Answering & Marking', 'उत्तर और अंकन')}
          subTitle=""
          items={content.answering}
        />

        {/* 5. Additional */}
        <InstructionSection
          number="5"
          title={bi('Additional Notes', 'अतिरिक्त जानकारी')}
          subTitle=""
          items={content.additional}
        />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Pressable style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>← Back</Text>
          </Pressable>
          <Pressable style={[styles.nextBtn, { flex: 1 }]} onPress={onNext}>
            <Text style={styles.nextBtnText}>Next: Symbols →</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Step 3: Symbol Legend ────────────────────────────────────────────────────
function SymbolsStep({
  language,
  agreed,
  setAgreed,
  starting,
  error,
  onBack,
  onBegin,
}: {
  language: Language;
  agreed: boolean;
  setAgreed: (v: boolean) => void;
  starting: boolean;
  error: string;
  onBack: () => void;
  onBegin: () => void;
}) {
  const symbols = getSymbolsContent(language);
  const bi = (en: string, hi: string) => (language === 'Hindi' ? hi : en);

  return (
    <View style={{ flex: 1 }}>
      {/* Dark header info box */}
      <View style={styles.symbolHeaderBox}>
        <Ionicons name="information-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.symbolHeaderText}>
          {bi(
            'The symbols used in the exam pages are shown below. Please go through them before you start.',
            'परीक्षा के पृष्ठों में उपयोग होने वाले चिन्ह नीचे दिए गए हैं। शुरू करने से पहले इन्हें ध्यान से पढ़ें।'
          )}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Symbol Table */}
        <View style={styles.symbolTable}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 0.7, textAlign: 'center' }]}>
              {bi('Symbol', 'चिन्ह')}
            </Text>
            <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 2.3 }]}>
              {bi('Description', 'विवरण')}
            </Text>
          </View>

          {symbols.map((item, idx) => (
            <View
              key={idx}
              style={[styles.tableRow, idx % 2 === 0 && styles.tableRowEven, { alignItems: 'center' }]}
            >
              <View style={[styles.tableCell, { flex: 0.7, alignItems: 'center' }]}>
                {item.num !== undefined ? (
                  <View style={[styles.numBox, { backgroundColor: item.bg }]}>
                    <Text style={styles.numBoxText}>{item.num}</Text>
                  </View>
                ) : (
                  <Ionicons name={item.symbol as any} size={22} color={item.color} />
                )}
              </View>
              <Text style={[styles.tableCell, styles.tableCellText, { flex: 2.3, lineHeight: 18 }]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Language note */}
        <View style={styles.langSelectNote}>
          <Text style={styles.langSelectNoteTitle}>
            {bi('Your selected language: ', 'आपकी चुनी हुई भाषा: ')}
            <Text style={{ color: NAVY, fontWeight: '800' }}>{language === 'Hindi' ? 'हिंदी' : 'English'}</Text>
          </Text>
          <Text style={styles.langSelectNoteBody}>
            {bi(
              'All questions will appear in your selected language. You can change the language for individual questions during the test.',
              'सभी प्रश्न आपकी चुनी हुई भाषा में दिखेंगे। परीक्षा के दौरान आप प्रत्येक प्रश्न के लिए भाषा बदल सकते हैं।'
            )}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {!!error && <Text style={styles.errorTextSmall}>{error}</Text>}

        {/* Agree checkbox */}
        <Pressable style={styles.agreeRow} onPress={() => setAgreed(!agreed)}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Ionicons name="checkmark" size={13} color="#fff" />}
          </View>
          <Text style={styles.agreeText}>
            {bi(
              'I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I declare that I am not in possession of / not wearing any prohibited gadget like mobile phone, bluetooth devices etc.',
              'मैंने निर्देश पढ़ लिए हैं और समझ लिए हैं। मुझे दिया गया सभी कंप्यूटर हार्डवेयर सही स्थिति में है। मैं घोषणा करता/करती हूं कि मेरे पास कोई प्रतिबंधित गैजेट जैसे मोबाइल फोन, ब्लूटूथ डिवाइस आदि नहीं है।'
            )}
          </Text>
        </Pressable>

        <View style={styles.footerRow}>
          <Pressable style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>← Previous</Text>
          </Pressable>
          <Pressable
            style={[styles.beginBtn, (!agreed || starting) && styles.beginBtnDisabled, { flex: 1 }]}
            onPress={onBegin}
            disabled={!agreed || starting}
          >
            {starting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.beginBtnText}>
                {bi('I am ready to begin', 'मैं तैयार हूं')}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatBox({
  label,
  value,
  icon,
  valueColor,
}: {
  label: string;
  value: string;
  icon: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon as any} size={18} color={GOLD} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

function InstructionSection({
  number,
  title,
  subTitle,
  items,
}: {
  number: string;
  title: string;
  subTitle: string;
  items: string[];
}) {
  return (
    <View style={styles.instrSection}>
      <View style={styles.instrSectionHeader}>
        <View style={styles.instrNumBadge}>
          <Text style={styles.instrNumText}>{number}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.instrSectionTitle}>{title}</Text>
          {!!subTitle && <Text style={styles.instrSectionSubTitle}>{subTitle}</Text>}
        </View>
      </View>
      {items.map((item, idx) => (
        <View key={idx} style={styles.instrItem}>
          <View style={styles.instrBullet} />
          <Text style={styles.instrItemText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ERROR_COLOR = '#C0392B';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    color: NAVY,
  },

  // Step indicator
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EDEBE4',
  },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: NAVY },
  stepDotText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  stepLabel: { fontSize: 10.5, color: MUTED, marginLeft: 5, fontWeight: '600' },
  stepLabelActive: { color: NAVY },
  stepLine: { width: 28, height: 2, backgroundColor: '#D1D5DB', marginHorizontal: 5 },
  stepLineActive: { backgroundColor: NAVY },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorBox: { margin: 20, padding: 16, borderRadius: 12, backgroundColor: '#FBEAE8' },
  errorText: { color: ERROR_COLOR, fontSize: 13, textAlign: 'center' },
  errorTextSmall: { color: ERROR_COLOR, fontSize: 12, textAlign: 'center', marginBottom: 8 },

  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },

  // ── Language Step ──
  modeCard: {
    backgroundColor: NAVY,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    ...CARD_SHADOW,
  },
  modeCardTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  modeCardMeta: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  negBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    alignSelf: 'flex-start',
  },
  negBadgeText: { fontSize: 11, fontWeight: '700', color: '#B45309' },

  langHeading: { fontSize: 16, fontWeight: '800', color: NAVY, marginBottom: 4 },
  langSubtitle: { fontSize: 12, color: MUTED, lineHeight: 18, marginBottom: 14 },
  langOptions: { gap: 12, marginBottom: 16 },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EDEBE4',
    padding: 14,
    ...SOFT_SHADOW,
  },
  langCardActive: { borderColor: NAVY, backgroundColor: '#EEF2FA' },
  langCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: { borderColor: NAVY },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: NAVY },
  langCardName: { fontSize: 14, fontWeight: '700', color: '#334155' },
  langCardNameActive: { color: NAVY },
  langCardDesc: { fontSize: 11.5, color: MUTED, marginTop: 2 },
  langNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#F0F4FF',
    borderRadius: 10,
    padding: 10,
  },
  langNoteText: { flex: 1, fontSize: 11.5, color: MUTED, lineHeight: 17 },

  // ── Instructions Step ──
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    gap: 4,
    ...SOFT_SHADOW,
  },
  statLabel: { fontSize: 11, color: MUTED },
  statValue: { fontSize: 16, fontWeight: '800', color: NAVY },

  sectionBlock: { marginBottom: 16 },

  table: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDBD4',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 6 },
  tableRowEven: { backgroundColor: '#F9F8F4' },
  tableHeader: { backgroundColor: '#2B4170' },
  tableFooterRow: { backgroundColor: '#EEF1F7', borderTopWidth: 1, borderTopColor: '#DDDBD4' },
  tableCell: { fontSize: 12, paddingHorizontal: 4 },
  tableHeaderText: { color: '#fff', fontWeight: '700', fontSize: 11.5 },
  tableCellText: { color: '#334155' },
  tableFooterText: { fontWeight: '800', color: NAVY },

  instrSection: {
    marginBottom: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    ...SOFT_SHADOW,
  },
  instrSectionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  instrNumBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  instrNumText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  instrSectionTitle: { fontSize: 13.5, fontWeight: '800', color: NAVY, flex: 1 },
  instrSectionSubTitle: { fontSize: 11, color: MUTED, marginTop: 2 },
  instrItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  instrBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GOLD,
    marginTop: 6,
    flexShrink: 0,
  },
  instrItemText: { flex: 1, fontSize: 12.5, color: '#334155', lineHeight: 18 },

  // ── Symbols Step ──
  symbolHeaderBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#2B3E6B',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 0,
  },
  symbolHeaderText: { flex: 1, fontSize: 12.5, color: '#fff', lineHeight: 18 },
  symbolTable: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDBD4',
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 14,
  },
  numBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numBoxText: { fontSize: 12, fontWeight: '800', color: '#fff' },

  langSelectNote: {
    backgroundColor: '#EEF2FA',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C7D4F0',
    marginBottom: 8,
  },
  langSelectNoteTitle: { fontSize: 12.5, color: '#334155', marginBottom: 4 },
  langSelectNoteBody: { fontSize: 12, color: MUTED, lineHeight: 17 },

  // ── Footer / Shared ──
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#EDEBE4',
    backgroundColor: '#fff',
  },
  footerRow: { flexDirection: 'row', gap: 10 },
  nextBtn: {
    backgroundColor: NAVY,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 13.5 },
  backBtn: {
    borderWidth: 1.5,
    borderColor: NAVY,
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  backBtnText: { color: NAVY, fontWeight: '700', fontSize: 13 },
  beginBtn: {
    backgroundColor: '#2E9E5B',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },
  beginBtnDisabled: { opacity: 0.45 },
  beginBtnText: { color: '#fff', fontWeight: '700', fontSize: 13.5 },

  agreeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  agreeText: { flex: 1, fontSize: 11.5, color: '#334155', lineHeight: 17 },
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
