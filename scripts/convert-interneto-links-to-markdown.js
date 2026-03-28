import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const INPUT_CSV = path.resolve(ROOT_DIR, 'interneto-links.csv');
const OUTPUT_DIR = path.resolve(ROOT_DIR, 'docs');

const CATEGORY_CONFIG = [
  { folder: 'by-Company', file: 'by-company.md', description: 'Useful services organized by company' },
  { folder: 'OS', file: 'os.md', description: 'Operating systems and tools' },
  { folder: 'Al Tools & Services', file: 'ai-tools-and-services.md', description: 'Artificial Intelligence tools and services' },
  { folder: 'Dev', file: 'dev.md', description: 'Development tools and resources' },
  { folder: 'Education', file: 'education.md', description: 'Educational resources and platforms' },
  { folder: 'File Management', file: 'file-management.md', description: 'File storage and management solutions' },
  { folder: 'Financial assets', file: 'financial-assets.md', description: 'Financial and investment tools' },
  { folder: 'Gaming', file: 'gaming.md', description: 'Gaming platforms and services' },
  { folder: 'Health & Fitness', file: 'health-and-fitness.md', description: 'Health and fitness applications' },
  { folder: 'Home & Family', file: 'home-and-family.md', description: 'Home automation and family services' },
  { folder: 'InterComm', file: 'intercomm.md', description: 'Communication and collaboration tools' },
  { folder: 'Multimedia', file: 'multimedia.md', description: 'Multimedia and content creation tools' },
  { folder: 'News Media', file: 'news-media.md', description: 'News and media platforms' },
  { folder: 'Office & Productivity', file: 'office-and-productivity.md', description: 'Office and productivity applications' },
  { folder: 'Online Services', file: 'online-services.md', description: 'Online services and utilities' },
  { folder: 'Security & Privacy', file: 'security-and-privacy.md', description: 'Security and privacy tools' },
  { folder: 'Sys Admin', file: 'sys-admin.md', description: 'System administration tools' },
  { folder: 'Time', file: 'time.md', description: 'Time management and scheduling tools' },
  { folder: 'Travel & Location', file: 'travel-and-location.md', description: 'Travel and location services' },
  { folder: 'Utility', file: 'utility.md', description: 'Utility tools and applications' }
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

function toCamelCaseWords(text) {
  return cleanText(text)
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
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

function generateFrontmatter(title, description) {
  const today = new Date().toISOString().split('T')[0];
  return [
    '---',
    `title: ${title}`,
    `description: ${description}`,
    `date: ${today}`,
    'next: false',
    'prev: false',
    'footer: true',
    '---'
  ];
}

function renderGroupFile(groupName, group, description) {
  const lines = [
    ...generateFrontmatter(groupName, description),
    '',
    `# ${escapeMd(groupName)}`,
    ''
  ];

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

    const title = toCamelCaseWords(row.title);
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
    const markdown = renderGroupFile(category.folder, groups.get(category.folder), category.description);
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
