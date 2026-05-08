const {
  LANGUAGE_OPTIONS,
  formatText,
  getLanguage,
  getPageText,
  setLanguage
} = require("../../utils/i18n");

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
    summaryText: "",
    customAmountYuan: "",
    selectedAmountFen: 1800,
    language: "en",
    languageOptions: LANGUAGE_OPTIONS,
    commonText: {},
    text: {},
    tiers: []
  },

  onLoad(options) {
    this.language = getLanguage();
    this.setData({
      score: Number(options.score || 0)
    });
    this.applyLanguage();
  },

  onShow() {
    const latestLanguage = getLanguage();
    if (latestLanguage !== this.language) {
      this.language = latestLanguage;
      this.applyLanguage();
    }
  },

  applyLanguage() {
    const locale = getPageText(this.language, "support");
    const commonText = locale.common;
    const text = locale.page;
    const app = getApp();
    app.globalData.language = this.language;

    wx.setNavigationBarTitle({
      title: text.navTitle
    });

    this.setData({
      language: this.language,
      languageOptions: LANGUAGE_OPTIONS,
      commonText,
      text,
      summaryText: formatText(text.summary, { score: this.data.score || 0 }),
      tiers: [
        { label: text.smallThanks, amountFen: 600, amountYuan: "6.00", description: text.smallThanksDesc },
        { label: text.snackTier, amountFen: 1800, amountYuan: "18.00", description: text.snackTierDesc },
        { label: text.champion, amountFen: 5000, amountYuan: "50.00", description: text.championDesc },
        { label: text.legend, amountFen: 8800, amountYuan: "88.00", description: text.legendDesc }
      ]
    });
  },

  switchLanguage(event) {
    const nextLanguage = event.currentTarget.dataset.language;
    if (!nextLanguage || nextLanguage === this.language) {
      return;
    }

    this.language = setLanguage(nextLanguage);
    this.applyLanguage();
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
    const text = this.data.text;

    if (amountFen <= 0) {
      wx.showToast({
        title: text.invalidAmount,
        icon: "none"
      });
      return;
    }

    if (!wx.cloud) {
      wx.showToast({
        title: text.cloudUnavailable,
        icon: "none"
      });
      return;
    }

    this.setData({
      busy: true,
      statusNote: text.createOrder
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
        throw new Error(payload.message || text.paymentNotReturned);
      }

      await this.requestPayment(payload.payment);

      this.setData({
        statusNote: text.verifyPayment
      });

      const verified = await this.verifyPayment(payload.outTradeNo, amountFen);
      if (!verified) {
        wx.showToast({
          title: text.pendingToast,
          icon: "none"
        });
        this.setData({
          statusNote: text.pendingNote
        });
        return;
      }

      wx.redirectTo({
        url: `/pages/thanks/thanks?amountFen=${amountFen}&tradeNo=${payload.outTradeNo}`
      });
    } catch (error) {
      const message = error && error.message ? error.message : text.paymentFailed;
      if (message !== "PAYMENT_CANCELLED") {
        wx.showToast({
          title: message,
          icon: "none"
        });
      }

      this.setData({
        statusNote: message === "PAYMENT_CANCELLED" ? text.cancelled : message
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

          reject(new Error(this.data.text.paymentIncomplete));
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
