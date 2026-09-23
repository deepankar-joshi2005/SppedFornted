/**
 * Loads Razorpay's Checkout.js from their CDN inside WebView and opens
 * the standard payment sheet for a test series order on Expo / React Native.
 */
export const buildCheckoutHtml = (params: {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
}): string => {
  // Safely inject values to avoid JS injection issues
  const keyId = JSON.stringify(params.keyId);
  const orderId = JSON.stringify(params.orderId);
  const amount = JSON.stringify(String(params.amount));
  const currency = JSON.stringify(params.currency);
  const name = JSON.stringify(params.name);
  const description = JSON.stringify(params.description);

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
<style>
  html, body { margin: 0; padding: 0; background: #F5F4EF; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  #status { color: #5B6577; text-align: center; padding: 90px 24px 24px; font-size: 15px; font-weight: 500; }
  #errBox { display:none; color:#C0392B; text-align:center; padding: 40px 24px; font-size:14px; }
</style>
</head>
<body>
<div id="status">Opening secure payment screen…</div>
<div id="errBox"></div>
<script>
  function post(msg) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    } catch(e) {}
  }

  function showError(msg) {
    document.getElementById('status').style.display = 'none';
    var eb = document.getElementById('errBox');
    eb.style.display = 'block';
    eb.textContent = msg;
    post({ type: 'error', message: msg });
  }

  function loadRazorpay() {
    var script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = function() {
      try {
        var options = {
          key: ${keyId},
          order_id: ${orderId},
          amount: ${amount},
          currency: ${currency},
          name: ${name},
          description: ${description},
          theme: { color: '#16315C' },
          handler: function(response) {
            post({
              type: 'success',
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: function() {
              post({ type: 'cancelled' });
            },
          },
        };
        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function(resp) {
          var msg = (resp.error && resp.error.description) || 'Payment failed. Please try again.';
          post({ type: 'failed', message: msg });
        });
        rzp.open();
      } catch(e) {
        showError('Payment error: ' + e.message);
      }
    };
    script.onerror = function() {
      showError('Could not load payment page. Please check your internet connection and try again.');
    };
    document.body.appendChild(script);
  }

  // Small delay to ensure WebView bridge is ready
  setTimeout(loadRazorpay, 300);
</script>
</body>
</html>`;
};
