const puppeteer = require('puppeteer-core');
console.log('Puppeteer exports:', Object.keys(puppeteer));

try {
    // Try to find BrowserFetcher in internal paths
    const BrowserFetcherPath = require.resolve('puppeteer-core/lib/cjs/puppeteer/node/BrowserFetcher.js');
    console.log('BrowserFetcher path found:', BrowserFetcherPath);

    const BrowserFetcherModule = require('puppeteer-core/lib/cjs/puppeteer/node/BrowserFetcher.js');
    console.log('BrowserFetcher module keys:', Object.keys(BrowserFetcherModule));
} catch (e) {
    console.log('Could not load BrowserFetcher from direct path:', e.message);
}
