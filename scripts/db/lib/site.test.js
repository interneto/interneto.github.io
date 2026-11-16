import { test } from 'node:test'
import assert from 'node:assert/strict'
import { siteOf } from './site.js'

test('siteOf groups subdomains and aliases into one site', () => {
  const cases = {
    'en.wikipedia.org': 'wikipedia.org',
    'm.youtube.com': 'youtube.com',
    'youtu.be': 'youtube.com',
    'www.reddit.com': 'reddit.com',
    'aur.archlinux.org': 'archlinux.org',
    'foo.github.io': 'foo.github.io',
    'github.io': 'github.io',
    'www.bbc.co.uk': 'bbc.co.uk',
    'x.com': 'twitter.com',
    '127.0.0.1': '127.0.0.1',
    localhost: 'localhost',
  }
  for (const [domain, site] of Object.entries(cases)) assert.equal(siteOf(domain), site, domain)
  assert.equal(siteOf(null), null)
})
