import axios from 'axios';
import { Article, FetchOptions } from '../types';
import { BaseProvider } from './base';

interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: { name: string; url: string };
}

interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

export class GNewsProvider extends BaseProvider {
  private static readonly BASE_URL = 'https://gnews.io/api/v4';

  async fetch(options: FetchOptions = {}): Promise<Article[]> {
    const { topic, limit = 10, lang = 'ja', country, sort, from, to } = options;
    const endpoint = topic ? '/search' : '/top-headlines';

    const params: Record<string, string | number> = {
      apikey: this.apiKey,
      lang,
      max: Math.min(limit, 10),
    };
    if (topic)   params['q']       = topic;
    if (country) params['country'] = country;
    if (sort)    params['sortby']  = sort;
    if (from)    params['from']    = from;
    if (to)      params['to']      = to;

    const response = await this.withRetry(() =>
      axios.get<GNewsResponse>(`${GNewsProvider.BASE_URL}${endpoint}`, { params })
    );

    return response.data.articles.map((raw) => this.normalize(raw));
  }

  private normalize(raw: GNewsArticle): Article {
    return {
      id: this.makeId(raw.url),
      title: raw.title,
      description: raw.description ?? '',
      url: raw.url,
      source: raw.source.name,
      provider: 'gnews',
      publishedAt: raw.publishedAt,
      content: raw.content || undefined,
    };
  }
}
