// Minimal Raindrop REST client shared by the fetch scripts. GET only.

export const API = 'https://api.raindrop.io/rest/v1'
export const PER_PAGE = 50 // API maximum
// Off-limits roots (docs/RAINDROP-CLEANUP.md): never written to any snapshot or database.
export const EXCLUDED_ROOT_IDS = [19044358, 71411789]

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export function requireToken() {
  const token = process.env.RAINDROP_TOKEN
  if (!token) {
    console.error('❌ RAINDROP_TOKEN is not set. Put RAINDROP_TOKEN=... in .env (gitignored); see scripts/db/fetch-raindrop.js.')
    process.exit(1)
  }
  return token
}

export function createClient(token) {
  return async function get(route) {
    for (let attempt = 0; ; attempt++) {
      let res
      try {
        res = await fetch(`${API}${route}`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) return await res.json()
      } catch (error) {
        // Dropped connections (ECONNRESET) happen over ~950 requests; retry rather than lose the run.
        if (attempt >= 5) throw error
        await sleep(3000 * (attempt + 1))
        continue
      }
      // 120 requests/minute; the reset header is a unix timestamp.
      if ((res.status === 429 || res.status >= 500) && attempt < 5) {
        const reset = Number(res.headers.get('x-ratelimit-reset')) * 1000 - Date.now()
        // No usable header -> wait out a full rate-limit window.
        await sleep(reset > 0 && reset < 120000 ? reset + 1000 : 61000)
        continue
      }
      throw new Error(`GET ${route} -> ${res.status} ${res.statusText}`)
    }
  }
}

/**
 * Calls a tool on Raindrop's MCP server with the same token as the REST API, and returns the
 * tool's JSON reply. Used for writes: the MCP tools can update but never delete or merge.
 */
export function createMcpClient(token) {
  const url = 'https://api.raindrop.io/rest/v2/ai/mcp'
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' }
  let id = 0
  const rpc = async (method, params) => {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }) })
    if (!res.ok) throw new Error(`MCP ${method} -> ${res.status} ${res.statusText}`)
    return res.json()
  }
  const ready = rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'bookmark-mirror', version: '1' } })
  return async function callTool(name, args) {
    await ready
    const reply = await rpc('tools/call', { name, arguments: args })
    const text = reply.result?.content?.[0]?.text
    if (reply.error || reply.result?.isError) throw new Error(`MCP ${name}: ${reply.error?.message ?? text ?? 'error'}`)
    return JSON.parse(text ?? '{}')
  }
}

/** Bookmarks of a collection touched at or after `since` (ISO date), newest change first, plus the collection's total. */
export async function changedSince(get, collectionId, since) {
  const items = []
  let total = 0
  for (let page = 0; ; page++) {
    const body = await get(`/raindrops/${collectionId}?perpage=${PER_PAGE}&page=${page}&sort=-lastUpdate`)
    total = body.count
    const fresh = body.items.filter((r) => r.lastUpdate >= since)
    items.push(...fresh)
    if (fresh.length < PER_PAGE) break
    await sleep(550)
  }
  return { items, total }
}

/** Every bookmark of a collection (0 = all but Trash, -99 = Trash), oldest first. */
export async function fetchAllRaindrops(get, collectionId, onProgress = () => {}) {
  const items = []
  let total = Infinity
  for (let page = 0; items.length < total; page++) {
    const body = await get(`/raindrops/${collectionId}?perpage=${PER_PAGE}&page=${page}&sort=created`)
    total = body.count
    if (!body.items.length) break
    items.push(...body.items)
    await sleep(550) // stay under the 120 requests/minute limit instead of running into it
    if (page % 20 === 0) onProgress(items.length, total)
  }
  const unique = new Map(items.map((r) => [r._id, r]))
  return { items: [...unique.values()], total }
}
