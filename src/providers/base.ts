import { createHash } from 'crypto';
import { Article, FetchOptions } from '../types';

export abstract class BaseProvider {
  protected apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  abstract fetch(options?: FetchOptions): Promise<Article[]>;

  protected makeId(url: string): string {
    return createHash('sha256').update(url).digest('hex');
  }

  /**
   * WSL2 の断続的な DNS 解決失敗に対するリトライ処理．
   * 指数バックオフで最大 `retries` 回リトライする．
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    retries = 2,
    delayMs = 800
  ): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (retries <= 0) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
      return this.withRetry(fn, retries - 1, delayMs * 2);
    }
  }
}
