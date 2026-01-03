// GA4 Analytics Worker for BIZEN Dashboard
// Cloudflare Worker that fetches data from Google Analytics Data API
// + D1 database for storing daily analytics data

const GA4_PROPERTY_ID = '514848999';

// Service Account Credentials (stored in environment variables for security)
const SERVICE_ACCOUNT = {
  client_email: 'bizen-ga4@bizen-480210.iam.gserviceaccount.com',
  private_key_id: '11f9efe9e4c52ebc76caba4b5127099e747c1952'
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// Base64 URL encode
function base64urlEncode(str) {
  const base64 = btoa(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Create JWT token for Google API authentication
async function createJWT(privateKey) {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: SERVICE_ACCOUNT.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Import private key
  const pemContents = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = base64urlEncode(String.fromCharCode(...new Uint8Array(signature)));

  return `${signatureInput}.${encodedSignature}`;
}

// Get access token from Google
async function getAccessToken(privateKey) {
  const jwt = await createJWT(privateKey);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  const data = await response.json();
  return data.access_token;
}

// Call GA4 Data API
async function callGA4API(accessToken, requestBody) {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }
  );

  return response.json();
}

// Get date range based on period
function getDateRange(period) {
  const today = new Date();
  let startDate, endDate;

  switch (period) {
    case 'daily':
      // 이번 주 월요일 ~ 일요일 기준
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      monday.setDate(today.getDate() - daysToMonday);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      startDate = monday.toISOString().split('T')[0];
      endDate = sunday.toISOString().split('T')[0];
      break;
    case 'weekly':
      // 최근 4주
      const fourWeeksAgo = new Date(today);
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      startDate = fourWeeksAgo.toISOString().split('T')[0];
      endDate = today.toISOString().split('T')[0];
      break;
    case 'monthly':
      // 최근 3개월
      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      startDate = threeMonthsAgo.toISOString().split('T')[0];
      endDate = today.toISOString().split('T')[0];
      break;
    default:
      startDate = today.toISOString().split('T')[0];
      endDate = startDate;
  }

  return { startDate, endDate };
}

// Format duration (seconds to minutes:seconds)
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}분 ${secs}초`;
}

// Handler for overview data
async function getOverview(accessToken, period) {
  const { startDate, endDate } = getDateRange(period);

  // Calculate previous period
  const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
  const prevEnd = new Date(startDate);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - daysDiff + 1);

  // Current period data
  const currentData = await callGA4API(accessToken, {
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'screenPageViews' },
      { name: 'averageSessionDuration' },
      { name: 'bounceRate' }
    ]
  });

  // Previous period data
  const previousData = await callGA4API(accessToken, {
    dateRanges: [{
      startDate: prevStart.toISOString().split('T')[0],
      endDate: prevEnd.toISOString().split('T')[0]
    }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'screenPageViews' },
      { name: 'averageSessionDuration' },
      { name: 'bounceRate' }
    ]
  });

  const current = currentData.rows?.[0]?.metricValues || [];
  const previous = previousData.rows?.[0]?.metricValues || [];

  const visitors = parseInt(current[0]?.value || 0);
  const pageviews = parseInt(current[1]?.value || 0);
  const duration = parseFloat(current[2]?.value || 0);
  const bounceRate = parseFloat(current[3]?.value || 0);

  const prevVisitors = parseInt(previous[0]?.value || 1);
  const prevPageviews = parseInt(previous[1]?.value || 1);
  const prevDuration = parseFloat(previous[2]?.value || 1);
  const prevBounceRate = parseFloat(previous[3]?.value || 1);

  return {
    period: { startDate, endDate },
    visitors: {
      value: visitors,
      change: Math.round(((visitors - prevVisitors) / prevVisitors) * 100)
    },
    pageviews: {
      value: pageviews,
      change: Math.round(((pageviews - prevPageviews) / prevPageviews) * 100)
    },
    duration: {
      value: formatDuration(duration),
      seconds: duration,
      change: Math.round(((duration - prevDuration) / prevDuration) * 100)
    },
    bounceRate: {
      value: Math.round(bounceRate * 100),
      change: Math.round(((bounceRate - prevBounceRate) / prevBounceRate) * 100)
    }
  };
}

// Handler for traffic sources
async function getTrafficSources(accessToken, period) {
  const { startDate, endDate } = getDateRange(period);

  const data = await callGA4API(accessToken, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'sessions' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 10
  });

  const total = data.rows?.reduce((sum, row) => sum + parseInt(row.metricValues[0].value), 0) || 1;

  const sources = data.rows?.map(row => ({
    source: row.dimensionValues[0].value,
    sessions: parseInt(row.metricValues[0].value),
    percentage: Math.round((parseInt(row.metricValues[0].value) / total) * 100)
  })) || [];

  return { period: { startDate, endDate }, sources, total };
}

// Handler for top pages
async function getTopPages(accessToken, period) {
  const { startDate, endDate } = getDateRange(period);

  const data = await callGA4API(accessToken, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 10
  });

  const pages = data.rows?.map(row => ({
    path: row.dimensionValues[0].value,
    views: parseInt(row.metricValues[0].value)
  })) || [];

  return { period: { startDate, endDate }, pages };
}

// Handler for device breakdown
async function getDevices(accessToken, period) {
  const { startDate, endDate } = getDateRange(period);

  const data = await callGA4API(accessToken, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'deviceCategory' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }]
  });

  const total = data.rows?.reduce((sum, row) => sum + parseInt(row.metricValues[0].value), 0) || 1;

  const devices = data.rows?.map(row => ({
    device: row.dimensionValues[0].value,
    users: parseInt(row.metricValues[0].value),
    percentage: Math.round((parseInt(row.metricValues[0].value) / total) * 100)
  })) || [];

  return { period: { startDate, endDate }, devices, total };
}

// Handler for geographic data
async function getGeography(accessToken, period) {
  const { startDate, endDate } = getDateRange(period);

  const data = await callGA4API(accessToken, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'city' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 10
  });

  const regions = data.rows?.map(row => ({
    city: row.dimensionValues[0].value,
    users: parseInt(row.metricValues[0].value)
  })) || [];

  return { period: { startDate, endDate }, regions };
}

// Handler for referrers (유입 경로)
async function getReferrers(accessToken, period) {
  const { startDate, endDate } = getDateRange(period);

  const data = await callGA4API(accessToken, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
    metrics: [{ name: 'sessions' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 10
  });

  const total = data.rows?.reduce((sum, row) => sum + parseInt(row.metricValues[0].value), 0) || 1;

  const referrers = data.rows?.map(row => ({
    source: row.dimensionValues[0].value,
    medium: row.dimensionValues[1].value,
    sessions: parseInt(row.metricValues[0].value),
    percentage: Math.round((parseInt(row.metricValues[0].value) / total) * 100)
  })) || [];

  return { period: { startDate, endDate }, referrers, total };
}

// Handler for daily trend
async function getDailyTrend(accessToken, period) {
  const { startDate, endDate } = getDateRange(period);

  const data = await callGA4API(accessToken, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'date' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'screenPageViews' }
    ],
    orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }]
  });

  const trend = data.rows?.map(row => ({
    date: row.dimensionValues[0].value,
    visitors: parseInt(row.metricValues[0].value),
    pageviews: parseInt(row.metricValues[1].value)
  })) || [];

  return { period: { startDate, endDate }, trend };
}

// ========================================
// D1 Database Functions
// ========================================

// Initialize database tables (테이블이 없을 때만 생성)
async function initDatabase(db) {
  try {
    // 테이블 존재 여부 확인
    const result = await db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='daily_stats'"
    ).first();

    // 이미 테이블이 있으면 건너뛰기
    if (result) {
      return;
    }

    // 테이블이 없으면 개별적으로 생성
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS daily_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        visitors INTEGER DEFAULT 0,
        pageviews INTEGER DEFAULT 0,
        avg_duration REAL DEFAULT 0,
        bounce_rate REAL DEFAULT 0,
        leads INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS traffic_sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        source TEXT NOT NULL,
        medium TEXT,
        sessions INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, source, medium)
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS top_pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        page_path TEXT NOT NULL,
        pageviews INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, page_path)
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS device_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        device TEXT NOT NULL,
        users INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, device)
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS geo_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        city TEXT NOT NULL,
        users INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, city)
      )
    `).run();

    // 인덱스 생성
    await db.prepare('CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date)').run();
    await db.prepare('CREATE INDEX IF NOT EXISTS idx_traffic_sources_date ON traffic_sources(date)').run();
    await db.prepare('CREATE INDEX IF NOT EXISTS idx_top_pages_date ON top_pages(date)').run();
    await db.prepare('CREATE INDEX IF NOT EXISTS idx_device_stats_date ON device_stats(date)').run();
    await db.prepare('CREATE INDEX IF NOT EXISTS idx_geo_stats_date ON geo_stats(date)').run();
  } catch (error) {
    console.error('initDatabase error:', error);
    // 테이블이 이미 있을 경우 에러 무시
  }
}

