# WeChat Mini Program Snake Game With Donations

This project is a WeChat Mini Program scaffold that includes:

- A playable snake game inside WeChat
- A donation page that calls `wx.requestPayment`
- A cloud function that creates and verifies WeChat Pay orders
- English and Chinese language switching in the UI

## Requirements for real donations

WeChat Pay for Mini Programs is not front-end only. You need:

1. A verified WeChat Mini Program AppID
2. A WeChat Pay merchant account
3. JSAPI payment permission enabled for the merchant
4. The merchant bound to the Mini Program AppID
5. Cloud Functions enabled in the WeChat Mini Program project

According to the official WeChat Pay docs, Mini Program payments use `wx.requestPayment` on the client, and your server side must create the order first and return payment parameters. The merchant docs also state that Mini Program payments share the JSAPI payment permission and require the Mini Program AppID to be bound to the merchant account.

Relevant official docs:

- [WeChat Pay Mini Program access guide](https://pay.wechatpay.cn/static/applyment_guide/applyment_detail_miniapp.shtml)
- [JSAPI or Mini Program order creation API](https://pay.wechatpay.cn/doc/v3/merchant/4012791856)
- [JSAPI payment permission for Mini Program payments](https://pay.wechatpay.cn/doc/v3/merchant/4012791895)
- [Mini Program payment flow guide](https://pay.wechatpay.cn/doc/v2/merchant/4011938514)

## Project structure

```text
.
|-- app.js
|-- app.json
|-- app.wxss
|-- sitemap.json
|-- project.config.json
|-- pages
|   |-- index
|   |-- support
|   `-- thanks
|-- utils
|   `-- i18n.js
`-- cloudfunctions
    `-- donationPay
```

## Open in WeChat DevTools

1. Open WeChat DevTools
2. Import `D:\Projects\wx_snake_game`
3. Replace the placeholder `appid` in `project.config.json` with your Mini Program AppID when ready to test
4. Enable Cloud Development for the project
5. Upload and deploy the `donationPay` cloud function

## Configure payment secrets

The cloud function reads payment settings from environment variables:

- `WX_APP_ID`
- `WX_MCH_ID`
- `WX_MCH_SERIAL_NO`
- `WX_MCH_PRIVATE_KEY`
- `WX_PAY_NOTIFY_URL`

Notes:

- `WX_MCH_PRIVATE_KEY` should be the merchant API certificate private key text. If your platform stores newlines as `\n`, this project normalizes them.
- `WX_PAY_NOTIFY_URL` should point to your payment notification endpoint. For production, add real payment notification handling and persistent order storage.

## Donation compliance note

This scaffold implements a support or tip style payment flow technically. Whether a pure donation model is approved for your account depends on your registered entity, industry category, and WeChat review rules. Before launch, confirm that your Mini Program content, merchant category, and payment use case match your approved business scope.

## Deployment checklist

1. Replace `touristappid` in `project.config.json`
2. Bind the merchant account to the same Mini Program AppID
3. Ensure JSAPI payment permission is enabled
4. Configure the cloud function environment variables
5. Deploy the cloud function from WeChat DevTools
6. Test payment in a real WeChat environment with a bound merchant account
