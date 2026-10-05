#!/usr/bin/env node
// Overwrites existing cpmi values in src/data/llm-pricing/elo.csv with the
// current OpenRouter prompt price. The regular update only backfills blanks.
//
// Run with: node scripts/llm-pricing-reprice.mjs [--dry-run]

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  fetchOpenRouterModels,
  formatDecimal,
  OpenRouterMatcher,
  readEloRows,
  writeRows,
} from './lib/llm-pricing.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ELO_PATH = join(__dirname, '..', 'src', 'data', 'llm-pricing', 'elo.csv');
// A jump this large is more likely a promo/mislisted price or a wrong match than a real cut.
const MAX_RATIO = 10;

const dryRun = process.argv.includes('--dry-run');
const today = new Date().toISOString().slice(0, 10);
const matcher = new OpenRouterMatcher(await fetchOpenRouterModels());
const { headers, rows } = readEloRows(ELO_PATH);

let changed = 0;
const skipped = [];
for (const row of rows) {
  const old = Number(row.cpmi);
  if (!row.cpmi || !Number.isFinite(old) || old <= 0) continue;
  // Retired models keep the price they had while available ("2026-10?" is only a guess, not retired).
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(row.end) && row.end < today.slice(0, row.end.length)) continue;

  const match = matcher.match(row.model);
  if (!match || match.promptPrice <= 0) continue;
  const price = match.promptPrice * 1_000_000;
  if (Math.abs(price - old) < 1e-9) continue;

  const label = `${row.model}: ${row.cpmi} -> ${formatDecimal(price)} (${match.modelId})`;
  if (Math.max(price / old, old / price) > MAX_RATIO) {
    skipped.push(label);
    continue;
  }
  console.log(label);
  row.cpmi = formatDecimal(price);
  row.source = match.sourceUrl;
  changed += 1;
}

if (!dryRun) writeRows(ELO_PATH, headers, rows);
console.log(`${dryRun ? 'Dry run: would reprice' : 'Repriced'} ${changed} models.`);
if (skipped.length) console.log(`Skipped ${skipped.length} implausible changes (>${MAX_RATIO}x):\n  ${skipped.join('\n  ')}`);
