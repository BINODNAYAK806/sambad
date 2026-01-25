const puppeteer = require('puppeteer-core');
console.log('Puppeteer exports:', Object.keys(puppeteer));

try {
  const BrowserFetcher = require('puppeteer-core/lib/cjs/puppeteer/node/BrowserFetcher.js').BrowserFetcher;
  console.log('BrowserFetcher loaded from direct path:', !!BrowserFetcher);
} catch (e) {
  console.log('Could not load BrowserFetcher from direct path:', e.message);
}
