/**
 * add-agent-tags.mjs
 *
 * Adds a `tags` array to every entry in public/pkgs/agents-pkgs.json.
 * Tags are one or more of: MCP, Plugin, Skill, Hook.
 *
 * The mapping is explicit per agent (source of truth), so it's reproducible
 * and reviewable. Run with: node scripts/add-agent-tags.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, '..', 'public', 'pkgs', 'agents-pkgs.json');

// Explicit per-agent tags. MCP servers get ["MCP"]; plugins/skills get
// ["Plugin","Skill"]; marketplaces get ["Plugin"]; hooks get ["Plugin","Hook"].
const TAGS = {
  // ---- MCP servers ----
  'ableton-mcp': ['MCP'],
  'adobe-creativity': ['MCP'],
  'affinity': ['MCP'],
  'blender-mcp': ['MCP'],
  'chrome-devtools': ['MCP'],
  'cloudflare': ['MCP'],
  'codebase-memory-mcp': ['MCP'],
  'comfyui-mcp': ['MCP'],
  'composio': ['MCP'],
  'context7': ['MCP', 'Plugin'],
  'dashboard-icons': ['MCP'],
  'daw-mcp': ['MCP'],
  'elevenlabs': ['MCP'],
  'exa': ['MCP'],
  'figma': ['MCP'],
  'filesystem': ['MCP'],
  'firecrawl-mcp': ['MCP'],
  'fl-studio-mcp': ['MCP'],
  'github': ['MCP'],
  'grafana': ['MCP'],
  'guitar-pro-mcp': ['MCP'],
  'hyperframes': ['MCP'],
  'kubernetes': ['MCP'],
  'linear': ['MCP'],
  'magnific': ['MCP'],
  'musescore-mcp': ['MCP'],
  'notion': ['MCP'],
  'playwright': ['MCP', 'Plugin'],
  'postgres': ['MCP'],
  'raindrop': ['MCP'],
  'reaper-mcp': ['MCP'],
  'runnet': ['MCP'],
  'ruview': ['MCP'],
  'sentry': ['MCP'],
  'serena': ['MCP'],
  'stripe': ['MCP'],
  'suno': ['MCP'],
  'supabase': ['MCP'],
  'vercel': ['MCP'],

  // ---- Plugins / Skills ----
  'academic-research-skills': ['Plugin', 'Skill'],
  'agent-skills': ['Plugin', 'Skill'],
  'ast-grep': ['Plugin', 'Skill'],
  'brand-voice': ['Plugin', 'Skill'],
  'build-web-apps': ['Plugin', 'Skill'],
  'canva': ['Plugin', 'Skill'],
  'caveman': ['Plugin', 'Skill'],
  'claude-md-management': ['Plugin', 'Skill'],
  'claude-plugins-official': ['Plugin'],
  'code-simplifier': ['Plugin', 'Skill'],
  'codex': ['Plugin', 'Skill'],
  'design': ['Plugin', 'Skill'],
  'diagram-design': ['Plugin', 'Skill'],
  'engineering': ['Plugin', 'Skill'],
  'firecrawl-cli': ['Plugin', 'Skill'],
  'frontend-design': ['Plugin', 'Skill'],
  'higgsfield-ai-skills': ['Plugin', 'Skill'],
  'hookify': ['Plugin', 'Hook'],
  'knowledge-work-plugins': ['Plugin'],
  'marketing': ['Plugin', 'Skill'],
  'obsidian': ['Plugin', 'Skill'],
  'pdf-viewer': ['Plugin', 'Skill'],
  'php-lsp': ['Plugin', 'Skill'],
  'ponytail': ['Plugin', 'Hook'],
  'postiz': ['Plugin', 'Skill'],
  'productivity': ['Plugin', 'Skill'],
  'pyright-lsp': ['Plugin', 'Skill'],
  'superpowers': ['Plugin', 'Skill'],
  'typescript-lsp': ['Plugin', 'Skill'],
};

const data = JSON.parse(readFileSync(FILE, 'utf8'));
const agents = data.agents;

let added = 0;
let missing = [];

for (const [id, entry] of Object.entries(agents)) {
  const tags = TAGS[id];
  if (!tags) {
    missing.push(id);
    continue;
  }
  entry.tags = tags;
  added++;
}

writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');

console.log(`Added tags to ${added} agents.`);
if (missing.length) {
  console.warn(`No tag mapping for ${missing.length} agent(s): ${missing.join(', ')}`);
} else {
  console.log('All agents have a tag mapping.');
}
