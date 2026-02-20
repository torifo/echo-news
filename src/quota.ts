import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_DIR = join(homedir(), '.config', 'echo-news');
const QUOTA_FILE = join(CONFIG_DIR, 'quota.json');

/** 自分のキーを持たないユーザが共有キーで叩ける上限 */
export const SHARED_LIMITS = { gnews: 5, currents: 1 } as const;
/** 表示用の全体上限 */
export const TOTAL_LIMITS  = { gnews: 100, currents: 20 } as const;

interface ProviderQuota { date: string; count: number }

interface CurrentsApiQuota extends ProviderQuota {
  /** Currents API レスポンスヘッダーから取得した実際の残りリクエスト数 */
  apiRemaining?: number;
  /** Currents API レスポンスヘッダーから取得した日次上限 */
  apiLimit?: number;
}

interface QuotaData {
  gnews:    ProviderQuota;
  currents: CurrentsApiQuota;
  shared: {
    gnews:    ProviderQuota;
    currents: ProviderQuota;
  };
}

/** GNews は UTC 0時リセット */
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/** ローカル日時（Currents API の共有制限判定・表示用） */
function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function defaultQuota(): QuotaData {
  return {
    gnews:    { date: todayUTC(),   count: 0 },
    currents: { date: todayLocal(), count: 0 },
    shared: {
      gnews:    { date: todayUTC(),   count: 0 },
      currents: { date: todayLocal(), count: 0 },
    },
  };
}

function load(): QuotaData {
  if (!existsSync(QUOTA_FILE)) return defaultQuota();
  const raw = JSON.parse(readFileSync(QUOTA_FILE, 'utf-8')) as Partial<QuotaData>;
  if (!raw.shared) {
    raw.shared = {
      gnews:    { date: todayUTC(),   count: 0 },
      currents: { date: todayLocal(), count: 0 },
    };
  }
  return raw as QuotaData;
}

function save(data: QuotaData): void {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(QUOTA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function resetIfNewDay(q: ProviderQuota, dateKey: string): ProviderQuota {
  return q.date === dateKey ? q : { date: dateKey, count: 0 };
}

/**
 * APIリクエスト成功後に呼ぶ．
 * isOwn=false（共有キー利用）の場合は shared カウントも加算．
 */
export function increment(provider: 'gnews' | 'currents', isOwn: boolean): void {
  const data  = load();
  const dateKey = provider === 'gnews' ? todayUTC() : todayLocal();

  data[provider] = resetIfNewDay(data[provider], dateKey);
  data[provider].count += 1;

  if (!isOwn) {
    data.shared[provider] = resetIfNewDay(data.shared[provider], dateKey);
    data.shared[provider].count += 1;
  }
  save(data);
}

/**
 * Currents API レスポンスヘッダーの実際の残数を保存する．
 */
export function storeCurrentsRateLimit(remaining: number, limit: number): void {
  const data = load();
  const dateKey = todayLocal();
  data.currents = resetIfNewDay(data.currents, dateKey) as CurrentsApiQuota;
  (data.currents as CurrentsApiQuota).apiRemaining = remaining;
  (data.currents as CurrentsApiQuota).apiLimit     = limit;
  save(data);
}

/**
 * 共有キーでのリクエストが今日の上限内か確認する．
 */
export function isSharedAllowed(provider: 'gnews' | 'currents', isOwn: boolean): boolean {
  if (isOwn) return true;
  const data    = load();
  const dateKey = provider === 'gnews' ? todayUTC() : todayLocal();
  const q       = resetIfNewDay(data.shared[provider], dateKey);
  return q.count < SHARED_LIMITS[provider];
}

export function getSharedUsed(provider: 'gnews' | 'currents'): number {
  const data    = load();
  const dateKey = provider === 'gnews' ? todayUTC() : todayLocal();
  return resetIfNewDay(data.shared[provider], dateKey).count;
}

export interface UsageInfo {
  gnews: {
    used:  number; // ローカルカウント（近似値）
  };
  currents: {
    used:       number;          // ローカルカウント
    apiRemaining?: number;       // API実測値（あれば優先）
    apiLimit?:     number;
  };
}

export function getUsage(): UsageInfo {
  const data    = load();
  const gDate   = todayUTC();
  const cDate   = todayLocal();
  const gq      = resetIfNewDay(data.gnews,    gDate);
  const cq      = resetIfNewDay(data.currents, cDate) as CurrentsApiQuota;

  return {
    gnews:    { used: gq.count },
    currents: {
      used:         cq.count,
      apiRemaining: cq.apiRemaining,
      apiLimit:     cq.apiLimit,
    },
  };
}
