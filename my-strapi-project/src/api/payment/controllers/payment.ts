import { factories } from "@strapi/strapi";
import Stripe from "stripe";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2022-11-15",
});

export default factories.createCoreController(
  "api::payment.payment",
  ({ strapi }) => ({
    async create(ctx) {
      try {
        const { amount, paymentMethodId, ...rest } = ctx.request.body.data;

        if (!amount || !paymentMethodId) {
          return ctx.badRequest(
            "Missing required parameters (amount, paymentMethodId) for payment processing."
          );
        }

        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount * 100,
          currency: "usd",
          payment_method: paymentMethodId,
          confirm: true,
          return_url: "http://localhost:3000/payment-success",
        });
        console.log("PaymentIntent created:", paymentIntent);

        if (paymentIntent.status !== "succeeded") {
          return ctx.badRequest({
            success: false,
            message: "Payment failed",
            paymentIntent,
          });
        }

        // Payment succeeded, create a new entry in the database
        const entry = await strapi.entityService.create(
          "api::payment.payment",
          {
            data: {
              ...rest,
              amount: amount,
              paymentMethodId: paymentMethodId,
              paymentIntentId: paymentIntent.id,
              statusPayment: "Succeeded", // Update statusPayment to "Succeeded"
            },
          }
        );

        ctx.send({ success: true, paymentIntent, data: entry });
      } catch (error) {
        console.error("Stripe error during create:", error);
        return ctx.badRequest("Payment error during create", {
          message: error.message,
        });
      }
    },
  })
);
