// Injects the Razorpay Checkout script once, and exposes a promise-based opener.
let scriptPromise = null;

function loadRazorpayScript() {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'));
    document.body.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Opens Razorpay Checkout and resolves with the payment response on success.
 * Rejects if the script fails to load or the user dismisses the modal.
 */
export async function openRazorpayCheckout({ orderId, amount, currency, keyId, patientName, description }) {
  await loadRazorpayScript();
  if (!window.Razorpay) {
    throw new Error('Razorpay Checkout could not be loaded. Please try again.');
  }
  if (!keyId) {
    throw new Error('Razorpay is not configured. Add valid TEST keys to the backend.');
  }

  return new Promise((resolve, reject) => {
    const options = {
      key: keyId,
      amount,
      currency,
      name: 'Patient Management System',
      description: description || 'Bill Payment',
      order_id: orderId,
      prefill: { name: patientName },
      theme: { color: '#2563eb' },
      handler: (response) => {
        // response: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
        resolve(response);
      },
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      reject(new Error(response.error?.description || 'Payment failed'));
    });
    rzp.open();
  });
}