// Collect and store yesterday's data (called by cron)
async function collectDailyData(env) {
  const privateKey = env.GA4_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('Private key not configured');
  }

  const accessToken = await getAccessToken(privateKey);

  // Get yesterday's date
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  // Fetch data for yesterday
  const [overview, traffic, pages, devices, geography] = await Promise.all([
    callGA4API(accessToken, {
      dateRanges: [{ startDate: dateStr, endDate: dateStr }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' }
      ]
    }),
    callGA4API(accessToken, {
      dateRanges: [{ startDate: dateStr, endDate: dateStr }],
      dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 20
    }),
    callGA4API(accessToken, {
      dateRanges: [{ startDate: dateStr, endDate: dateStr }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 20
    }),
    callGA4API(accessToken, {
      dateRanges: [{ startDate: dateStr, endDate: dateStr }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'activeUsers' }]
    }),
    callGA4API(accessToken, {
      dateRanges: [{ startDate: dateStr, endDate: dateStr }],
      dimensions: [{ name: 'city' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 20
    })
  ]);

  // Store in D1
  const db = env.DB;

  // Initialize tables if needed
  await initDatabase(db);

  // Store daily stats
  const metrics = overview.rows?.[0]?.metricValues || [];
  await db.prepare(`
    INSERT OR REPLACE INTO daily_stats (date, visitors, pageviews, avg_duration, bounce_rate)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    dateStr,
    parseInt(metrics[0]?.value || 0),
    parseInt(metrics[1]?.value || 0),
    parseFloat(metrics[2]?.value || 0),
    parseFloat(metrics[3]?.value || 0)
  ).run();

  // Store traffic sources
  for (const row of (traffic.rows || [])) {
    await db.prepare(`
      INSERT OR REPLACE INTO traffic_sources (date, source, medium, sessions)
      VALUES (?, ?, ?, ?)
    `).bind(
      dateStr,
      row.dimensionValues[0].value,
      row.dimensionValues[1].value,
      parseInt(row.metricValues[0].value)
    ).run();
  }

  // Store top pages
  for (const row of (pages.rows || [])) {
    await db.prepare(`
      INSERT OR REPLACE INTO top_pages (date, page_path, pageviews)
      VALUES (?, ?, ?)
    `).bind(
      dateStr,
      row.dimensionValues[0].value,
      parseInt(row.metricValues[0].value)
    ).run();
  }

  // Store device stats
  for (const row of (devices.rows || [])) {
    await db.prepare(`
      INSERT OR REPLACE INTO device_stats (date, device, users)
      VALUES (?, ?, ?)
    `).bind(
      dateStr,
      row.dimensionValues[0].value,
      parseInt(row.metricValues[0].value)
    ).run();
  }

  // Store geo stats
  for (const row of (geography.rows || [])) {
    await db.prepare(`
      INSERT OR REPLACE INTO geo_stats (date, city, users)
      VALUES (?, ?, ?)
    `).bind(
      dateStr,
      row.dimensionValues[0].value,
      parseInt(row.metricValues[0].value)
    ).run();
  }

  return { success: true, date: dateStr, message: 'Daily data collected successfully' };
}

// Get historical data from D1
async function getHistoricalData(db, days = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const stats = await db.prepare(`
    SELECT * FROM daily_stats
    WHERE date >= ? AND date <= ?
    ORDER BY date ASC
  `).bind(startStr, endStr).all();

  return {
    period: { startDate: startStr, endDate: endStr },
    data: stats.results || []
  };
}

// Get historical traffic sources
async function getHistoricalTraffic(db, days = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const traffic = await db.prepare(`
    SELECT source, medium, SUM(sessions) as total_sessions
    FROM traffic_sources
    WHERE date >= ? AND date <= ?
    GROUP BY source, medium
    ORDER BY total_sessions DESC
    LIMIT 20
  `).bind(startStr, endStr).all();

  return {
    period: { startDate: startStr, endDate: endStr },
    data: traffic.results || []
  };
}

// Get historical top pages
async function getHistoricalPages(db, days = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const pages = await db.prepare(`
    SELECT page_path, SUM(pageviews) as total_pageviews
    FROM top_pages
    WHERE date >= ? AND date <= ?
    GROUP BY page_path
    ORDER BY total_pageviews DESC
    LIMIT 20
  `).bind(startStr, endStr).all();

  return {
    period: { startDate: startStr, endDate: endStr },
    data: pages.results || []
  };
}

// Main handler
export default {
  // HTTP request handler
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const period = url.searchParams.get('period') || 'daily';
    const days = parseInt(url.searchParams.get('days') || '30');

    try {
      // Historical data endpoints (from D1)
      if (path.startsWith('/history/')) {
        const db = env.DB;
        if (!db) {
          return new Response(JSON.stringify({ error: 'Database not configured' }), {
            status: 500,
            headers: corsHeaders
          });
        }

        await initDatabase(db);

        let data;
        switch (path) {
          case '/history/stats':
            data = await getHistoricalData(db, days);
            break;
          case '/history/traffic':
            data = await getHistoricalTraffic(db, days);
            break;
          case '/history/pages':
            data = await getHistoricalPages(db, days);
            break;
          case '/history/collect':
            // Manual trigger to collect data
            data = await collectDailyData(env);
            break;
          default:
            return new Response(JSON.stringify({
              error: 'Not found',
              availableEndpoints: [
                '/history/stats?days=30',
                '/history/traffic?days=30',
                '/history/pages?days=30',
                '/history/collect'
              ]
            }), {
              status: 404,
              headers: corsHeaders
            });
        }

        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      // Real-time data endpoints (from GA4 API)
      const privateKey = env.GA4_PRIVATE_KEY;
      if (!privateKey) {
        return new Response(JSON.stringify({ error: 'Private key not configured' }), {
          status: 500,
          headers: corsHeaders
        });
      }

      const accessToken = await getAccessToken(privateKey);

      let data;
      switch (path) {
        case '/analytics/overview':
          data = await getOverview(accessToken, period);
          break;
        case '/analytics/traffic':
          data = await getTrafficSources(accessToken, period);
          break;
        case '/analytics/pages':
          data = await getTopPages(accessToken, period);
          break;
        case '/analytics/devices':
          data = await getDevices(accessToken, period);
          break;
        case '/analytics/geography':
          data = await getGeography(accessToken, period);
          break;
        case '/analytics/referrers':
          data = await getReferrers(accessToken, period);
          break;
        case '/analytics/trend':
          data = await getDailyTrend(accessToken, period);
          break;
        case '/analytics/all':
          // Get all data in one request
          const [overview, traffic, pages, devices, geography, referrers, trend] = await Promise.all([
            getOverview(accessToken, period),
            getTrafficSources(accessToken, period),
            getTopPages(accessToken, period),
            getDevices(accessToken, period),
            getGeography(accessToken, period),
            getReferrers(accessToken, period),
            getDailyTrend(accessToken, period)
          ]);
          data = { overview, traffic, pages, devices, geography, referrers, trend };
          break;
        default:
          return new Response(JSON.stringify({
            error: 'Not found',
            availableEndpoints: [
              '/analytics/overview',
              '/analytics/traffic',
              '/analytics/pages',
              '/analytics/devices',
              '/analytics/geography',
              '/analytics/referrers',
              '/analytics/trend',
              '/analytics/all',
              '/history/stats?days=30',
              '/history/traffic?days=30',
              '/history/pages?days=30',
              '/history/collect'
            ]
          }), {
            status: 404,
            headers: corsHeaders
          });
      }

      return new Response(JSON.stringify(data), { headers: corsHeaders });

    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message,
        stack: error.stack
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  },

  // Cron trigger handler (runs daily at 01:00 KST)
  async scheduled(event, env, ctx) {
    try {
      const result = await collectDailyData(env);
      console.log('Daily data collection completed:', result);
    } catch (error) {
      console.error('Daily data collection failed:', error);
    }
  }
};
