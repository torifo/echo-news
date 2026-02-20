export interface Article {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  provider: string;
  publishedAt: string;
  content?: string;
  relatedUrls?: string[];
}

export interface FetchOptions {
  topic?: string;
  limit?: number;
  lang?: string;
  country?: string;
  category?: string;          // Currents のみ対応
  sort?: 'publishedAt' | 'relevance'; // GNews のみ対応
  from?: string;              // ISO 8601 日付
  to?: string;                // ISO 8601 日付
}
