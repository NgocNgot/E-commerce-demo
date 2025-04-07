const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

module.exports = {
  async createPaymentIntent(ctx) {
    console.log('createPaymentIntent called');

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      return_url: 'http://localhost:3000/payment-success',
    });

    if (paymentIntent.status !== 'succeeded') {
      return ctx.badRequest({ success: false, message: 'Payment failed', paymentIntent });
    }
  },
};