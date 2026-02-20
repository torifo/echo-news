import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export const CONFIG_DIR  = join(homedir(), '.config', 'echo-news');
export const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export interface UserConfig {
  gnewsApiKey?:    string;
  currentsApiKey?: string;
}

export function loadConfig(): UserConfig {
  if (!existsSync(CONFIG_FILE)) return {};
  return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) as UserConfig;
}

function saveConfig(config: UserConfig): void {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export function setKey(provider: 'gnews' | 'currents', key: string): void {
  const config = loadConfig();
  if (provider === 'gnews') config.gnewsApiKey    = key;
  else                       config.currentsApiKey = key;
  saveConfig(config);
}

export function removeKey(provider: 'gnews' | 'currents'): void {
  const config = loadConfig();
  if (provider === 'gnews') delete config.gnewsApiKey;
  else                       delete config.currentsApiKey;
  saveConfig(config);
}

/** キーを末尾4文字だけ見せてマスク */
export function maskKey(key: string): string {
  if (key.length <= 4) return '****';
  return '*'.repeat(key.length - 4) + key.slice(-4);
}
