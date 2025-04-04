import Stripe from "stripe";
// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const paymentIntent = await stripe.paymentIntents.create({
  amount: 11 * 100,
  currency: "USD",
  payment_method: paymentMethodId,
  users_permissions_user: users_permissions_user,
  order: { id: orderId },  // Save relation to order
  confirm: true,
  return_url: "https://stripe.dicom-interactive.com/payment-success",
});

if (paymentIntent.status !== "succeeded") {
  return res.status(400).json({ success: false, message: "Payment failed", paymentIntent });
}