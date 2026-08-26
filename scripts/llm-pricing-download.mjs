#!/usr/bin/env node
// Scrapes one LMArena leaderboard view into a TSV via Chrome DevTools Protocol
// (or a launched headless Chromium), for scripts/llm-pricing-update-elo.mjs.
// Ported from https://github.com/sanand0/llmpricing's download.py.
//
// Run with:
//   node scripts/llm-pricing-download.mjs <url> <output.tsv> [--browser auto|cdp|launch] [--executable path]

import { existsSync } from 'node:fs';
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const EXTRACT_SCRIPT = `
Array.from(document.querySelectorAll("table tr")).map(d => {
  const cells = d.querySelectorAll("td, th");
  const [model, score] = [(cells[2].querySelector("a")?.innerText ?? cells[2].innerText).split(/\\n/)[0], cells[3].innerText.split(/\\s/)[0]];
  return \`\${model}\\t\${score}\`;
}).join("\\n");
`.trim();

function defaultExecutable() {
  const configured = process.env.LLMPRICING_CHROMIUM;
  const candidates = [
    configured,
    process.platform === 'win32' ? `${process.env.LOCALAPPDATA}\\Chromium\\Application\\chrome.exe` : null,
    process.platform === 'win32' ? `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe` : null,
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

export async function downloadLeaderboard({ url, output, cdp = 'http://localhost:9222', browserMode = 'auto', executable = null, timeout = 60_000 }) {
  let browser = null;
  let ownsBrowser = false;

  if (browserMode === 'auto' || browserMode === 'cdp') {
    try {
      browser = await chromium.connectOverCDP(cdp, { timeout });
    } catch (error) {
      if (browserMode === 'cdp') throw error;
    }
  }
  if (!browser) {
    browser = await chromium.launch({ headless: true, executablePath: executable ?? undefined });
    ownsBrowser = true;
  }

  const context = browser.contexts()[0] ?? (await browser.newContext());
  const page = await context.newPage();
  let value;
  try {
    console.error(`Opening ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    await page.waitForFunction(
      () => [...document.querySelectorAll('table tr')].some((row) => row.querySelectorAll('td, th').length >= 4),
      { timeout }
    );
    value = await page.evaluate(EXTRACT_SCRIPT);
  } finally {
    await page.close();
    // Only close a browser we launched ourselves — a CDP-connected browser
    // belongs to the user's already-running Chrome and must be left open,
    // exactly like download.py's `if owns_browser: browser.close()`.
    if (ownsBrowser) await browser.close();
  }

  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('The leaderboard extraction returned no text.');
  }

  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, value.trimEnd() + '\n', 'utf8');
  const { size } = await stat(output);
  return {
    url,
    path: output,
    lines: value.split(/\r\n|\n/).filter((line) => line.trim()).length,
    bytes: size,
  };
}

function parseArgs(argv) {
  const positional = [];
  let cdp = 'http://localhost:9222';
  let browserMode = 'auto';
  let executable = null;
  let timeout = 60_000;
  let format = 'json';
  let describe = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--cdp') cdp = argv[++i];
    else if (arg === '--browser') browserMode = argv[++i];
    else if (arg === '--executable') executable = argv[++i];
    else if (arg === '--timeout') timeout = Number(argv[++i]);
    else if (arg === '--format') format = argv[++i];
    else if (arg === '--describe') describe = true;
    else positional.push(arg);
  }

  return { url: positional[0], output: positional[1], cdp, browserMode, executable, timeout, format, describe };
}

function describeContract() {
  console.log(
    JSON.stringify(
      {
        description: 'Download an LMArena leaderboard TSV with Playwright.',
        arguments: { url: 'Leaderboard URL to visit.', output: 'Path to write the TSV export.' },
        options: {
          '--browser': 'Browser mode: auto, cdp, or launch. Default: auto.',
          '--cdp': 'CDP endpoint used by cdp/auto mode. Default: http://localhost:9222',
          '--executable': 'Optional Chrome/Chromium executable for launch mode.',
          '--timeout': 'Navigation and table wait timeout in milliseconds.',
          '--format': 'Use json for structured output or text for a plain summary.',
          '--describe': 'Print this schema and exit.',
        },
        output: { url: 'Visited URL.', path: 'Written TSV path.', lines: 'Number of non-empty output lines.', bytes: 'Number of bytes written.' },
      },
      null,
      2
    )
  );
}

async function main() {
  const { url, output, cdp, browserMode, executable, timeout, format, describe } = parseArgs(process.argv.slice(2));

  if (describe) {
    describeContract();
    return;
  }
  if (!url || !output) {
    console.error('Error: URL and output path are required unless --describe is used.');
    process.exit(2);
  }
  if (!['json', 'text'].includes(format)) {
    console.error('Error: --format must be json or text.');
    process.exit(2);
  }
  if (!['auto', 'cdp', 'launch'].includes(browserMode)) {
    console.error('Error: --browser must be auto, cdp, or launch.');
    process.exit(2);
  }
  if (executable && !existsSync(executable)) {
    console.error(`Error: executable does not exist: ${executable}`);
    process.exit(2);
  }

  const resolvedExecutable = executable ?? defaultExecutable();

  let summary;
  try {
    summary = await downloadLeaderboard({ url, output: resolve(output), cdp, browserMode, executable: resolvedExecutable, timeout });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }

  if (format === 'json' || !process.stdout.isTTY) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`Wrote ${summary.lines} lines to ${summary.path}`);
  }
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
