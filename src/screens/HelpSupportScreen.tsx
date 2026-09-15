import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../components/PrimaryButton';
import { Nav } from '../navigation/types';
import { createTicket, getTickets, SupportTicket } from '../services/support.service';
import { ERROR, GOLD, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  nav: Nav;
};

const FAQS = [
  {
    q: 'How is my score calculated?',
    a: 'Each correct answer earns marks and each incorrect answer applies negative marking, as shown on the test instructions screen. Skipped questions are neither rewarded nor penalized.',
  },
  {
    q: 'Can I resume a test I started earlier?',
    a: 'Yes. Tests you have started but not submitted appear as "In Progress" in the test list and under Continue Test on your Home screen — tap Resume to pick up where you left off.',
  },
  {
    q: 'How is my rank on the leaderboard determined?',
    a: 'Ranks are calculated by comparing your score against everyone who has completed that same test, sorted from highest to lowest score.',
  },
  {
    q: 'How do I change my registered email or mobile number?',
    a: 'Go to Profile > Edit Profile to update your name, email, or mobile number at any time.',
  },
];

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function HelpSupportScreen({ token, nav }: Props) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);

  useEffect(() => {
    getTickets(token)
      .then(setTickets)
      .catch(() => setTickets([]));
  }, [token]);

  const handleSubmit = async () => {
    setFormError('');
    setSuccessMsg('');
    if (!subject.trim() || !message.trim()) {
      setFormError('Please fill in both the subject and your message.');
      return;
    }
    setSubmitting(true);
    try {
      const ticket = await createTicket(token, { subject: subject.trim(), message: message.trim() });
      setTickets((prev) => [ticket, ...(prev ?? [])]);
      setSubject('');
      setMessage('');
      setSuccessMsg('Your request has been submitted. Our team will get back to you soon.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit your request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {FAQS.map((faq, idx) => {
          const isOpen = expandedFaq === idx;
          return (
            <Pressable
              key={idx}
              style={styles.faqCard}
              onPress={() => setExpandedFaq(isOpen ? null : idx)}
            >
              <View style={styles.faqHeaderRow}>
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={MUTED}
                />
              </View>
              {isOpen && <Text style={styles.faqAnswer}>{faq.a}</Text>}
            </Pressable>
          );
        })}

        <Text style={styles.sectionTitle}>Contact Support</Text>
        <View style={styles.formCard}>
          {!!formError && <Text style={styles.errorText}>{formError}</Text>}
          {!!successMsg && <Text style={styles.successText}>{successMsg}</Text>}

          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            placeholder="What do you need help with?"
            placeholderTextColor="#9AA3B2"
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Describe your issue in detail..."
            placeholderTextColor="#9AA3B2"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <PrimaryButton label="SUBMIT REQUEST" onPress={handleSubmit} loading={submitting} />
        </View>

        {tickets === null ? (
          <ActivityIndicator color={NAVY} size="small" style={{ marginTop: 20 }} />
        ) : tickets.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Your Requests</Text>
            {tickets.map((t) => (
              <View style={styles.ticketCard} key={t.id}>
                <View style={styles.ticketTopRow}>
                  <Text style={styles.ticketSubject} numberOfLines={1}>
                    {t.subject}
                  </Text>
                  <View style={[styles.statusPill, t.status === 'resolved' && styles.statusPillResolved]}>
                    <Text
                      style={[
                        styles.statusPillText,
                        t.status === 'resolved' && styles.statusPillTextResolved,
                      ]}
                    >
                      {t.status === 'resolved' ? 'Resolved' : 'Open'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.ticketMessage} numberOfLines={2}>
                  {t.message}
                </Text>
                <Text style={styles.ticketDate}>{formatDate(t.createdAt)}</Text>
              </View>
            ))}
          </>
        ) : null}
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
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: NAVY,
    marginTop: 18,
    marginBottom: 12,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    marginBottom: 10,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: NAVY,
  },
  faqAnswer: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
    marginTop: 10,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  errorText: {
    color: ERROR,
    fontSize: 12.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  successText: {
    color: '#2E9E5B',
    fontSize: 12.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: MUTED,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.4,
    borderColor: '#E7E5DE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13.5,
    color: NAVY,
    marginBottom: 14,
  },
  textarea: {
    height: 110,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    marginBottom: 10,
  },
  ticketTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  ticketSubject: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: NAVY,
  },
  statusPill: {
    backgroundColor: '#FDF1DC',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statusPillResolved: {
    backgroundColor: '#E4F5EA',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: GOLD,
  },
  statusPillTextResolved: {
    color: '#2E9E5B',
  },
  ticketMessage: {
    fontSize: 12,
    color: '#334155',
    marginTop: 6,
  },
  ticketDate: {
    fontSize: 10.5,
    color: MUTED,
    marginTop: 8,
  },
});
