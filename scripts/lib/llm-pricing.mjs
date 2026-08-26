// Shared CSV + OpenRouter-matching logic for the llm-pricing update tooling.
// Ported from https://github.com/sanand0/llmpricing's scripts/update_elo.py.

import { readFileSync, writeFileSync } from 'node:fs';
import * as d3 from 'd3';

export const COLUMN_ALIASES = {
  text: 'overall',
  overall: 'overall',
  hard: 'hard',
  code: 'coding',
  coding: 'coding',
};

const PAREN_SUFFIX = /\s*\([^)]*\)\s*$/;
const LATEST_SUFFIX = /-latest$/i;
const EFFORT_SUFFIX = /-(?:high|medium|low)$/i;
const REASONING_SUFFIX = /-(?:thinking|reasoning|no-thinking|non-thinking)$/i;
const BETA_SUFFIX = /-beta(?:-\d+|\d+)?$/i;
const RELEASE_SUFFIXES = [
  /-(?:20\d{2}(?:[-.]\d{2}){1,2})$/,
  /-(?:\d{2}(?:[-.]\d{2}){2})$/,
  /-\d{8}$/,
  /-\d{4}$/,
];

const TOKENS_PER_MILLION = 1_000_000;

export class UpdateEloError extends Error {}

export function normalizeKey(value) {
  let normalized = value.toLowerCase();
  normalized = normalized.replace(/[^a-z0-9]+/g, '-');
  normalized = normalized.replace(/-+/g, '-');
  return normalized.replace(/^-+|-+$/g, '');
}

function dropProviderPrefix(value) {
  const providerless = value.includes('/') ? value.split('/').slice(1).join('/') : value;
  return providerless.split(':')[0];
}

function generateLookupKeys(model) {
  const values = new Set([model.modelId, dropProviderPrefix(model.modelId)]);
  if (model.canonicalSlug) {
    values.add(model.canonicalSlug);
    values.add(dropProviderPrefix(model.canonicalSlug));
  }
  return new Set([...values].filter(Boolean).map(normalizeKey));
}

const dropParentheticalSuffix = (value) => value.replace(PAREN_SUFFIX, '').trim();
const dropLatestSuffix = (value) => value.replace(LATEST_SUFFIX, '').replace(/[- ]+$/, '');
const dropEffortSuffix = (value) => value.replace(EFFORT_SUFFIX, '').replace(/[- ]+$/, '');
const dropReasoningSuffix = (value) => value.replace(REASONING_SUFFIX, '').replace(/[- ]+$/, '');
const dropBetaSuffix = (value) => value.replace(BETA_SUFFIX, '').replace(/[- ]+$/, '');
function dropReleaseSuffix(value) {
  let trimmed = value;
  for (const pattern of RELEASE_SUFFIXES) {
    trimmed = trimmed.replace(pattern, '').replace(/[- ]+$/, '');
  }
  return trimmed;
}

const TRANSFORMS = [
  dropParentheticalSuffix,
  dropLatestSuffix,
  dropReasoningSuffix,
  dropEffortSuffix,
  dropBetaSuffix,
  dropReleaseSuffix,
];

export function generateCandidateKeys(modelName) {
  const queue = [modelName.trim()];
  const seenValues = new Set();
  const orderedKeys = [];
  const seenKeys = new Set();

  while (queue.length > 0) {
    const current = queue.shift().trim();
    if (!current || seenValues.has(current)) continue;
    seenValues.add(current);

    const key = normalizeKey(current);
    if (key && !seenKeys.has(key)) {
      orderedKeys.push(key);
      seenKeys.add(key);
    }

    for (const transform of TRANSFORMS) {
      const transformed = transform(current);
      if (transformed && transformed !== current && !seenValues.has(transformed)) {
        queue.push(transformed);
      }
    }
  }

  return orderedKeys;
}

export class OpenRouterMatcher {
  constructor(models) {
    this.lookup = new Map();
    for (const model of models) {
      for (const key of generateLookupKeys(model)) {
        if (!this.lookup.has(key)) this.lookup.set(key, []);
        this.lookup.get(key).push(model);
      }
    }
  }

  match(modelName) {
    for (const key of generateCandidateKeys(modelName)) {
      const match = this._resolveHits(this.lookup.get(key) ?? []);
      if (match) return match;
    }
    return null;
  }

  _resolveHits(hits) {
    const uniqueById = new Map(hits.map((hit) => [hit.modelId, hit]));
    const uniqueHits = [...uniqueById.values()];
    if (uniqueHits.length === 0) return null;
    if (uniqueHits.length === 1) return uniqueHits[0];

    const paidHits = uniqueHits.filter((hit) => !hit.modelId.endsWith(':free'));
    if (paidHits.length === 1) return paidHits[0];
    return null;
  }
}

