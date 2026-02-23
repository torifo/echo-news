import axios from 'axios';
import { Article, FetchOptions } from '../types';
import { BaseProvider } from './base';
import { storeCurrentsRateLimit } from '../quota';

interface CurrentsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  author: string;
  image: string;
  language: string;
  category: string[];
  published: string;
}

interface CurrentsResponse {
  status: string;
  news: CurrentsArticle[];
}

export class CurrentsProvider extends BaseProvider {
  private static readonly BASE_URL = 'https://api.currentsapi.services/v1';

  async fetch(options: FetchOptions = {}): Promise<Article[]> {
    const { topic, limit = 20, lang = 'ja', country, category, from, to } = options;
    const endpoint = topic ? '/search' : '/latest-news';

    const params: Record<string, string | number> = {
      apiKey: this.apiKey,
      language: lang,
    };
    if (topic)    params['keywords']   = topic;
    if (country)  params['country']    = country;
    if (category) params['category']   = category;
    if (from)     params['start_date'] = from;
    if (to)       params['end_date']   = to;

    const response = await this.withRetry(() =>
      axios.get<CurrentsResponse>(`${CurrentsProvider.BASE_URL}${endpoint}`, { params })
    );

    // X-RateLimit-Remaining / X-RateLimit-Limit ヘッダーを保存
    const remaining = parseInt(response.headers['x-ratelimit-remaining'] ?? '', 10);
    const limit2    = parseInt(response.headers['x-ratelimit-limit']     ?? '', 10);
    if (!isNaN(remaining) && !isNaN(limit2)) {
      storeCurrentsRateLimit(remaining, limit2);
    }

    return response.data.news
      .slice(0, limit)
      .map((raw) => this.normalize(raw));
  }

  private normalize(raw: CurrentsArticle): Article {
    const publishedAt = new Date(raw.published).toISOString();
    return {
      id: this.makeId(raw.url),
      title: raw.title,
      description: raw.description ?? '',
      url: raw.url,
      source: raw.author || 'Currents',
      provider: 'currents',
      publishedAt,
    };
  }
}
