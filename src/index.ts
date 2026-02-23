#!/usr/bin/env node
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import path from 'path';
import { config } from 'dotenv';
import { Command } from 'commander';
import ora from 'ora';
import { NewsAggregator } from './aggregator';
import { printArticle, printJson, printSummary, printQuota, printConfigStatus, printError } from './formatter';
import { getUsage, isSharedAllowed, getSharedUsed, SHARED_LIMITS, TOTAL_LIMITS } from './quota';
import { loadConfig, setKey, removeKey, maskKey } from './config';

// グローバル実行時も dist/ の隣の .env を読む（開発者のデフォルトキー）
config({ path: path.resolve(__dirname, '../.env') });

const program = new Command();

// ────────────────────────────────────────────────
// config サブコマンド群
// ────────────────────────────────────────────────
const configCmd = program
  .command('config')
  .description('APIキー設定を管理する');

configCmd
  .command('set-key <provider> <key>')
  .description('自分のAPIキーを設定する（provider: gnews | currents）')
  .action((provider: string, key: string) => {
    if (!['gnews', 'currents'].includes(provider)) {
      printError('provider には gnews または currents を指定してください．');
      process.exit(1);
    }
    setKey(provider as 'gnews' | 'currents', key);
    console.log(`\n  [OK] ${provider} のAPIキーを保存しました．\n`);
  });

configCmd
  .command('remove-key <provider>')
  .description('自分のAPIキーを削除して開発者の共有キーに戻す（provider: gnews | currents）')
  .action((provider: string) => {
    if (!['gnews', 'currents'].includes(provider)) {
      printError('provider には gnews または currents を指定してください．');
      process.exit(1);
    }
    removeKey(provider as 'gnews' | 'currents');
    console.log(`\n  [OK] ${provider} のAPIキーを削除しました（共有キーを使用します）．\n`);
  });

configCmd
  .command('show')
  .description('現在のAPIキー設定と使用状況を表示する')
  .action(() => {
    const userCfg = loadConfig();
    const usage = getUsage();
    printConfigStatus(
      userCfg.gnewsApiKey,
      userCfg.currentsApiKey,
      maskKey,
      usage.gnews.used,
      usage.currents.apiRemaining ?? (TOTAL_LIMITS.currents - usage.currents.used),
      getSharedUsed('gnews'),
      getSharedUsed('currents'),
    );
  });

