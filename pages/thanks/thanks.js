const {
  LANGUAGE_OPTIONS,
  getLanguage,
  getPageText,
  setLanguage
} = require("../../utils/i18n");

function formatYuan(amountFen) {
  return (Number(amountFen || 0) / 100).toFixed(2);
}

Page({
  data: {
    amountYuan: "0.00",
    tradeNo: "",
    language: "en",
    languageOptions: LANGUAGE_OPTIONS,
    commonText: {},
    text: {}
  },

  onLoad(options) {
    this.amountFen = options.amountFen;
    this.tradeNo = options.tradeNo || "";
    this.language = getLanguage();
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
    const locale = getPageText(this.language, "thanks");
    const app = getApp();
    app.globalData.language = this.language;

    wx.setNavigationBarTitle({
      title: locale.page.navTitle
    });

    this.setData({
      amountYuan: formatYuan(this.amountFen),
      tradeNo: this.tradeNo,
      language: this.language,
      languageOptions: LANGUAGE_OPTIONS,
      commonText: locale.common,
      text: locale.page
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

  playAgain() {
    wx.reLaunch({
      url: "/pages/index/index"
    });
  }
});
