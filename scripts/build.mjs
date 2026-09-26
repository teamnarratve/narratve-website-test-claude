#!/usr/bin/env node
/**
 * Narratve Space — static site build.
 *
 *   npm run build          production build → dist/
 *   npm run build:strict   fails if launch-critical data is missing
 *   npm run build:drafts   includes draft case studies (for review only)
 */
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';
import sharp from 'sharp';
import { ROOT, SRC, DIST, esc, get, hash, readJSON, write, walk, ensureDir, warn, warnings } from './lib/util.mjs';
import { processImages, expandImgTags, imageUrl, hasImage } from './lib/images.mjs';
import { layout } from './lib/layout.mjs';
import * as partials from './lib/partials.mjs';
import { servicePage, workPage, articlePage } from './lib/templates.mjs';
import { jsonld, sitemap, robots, netlifyHeaders, netlifyRedirects, htaccess, manifest } from './lib/seo.mjs';

const args = new Set(process.argv.slice(2));
const STRICT = args.has('--strict');
const DRAFTS = args.has('--drafts');
const t0 = Date.now();

/* ---- Data ---------------------------------------------------------------- */
const DATA = path.join(SRC, 'data');
const site = readJSON(path.join(DATA, 'site.json'));
const services = readJSON(path.join(DATA, 'services.json'));
const allWork = readJSON(path.join(DATA, 'work.json'));
const work = allWork.filter((w) => DRAFTS || !w.draft);
const clients = readJSON(path.join(DATA, 'clients.json'));
const insights = readJSON(path.join(DATA, 'insights.json')).sort((a, b) => b.date.localeCompare(a.date));
const careers = readJSON(path.join(DATA, 'careers.json'));

const REQUIRED = ['contact.email', 'contact.phone', 'address.locality'];
const missing = REQUIRED.filter((k) => !get(site, k));
missing.forEach((k) => warn(`Missing required site data: site.json → ${k}`));
if (!site.forms.endpoint) warn('No form endpoint set (site.json → forms.endpoint). The contact form will only work on Netlify.');
if (allWork.some((w) => w.draft)) warn(`${allWork.filter((w) => w.draft).length} draft case studies are ${DRAFTS ? 'INCLUDED (draft build)' : 'excluded'} — replace them in src/data/work.json.`);

/* ---- Clean --------------------------------------------------------------- */
fs.rmSync(DIST, { recursive: true, force: true });
ensureDir(DIST);

/* ---- Images -------------------------------------------------------------- */
await processImages();

/* ---- Logo ---------------------------------------------------------------- */
const logoPath = path.join(SRC, 'static', 'logo.svg');
site._hasLogo = fs.existsSync(logoPath);
if (site._hasLogo) {
  const svg = fs.readFileSync(logoPath, 'utf8');
  const vb = svg.match(/viewBox="[\d.\s-]*?([\d.]+)\s+([\d.]+)"/);
  const [w, h] = vb ? [+vb[1], +vb[2]] : [120, 24];
  site._logoSize = { w: Math.round((w / h) * 24), h: 24 };
} else {
  warn('Using interim wordmark — add the official logo as src/static/logo.svg');
}

