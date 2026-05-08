Page({
  data: {
    amount: '1',
    loading: false
  },

  onAmountInput(e) {
    this.setData({ amount: e.detail.value });
  },

  async donate() {
    const amount = Number(this.data.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      wx.showToast({ title: 'Please enter a valid amount', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      const createRes = await wx.cloud.callFunction({
        name: 'pay',
        data: {
          action: 'createOrder',
          amount,
          description: 'Support wx_snake_game'
        }
      });

      const { orderId, payment } = createRes.result || {};
      if (!orderId || !payment) {
        throw new Error('Invalid createOrder response');
      }

      await wx.requestPayment(payment);

      await wx.cloud.callFunction({
        name: 'pay',
        data: {
          action: 'verifyOrder',
          orderId,
          paid: true
        }
      });

      wx.showToast({ title: 'Thanks for your support!', icon: 'success' });
    } catch (error) {
      wx.showToast({
        title: error && error.errMsg ? error.errMsg : 'Payment failed',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  }
});