export function resolveColumn(columnName, headers) {
  const resolved = COLUMN_ALIASES[columnName.toLowerCase()];
  if (!resolved) {
    const options = Object.keys(COLUMN_ALIASES).sort().join(', ');
    throw new UpdateEloError(`Unsupported column ${JSON.stringify(columnName)}. Use one of: ${options}.`);
  }
  if (!headers.includes(resolved)) {
    throw new UpdateEloError(`elo.csv does not have a ${JSON.stringify(resolved)} column.`);
  }
  return resolved;
}

export function readUpdates(tsvPath) {
  const text = readFileSync(tsvPath, 'utf8');
  const rows = d3.tsvParseRows(text);
  if (rows.length === 0) {
    throw new UpdateEloError(`${tsvPath} is empty.`);
  }

  const updates = new Map();
  const dataRows = rows.slice(1);
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const lineNumber = i + 2;
    if (row.length === 0 || row.every((cell) => !cell.trim())) continue;
    if (row.length < 2) {
      throw new UpdateEloError(`${tsvPath}:${lineNumber} must have at least two TSV columns.`);
    }
    const model = row[0].trim();
    const score = row[1].trim();
    if (!model) throw new UpdateEloError(`${tsvPath}:${lineNumber} is missing the model name.`);
    if (!score) throw new UpdateEloError(`${tsvPath}:${lineNumber} is missing the score value.`);
    if (!Number.isFinite(Number(score))) {
      throw new UpdateEloError(`${tsvPath}:${lineNumber} has a non-numeric score ${JSON.stringify(score)}.`);
    }
    updates.set(model, score);
  }

  if (updates.size === 0) throw new UpdateEloError(`${tsvPath} does not contain any data rows.`);
  return updates;
}

export function readEloRows(eloPath) {
  const text = readFileSync(eloPath, 'utf8');
  const parsed = d3.csvParse(text);
  if (!parsed.columns || parsed.columns.length === 0) {
    throw new UpdateEloError(`${eloPath} is missing a header row.`);
  }
  const rows = parsed.map((row) => {
    const normalized = {};
    for (const key of parsed.columns) normalized[key] = row[key] ?? '';
    return normalized;
  });
  return { headers: [...parsed.columns], rows };
}

export function writeRows(eloPath, headers, rows) {
  writeFileSync(eloPath, d3.csvFormat(rows, headers) + '\n', 'utf8');
}

export async function fetchOpenRouterModels() {
  const response = await fetch('https://openrouter.ai/api/v1/models');
  if (!response.ok) {
    throw new UpdateEloError(`OpenRouter models request failed: ${response.status} ${response.statusText}`);
  }
  const payload = await response.json();
  if (!payload || !Array.isArray(payload.data)) {
    throw new UpdateEloError('OpenRouter returned an unexpected models payload.');
  }

  const models = [];
  for (const item of payload.data) {
    const modelId = item.id;
    const promptPrice = item.pricing?.prompt;
    if (!modelId || promptPrice === undefined || promptPrice === null || promptPrice === '') continue;
    const price = Number(promptPrice);
    if (!Number.isFinite(price)) continue;
    models.push({
      modelId: String(modelId),
      canonicalSlug: String(item.canonical_slug ?? ''),
      promptPrice: price,
      launchLabel: inferOpenRouterLaunchLabel(item.created),
      get sourceUrl() {
        return `https://openrouter.ai/${this.modelId.split(':')[0]}`;
      },
    });
  }
  return models;
}

export function formatDecimal(value) {
  if (Number.isInteger(value)) return String(value);
  // Existing elo.csv cpmi values go to 3-4 decimal places (e.g. 0.7448,
  // 0.435) — Python's Decimal preserves full precision here, so don't
  // round to a fixed 2 places. toFixed(10) also absorbs float noise
  // (e.g. 0.30000000000000004) before the trailing zeros are trimmed.
  return value.toFixed(10).replace(/0+$/, '').replace(/\.$/, '');
}

export function monthLabel(now, { monthOffset = 0, approximate = true } = {}) {
  const totalMonths = now.getUTCFullYear() * 12 + now.getUTCMonth() + monthOffset;
  const year = Math.floor(totalMonths / 12);
  const monthIndex = ((totalMonths % 12) + 12) % 12;
  const suffix = approximate ? '?' : '';
  return `${String(year).padStart(4, '0')}-${String(monthIndex + 1).padStart(2, '0')}${suffix}`;
}

function inferOpenRouterLaunchLabel(created) {
  if (created === undefined || created === null || created === '') return null;
  const timestamp = Number(created);
  if (!Number.isFinite(timestamp)) return null;
  const createdAt = new Date(timestamp * 1000);
  if (Number.isNaN(createdAt.getTime())) return null;
  return monthLabel(createdAt, { approximate: false });
}

