// Groups hostnames into the site they belong to: en.wikipedia.org -> wikipedia.org, youtu.be -> youtube.com.

// Short links and alternate domains of one site.
const ALIASES = { 'youtu.be': 'youtube.com', 'redd.it': 'reddit.com', 'x.com': 'twitter.com', 'goo.gl': 'google.com', 'amzn.to': 'amazon.com' }
// Hosts where every subdomain is a different owner's site, so the subdomain is kept.
const SHARED_HOSTS = ['github.io', 'gitlab.io', 'blogspot.com', 'wordpress.com', 'vercel.app', 'netlify.app', 'pages.dev',
  'substack.com', 'medium.com', 'itch.io', 'neocities.org', 'readthedocs.io', 'herokuapp.com', 'web.app', 'firebaseapp.com',
  'tumblr.com', 'notion.site', 'carrd.co', 'framer.website', 'glitch.me', 'surge.sh', 'fly.dev', 'onrender.com', 'workers.dev',
  'sourceforge.io']
// shortcut: two-label country suffixes only (co.uk, com.ar...), not the full Public Suffix List; switch to the PSL if odd groupings show up.
const SLD = new Set(['co', 'com', 'org', 'net', 'gov', 'gob', 'ac', 'edu', 'or', 'ne', 'go'])

export function siteOf(domain) {
  if (!domain) return null
  const host = domain.toLowerCase().replace(/^www\d?\./, '')
  if (/^[\d.]+$/.test(host) || !host.includes('.')) return host
  const shared = SHARED_HOSTS.find((s) => host === s || host.endsWith(`.${s}`))
  const labels = host.split('.')
  let keep = shared ? shared.split('.').length + (host === shared ? 0 : 1) : 2
  if (!shared && labels.length > 2 && SLD.has(labels.at(-2)) && labels.at(-1).length === 2) keep = 3
  const site = labels.slice(-keep).join('.')
  return ALIASES[site] ?? site
}
