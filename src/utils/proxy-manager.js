/**
 * Proxy Manager
 * Handles proxy rotation and management for scraping
 */

const config = require('../config/config');
const { scraperLogger } = require('./logger');

class ProxyManager {
  constructor() {
    this.proxies = this.initializeProxies();
    this.currentIndex = 0;
    this.failedProxies = new Set();
  }

  initializeProxies() {
    const proxies = [];

    if (config.proxies.brightData) {
      proxies.push({
        name: 'BrightData',
        url: config.proxies.brightData,
        type: 'rotating',
      });
    }

    if (config.proxies.oxylabs) {
      proxies.push({
        name: 'Oxylabs',
        url: config.proxies.oxylabs,
        type: 'rotating',
      });
    }

    if (config.proxies.smartProxy) {
      proxies.push({
        name: 'SmartProxy',
        url: config.proxies.smartProxy,
        type: 'rotating',
      });
    }

    scraperLogger.info(`Initialized ${proxies.length} proxy services`);
    return proxies;
  }

  getNextProxy() {
    if (this.proxies.length === 0) {
      scraperLogger.warn('No proxies configured, returning null');
      return null;
    }

    // Get next proxy in rotation
    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;

    scraperLogger.debug(`Using proxy: ${proxy.name}`);
    return proxy;
  }

  markProxyFailed(proxyName) {
    this.failedProxies.add(proxyName);
    scraperLogger.warn(`Proxy marked as failed: ${proxyName}`);
  }

  resetFailedProxies() {
    this.failedProxies.clear();
    scraperLogger.info('Reset failed proxies list');
  }

  getWorkingProxies() {
    return this.proxies.filter(p => !this.failedProxies.has(p.name));
  }

  // For Puppeteer/Playwright
  getPuppeteerProxyConfig(proxy) {
    if (!proxy) return {};

    return {
      server: proxy.url,
    };
  }

  // For Axios
  getAxiosProxyConfig(proxy) {
    if (!proxy) return {};

    const url = new URL(proxy.url);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 80,
      auth: url.username && url.password ? {
        username: url.username,
        password: url.password,
      } : undefined,
      protocol: url.protocol.replace(':', ''),
    };
  }
}

module.exports = new ProxyManager();
