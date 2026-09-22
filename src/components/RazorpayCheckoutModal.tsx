import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import WebView from 'react-native-webview';
import { RazorpayOrderResponse } from '../services/purchases.service';
import { NAVY } from '../theme/colors';
import { buildCheckoutHtml } from '../utils/razorpayCheckout';

type Props = {
  visible: boolean;
  orderData: RazorpayOrderResponse | null;
  onSuccess: (data: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onCancel: () => void;
  onError: (errorMessage: string) => void;
};

export default function RazorpayCheckoutModal({
  visible,
  orderData,
  onSuccess,
  onCancel,
  onError,
}: Props) {
  if (!orderData) return null;

  const html = buildCheckoutHtml({
    keyId: orderData.keyId,
    orderId: orderData.orderId,
    amount: orderData.amount,
    currency: orderData.currency,
    name: 'Speed Education',
    description: orderData.title,
  });

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'success') {
        onSuccess({
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_order_id: data.razorpay_order_id,
          razorpay_signature: data.razorpay_signature,
        });
      } else if (data.type === 'cancelled') {
        onCancel();
      } else if (data.type === 'failed' || data.type === 'error') {
        onError(data.message || 'Razorpay payment was not completed.');
      }
    } catch (e) {
      onError('Payment processing error.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Razorpay Secure Payment</Text>
          <Pressable style={styles.closeBtn} onPress={onCancel}>
            <Ionicons name="close" size={24} color="#FFF" />
          </Pressable>
        </View>

        <WebView
          originWhitelist={['*']}
          source={{ html }}
          onMessage={handleMessage}
          style={{ flex: 1 }}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={NAVY} />
              <Text style={styles.loadingText}>Opening Razorpay Payment Checkout...</Text>
            </View>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4EF',
  },
  header: {
    height: 56,
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F4EF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: NAVY,
  },
});
