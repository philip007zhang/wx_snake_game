function formatYuan(amountFen) {
  return (Number(amountFen || 0) / 100).toFixed(2);
}

Page({
  data: {
    amountYuan: "0.00",
    tradeNo: ""
  },

  onLoad(options) {
    this.setData({
      amountYuan: formatYuan(options.amountFen),
      tradeNo: options.tradeNo || ""
    });
  },

  playAgain() {
    wx.reLaunch({
      url: "/pages/index/index"
    });
  }
});
