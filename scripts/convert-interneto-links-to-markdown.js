import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const INPUT_CSV = path.resolve(ROOT_DIR, 'interneto-links.csv');
const OUTPUT_DIR = path.resolve(ROOT_DIR, 'docs');

const CATEGORY_CONFIG = [
  { folder: 'by-Company', file: 'by-company.md' },
  { folder: 'OS', file: 'os.md' },
  { folder: 'Al Tools & Services', file: 'ai-tools-and-services.md' },
  { folder: 'Dev', file: 'dev.md' },
  { folder: 'Gaming', file: 'gaming.md' },
  { folder: 'Education', file: 'education.md' },
  { folder: 'File Management', file: 'file-management.md' },
  { folder: 'Financial assets', file: 'financial-assets.md' },
  { folder: 'Health & Fitness', file: 'health-and-fitness.md' },
  { folder: 'Home & Family', file: 'home-and-family.md' },
  { folder: 'InterComm', file: 'intercomm.md' },
  { folder: 'Multimedia', file: 'multimedia.md' },
  { folder: 'News Media', file: 'news-media.md' },
  { folder: 'Office & Productivity', file: 'office-and-productivity.md' },
  { folder: 'Online Services', file: 'online-services.md' },
  { folder: 'Security & Privacy', file: 'security-and-privacy.md' },
  { folder: 'Sys Admin', file: 'sys-admin.md' },
  { folder: 'Time', file: 'time.md' },
  { folder: 'Travel & Location', file: 'travel-and-location.md' },
  { folder: 'Utility', file: 'utility.md' }
];

const CATEGORY_BY_FOLDER = new Map(CATEGORY_CONFIG.map((entry) => [entry.folder, entry]));
const INPUT_CHILD_ALIAS = new Map([['AI Tools & Services', 'Al Tools & Services']]);

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

function cleanText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function escapeMd(text) {
  return cleanText(text).replace(/\[/g, '\\[').replace(/\]/g, '\\]');
}

function normalizeFolder(folder) {
  return folder
    .split('/')
    .map((s) => cleanText(s))
    .filter(Boolean)
    .map((s) => INPUT_CHILD_ALIAS.get(s) || s);
}

function safeUnlink(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function clearOutputFiles() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const category of CATEGORY_CONFIG) {
    safeUnlink(path.join(OUTPUT_DIR, category.file));
  }
}

function createNode() {
  return { items: [], children: new Map() };
}

function addToTree(group, pathParts, item) {
  if (!pathParts.length) {
    group.items.push(item);
    return;
  }

  let cursor = group.children;
  let node;
  for (const part of pathParts) {
    if (!cursor.has(part)) {
      cursor.set(part, createNode());
    }
    node = cursor.get(part);
    cursor = node.children;
  }
  node.items.push(item);
}

function renderItems(lines, items) {
  for (const item of items) {
    const star = item.favorite ? '⭐ ' : '';
    lines.push(`- ${star}[${escapeMd(item.title)}](${item.url})`);
  }
}

function renderChildren(lines, children, level) {
  for (const [name, node] of children) {
    lines.push('');
    lines.push(`${'#'.repeat(level)} ${escapeMd(name)}`);
    lines.push('');
    renderItems(lines, node.items);
    renderChildren(lines, node.children, level + 1);
  }
}

function renderGroupFile(groupName, group) {
  const lines = [`# ${escapeMd(groupName)}`, ''];

  renderItems(lines, group.items);
  renderChildren(lines, group.children, 2);

  if (lines[lines.length - 1] !== '') {
    lines.push('');
  }

  return lines.join('\n');
}

function run() {
  if (!fs.existsSync(INPUT_CSV)) {
    throw new Error(`CSV file not found: ${INPUT_CSV}`);
  }

  const csv = fs.readFileSync(INPUT_CSV, 'utf8');
  const rows = parseCsv(csv);

  const groups = new Map(CATEGORY_CONFIG.map((entry) => [entry.folder, createNode()]));
  let included = 0;

  for (const row of rows) {
    const folderParts = normalizeFolder(row.folder || '');
    if (folderParts.length < 2 || folderParts[0] !== 'Apps') continue;

    const child = folderParts[1];
    if (!CATEGORY_BY_FOLDER.has(child)) continue;

    const title = cleanText(row.title);
    const url = cleanText(row.url);
    if (!title || !url) continue;

    const item = {
      title,
      url,
      favorite: String(row.favorite || '').toLowerCase() === 'true'
    };

    addToTree(groups.get(child), folderParts.slice(2), item);
    included += 1;
  }

  clearOutputFiles();

  let filesWritten = 0;
  for (const category of CATEGORY_CONFIG) {
    const filePath = path.join(OUTPUT_DIR, category.file);
    const markdown = renderGroupFile(category.folder, groups.get(category.folder));
    fs.writeFileSync(filePath, markdown, 'utf8');
    filesWritten += 1;
  }

  const indexLines = ['# Apps Import', '', '## Categories', ''];
  for (const category of CATEGORY_CONFIG) {
    const href = `/${category.file.replace(/\.md$/i, '')}`;
    indexLines.push(`- [${category.folder}](${href})`);
  }
  indexLines.push('');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.md'), indexLines.join('\n'), 'utf8');

  console.log(`Converted ${included} links into ${filesWritten} markdown files at: ${OUTPUT_DIR}`);
}

run();
