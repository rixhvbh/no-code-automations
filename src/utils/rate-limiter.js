/**
 * Rate Limiter using Bottleneck
 * Ensures we don't overwhelm APIs or get blocked
 */

const Bottleneck = require('bottleneck');
const config = require('../config/config');

// Scraper rate limiter - general scraping
const scraperLimiter = new Bottleneck({
  maxConcurrent: config.scraper.maxConcurrent,
  minTime: config.scraper.rateLimitMs,
  reservoir: 100, // Max requests
  reservoirRefreshAmount: 100,
  reservoirRefreshInterval: 60 * 1000, // per minute
});

// API rate limiters for different services

// Hunter.io - 50 requests per month on free plan
const hunterLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 2000, // 2 seconds between requests
  reservoir: 50,
  reservoirRefreshAmount: 50,
  reservoirRefreshInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
});

// Apollo.io - 100 requests per day on free plan
const apolloLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 1000,
  reservoir: 100,
  reservoirRefreshAmount: 100,
  reservoirRefreshInterval: 24 * 60 * 60 * 1000, // 24 hours
});

// ZeroBounce - depends on plan, using conservative limits
const zeroBounce Limiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 500,
  reservoir: 1000,
  reservoirRefreshAmount: 1000,
  reservoirRefreshInterval: 60 * 60 * 1000, // 1 hour
});

// Proxycurl - 10 requests per minute on free plan
const proxycurlLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 6000, // 6 seconds
  reservoir: 10,
  reservoirRefreshAmount: 10,
  reservoirRefreshInterval: 60 * 1000, // 1 minute
});

// Twilio Lookup - 1000 requests per hour
const twilioLimiter = new Bottleneck({
  maxConcurrent: 5,
  minTime: 100,
  reservoir: 1000,
  reservoirRefreshAmount: 1000,
  reservoirRefreshInterval: 60 * 60 * 1000, // 1 hour
});

// Google Sheets API - 100 requests per 100 seconds per user
const googleSheetsLimiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 1000,
  reservoir: 100,
  reservoirRefreshAmount: 100,
  reservoirRefreshInterval: 100 * 1000, // 100 seconds
});

// LinkedIn (aggressive rate limiting to avoid blocks)
const linkedInLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 5000, // 5 seconds between requests
  reservoir: 20,
  reservoirRefreshAmount: 20,
  reservoirRefreshInterval: 60 * 60 * 1000, // 1 hour
});

module.exports = {
  scraperLimiter,
  hunterLimiter,
  apolloLimiter,
  zeroBounceLimiter,
  proxycurlLimiter,
  twilioLimiter,
  googleSheetsLimiter,
  linkedInLimiter,
};
