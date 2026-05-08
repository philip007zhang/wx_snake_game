const test = require('node:test');
const assert = require('node:assert/strict');

const payFunction = require('../cloudfunctions/pay/index.js');

test('createOrder returns requestPayment fields', () => {
  payFunction._test.reset();
  const result = payFunction._test.createOrder(
    { amount: 8.8, description: 'test donation' },
    'openid-1'
  );

  assert.ok(result.orderId.startsWith('ORDER_'));
  assert.equal(typeof result.payment.timeStamp, 'string');
  assert.equal(typeof result.payment.nonceStr, 'string');
  assert.ok(result.payment.package.startsWith('prepay_id='));
  assert.equal(result.payment.signType, 'MD5');
  assert.equal(typeof result.payment.paySign, 'string');
});

test('verifyOrder marks paid order', () => {
  payFunction._test.reset();
  const created = payFunction._test.createOrder({ amount: 1 }, 'openid-2');

  const verified = payFunction._test.verifyOrder({
    orderId: created.orderId,
    paid: true
  });

  assert.equal(verified.status, 'PAID');
  assert.equal(verified.orderId, created.orderId);
});

test('createOrder rejects invalid amount', () => {
  payFunction._test.reset();
  assert.throws(() => payFunction._test.createOrder({ amount: 0 }, 'openid-3'));
});
