// ── Resource types ──────────────────────────────────────────────────

export interface Resource {
  title: string;
  url: string;
  description?: string;
  content?: string;
  keywords?: string;
  excluded?: boolean;
}

export interface ProductResource extends Resource {
  price?: string;
  compareAtPrice?: string;
  currency?: string;
  available?: boolean;
  variants?: Array<{
    title: string;
    price: string;
    available: boolean;
  }>;
}

export interface ResourceSection {
  /** Section heading for llms.txt (e.g. "Products", "Blog Posts") */
  name: string;
  /** Type identifier: 'product', 'page', or any custom string */
  type: string;
  resources: Resource[];
}

// ── Provider ────────────────────────────────────────────────────────

export interface ContentProvider {
  getSections(options?: { locale?: string }): Promise<ResourceSection[]>;
}

// ── Cache ───────────────────────────────────────────────────────────

export interface CacheAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  invalidate(key?: string): Promise<void>;
}

// ── Crawl tracking ──────────────────────────────────────────────────

export interface CrawlEntry {
  botName: string;
  fileType: string;
  ipHash: string;
  userAgent: string;
  timestamp: Date;
}

export interface CrawlActivity {
  botName: string;
  displayName: string;
  totalVisits: number;
  lastVisit: Date;
}

export interface CrawlStore {
  log(entry: CrawlEntry): Promise<void>;
  getActivity(options?: { days?: number }): Promise<CrawlActivity[]>;
  cleanup(olderThanDays: number): Promise<void>;
}

// ── Configuration ───────────────────────────────────────────────────

export interface CrawlTrackingConfig {
  store?: CrawlStore;
  secret?: string;
}

export interface CryptoConfig {
  encryptionKey: string; // 64-char hex
}

export interface GeoAIConfig {
  // Required
  siteName: string;
  siteUrl: string;
  provider: ContentProvider | Record<string, Resource[]>;

  // Optional
  siteDescription?: string;
  crawlers?: Record<string, 'allow' | 'disallow'> | 'all';
  cache?: CacheAdapter | string; // string = duration like '24h', '1h'
  crypto?: CryptoConfig;
  crawlTracking?: CrawlTrackingConfig | true;
}

// ── AI types (geo-ai-core/ai) ───────────────────────────────────────

export type AiProvider = 'anthropic' | 'openai';

export interface AiGeneratorConfig {
  provider: AiProvider;
  apiKey: string;
  model?: string;
  maxDescriptionLength?: number; // default 200
  promptTemplate?: string;
  rateLimit?: number; // requests per minute, default 10
}

export interface AiError {
  type: 'auth_error' | 'rate_limit' | 'server_error' | 'network_error' | 'unknown';
  message: string;
  statusCode?: number;
}

export interface AiBulkConfig {
  batchSize?: number; // default 5
  maxItems?: number; // default 50
  onProgress?: (completed: number, total: number, current: Resource) => void;
}

export interface AiContext {
  title: string;
  content?: string;
  type?: string;
  price?: string;
  category?: string;
}
