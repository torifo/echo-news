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
}
