import { Article, FetchOptions } from './types';
import { GNewsProvider } from './providers/gnews';
import { CurrentsProvider } from './providers/currents';
import { deduplicate } from './deduplicator';
import { increment } from './quota';

type ProviderName = 'gnews' | 'currents' | 'all';

export interface KeyInfo {
  key:   string;
  isOwn: boolean; // true = ユーザ自身のキー，false = 開発者の共有キー
}

export interface AggregateOptions extends FetchOptions {
  source?:   ProviderName;
  noDedup?:  boolean;
  gnewsKey:  KeyInfo;
  currentsKey: KeyInfo;
}

export class NewsAggregator {
  async aggregate(options: AggregateOptions): Promise<Article[]> {
    const {
      source = 'all',
      limit = 10,
      noDedup = false,
      gnewsKey,
      currentsKey,
      ...fetchOpts
    } = options;

    const targets: Array<{
      name: 'gnews' | 'currents';
      fetch: () => Promise<Article[]>;
      isOwn: boolean;
    }> = [];

    if (source === 'gnews' || source === 'all') {
      const p = new GNewsProvider(gnewsKey.key);
      targets.push({ name: 'gnews', fetch: () => p.fetch({ ...fetchOpts, limit }), isOwn: gnewsKey.isOwn });
    }
    if (source === 'currents' || source === 'all') {
      const p = new CurrentsProvider(currentsKey.key);
      targets.push({ name: 'currents', fetch: () => p.fetch({ ...fetchOpts, limit }), isOwn: currentsKey.isOwn });
    }

    const results = await Promise.allSettled(targets.map((t) => t.fetch()));

    const articles: Article[] = [];
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const { name, isOwn } = targets[i];
      if (result.status === 'fulfilled') {
        increment(name, isOwn);
        articles.push(...result.value);
      } else {
        console.error(`[warn] ${name} の取得に失敗しました: ${result.reason}`);
      }
    }

    const processed = noDedup ? articles : deduplicate(articles);
    return processed.slice(0, limit);
  }
}
