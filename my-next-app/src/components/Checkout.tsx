import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('your-publishable-key-here');  // Thay thế với public key của bạn từ Stripe

const Checkout = () => {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const createPaymentIntent = async () => {
            const res = await fetch('http://localhost:1337/api/payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ amount: 5000 }), // Đoạn này sẽ gửi số tiền thanh toán (5 USD = 5000 cents)
            });
            const data = await res.json();
            setClientSecret(data.clientSecret);
        };

        createPaymentIntent();
    }, []);

    const handlePayment = async () => {
        if (!clientSecret) return;

        const stripe = await stripePromise;
        const { error, paymentIntent } = await stripe!.confirmCardPayment(clientSecret, {
            payment_method: {
                card: 'your-card-element',  // Thêm phần tử thẻ thẻ Stripe
                billing_details: {
                    name: 'Your Name',
                },
            },
        });

        if (error) {
            console.error(error);
            alert(error.message);
        } else if (paymentIntent?.status === 'succeeded') {
            alert('Payment successful!');
        }
    };

    return (
        <div>
            <h2>Checkout</h2>
            <button disabled={!clientSecret || loading} onClick={handlePayment}>
                Pay Now
            </button>
        </div>
    );
};

export default Checkout;
