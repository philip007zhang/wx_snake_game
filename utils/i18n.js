const DEFAULT_LANGUAGE = "en";
const LANGUAGE_OPTIONS = [
  { code: "en", label: "EN" },
  { code: "zh", label: "中文" }
];

const translations = {
  en: {
    common: {
      language: "Language",
      supportBannerTitle: "Support this mini-program",
      supportBannerText: "Open the donation page to test WeChat Pay support tiers and custom amounts.",
      currency: "¥"
    },
    index: {
      navTitle: "Snake Support",
      level: "Level",
      diamonds: "Diamonds",
      score: "Score",
      best: "Best",
      state: "State",
      rules: "Rules",
      barriers: "Barriers",
      entry: "Entry",
      wraparound: "Wraparound",
      wallsStones: "Walls + Stones",
      ready: "Ready",
      paused: "Paused",
      live: "Live",
      gameOver: "Game Over",
      start: "Start",
      pause: "Pause",
      resume: "Resume",
      restart: "Restart",
      reset: "Reset",
      donate: "Donate",
      up: "up",
      left: "left",
      right: "right",
      down: "down",
      popupEntry: "Entry level has no walls. Cross any edge and loop back in.",
      idleHint: "Tap Start when you're ready.",
      pausedHint: "Paused. Tap Start to continue this level.",
      entryRunningHint: "Entry level is active. Use the edges to wrap around.",
      levelRunningHint: "Level {level} is live. Avoid {count} barrier{suffix}.",
      barrierSuffixPlural: "s",
      crashBarrier: "You hit a barrier. Reset and try again.",
      crashGeneric: "You crashed. Reset and try again.",
      diamondProgressEntry: "{current}/{target} diamonds cleared for Entry.",
      diamondProgressLevel: "{current}/{target} diamonds cleared for Level {level}.",
      entryCleared: "Entry cleared",
      levelCleared: "Level {level} clear",
      nextLevelHint: "Level {level} begins. The snake restarts, and {count} barrier{suffix} appear.",
      ok: "OK"
    },
    support: {
      navTitle: "Support The Game",
      title: "Support The Game",
      summary: "Send a WeChat Pay donation from inside the Mini Program. Your best score today: {score}.",
      pickTier: "Pick a support tier",
      customAmount: "Or enter a custom amount",
      amountPlaceholder: "For example 12.88",
      amountHelp: "Amounts are in CNY and converted to fen before payment.",
      nextTitle: "What happens next",
      step1: "1. The cloud function creates a WeChat Pay order.",
      step2: "2. The Mini Program calls wx.requestPayment.",
      step3: "3. The app verifies the order status with the merchant API.",
      donateNow: "Donate with WeChat Pay",
      preparing: "Preparing payment...",
      createOrder: "Creating a WeChat Pay order...",
      verifyPayment: "Verifying payment status...",
      pendingToast: "Payment pending",
      pendingNote: "Payment is still pending. Check the merchant order status.",
      cancelled: "Payment was cancelled.",
      invalidAmount: "Enter a valid amount",
      cloudUnavailable: "Cloud not available",
      paymentNotReturned: "Payment parameters were not returned.",
      paymentFailed: "Payment failed",
      paymentIncomplete: "WeChat Pay did not complete.",
      smallThanks: "Small Thank You",
      smallThanksDesc: "Buy the game a coffee.",
      snackTier: "Snack Tier",
      snackTierDesc: "A bigger show of support.",
      champion: "Champion",
      championDesc: "Back future updates.",
      legend: "Legend",
      legendDesc: "Maximum visible support."
    },
    thanks: {
      navTitle: "Thank You",
      title: "Thank you",
      copy: "Your support helps keep this WeChat Mini Program improving.",
      amount: "Amount",
      order: "Order",
      back: "Back To Game"
    }
  },
  zh: {
    common: {
      language: "语言",
      supportBannerTitle: "支持这个小程序",
      supportBannerText: "打开赞助页面，使用微信支付测试固定档位或自定义金额。",
      currency: "¥"
    },
    index: {
      navTitle: "贪吃蛇赞助版",
      level: "关卡",
      diamonds: "钻石",
      score: "分数",
      best: "最高分",
      state: "状态",
      rules: "规则",
      barriers: "障碍",
      entry: "入门",
      wraparound: "穿墙循环",
      wallsStones: "边墙和石块",
      ready: "准备",
      paused: "已暂停",
      live: "进行中",
      gameOver: "游戏结束",
      start: "开始",
      pause: "暂停",
      resume: "继续",
      restart: "重开",
      reset: "重置",
      donate: "赞助",
      up: "上",
      left: "左",
      right: "右",
      down: "下",
      popupEntry: "入门关没有墙，蛇穿过任意边缘后会从另一侧回来。",
      idleHint: "准备好后点击开始。",
      pausedHint: "已暂停，点击开始继续当前关卡。",
      entryRunningHint: "入门关进行中，可以利用边缘穿越循环。",
      levelRunningHint: "第{level}关进行中，注意避开{count}个障碍。",
      barrierSuffixPlural: "",
      crashBarrier: "你撞到障碍了，请重置后再试。",
      crashGeneric: "你撞到了，请重置后再试。",
      diamondProgressEntry: "入门关已收集 {current}/{target} 颗钻石。",
      diamondProgressLevel: "第{level}关已收集 {current}/{target} 颗钻石。",
      entryCleared: "入门关完成",
      levelCleared: "第{level}关通过",
      nextLevelHint: "第{level}关开始，蛇会重置，同时出现{count}个障碍。",
      ok: "确定"
    },
    support: {
      navTitle: "支持游戏",
      title: "支持游戏",
      summary: "你可以在小程序内直接使用微信支付赞助。你今天的最高分是：{score}。",
      pickTier: "选择一个支持档位",
      customAmount: "或输入自定义金额",
      amountPlaceholder: "例如 12.88",
      amountHelp: "金额单位为人民币元，支付前会自动转换为分。",
      nextTitle: "接下来会发生什么",
      step1: "1. 云函数先创建微信支付订单。",
      step2: "2. 小程序调用 wx.requestPayment。",
      step3: "3. 应用再向商户接口确认订单状态。",
      donateNow: "使用微信支付赞助",
      preparing: "正在准备支付...",
      createOrder: "正在创建微信支付订单...",
      verifyPayment: "正在确认支付状态...",
      pendingToast: "支付结果待确认",
      pendingNote: "支付状态仍在处理中，请稍后到商户订单里查看。",
      cancelled: "已取消支付。",
      invalidAmount: "请输入有效金额",
      cloudUnavailable: "云能力不可用",
      paymentNotReturned: "没有拿到支付参数。",
      paymentFailed: "支付失败",
      paymentIncomplete: "微信支付未完成。",
      smallThanks: "小额支持",
      smallThanksDesc: "请游戏喝杯咖啡。",
      snackTier: "加餐支持",
      snackTierDesc: "表达更多一点支持。",
      champion: "冠军支持",
      championDesc: "帮助推进后续更新。",
      legend: "传奇支持",
      legendDesc: "给予最高可见支持。"
    },
    thanks: {
      navTitle: "感谢支持",
      title: "感谢支持",
      copy: "你的支持会帮助这个微信小程序继续改进。",
      amount: "金额",
      order: "订单号",
      back: "返回游戏"
    }
  }
};

function getLanguage() {
  try {
    const stored = wx.getStorageSync("app-language");
    if (stored === "en" || stored === "zh") {
      return stored;
    }
  } catch (error) {
    return DEFAULT_LANGUAGE;
  }

  return DEFAULT_LANGUAGE;
}

function setLanguage(language) {
  const nextLanguage = language === "zh" ? "zh" : "en";
  wx.setStorageSync("app-language", nextLanguage);
  return nextLanguage;
}

function getPageText(language, pageName) {
  const locale = translations[language] || translations[DEFAULT_LANGUAGE];
  return {
    common: locale.common,
    page: locale[pageName]
  };
}

function formatText(template, replacements = {}) {
  return Object.keys(replacements).reduce(
    (result, key) => result.replace(new RegExp(`\\{${key}\\}`, "g"), String(replacements[key])),
    template
  );
}

module.exports = {
  DEFAULT_LANGUAGE,
  LANGUAGE_OPTIONS,
  formatText,
  getLanguage,
  getPageText,
  setLanguage
};
