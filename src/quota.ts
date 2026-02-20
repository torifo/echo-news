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

interface QuotaData {
  gnews:    ProviderQuota;
  currents: ProviderQuota;
  shared: {
    gnews:    ProviderQuota;
    currents: ProviderQuota;
  };
}

function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function defaultQuota(): QuotaData {
  const td = today();
  return {
    gnews:    { date: td, count: 0 },
    currents: { date: td, count: 0 },
    shared: {
      gnews:    { date: td, count: 0 },
      currents: { date: td, count: 0 },
    },
  };
}

function load(): QuotaData {
  if (!existsSync(QUOTA_FILE)) return defaultQuota();
  const raw = JSON.parse(readFileSync(QUOTA_FILE, 'utf-8')) as Partial<QuotaData>;
  // shared フィールドが旧バージョンにない場合のマイグレーション
  if (!raw.shared) {
    const td = today();
    raw.shared = { gnews: { date: td, count: 0 }, currents: { date: td, count: 0 } };
  }
  return raw as QuotaData;
}

function save(data: QuotaData): void {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(QUOTA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function resetIfNewDay(q: ProviderQuota): ProviderQuota {
  const td = today();
  return q.date === td ? q : { date: td, count: 0 };
}

/**
 * APIリクエスト成功後に呼ぶ．
 * isOwn=false（共有キー利用）の場合は shared カウントも加算．
 */
export function increment(provider: 'gnews' | 'currents', isOwn: boolean): void {
  const data = load();
  data[provider] = resetIfNewDay(data[provider]);
  data[provider].count += 1;

  if (!isOwn) {
    data.shared[provider] = resetIfNewDay(data.shared[provider]);
    data.shared[provider].count += 1;
  }
  save(data);
}

/**
 * 共有キーでのリクエストが今日の上限内か確認する．
 * isOwn=true のユーザは常に true を返す（制限なし）．
 */
export function isSharedAllowed(provider: 'gnews' | 'currents', isOwn: boolean): boolean {
  if (isOwn) return true;
  const data = load();
  const q = resetIfNewDay(data.shared[provider]);
  return q.count < SHARED_LIMITS[provider];
}

export function getSharedUsed(provider: 'gnews' | 'currents'): number {
  const data = load();
  const q = resetIfNewDay(data.shared[provider]);
  return q.count;
}

export function getUsage(): { gnews: number; currents: number } {
  const data = load();
  return {
    gnews:    resetIfNewDay(data.gnews).count,
    currents: resetIfNewDay(data.currents).count,
  };
}
