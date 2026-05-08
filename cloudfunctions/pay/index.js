let cloud;
const crypto = require('node:crypto');
try {
  cloud = require('wx-server-sdk');
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
} catch (error) {
  cloud = {
    getWXContext: () => ({ OPENID: 'local-openid' })
  };
}

const orders = new Map();

function randomToken() {
  return crypto.randomBytes(8).toString('hex');
}

function createOrder(event, openid) {
  const amount = Number(event.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Invalid amount');
  }

  const orderId = `ORDER_${Date.now()}_${randomToken()}`;
  const order = {
    orderId,
    openid,
    amount,
    description: event.description || 'Donation',
    status: 'CREATED',
    createdAt: new Date().toISOString()
  };
  orders.set(orderId, order);

  return {
    orderId,
    payment: {
      timeStamp: `${Math.floor(Date.now() / 1000)}`,
      nonceStr: randomToken(),
      package: `prepay_id=${orderId}`,
      signType: 'MD5',
      paySign: randomToken()
    }
  };
}

function verifyOrder(event) {
  const order = orders.get(event.orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  order.status = event.paid ? 'PAID' : 'FAILED';
  order.verifiedAt = new Date().toISOString();

  return {
    orderId: order.orderId,
    status: order.status,
    amount: order.amount,
    openid: order.openid
  };
}

async function main(event = {}) {
  const { OPENID } = cloud.getWXContext();

  if (event.action === 'createOrder') {
    return createOrder(event, OPENID);
  }

  if (event.action === 'verifyOrder') {
    return verifyOrder(event);
  }

  throw new Error('Unsupported action');
}

module.exports = {
  main,
  _test: {
    createOrder,
    verifyOrder,
    orders,
    reset: () => orders.clear()
  }
};
