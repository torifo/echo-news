import { Article } from './types';

const SIMILARITY_THRESHOLD = 0.85;

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  return 1 - levenshtein(a, b) / maxLen;
}

function contentLength(article: Article): number {
  return (article.content ?? article.description ?? '').length;
}

export function deduplicate(articles: Article[]): Article[] {
  const groups: Article[][] = [];
  const assigned = new Set<string>();

  for (const article of articles) {
    if (assigned.has(article.id)) continue;

    const group: Article[] = [article];
    assigned.add(article.id);

    for (const other of articles) {
      if (assigned.has(other.id)) continue;

      // Step 1: URL完全一致（id一致）
      if (article.id === other.id) {
        group.push(other);
        assigned.add(other.id);
        continue;
      }

      // Step 2: タイトル類似度
      if (similarity(article.title, other.title) >= SIMILARITY_THRESHOLD) {
        group.push(other);
        assigned.add(other.id);
      }
    }

    groups.push(group);
  }

  // Step 3: 各グループから代表記事を選定
  return groups.map((group) => {
    const representative = group.reduce((best, current) =>
      contentLength(current) > contentLength(best) ? current : best
    );

    const relatedUrls = group
      .filter((a) => a.url !== representative.url)
      .map((a) => a.url);

    return relatedUrls.length > 0
      ? { ...representative, relatedUrls }
      : representative;
  });
}
