/**
 * CSV Parser utilities
 */

function cleanText(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]
    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; continue; }
      if (ch === '"') { inQuotes = false; continue; }
      field += ch; continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ',') { row.push(field); field = ''; continue; }
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    if (ch !== '\r') field += ch;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((h, idx) => [h, values[idx] ?? ''])));
}

function buildItemFromRow(row) {
  const title = cleanText(row.title)
  const rawUrl = cleanText(row.url)
  if (!title || !rawUrl) return null

  let url
  try {
    url = new URL(rawUrl).toString()
  } catch {
    return null
  }

  return {
    title,
    url,
    favorite: String(row.favorite).toLowerCase() === 'true',
    sourceCodeUrls: extractSourceCodeUrls(row.note)
  }
}

function extractSourceCodeUrls(note) {
  if (!note) return null

  const sourceCodeLabelMatch = String(note).match(/source-code\s*:/i)
  if (!sourceCodeLabelMatch) return null

  let sourceCodeSegment = String(note).slice(
    sourceCodeLabelMatch.index + sourceCodeLabelMatch[0].length
  )
  const urls = []

  while (true) {
    const urlMatch = sourceCodeSegment.match(/^\s*,?\s*(https?:\/\/[^\s,]+)/i)
    if (!urlMatch) break

    const url = cleanText(urlMatch[1])
    try {
      urls.push(new URL(url).toString())
    } catch {
      break
    }

    sourceCodeSegment = sourceCodeSegment.slice(urlMatch[0].length)
  }

  if (!urls.length) return null
  return Array.from(new Set(urls))
}

export { parseCsv, buildItemFromRow, extractSourceCodeUrls, cleanText }
