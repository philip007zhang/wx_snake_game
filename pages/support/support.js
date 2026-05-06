function toFen(amountText) {
  if (!amountText) {
    return 0;
  }

  const normalized = String(amountText).trim();
  if (!normalized) {
    return 0;
  }

  const value = Number(normalized);
  if (Number.isNaN(value) || value <= 0) {
    return 0;
  }

  return Math.round(value * 100);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Page({
  data: {
    score: 0,
    busy: false,
    statusNote: "",
    customAmountYuan: "",
    selectedAmountFen: 1800,
    tiers: [
      { label: "Small Thank You", amountFen: 600, amountYuan: "6.00", description: "Buy the game a coffee." },
      { label: "Snack Tier", amountFen: 1800, amountYuan: "18.00", description: "A bigger show of support." },
      { label: "Champion", amountFen: 5000, amountYuan: "50.00", description: "Back future updates." },
      { label: "Legend", amountFen: 8800, amountYuan: "88.00", description: "Maximum visible support." }
    ]
  },

  onLoad(options) {
    this.setData({
      score: Number(options.score || 0)
    });
  },

  selectTier(event) {
    this.setData({
      selectedAmountFen: Number(event.currentTarget.dataset.amount || 0),
      customAmountYuan: "",
      statusNote: ""
    });
  },

  handleCustomAmountInput(event) {
    const value = event.detail.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
    this.setData({
      customAmountYuan: value,
      selectedAmountFen: 0,
      statusNote: ""
    });
  },

  async donateNow() {
    const amountFen = this.getSelectedAmountFen();
    if (amountFen <= 0) {
      wx.showToast({
        title: "Enter a valid amount",
        icon: "none"
      });
      return;
    }

    if (!wx.cloud) {
      wx.showToast({
        title: "Cloud not available",
        icon: "none"
      });
      return;
    }

    this.setData({
      busy: true,
      statusNote: "Creating a WeChat Pay order..."
    });

    try {
      const orderResult = await wx.cloud.callFunction({
        name: "donationPay",
        data: {
          action: "create",
          amountFen,
          description: "Snake game support"
        }
      });

      const payload = orderResult.result || {};
      if (!payload.payment || !payload.outTradeNo) {
        throw new Error(payload.message || "Payment parameters were not returned.");
      }

      await this.requestPayment(payload.payment);

      this.setData({
        statusNote: "Verifying payment status..."
      });

      const verified = await this.verifyPayment(payload.outTradeNo, amountFen);
      if (!verified) {
        wx.showToast({
          title: "Payment pending",
          icon: "none"
        });
        this.setData({
          statusNote: "Payment is still pending. Check the merchant order status."
        });
        return;
      }

      wx.redirectTo({
        url: `/pages/thanks/thanks?amountFen=${amountFen}&tradeNo=${payload.outTradeNo}`
      });
    } catch (error) {
      const message = error && error.message ? error.message : "Payment failed";
      if (message !== "PAYMENT_CANCELLED") {
        wx.showToast({
          title: message,
          icon: "none"
        });
      }

      this.setData({
        statusNote:
          message === "PAYMENT_CANCELLED"
            ? "Payment was cancelled."
            : message
      });
    } finally {
      this.setData({
        busy: false
      });
    }
  },

  getSelectedAmountFen() {
    if (this.data.customAmountYuan) {
      return toFen(this.data.customAmountYuan);
    }

    return Number(this.data.selectedAmountFen || 0);
  },

  requestPayment(payment) {
    return new Promise((resolve, reject) => {
      wx.requestPayment({
        timeStamp: payment.timeStamp,
        nonceStr: payment.nonceStr,
        package: payment.package,
        signType: payment.signType,
        paySign: payment.paySign,
        success: resolve,
        fail: (error) => {
          if (error && error.errMsg && error.errMsg.includes("cancel")) {
            reject(new Error("PAYMENT_CANCELLED"));
            return;
          }

          reject(new Error("WeChat Pay did not complete."));
        }
      });
    });
  },

  async verifyPayment(outTradeNo, amountFen) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const result = await wx.cloud.callFunction({
        name: "donationPay",
        data: {
          action: "query",
          outTradeNo
        }
      });

      const payload = result.result || {};
      if (
        payload.tradeState === "SUCCESS" &&
        Number(payload.amountFen || 0) === amountFen
      ) {
        return true;
      }

      await sleep(1200);
    }

    return false;
  }
});