// ────────────────────────────────────────────────
// メインコマンド
// ────────────────────────────────────────────────
program
  .name('echo-news')
  .description('複数ニュースAPIを集約し重複排除して表示するCLIツール')
  .version('1.0.0')
  // 検索・絞り込み
  .option('--topic <keyword>',   'キーワード検索')
  .option('--lang <code>',       '言語コード（デフォルト: ja）', 'ja')
  .option('--country <code>',    '国コード（例: jp，us）')
  .option('--category <name>',   'カテゴリ（Currentsのみ: technology / sports / finance / science / world 等）')
  .option('--sort <order>',      '並び順 publishedAt | relevance（GNewsのみ）', 'publishedAt')
  .option('--from <date>',       '取得開始日（YYYY-MM-DD）')
  .option('--to <date>',         '取得終了日（YYYY-MM-DD）')
  // 表示件数・ソース
  .option('--limit <number>',    '表示件数（デフォルト: 10）', '10')
  .option('--source <provider>', 'プロバイダ gnews | currents | all（デフォルト: all）', 'all')
  // 出力形式
  .option('--url',               '記事URLを表示する')
  .option('--json',              'JSON形式で出力する')
  // 動作
  .option('--no-dedup',          '重複排除を無効にする')
  .option('--quota',             '今日の残りリクエスト数だけ表示して終了')
  .action(async (options) => {

    // --quota のみ表示して終了
    if (options.quota) {
      const usage = getUsage();
      printQuota(usage, 'all');
      return;
    }

    // バリデーション
    const limit = parseInt(options.limit, 10);
    if (isNaN(limit) || limit < 1) {
      printError('--limit には1以上の整数を指定してください．');
      process.exit(1);
    }

    const source = options.source as 'gnews' | 'currents' | 'all';
    if (!['gnews', 'currents', 'all'].includes(source)) {
      printError('--source には gnews / currents / all を指定してください．');
      process.exit(1);
    }

    if (!['publishedAt', 'relevance'].includes(options.sort)) {
      printError('--sort には publishedAt / relevance を指定してください．');
      process.exit(1);
    }

    // ── キー解決 ──────────────────────────────────
    const userCfg    = loadConfig();
    const devGnews   = process.env['GNEWS_API_KEY']    ?? '';
    const devCurrents = process.env['CURRENTS_API_KEY'] ?? '';

    const gnewsKeyInfo = {
      key:   userCfg.gnewsApiKey    ?? devGnews,
      isOwn: !!userCfg.gnewsApiKey,
    };
    const currentsKeyInfo = {
      key:   userCfg.currentsApiKey ?? devCurrents,
      isOwn: !!userCfg.currentsApiKey,
    };

    // キー存在チェック
    if ((source === 'gnews' || source === 'all') && !gnewsKeyInfo.key) {
      printError(
        'GNews API キーが見つかりません．\n' +
        '  自分のキーを設定: echo-news config set-key gnews <key>\n' +
        '  取得先: https://gnews.io/'
      );
      process.exit(1);
    }
    if ((source === 'currents' || source === 'all') && !currentsKeyInfo.key) {
      printError(
        'Currents API キーが見つかりません．\n' +
        '  自分のキーを設定: echo-news config set-key currents <key>\n' +
        '  取得先: https://currentsapi.services/'
      );
      process.exit(1);
    }

    // ── 共有キー利用者の日次制限チェック ──────────────
    if ((source === 'gnews' || source === 'all') && !gnewsKeyInfo.isOwn) {
      if (!isSharedAllowed('gnews', false)) {
        printError(
          `今日の GNews 共有キー利用上限（${SHARED_LIMITS.gnews}回/日）に達しました．\n` +
          '  自分のキーを設定すると制限なく使えます:\n' +
          '  echo-news config set-key gnews <key>  →  https://gnews.io/'
        );
        process.exit(1);
      }
    }
    if ((source === 'currents' || source === 'all') && !currentsKeyInfo.isOwn) {
      if (!isSharedAllowed('currents', false)) {
        printError(
          `今日の Currents 共有キー利用上限（${SHARED_LIMITS.currents}回/日）に達しました．\n` +
          '  自分のキーを設定すると制限なく使えます:\n' +
          '  echo-news config set-key currents <key>  →  https://currentsapi.services/'
        );
        process.exit(1);
      }
    }

    const spinner = ora('ニュースを取得中...').start();

    try {
      const aggregator = new NewsAggregator();
      const articles = await aggregator.aggregate({
        topic:       options.topic,
        lang:        options.lang,
        country:     options.country,
        category:    options.category,
        sort:        options.sort as 'publishedAt' | 'relevance',
        from:        options.from,
        to:          options.to,
        limit,
        source,
        noDedup:     !options.dedup,
        gnewsKey:    gnewsKeyInfo,
        currentsKey: currentsKeyInfo,
      });

      spinner.stop();

      if (articles.length === 0) {
        console.log('\n  該当する記事が見つかりませんでした．\n');
        return;
      }

      if (options.json) {
        printJson(articles);
      } else {
        articles.forEach((a, i) => printArticle(a, i + 1, options.url));
        printSummary(articles.length);
        const usage = getUsage();
        printQuota(usage, source);
      }

    } catch (err) {
      spinner.stop();
      const message = err instanceof Error ? err.message : String(err);
      printError(`ニュースの取得に失敗しました: ${message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
