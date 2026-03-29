import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const INPUT_CSV = path.resolve(ROOT_DIR, 'interneto-links.csv');
const OUTPUT_DIR = path.resolve(ROOT_DIR, 'docs');

const CATEGORY_CONFIG = [
  { folder: 'by-company', displayName: 'By Company', file: 'by-company.md', description: 'Useful services organized by company', icon: '🏢' },
  { folder: 'os', displayName: 'OS', file: 'os.md', description: 'Operating systems and tools', icon: '💻' },
  { folder: 'ai-tools-and-services', displayName: 'AI Tools & Services', file: 'ai-tools-and-services.md', description: 'Artificial Intelligence tools and services', icon: '🤖' },
  { folder: 'dev', displayName: 'Dev', file: 'dev.md', description: 'Development tools and resources', icon: '⚙️' },
  { folder: 'education', displayName: 'Education', file: 'education.md', description: 'Educational resources and platforms', icon: '📚' },
  { folder: 'file-management', displayName: 'File Management', file: 'file-management.md', description: 'File storage and management solutions', icon: '📁' },
  { folder: 'financial-assets', displayName: 'Financial Assets', file: 'financial-assets.md', description: 'Financial and investment tools', icon: '💰' },
  { folder: 'gaming', displayName: 'Gaming', file: 'gaming.md', description: 'Gaming platforms and services', icon: '🎮' },
  { folder: 'health-and-fitness', displayName: 'Health & Fitness', file: 'health-and-fitness.md', description: 'Health and fitness applications', icon: '💪' },
  { folder: 'home-and-family', displayName: 'Home & Family', file: 'home-and-family.md', description: 'Home automation and family services', icon: '🏠' },
  { folder: 'internet-communication', displayName: 'Internet Communication', file: 'intercomm.md', description: 'Communication and collaboration tools', icon: '💬' },
  { folder: 'multimedia', displayName: 'Multimedia', file: 'multimedia.md', description: 'Multimedia and content creation tools', icon: '🎬' },
  { folder: 'news-media', displayName: 'News Media', file: 'news-media.md', description: 'News and media platforms', icon: '📰' },
  { folder: 'office-and-productivity', displayName: 'Office & Productivity', file: 'office-and-productivity.md', description: 'Office and productivity applications', icon: '📊' },
  { folder: 'online-services', displayName: 'Online Services', file: 'online-services.md', description: 'Online services and utilities', icon: '🌐' },
  { folder: 'security-and-privacy', displayName: 'Security & Privacy', file: 'security-and-privacy.md', description: 'Security and privacy tools', icon: '🔒' },
  { folder: 'sys-admin', displayName: 'Sys Admin', file: 'sys-admin.md', description: 'System administration tools', icon: '🛠️' },
  { folder: 'time', displayName: 'Time', file: 'time.md', description: 'Time management and scheduling tools', icon: '⏰' },
  { folder: 'travel-and-location', displayName: 'Travel & Location', file: 'travel-and-location.md', description: 'Travel and location services', icon: '✈️' },
  { folder: 'utility', displayName: 'Utility', file: 'utility.md', description: 'Utility tools and applications', icon: '🔧' }
];

const CATEGORY_BY_FOLDER = new Map(CATEGORY_CONFIG.map((entry) => [entry.folder, entry]));

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    // Handle quoted field content
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    // Handle delimiter or quote start
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') {
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
    .map((s) => cleanText(s).toLowerCase().replace(/\s+/g, '-'))
    .filter(Boolean);
}

function extractSourceCodeUrls(note) {
  if (!note) return null;
  
  const sourceCodeMatch = note.match(/Source-code:\s*(.+?)(?=,\s*[A-Za-z]|$)/i);
  if (!sourceCodeMatch?.[1]) return null;
  
  const urls = sourceCodeMatch[1]
    .split(',')
    .map((url) => url.trim())
    .filter((url) => url.length > 0 && url.startsWith('http'));
  
  return urls.length > 0 ? urls : null;
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

function countItems(node) {
  let count = node.items.length;
  for (const child of node.children.values()) {
    count += countItems(child);
  }
  return count;
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

function buildItemLine(item) {
  let line = '- ';
  const titleLink = `[${escapeMd(item.title)}](${item.url})`;
  
  line += item.favorite ? `⭐ **${titleLink}**` : titleLink;
  
  if (item.sourceCodeUrls?.length > 0) {
    const codeLinks = item.sourceCodeUrls.map((url) => `[🔗](${url})`).join(', ');
    line += ` / ${codeLinks}`;
  }
  
  return line;
}

function renderItems(lines, items) {
  const sorted = [...items].sort((a, b) => {
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
    return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
  });

  sorted.forEach((item) => lines.push(buildItemLine(item)));
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

function isValidRowFolder(folderParts) {
  return folderParts.length >= 2 && folderParts[0] === 'apps';
}

function buildItemFromRow(row) {
  const title = toCamelCaseWords(row.title);
  const url = cleanText(row.url);
  
  if (!title || !url) return null;
  
  return {
    title,
    url,
    favorite: String(row.favorite || '').toLowerCase() === 'true',
    sourceCodeUrls: extractSourceCodeUrls(row.note)
  };
}

function processRowsIntoGroups(rows, groups) {
  let count = 0;
  
  for (const row of rows) {
    const folderParts = normalizeFolder(row.folder || '');
    
    if (!isValidRowFolder(folderParts)) continue;
    
    const categoryName = folderParts[1];
    if (!CATEGORY_BY_FOLDER.has(categoryName)) continue;
    
    const item = buildItemFromRow(row);
    if (!item) continue;
    
    addToTree(groups.get(categoryName), folderParts.slice(2), item);
    count += 1;
  }
  
  return count;
}

function writeGroupFiles(groups) {
  let count = 0;
  
  for (const category of CATEGORY_CONFIG) {
    const filePath = path.join(OUTPUT_DIR, category.file);
    const markdown = renderGroupFile(category.displayName, groups.get(category.folder), category.description);
    fs.writeFileSync(filePath, markdown, 'utf8');
    count += 1;
  }
  
  return count;
}


function renderGroupFile(groupName, group, description) {
  const lines = [
    `# ${escapeMd(groupName)}`,
    ''
  ];

  const totalBookmarks = countItems(group);
  lines.push(`**Total Bookmarks:** ${totalBookmarks}`);
  lines.push('');

  renderItems(lines, group.items);
  renderChildren(lines, group.children, 2);

  if (lines[lines.length - 1] !== '') {
    lines.push('');
  }

  return lines.join('\n');
}

function runLinting() {
  console.log('\n📋 Running markdown lint...');
  const result = spawnSync('node', [path.resolve(__dirname, 'lint-markdown.js')], {
    stdio: 'inherit',
    cwd: ROOT_DIR
  });
  
  if (result.error) {
    console.error('❌ Lint failed:', result.error.message);
    process.exit(1);
  }
  
  if (result.status !== 0) {
    console.warn('⚠️ Lint warnings found');
  }
}

function run() {
  if (!fs.existsSync(INPUT_CSV)) {
    throw new Error(`CSV file not found: ${INPUT_CSV}`);
  }

  const csv = fs.readFileSync(INPUT_CSV, 'utf8');
  const rows = parseCsv(csv);
  const groups = new Map(CATEGORY_CONFIG.map((entry) => [entry.folder, createNode()]));

  const included = processRowsIntoGroups(rows, groups);
  clearOutputFiles();
  const filesWritten = writeGroupFiles(groups);

  console.log(`Converted ${included} links into ${filesWritten} markdown files at: ${OUTPUT_DIR}`);
  runLinting();
}

run();
