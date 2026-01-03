-- 일별 통계 테이블
CREATE TABLE IF NOT EXISTS daily_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  visitors INTEGER DEFAULT 0,
  pageviews INTEGER DEFAULT 0,
  avg_duration REAL DEFAULT 0,
  bounce_rate REAL DEFAULT 0,
  leads INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 트래픽 소스 테이블
CREATE TABLE IF NOT EXISTS traffic_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  source TEXT NOT NULL,
  medium TEXT,
  sessions INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, source, medium)
);

-- 인기 페이지 테이블
CREATE TABLE IF NOT EXISTS top_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  page_path TEXT NOT NULL,
  pageviews INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, page_path)
);

-- 검색어 테이블 (Search Console 연동 시)
CREATE TABLE IF NOT EXISTS search_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  query TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr REAL DEFAULT 0,
  position REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, query)
);

-- 디바이스 통계 테이블
CREATE TABLE IF NOT EXISTS device_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  device TEXT NOT NULL,
  users INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, device)
);

-- 지역 통계 테이블
CREATE TABLE IF NOT EXISTS geo_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  city TEXT NOT NULL,
  users INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, city)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_traffic_sources_date ON traffic_sources(date);
CREATE INDEX IF NOT EXISTS idx_top_pages_date ON top_pages(date);
CREATE INDEX IF NOT EXISTS idx_search_queries_date ON search_queries(date);
CREATE INDEX IF NOT EXISTS idx_device_stats_date ON device_stats(date);
CREATE INDEX IF NOT EXISTS idx_geo_stats_date ON geo_stats(date);
