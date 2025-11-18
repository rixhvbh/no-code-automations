/**
 * IBOVI System Configuration
 * Centralizes all environment variables and configuration
 */

require('dotenv').config();

module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
    redis: process.env.REDIS_URL || 'redis://localhost:6379',
    dynamodb: {
      region: process.env.DYNAMODB_REGION || 'us-east-1',
    },
  },

  // AWS Configuration
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.DYNAMODB_REGION || 'us-east-1',
  },

  // Proxy Configuration
  proxies: {
    brightData: process.env.BRIGHTDATA_PROXY_URL,
    oxylabs: process.env.OXYLABS_PROXY_URL,
    smartProxy: process.env.SMARTPROXY_PROXY_URL,
  },

  // CAPTCHA Services
  captcha: {
    twoCaptcha: process.env.TWOCAPTCHA_API_KEY,
    antiCaptcha: process.env.ANTICAPTCHA_API_KEY,
  },

  // Scraper Configuration
  scraper: {
    maxConcurrent: parseInt(process.env.SCRAPER_MAX_CONCURRENT) || 5,
    rateLimitMs: parseInt(process.env.SCRAPER_RATE_LIMIT_MS) || 2000,
    maxRetries: parseInt(process.env.SCRAPER_MAX_RETRIES) || 3,
    timeout: 30000, // 30 seconds
    userAgents: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ],
  },

  // Enrichment APIs
  enrichment: {
    apollo: {
      apiKey: process.env.APOLLO_API_KEY,
      baseUrl: 'https://api.apollo.io/v1',
    },
    clearbit: {
      apiKey: process.env.CLEARBIT_API_KEY,
      baseUrl: 'https://company.clearbit.com/v2',
    },
    hunter: {
      apiKey: process.env.HUNTER_API_KEY,
      baseUrl: 'https://api.hunter.io/v2',
    },
    proxycurl: {
      apiKey: process.env.PROXYCURL_API_KEY,
      baseUrl: 'https://nubela.co/proxycurl/api/v2',
    },
    clay: {
      apiKey: process.env.CLAY_API_KEY,
      baseUrl: 'https://api.clay.com/v1',
    },
    rocketReach: {
      apiKey: process.env.ROCKETREACH_API_KEY,
      baseUrl: 'https://api.rocketreach.co/v2',
    },
  },

  // Verification Services
  verification: {
    email: {
      zeroBounce: {
        apiKey: process.env.ZEROBOUNCE_API_KEY,
        baseUrl: 'https://api.zerobounce.net/v2',
      },
      neverBounce: {
        apiKey: process.env.NEVERBOUNCE_API_KEY,
        baseUrl: 'https://api.neverbounce.com/v4',
      },
      debounce: {
        apiKey: process.env.DEBOUNCE_API_KEY,
        baseUrl: 'https://api.debounce.io/v1',
      },
    },
    phone: {
      twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
      },
      numverify: {
        apiKey: process.env.NUMVERIFY_API_KEY,
        baseUrl: 'http://apilayer.net/api',
      },
    },
  },

  // Google Sheets
  googleSheets: {
    clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
  },

  // Slack Configuration
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
    channel: process.env.SLACK_CHANNEL || '#candidates',
    enabled: process.env.ENABLE_SLACK_NOTIFICATIONS === 'true',
  },

  // ATS Integration
  ats: {
    bullhorn: {
      clientId: process.env.BULLHORN_CLIENT_ID,
      clientSecret: process.env.BULLHORN_CLIENT_SECRET,
    },
    greenhouse: {
      apiKey: process.env.GREENHOUSE_API_KEY,
      baseUrl: 'https://harvest.greenhouse.io/v1',
    },
    lever: {
      apiKey: process.env.LEVER_API_KEY,
      baseUrl: 'https://api.lever.co/v1',
    },
  },

  // Monitoring
  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN,
      enabled: process.env.NODE_ENV === 'production',
    },
    datadog: {
      apiKey: process.env.DATADOG_API_KEY,
      appKey: process.env.DATADOG_APP_KEY,
    },
    enabled: process.env.ENABLE_MONITORING === 'true',
  },

  // n8n Configuration
  n8n: {
    host: process.env.N8N_HOST || 'http://localhost:5678',
    apiKey: process.env.N8N_API_KEY,
    webhookBaseUrl: process.env.N8N_WEBHOOK_BASE_URL || 'http://localhost:5678/webhook',
  },

  // Processing Limits
  processing: {
    maxCandidatesPerBatch: parseInt(process.env.MAX_CANDIDATES_PER_BATCH) || 1000,
    maxEnrichmentRetries: parseInt(process.env.MAX_ENRICHMENT_RETRIES) || 2,
    deduplicationThreshold: parseFloat(process.env.DEDUPLICATION_SIMILARITY_THRESHOLD) || 0.85,
    minQualityScore: parseInt(process.env.DATA_QUALITY_MIN_SCORE) || 60,
  },

  // Cost Controls
  costControl: {
    maxApiCostPerDay: parseFloat(process.env.MAX_API_COST_PER_DAY) || 100.00,
    alertThresholdPercentage: parseInt(process.env.ALERT_THRESHOLD_PERCENTAGE) || 80,
    enabled: process.env.ENABLE_COST_TRACKING === 'true',
  },

  // Email Pattern Templates
  emailPatterns: [
    '{first}.{last}@{domain}',
    '{first}{last}@{domain}',
    '{f}{last}@{domain}',
    '{first}_{last}@{domain}',
    '{first}-{last}@{domain}',
    '{last}.{first}@{domain}',
    '{f}.{last}@{domain}',
  ],

  // Job Boards
  jobBoards: {
    indeed: {
      us: 'https://www.indeed.com',
      uk: 'https://www.indeed.co.uk',
      ca: 'https://www.indeed.ca',
    },
    linkedin: 'https://www.linkedin.com',
    zipRecruiter: 'https://www.ziprecruiter.com',
    glassdoor: 'https://www.glassdoor.com',
    careerBuilder: 'https://www.careerbuilder.com',
  },
};
