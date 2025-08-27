const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'https://api-test.qiwi.com/partner/payout/',
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },
});