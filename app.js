const { getLanguage } = require("./utils/i18n");

App({
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        traceUser: true
      });
    }

    this.globalData.language = getLanguage();
  },
  globalData: {
    appName: "Snake Support",
    language: "en"
  }
});
