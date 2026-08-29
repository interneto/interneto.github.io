#!/usr/bin/env node
// Refreshes src/data/llm-pricing/elo.csv from all three LMArena leaderboard
// views. Node port of https://github.com/sanand0/llmpricing's update.sh.
//
// Run with: node scripts/llm-pricing-update.mjs
// Optional: LLMPRICING_CHROMIUM=/path/to/chrome node scripts/llm-pricing-update.mjs

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { downloadLeaderboard } from './llm-pricing-download.mjs';
import { updateElo } from './llm-pricing-update-elo.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ELO_PATH = join(__dirname, '..', 'src', 'data', 'llm-pricing', 'elo.csv');

const VIEWS = [
  { url: 'https://lmarena.ai/leaderboard/text', column: 'overall' },
  { url: 'https://lmarena.ai/leaderboard/text/hard-prompts', column: 'hard' },
  { url: 'https://lmarena.ai/leaderboard/text/coding', column: 'coding' },
];

const tmpDir = mkdtempSync(join(tmpdir(), 'llm-pricing-'));
try {
  for (const { url, column } of VIEWS) {
    const output = join(tmpDir, `${column}.tsv`);
    console.log(`Downloading ${column} leaderboard from ${url}`);
    await downloadLeaderboard({
      url,
      output,
      browserMode: 'auto',
      executable: process.env.LLMPRICING_CHROMIUM || null,
    });

    console.log(`Updating elo.csv column ${column}`);
    await updateElo({ filePath: output, column, eloPath: ELO_PATH });
  }
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}
