import chalk from 'chalk';
import { Article } from './types';
import { UsageInfo, TOTAL_LIMITS } from './quota';

const SEPARATOR = chalk.gray('━'.repeat(56));

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
}

function wrapText(text: string, width: number, indent: string): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > width) {
      if (current) lines.push(indent + current.trim());
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(indent + current.trim());
  return lines.join('\n');
}

export function printArticle(article: Article, index: number, showUrl = false): void {
  const indent = '     ';
  console.log(SEPARATOR);
  console.log(chalk.cyan.bold(` [${index}]  `) + chalk.white.bold(article.title));
  console.log(
    chalk.gray(`${indent}${article.source}  |  ${formatDate(article.publishedAt)}  |  ${article.provider}`)
  );
  if (article.description) {
    console.log(wrapText(article.description, 56, indent));
  }
  if (showUrl) {
    console.log(chalk.blue(`${indent}${article.url}`));
  }
}

export function printJson(articles: Article[]): void {
  console.log(JSON.stringify(articles, null, 2));
}

export function printSummary(count: number): void {
  console.log(SEPARATOR);
  console.log(chalk.gray(`\n  ${count}件を表示\n`));
}

/** UTC 0時までの残り時間を「Xh Ym」形式で返す */
function hoursUntilUTCMidnight(): string {
  const now  = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const ms   = next.getTime() - now.getTime();
  const h    = Math.floor(ms / 3_600_000);
  const m    = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

/** ローカル 0時までの残り時間を「Xh Ym」形式で返す */
function hoursUntilLocalMidnight(): string {
  const now  = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const ms   = next.getTime() - now.getTime();
  const h    = Math.floor(ms / 3_600_000);
  const m    = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

export function printQuota(usage: UsageInfo, source: string): void {
  const lines: string[] = ['\n  今日の残りリクエスト数:'];

  if (source === 'gnews' || source === 'all') {
    const limit = TOTAL_LIMITS.gnews;
    const rem   = limit - usage.gnews.used;
    const color = rem <= 10 ? chalk.red : rem <= 30 ? chalk.yellow : chalk.green;
    const reset = rem <= 30 ? chalk.gray(` ※ リセットまで ${hoursUntilUTCMidnight()}`) : '';
    lines.push(`    GNews    : ${color(`${rem}/${limit}`)} ${chalk.gray('(ローカル計測・UTC 0時リセット)')}${reset}`);
  }

  if (source === 'currents' || source === 'all') {
    const { apiRemaining, apiLimit, used } = usage.currents;
    if (apiRemaining !== undefined && apiLimit !== undefined) {
      const color = apiRemaining <= 3 ? chalk.red : apiRemaining <= 7 ? chalk.yellow : chalk.green;
      const reset = apiRemaining <= 7 ? chalk.gray(` ※ リセットまで ${hoursUntilLocalMidnight()}`) : '';
      lines.push(`    Currents : ${color(`${apiRemaining}/${apiLimit}`)} ${chalk.gray('(API実測値)')}${reset}`);
    } else {
      const limit = TOTAL_LIMITS.currents;
      const rem   = limit - used;
      const color = rem <= 3 ? chalk.red : rem <= 7 ? chalk.yellow : chalk.green;
      const reset = rem <= 7 ? chalk.gray(` ※ リセットまで ${hoursUntilLocalMidnight()}`) : '';
      lines.push(`    Currents : ${color(`${rem}/${limit}`)} ${chalk.gray('(ローカル計測)')}${reset}`);
    }
  }

  console.log(chalk.gray(lines.join('\n')) + '\n');
}

export function printConfigStatus(
  gnewsKey: string | undefined,
  currentsKey: string | undefined,
  maskFn: (k: string) => string,
  gnewsUsed: number,
  currentsUsed: number,
  sharedGnewsUsed: number,
  sharedCurrentsUsed: number,
): void {
  const ownTag      = chalk.green('[自分のキー]');
  const sharedTag   = chalk.yellow('[共有キー]');

  console.log('\n  ── APIキー設定 ──────────────────────────────────');
  if (gnewsKey) {
    console.log(`  GNews    : ${ownTag} ${chalk.gray(maskFn(gnewsKey))}`);
    console.log(chalk.gray(`             今日の使用: ${gnewsUsed}/100`));
  } else {
    console.log(`  GNews    : ${sharedTag}`);
    console.log(chalk.gray(`             今日の共有使用: ${sharedGnewsUsed}/5（共有上限: 5回/日）`));
    console.log(chalk.gray(`             自分のキーを設定すると上限100回/日になります`));
  }

  console.log('');

  if (currentsKey) {
    console.log(`  Currents : ${ownTag} ${chalk.gray(maskFn(currentsKey))}`);
    console.log(chalk.gray(`             今日の使用: ${currentsUsed}/20`));
  } else {
    console.log(`  Currents : ${sharedTag}`);
    console.log(chalk.gray(`             今日の共有使用: ${sharedCurrentsUsed}/1（共有上限: 1回/日）`));
    console.log(chalk.gray(`             自分のキーを設定すると上限20回/日になります`));
  }

  console.log('  ──────────────────────────────────────────────');
  console.log(chalk.gray('  キー設定: echo-news config set-key <gnews|currents> <key>'));
  console.log('');
}

export function printError(message: string): void {
  console.error(chalk.red(`\n  [エラー] ${message}\n`));
}