/* ---- Fonts --------------------------------------------------------------- */
const fontSrc = path.join(ROOT, 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2');
const fontBuf = fs.readFileSync(fontSrc);
const fontName = `/assets/fonts/inter-latin-${hash(fontBuf, 8)}.woff2`;
write(path.join(DIST, fontName), fontBuf);
const fontFace = `@font-face{font-family:"Inter";font-style:normal;font-display:swap;font-weight:100 900;src:url(..${fontName.replace('/assets', '')}) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}`;

/* ---- CSS ----------------------------------------------------------------- */
const cssSrc = ['tokens.css', 'main.css', 'pages.css']
  .map((f) => fs.readFileSync(path.join(SRC, 'assets/css', f), 'utf8')).join('\n');
const css = (await esbuild.transform(fontFace + cssSrc, { loader: 'css', minify: true, target: ['chrome100', 'safari15', 'firefox100'] })).code;
const cssName = `/assets/css/site-${hash(css)}.css`;
write(path.join(DIST, cssName), css);

/* ---- JS ------------------------------------------------------------------ */
async function bundle(entry, prefix) {
  const r = await esbuild.build({ entryPoints: [path.join(SRC, 'assets/js', entry)], bundle: true, minify: true, write: false, target: ['es2019'], format: 'iife' });
  const code = r.outputFiles[0].text;
  const name = `/assets/js/${prefix}-${hash(code)}.js`;
  write(path.join(DIST, name), code);
  return name;
}
const jsName = await bundle('main.js', 'site');
const gtagName = site.analytics.ga4 ? await bundle('gtag.js', 'gtag') : '';
const assets = { css: cssName, js: jsName, gtag: gtagName, font: fontName };

/* ---- Icons & social image ------------------------------------------------ */
const favSvg = fs.readFileSync(path.join(SRC, 'static/favicon.svg'));
const icon = (size, file, pad = 0, bg = null) => {
  let p = sharp(favSvg, { density: 600 }).resize(size - pad * 2, size - pad * 2);
  if (pad || bg) p = p.extend({ top: pad, bottom: pad, left: pad, right: pad, background: bg ?? { r: 0, g: 0, b: 0, alpha: 0 } });
  return p.png().toFile(path.join(DIST, file));
};
await Promise.all([
  icon(180, 'apple-touch-icon.png', 20, '#F5F5F7'),
  icon(192, 'icon-192.png'),
  icon(512, 'icon-512.png'),
  icon(512, 'icon-maskable-512.png', 96, '#F5F5F7'),
  sharp(favSvg, { density: 300 }).resize(32, 32).png().toFile(path.join(DIST, 'favicon-32.png'))
]);
// favicon.ico (PNG-in-ICO, supported by all modern browsers)
{
  const png = fs.readFileSync(path.join(DIST, 'favicon-32.png'));
  const h = Buffer.alloc(22);
  h.writeUInt16LE(0, 0); h.writeUInt16LE(1, 2); h.writeUInt16LE(1, 4);
  h.writeUInt8(32, 6); h.writeUInt8(32, 7); h.writeUInt8(0, 8); h.writeUInt8(0, 9);
  h.writeUInt16LE(1, 10); h.writeUInt16LE(32, 12); h.writeUInt32LE(png.length, 14); h.writeUInt32LE(22, 18);
  fs.writeFileSync(path.join(DIST, 'favicon.ico'), Buffer.concat([h, png]));
  fs.rmSync(path.join(DIST, 'favicon-32.png'));
}
ensureDir(path.join(DIST, 'assets/og'));
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#F5F5F7"/>
  <rect x="72" y="72" width="40" height="40" rx="11" fill="#000"/><circle cx="112" cy="112" r="11" fill="#0071E3" stroke="#F5F5F7" stroke-width="5"/>
  <text x="132" y="101" font-family="Inter, Helvetica, Arial, sans-serif" font-size="26" font-weight="600" fill="#000" letter-spacing="-0.5">${esc(site.name)}</text>
  <text x="72" y="360" font-family="Inter, Helvetica, Arial, sans-serif" font-size="96" font-weight="700" fill="#000" letter-spacing="-4">We make brands</text>
  <text x="72" y="462" font-family="Inter, Helvetica, Arial, sans-serif" font-size="96" font-weight="700" fill="#000" letter-spacing="-4">worth <tspan fill="#0071E3">talking</tspan> about.</text>
  <text x="72" y="560" font-family="Inter, Helvetica, Arial, sans-serif" font-size="22" font-weight="600" fill="#6B6B6B" letter-spacing="2">ADVERTISING &amp; CREATIVE · KERALA · INDIA · GCC</text>
</svg>`;
await sharp(Buffer.from(ogSvg)).png({ compressionLevel: 9 }).toFile(path.join(DIST, 'assets/og/og-default.png'));

/* ---- Templating ---------------------------------------------------------- */
const ctx0 = { site, services, work, clients, insights, careers };

function render(src, ctx) {
  let out = src;
  out = out.replace(/{{#if ([\w.]+)}}([\s\S]*?)(?:{{else}}([\s\S]*?))?{{\/if}}/g, (_, k, a, b = '') => {
    const v = get(ctx, k);
    return (Array.isArray(v) ? v.length : v) ? a : b;
  });
  out = out.replace(/{{>\s*(\w+)(?:\s+([\w.-]+))?\s*}}/g, (_, name, arg) => {
    if (!partials[name]) throw new Error(`Unknown partial: ${name}`);
    return partials[name](ctx, arg);
  });
  out = out.replace(/{{{\s*([\w.]+)\s*}}}/g, (_, k) => get(ctx, k) ?? '');
  out = out.replace(/{{\s*([\w.]+)\s*}}/g, (_, k) => esc(get(ctx, k) ?? ''));
  return expandImgTags(out);
}

function parsePage(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  const meta = m ? JSON.parse(m[1]) : {};
  const body = m ? raw.slice(m[0].length) : raw;
  const rel = path.relative(path.join(SRC, 'pages'), file).split(path.sep).join('/');
  let p = '/' + rel.replace(/index\.html$/, '').replace(/\.html$/, '/');
  if (rel === '404.html') p = '/404.html';
  return { ...meta, path: meta.path ?? p, source: body };
}

const pages = [];
for (const file of walk(path.join(SRC, 'pages')).filter((f) => f.endsWith('.html'))) {
  const p = parsePage(file);
  p.body = render(p.source, { ...ctx0, page: p });
  pages.push(p);
}
services.forEach((s, i) => pages.push(servicePage(ctx0, s, i)));
work.forEach((w, i) => pages.push(workPage(ctx0, w, i)));
for (const post of insights) {
  const f = path.join(SRC, 'content/insights', `${post.slug}.html`);
  const content = expandImgTags(fs.readFileSync(f, 'utf8'));
  pages.push(articlePage(ctx0, post, content));
}

/* ---- Write pages --------------------------------------------------------- */
/**
 * Rewrite root-relative URLs ("/assets/…", "/about/") to paths relative to
 * the page, so the package works from any folder and when opened from disk.
 * 404.html keeps root-relative URLs because servers show it at any depth.
 */
function relativize(html, pagePath) {
  if (pagePath.endsWith('.html')) return html;
  const depth = pagePath.split('/').filter(Boolean).length;
  const up = depth ? '../'.repeat(depth) : './';
  const fix = (u) => (u.startsWith('/') && !u.startsWith('//') ? up + u.slice(1) : u);
  return html
    .replace(/\s(href|src|action|data-success)="([^"]*)"/g, (m, attr, u) => ` ${attr}="${fix(u)}"`)
    .replace(/\ssrcset="([^"]*)"/g, (m, set) => ` srcset="${set.split(', ').map((part) => fix(part)).join(', ')}"`);
}

const minify = (html) => html.replace(/<!--(?!\[if)[\s\S]*?-->/g, '').replace(/\n\s+/g, '\n').replace(/\n{2,}/g, '\n');

for (const page of pages) {
  const og = page.ogImage && hasImage(page.ogImage) ? imageUrl(page.ogImage, 1200) : null;
  if (og && typeof og === 'object') page.og = og;
  const ctx = { ...ctx0, page, assets, jsonld: jsonld(ctx0, page) };
  const html = relativize(minify(layout(ctx, page.body)), page.path);
  const out = page.path.endsWith('.html') ? path.join(DIST, page.path) : path.join(DIST, page.path, 'index.html');
  write(out, html);
}

/* ---- Static files & server config ---------------------------------------- */
for (const f of walk(path.join(SRC, 'static'))) {
  const rel = path.relative(path.join(SRC, 'static'), f);
  fs.copyFileSync(f, path.join(DIST, rel));
}
write(path.join(DIST, 'sitemap.xml'), sitemap(site, pages));
write(path.join(DIST, 'robots.txt'), robots(site));
write(path.join(DIST, 'site.webmanifest'), manifest(site));
write(path.join(DIST, '_headers'), netlifyHeaders(site));
write(path.join(DIST, '_redirects'), netlifyRedirects());
write(path.join(DIST, '.htaccess'), htaccess(site));

/* ---- Report -------------------------------------------------------------- */
const files = walk(DIST);
const bytes = files.reduce((n, f) => n + fs.statSync(f).size, 0);
console.log(`\n✓ Built ${pages.length} pages, ${files.length} files (${(bytes / 1024 / 1024).toFixed(1)} MB) in ${((Date.now() - t0) / 1000).toFixed(1)}s → dist/`);
console.log(`  CSS ${(css.length / 1024).toFixed(1)} KB · JS ${(fs.statSync(path.join(DIST, jsName)).size / 1024).toFixed(1)} KB`);
const uniq = [...new Set(warnings)];
if (uniq.length) {
  console.log(`\n⚠ ${uniq.length} item(s) to resolve before launch:`);
  uniq.forEach((w) => console.log('  - ' + w));
}
if (STRICT && (missing.length || uniq.some((w) => w.startsWith('Missing image')))) {
  console.error('\n✗ Strict build failed: launch-critical content is missing.');
  process.exit(1);
}
