module.exports = [
  {
    method: 'POST',
    path: '/payments',
    handler: 'payment-custom.createPaymentIntent',
    config: {
      auth: false,
    },
  },
];