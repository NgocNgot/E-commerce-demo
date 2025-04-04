module.exports = {
  routes: [
    {
      method: "POST",
      path: "/payments",
      handler: "payment.createPaymentIntent",
      config: {
        auth: false,
      },
    },
  ],
};
