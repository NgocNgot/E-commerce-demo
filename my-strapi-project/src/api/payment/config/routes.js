module.exports = {
  routes: [
    {
      method: "POST",
      path: "/payments/checkout",
      handler: "payment.checkout",
      config: {
        auth: false, // Không cần xác thực
      },
    },
  ],
};
