"use strict";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = {
  async checkout(ctx) {
    try {
      const { cart } = ctx.request.body;

      if (!cart || cart.length === 0) {
        return ctx.badRequest("Cart is empty");
      }

      const lineItems = cart.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.title,
            images: [item.image],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      }));

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/cart`,
      });

      return { url: session.url };
    } catch (error) {
      console.error("Stripe checkout error:", error);
      return ctx.badRequest("Error processing payment");
    }
  },
};
