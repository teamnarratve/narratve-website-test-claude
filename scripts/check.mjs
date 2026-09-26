#!/usr/bin/env node
/** Post-build checks: internal links, anchors, images, titles, meta. */
import fs from 'node:fs';
import path from 'node:path';
import { DIST, walk } from './lib/util.mjs';

const pages = walk(DIST).filter((f) => f.endsWith('.html'));
const errors = [];
const titles = new Map();
let pageDir = '/';
const exists = (p) => {
  let clean = p.split('#')[0].split('?')[0];
  if (clean && !clean.startsWith('/')) clean = path.posix.resolve(pageDir, clean) + (clean.endsWith('/') ? '/' : '');
  if (!clean) return true;
  const f = path.join(DIST, clean);
  return fs.existsSync(f) && (fs.statSync(f).isFile() || fs.existsSync(path.join(f, 'index.html')));
};

for (const file of pages) {
  const rel = '/' + path.relative(DIST, file).replace(/index\.html$/, '');
  pageDir = path.posix.dirname('/' + path.relative(DIST, file));
  const html = fs.readFileSync(file, 'utf8');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const dec = (s) => s?.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  const title = dec(html.match(/<title>([^<]*)<\/title>/)?.[1]);
  const desc = dec(html.match(/<meta name="description" content="([^"]*)"/)?.[1]);
  if (!title) errors.push(`${rel}: missing <title>`);
  else if (!rel.includes('404')) { if (titles.has(title)) errors.push(`${rel}: duplicate title with ${titles.get(title)}`); titles.set(title, rel); }
  if (title && title.length > 70) errors.push(`${rel}: title ${title.length} chars (>70)`);
  if (!desc) errors.push(`${rel}: missing meta description`);
  else if (desc.length > 165) errors.push(`${rel}: description ${desc.length} chars (>165)`);
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) errors.push(`${rel}: ${h1} <h1> elements`);
  for (const [, href] of html.matchAll(/\shref="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:)/.test(href)) continue;
    if (href.startsWith('/') && !file.endsWith('404.html')) errors.push(`${rel}: root-relative link ${href} (breaks when opened from disk)`);
    if (href.startsWith('#')) { if (href.length > 1 && !ids.has(href.slice(1))) errors.push(`${rel}: broken anchor ${href}`); continue; }
    if (!exists(href)) errors.push(`${rel}: broken link ${href}`);
  }
  for (const [, src] of html.matchAll(/\ssrc="([^"]+)"/g)) if (!exists(src)) errors.push(`${rel}: missing asset ${src}`);
  for (const [, set] of html.matchAll(/\ssrcset="([^"]+)"/g)) for (const part of set.split(',')) { const u = part.trim().split(' ')[0]; if (!exists(u)) errors.push(`${rel}: missing srcset ${u}`); }
  for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\salt="/.test(m[0])) errors.push(`${rel}: <img> without alt`);
  try { for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(m[1]); } catch { errors.push(`${rel}: invalid JSON-LD`); }
}

console.log(`Checked ${pages.length} pages.`);
if (errors.length) { console.log(errors.map((e) => '✗ ' + e).join('\n')); process.exit(1); }
console.log('✓ No broken links, anchors, assets or metadata issues.');
