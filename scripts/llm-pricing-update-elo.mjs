#!/usr/bin/env node
// Merges a scraped LMArena leaderboard TSV into src/data/llm-pricing/elo.csv,
// backfilling pricing/launch metadata from OpenRouter where blank.
// Ported from https://github.com/sanand0/llmpricing's scripts/update_elo.py.
//
// Run with:
//   node scripts/llm-pricing-update-elo.mjs <tsv-file> --column overall [--elo path] [--dry-run]

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  UpdateEloError,
  applyUpdates,
  fetchOpenRouterModels,
  OpenRouterMatcher,
  printSummary,
  readEloRows,
  readUpdates,
  resolveColumn,
  writeRows,
} from './lib/llm-pricing.mjs';

export async function updateElo({ filePath, column, eloPath = 'src/data/llm-pricing/elo.csv', dryRun = false }) {
  const { headers, rows } = readEloRows(eloPath);
  const targetColumn = resolveColumn(column, headers);
  const updates = readUpdates(filePath);
  const matcher = new OpenRouterMatcher(await fetchOpenRouterModels());

  const now = new Date();
  const summary = applyUpdates({ headers, rows, targetColumn, updates, matcher, now });

  if (!dryRun) writeRows(eloPath, headers, rows);

  printSummary(summary, { column, targetColumn, updateCount: updates.size, dryRun });
  return summary;
}

function parseArgs(argv) {
  const positional = [];
  let column = null;
  let eloPath = 'src/data/llm-pricing/elo.csv';
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--column' || arg === '-c') {
      column = argv[++i];
    } else if (arg === '--elo') {
      eloPath = argv[++i];
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else {
      positional.push(arg);
    }
  }

  return { filePath: positional[0], column, eloPath, dryRun };
}

async function main() {
  const { filePath, column, eloPath, dryRun } = parseArgs(process.argv.slice(2));
  if (!filePath || !column) {
    console.error('Usage: node scripts/llm-pricing-update-elo.mjs <tsv-file> --column overall|hard|coding [--elo path] [--dry-run]');
    process.exit(2);
  }

  try {
    await updateElo({ filePath: resolve(filePath), column, eloPath: resolve(eloPath), dryRun });
  } catch (error) {
    if (error instanceof UpdateEloError) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