function parseRankValue(value, context) {
  const stripped = value.trim();
  if (!stripped) return null;
  const parsed = Number(stripped);
  if (!Number.isFinite(parsed)) {
    throw new UpdateEloError(`${context} has a non-numeric value ${JSON.stringify(value)}.`);
  }
  return parsed;
}

function insertRowByScore(rows, newRow, targetColumn) {
  const newScore = parseRankValue(newRow[targetColumn], `new row ${newRow.model} ${targetColumn}`);
  if (newScore === null) {
    rows.push(newRow);
    return;
  }
  for (let i = 0; i < rows.length; i++) {
    const existingScore = parseRankValue(rows[i][targetColumn], `elo.csv row ${rows[i].model} ${targetColumn}`);
    if (existingScore === null || existingScore < newScore) {
      rows.splice(i, 0, newRow);
      return;
    }
  }
  rows.push(newRow);
}

function newRow(headers, modelName) {
  const row = {};
  for (const header of headers) row[header] = '';
  row.model = modelName;
  return row;
}

function updateOpenRouterMetadata(row, modelName, matcher) {
  const needsPricing = !row.cpmi || !row.source;
  const needsLaunch = !row.launch;
  if (!needsPricing && !needsLaunch) {
    return { pricingUpdated: false, launchUpdated: false, missingMatch: false };
  }

  const match = matcher.match(modelName);
  if (!match) {
    return { pricingUpdated: false, launchUpdated: false, missingMatch: true };
  }

  let pricingUpdated = false;
  if (!row.cpmi) {
    const cpmiValue = match.promptPrice * TOKENS_PER_MILLION;
    row.cpmi = cpmiValue <= 0 ? '' : formatDecimal(cpmiValue);
    pricingUpdated = true;
  }
  if (!row.source) {
    row.source = match.sourceUrl;
    pricingUpdated = true;
  }

  let launchUpdated = false;
  if (!row.launch && match.launchLabel) {
    row.launch = match.launchLabel;
    launchUpdated = true;
  }

  return { pricingUpdated, launchUpdated, missingMatch: false };
}

function fillMissingEndDates(rows, presentModels, endLabel) {
  let filled = 0;
  for (const row of rows) {
    if (presentModels.has(row.model) || row.end) continue;
    row.end = endLabel;
    filled += 1;
  }
  return filled;
}

export function applyUpdates({ headers, rows, targetColumn, updates, matcher, now }) {
  const summary = { added: 0, updated: 0, priced: 0, launched: 0, ended: 0, unmatchedOpenrouter: [] };
  const rowsByModel = new Map(rows.map((row) => [row.model, row]));
  const newRows = [];

  for (const [modelName, score] of updates) {
    let row = rowsByModel.get(modelName);
    const isNew = !row;
    if (!row) {
      row = newRow(headers, modelName);
      rowsByModel.set(modelName, row);
      newRows.push(row);
      summary.added += 1;
    } else {
      summary.updated += 1;
    }

    row[targetColumn] = score;

    const metadataUpdate = updateOpenRouterMetadata(row, modelName, matcher);
    if (metadataUpdate.missingMatch) summary.unmatchedOpenrouter.push(modelName);
    if (metadataUpdate.pricingUpdated) summary.priced += 1;
    if (metadataUpdate.launchUpdated) summary.launched += 1;
    if (isNew && !row.launch) row.launch = monthLabel(now, { monthOffset: -1 });
  }

  for (const row of newRows) insertRowByScore(rows, row, targetColumn);

  if (targetColumn === 'overall') {
    summary.ended = fillMissingEndDates(rows, new Set(updates.keys()), monthLabel(now));
  }

  return summary;
}

export function printSummary(summary, { column, targetColumn, updateCount, dryRun }) {
  const displayColumn = column.toLowerCase() === targetColumn ? column : `${column} -> ${targetColumn}`;
  console.log(
    `${dryRun ? 'Dry run:' : 'Updated'} ${summary.updated} existing rows and added ${summary.added} new rows ` +
      `for ${displayColumn} (${updateCount} input models).`
  );
  console.log(`Updated pricing metadata for ${summary.priced} touched models from OpenRouter.`);
  if (summary.launched) console.log(`Updated launch dates for ${summary.launched} touched models from OpenRouter.`);
  if (summary.ended) console.log(`Filled blank end dates for ${summary.ended} rows missing from the overall TSV.`);
  if (summary.unmatchedOpenrouter.length) {
    const preview = summary.unmatchedOpenrouter.slice(0, 10).join(', ');
    const suffix = summary.unmatchedOpenrouter.length > 10 ? ', ...' : '';
    console.log(`No safe OpenRouter match for ${summary.unmatchedOpenrouter.length} touched models: ${preview}${suffix}`);
  }
}
