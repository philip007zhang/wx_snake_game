# wx_snake_game

WeChat Mini Program scaffold including:

- A playable snake game page (`/miniprogram/pages/snake`)
- A donation page that calls `wx.requestPayment` (`/miniprogram/pages/donate`)
- A cloud function that creates and verifies WeChat Pay orders (`/cloudfunctions/pay`)

## Test

```bash
node --test test/pay.function.test.js
```
