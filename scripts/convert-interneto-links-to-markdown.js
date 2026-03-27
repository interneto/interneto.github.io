import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const INPUT_CSV = path.resolve(ROOT_DIR, 'interneto-links.csv');
const OUTPUT_DIR = path.resolve(ROOT_DIR, 'docs', 'apps-import');

// Only these markdown files are generated.
const OUTPUT_FILES = [
  'by-Company',
  'OS',
  'Al Tools & Services',
  'Dev',
  'Gaming',
  'Educinancial assets',
  'Health & Fitness',
  'ily',
  'InterComm',
  'Multimedia',
  'News Media',
  'Office & Productivity',
  'Online Services',
  'Security & Privacy',
  'Sys Admin',
  'Time',
  'Travel & Location',
  'Utility'
] as const;

const OUTPUT_FILE_SET = new Set(OUTPUT_FILES);

// Maps Apps first-level children from CSV to one of OUTPUT_FILES.
const INPUT_CHILD_TO_OUTPUT = new Map([
  ['by-Company', 'by-Company'],
  ['OS', 'OS'],
  ['AI Tools & Services', 'Al Tools & Services'],
  ['Al Tools & Services', 'Al Tools & Services'],
  ['Dev', 'Dev'],
  ['Gaming', 'Gaming'],
  ['Education', 'Educinancial assets'],
  ['Financial assets', 'Educinancial assets'],
  ['Health & Fitness', 'Health & Fitness'],
  ['Home & Family', 'ily'],
  ['InterComm', 'InterComm'],
  ['Multimedia', 'Multimedia'],
  ['News Media', 'News Media'],
  ['Office & Productivity', 'Office & Productivity'],
  ['Online Services', 'Online Services'],
  ['Security & Privacy', 'Security & Privacy'],
  ['Sys Admin', 'Sys Admin'],
  ['Time', 'Time'],
  ['Travel & Location', 'Travel & Location'],
  ['Utility', 'Utility']
]);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"') {
        if (next === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    if (ch !== '\r') {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (!rows.length) return [];

  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((values) => {
    const out = {};
    headers.forEach((h, idx) => {
      out[h] = values[idx] ?? '';
    });
    return out;
  });
}

function slugify(segment) {
  return segment
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function cleanText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function escapeMd(text) {
  return cleanText(text).replace(/\[/g, '\\[').replace(/\]/g, '\\]');
}

function headingAnchor(text) {
  return cleanText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function tagsToHashtags(tags) {
  if (!tags || !tags.trim()) return '';

  const tokens = tags
    .split(',')
    .map((t) => cleanText(t))
    .filter(Boolean)
    .map((t) => {
      const collapsed = t
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .replace(/_{2,}/g, '_');
      return collapsed ? `#${collapsed}` : '';
    })
    .filter(Boolean);

  return tokens.join(' ');
}

function normalizeFolder(folder) {
  return folder
    .split('/')
    .map((s) => cleanText(s))
    .filter(Boolean)
    .map((s) => (s === 'Al Tools & Services' ? 'AI Tools & Services' : s));
}

function toOutputFileName(groupName) {
  return `${groupName}.md`;
}

function toSectionName(folderParts) {
  if (folderParts.length <= 2) return 'General';
  return folderParts.slice(2).join(' / ');
}

function createBuckets() {
  const buckets = new Map();
  for (const fileName of OUTPUT_FILES) {
    buckets.set(fileName, new Map());
  }
  return buckets;
}

function sortItems(items) {
  return [...items].sort((a, b) => {
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
}

function renderGroupFile(groupName, sections) {
  const lines = [];
  lines.push(`# ${escapeMd(groupName)}`);
  lines.push('');

  const sectionNames = [...sections.keys()].sort((a, b) => {
    if (a === 'General') return -1;
    if (b === 'General') return 1;
    return a.localeCompare(b);
  });

  if (sectionNames.length) {
    lines.push('## Subfolders');
    lines.push('');
    for (const sectionName of sectionNames) {
      const anchorTitle = sectionName === 'General' ? groupName : sectionName;
      lines.push(`- [${escapeMd(sectionName)}](#${headingAnchor(anchorTitle)})`);
    }
    lines.push('');
  }

  for (const sectionName of sectionNames) {
    const heading = sectionName === 'General' ? groupName : sectionName;
    const items = sortItems(sections.get(sectionName) || []);

    lines.push(`## ${escapeMd(heading)}`);
    lines.push('');

    for (const item of items) {
      const star = item.favorite ? '⭐ ' : '';
      const title = escapeMd(item.title || item.url || 'Untitled');
      const url = cleanText(item.url);
      const excerpt = escapeMd(item.excerpt);
      const hashtags = tagsToHashtags(item.tags);

      let suffix = '';
      if (excerpt && hashtags) suffix = `: ${excerpt} ${hashtags}`;
      else if (excerpt) suffix = `: ${excerpt}`;
      else if (hashtags) suffix = `: ${hashtags}`;

      lines.push(`- ${star}[${title}](${url})${suffix}`);
    }

    if (!items.length) {
      lines.push('_No links found._');
    }

    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function clearOutputDir() {
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function run() {
  if (!fs.existsSync(INPUT_CSV)) {
    throw new Error(`CSV file not found: ${INPUT_CSV}`);
  }

  const csv = fs.readFileSync(INPUT_CSV, 'utf8');
  const rows = parseCsv(csv);

  const buckets = createBuckets();
  let included = 0;

  for (const row of rows) {
    const folderParts = normalizeFolder(row.folder || '');
    if (folderParts.length < 2 || folderParts[0] !== 'Apps') continue;

    const outputName = INPUT_CHILD_TO_OUTPUT.get(folderParts[1]);
    if (!outputName || !OUTPUT_FILE_SET.has(outputName)) continue;

    const sections = buckets.get(outputName);
    const sectionName = toSectionName(folderParts);
    if (!sections.has(sectionName)) {
      sections.set(sectionName, []);
    }

    sections.get(sectionName).push({
      title: row.title || '',
      url: row.url || '',
      tags: row.tags || '',
      excerpt: row.excerpt || '',
      favorite: String(row.favorite || '').toLowerCase() === 'true'
    });
    included += 1;
  }

  clearOutputDir();

  let filesWritten = 0;
  for (const outputName of OUTPUT_FILES) {
    const sections = buckets.get(outputName);
    const filePath = path.join(OUTPUT_DIR, toOutputFileName(outputName));
    const markdown = renderGroupFile(outputName, sections);
    fs.writeFileSync(filePath, markdown, 'utf8');
    filesWritten += 1;
  }

  console.log(`Converted ${included} links into ${filesWritten} markdown files at: ${OUTPUT_DIR}`);
}

run();
