const cloud = require("wx-server-sdk");
const crypto = require("crypto");
const https = require("https");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const API_BASE = "https://api.mch.weixin.qq.com";

function normalizeMultilineSecret(value) {
  return value ? value.replace(/\\n/g, "\n") : "";
}

function getConfig() {
  const config = {
    appid: process.env.WX_APP_ID,
    mchid: process.env.WX_MCH_ID,
    serialNo: process.env.WX_MCH_SERIAL_NO,
    privateKey: normalizeMultilineSecret(process.env.WX_MCH_PRIVATE_KEY),
    notifyUrl: process.env.WX_PAY_NOTIFY_URL,
    apiBase: process.env.WX_PAY_API_BASE || API_BASE
  };

  const missing = Object.keys(config).filter((key) => !config[key] && key !== "apiBase");
  if (missing.length > 0) {
    throw new Error(`Missing cloud env vars: ${missing.join(", ")}`);
  }

  return config;
}

function randomString(size = 16) {
  return crypto.randomBytes(size).toString("hex");
}

function signWithPrivateKey(message, privateKey) {
  return crypto.createSign("RSA-SHA256").update(message).sign(privateKey, "base64");
}

function buildAuthorization(method, pathWithQuery, bodyText, config) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonceStr = randomString(16);
  const message = `${method}\n${pathWithQuery}\n${timestamp}\n${nonceStr}\n${bodyText}\n`;
  const signature = signWithPrivateKey(message, config.privateKey);

  return `WECHATPAY2-SHA256-RSA2048 mchid="${config.mchid}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${config.serialNo}"`;
}

function requestWechatPay({ method, pathWithQuery, body, config }) {
  const url = new URL(pathWithQuery, config.apiBase);
  const bodyText = body ? JSON.stringify(body) : "";
  const authorization = buildAuthorization(method, `${url.pathname}${url.search}`, bodyText, config);

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: authorization
        }
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          let parsed = {};
          if (raw) {
            try {
              parsed = JSON.parse(raw);
            } catch (error) {
              parsed = {
                message: raw
              };
            }
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
            return;
          }

          reject(new Error(parsed.message || `WeChat Pay API failed with status ${res.statusCode}`));
        });
      }
    );

    req.on("error", (error) => reject(error));
    if (bodyText) {
      req.write(bodyText);
    }
    req.end();
  });
}

function buildMiniProgramPayment(prepayId, config) {
  const timeStamp = String(Math.floor(Date.now() / 1000));
  const nonceStr = randomString(16);
  const packageValue = `prepay_id=${prepayId}`;
  const paySignMessage = `${config.appid}\n${timeStamp}\n${nonceStr}\n${packageValue}\n`;

  return {
    timeStamp,
    nonceStr,
    package: packageValue,
    signType: "RSA",
    paySign: signWithPrivateKey(paySignMessage, config.privateKey)
  };
}

function createOutTradeNo() {
  return `snake_${Date.now()}_${randomString(4)}`;
}

async function createOrder(event) {
  const config = getConfig();
  const amountFen = Number(event.amountFen || 0);
  if (!Number.isInteger(amountFen) || amountFen <= 0) {
    throw new Error("amountFen must be a positive integer.");
  }

  const context = cloud.getWXContext();
  if (!context.OPENID) {
    throw new Error("Could not resolve the payer openid.");
  }

  const outTradeNo = createOutTradeNo();
  const response = await requestWechatPay({
    method: "POST",
    pathWithQuery: "/v3/pay/transactions/jsapi",
    config,
    body: {
      appid: config.appid,
      mchid: config.mchid,
      description: String(event.description || "Snake game support").slice(0, 127),
      out_trade_no: outTradeNo,
      notify_url: config.notifyUrl,
      amount: {
        total: amountFen,
        currency: "CNY"
      },
      payer: {
        openid: context.OPENID
      }
    }
  });

  if (!response.prepay_id) {
    throw new Error("WeChat Pay did not return prepay_id.");
  }

  return {
    outTradeNo,
    payment: buildMiniProgramPayment(response.prepay_id, config)
  };
}

async function queryOrder(event) {
  const config = getConfig();
  if (!event.outTradeNo) {
    throw new Error("outTradeNo is required.");
  }

  const response = await requestWechatPay({
    method: "GET",
    pathWithQuery: `/v3/pay/transactions/out-trade-no/${encodeURIComponent(event.outTradeNo)}?mchid=${encodeURIComponent(config.mchid)}`,
    config
  });

  return {
    outTradeNo: response.out_trade_no,
    tradeState: response.trade_state,
    amountFen: response.amount && response.amount.total
  };
}

exports.main = async (event) => {
  if (event.action === "create") {
    return createOrder(event);
  }

  if (event.action === "query") {
    return queryOrder(event);
  }

  throw new Error("Unsupported action. Use create or query.");
};
