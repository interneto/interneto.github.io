/**
 * generate-agents-pkgs.mjs
 *
 * Expands agents-pkgs.source.json (hand-maintained, templated) into
 * public/pkgs/agents-pkgs.json (the flat file the site actually fetches
 * at runtime - see src/scripts/toolbox-installer/agents-app.ts).
 *
 * Why a separate source + generator instead of hand-editing the served
 * file directly: ~45% of entries repeated the same install command
 * per-agent, differing only by the agent's CLI verb (claude/codex/copilot),
 * or shared a marketplace/plugin-hub template with only the plugin name
 * varying. Templating the *source* keeps the runtime file's shape exactly
 * as before (agents-app.ts needs zero changes) while making the common
 * cases a few lines instead of a full duplicated command block.
 *
 * An entry can use EITHER:
 *   "install": { "template": "<key in installTemplates>", "vars": {...} }
 *     - expands to one { agent, cmd } per key in that template
 *   "install": { "agents": ["claude","codex",...], "cmd": "..." }
 *     - the same literal command, listed for each agent (no vars needed)
 * OR (for anything that doesn't fit a template, which is most entries -
 * every agent's command differs in some real way, not just an agent name):
 *   "installs": [ { "agent": "...", "cmd": "..." }, ... ]
 *     - passed through unchanged, exactly like the current file's shape
 *
 * Run with: node scripts/generate-agents-pkgs.mjs
 * Verify nothing changed unexpectedly with: git diff public/pkgs/agents-pkgs.json
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE_FILE = join(__dirname, 'agents-pkgs.source.json');
const OUTPUT_FILE = join(__dirname, '..', 'public', 'pkgs', 'agents-pkgs.json');

function fillTemplate(str, vars, id) {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in vars)) throw new Error(`"${id}" install.vars is missing "${key}" used by its template`);
    return vars[key];
  });
}

function expandInstall(id, install, templates) {
  if (install.template) {
    const tpl = templates[install.template];
    if (!tpl) throw new Error(`Unknown installTemplate "${install.template}" referenced by "${id}"`);
    const vars = { plugin: id, prefix: '', ...install.vars };
    const results = Object.entries(tpl).map(([agent, pattern]) => ({ agent, cmd: fillTemplate(pattern, vars, id) }));
    // A real {{prefix}} step (e.g. "npm install -g X && ") plus a template
    // with no npx command of its own means the npx/no-CLI case is just the
    // prefix step alone (e.g. "npm install -g X").
    if (vars.prefix && tpl.npx === undefined) {
      results.push({ agent: 'npx', cmd: vars.prefix.replace(/\s*&&\s*$/, '') });
    }
    return results;
  }
  // Literal multi-agent shortcut: same cmd, listed for each agent.
  return install.agents.map(agent => ({ agent, cmd: install.cmd }));
}

const source = JSON.parse(readFileSync(SOURCE_FILE, 'utf8'));
const { installTemplates, agents } = source;

const outAgents = {};
for (const [id, entry] of Object.entries(agents)) {
  // Preserve source key order (installs/install occupies the same slot in
  // the output either way) so a re-run diffs cleanly against a
  // hand-edited served file - object key order doesn't affect the app,
  // but a noisy diff makes real changes harder to spot on review.
  const out = {};
  for (const [key, value] of Object.entries(entry)) {
    if (key === 'install') {
      out.installs = expandInstall(id, value, installTemplates);
    } else if (key === 'installs') {
      out.installs = value;
    } else {
      out[key] = value;
    }
  }
  outAgents[id] = out;
}

// Every agent the entry claims compatibility with needs an actual install
// command, or the toolbox shows an enabled checkbox that generates nothing.
for (const [id, out] of Object.entries(outAgents)) {
  const have = new Set((out.installs || []).map(i => i.agent));
  for (const [agent, compatible] of Object.entries(out.agent_compat || {})) {
    if (compatible && !have.has(agent)) {
      throw new Error(`"${id}" claims agent_compat.${agent} but has no install command for it`);
    }
  }
}

const output = { agents: outAgents };
writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2) + '\n', 'utf8');
console.log(`Generated ${OUTPUT_FILE} from ${Object.keys(agents).length} source entries.`);
