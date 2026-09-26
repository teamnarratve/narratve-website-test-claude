/**
 * Responsive image pipeline.
 * Every file in src/images/** is resized to several widths and encoded as
 * AVIF, WebP and JPEG (PNG kept for images with transparency). Pages refer
 * to images by their path relative to src/images, e.g. "services/foo.jpg".
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { SRC, DIST, ROOT, esc, walk, ensureDir, warn } from './util.mjs';

const IMG_SRC = path.join(SRC, 'images');
const IMG_OUT = path.join(DIST, 'assets', 'img');
const CACHE = path.join(ROOT, '.cache', 'img');
const WIDTHS = [480, 800, 1200, 1600, 2400];
const RASTER = /\.(jpe?g|png|webp|avif|tiff?)$/i;

const manifest = new Map();

export async function processImages() {
  const files = walk(IMG_SRC).filter((f) => RASTER.test(f) || /\.svg$/i.test(f));
  ensureDir(IMG_OUT);
  await Promise.all(files.map(processOne));
  return manifest;
}

async function processOne(file) {
  const rel = path.relative(IMG_SRC, file).split(path.sep).join('/');
  const base = rel.replace(/\.[^.]+$/, '');

  if (/\.svg$/i.test(file)) {
    const out = path.join(IMG_OUT, rel);
    ensureDir(path.dirname(out));
    fs.copyFileSync(file, out);
    manifest.set(rel, { svg: true, src: `/assets/img/${rel}` });
    return;
  }

  const img = sharp(file, { failOn: 'none' }).rotate();
  const meta = await img.metadata();
  const w0 = meta.autoOrient?.width ?? meta.width;
  const h0 = meta.autoOrient?.height ?? meta.height;
  const alpha = meta.hasAlpha && /\.png$/i.test(file);
  const widths = WIDTHS.filter((w) => w < w0);
  widths.push(Math.min(w0, 2400));
  const uniq = [...new Set(widths)].sort((a, b) => a - b);
  const fallbackFmt = alpha ? 'png' : 'jpg';
  const formats = ['avif', 'webp', fallbackFmt];
  const stat = fs.statSync(file);

  for (const w of uniq) {
    for (const fmt of formats) {
      const name = `${base}-${w}.${fmt}`;
      const out = path.join(IMG_OUT, name);
      const cached = path.join(CACHE, name);
      ensureDir(path.dirname(out));
      if (fs.existsSync(cached) && fs.statSync(cached).mtimeMs >= stat.mtimeMs) {
        fs.copyFileSync(cached, out);
        continue;
      }
      let p = sharp(file, { failOn: 'none' }).rotate().resize({ width: w, withoutEnlargement: true });
      if (fmt === 'avif') p = p.avif({ quality: 52, effort: 4 });
      if (fmt === 'webp') p = p.webp({ quality: 74 });
      if (fmt === 'jpg') p = p.flatten({ background: '#ffffff' }).jpeg({ quality: 78, mozjpeg: true, progressive: true });
      if (fmt === 'png') p = p.png({ compressionLevel: 9, palette: true });
      await p.toFile(out);
      ensureDir(path.dirname(cached));
      fs.copyFileSync(out, cached);
    }
  }
  manifest.set(rel, { width: w0, height: h0, widths: uniq, base, fallbackFmt });
}

export const hasImage = (rel) => !!rel && manifest.has(rel);

/** URL of a single rendition (for OG images etc). */
export function imageUrl(rel, want = 1200) {
  const m = manifest.get(rel);
  if (!m) return null;
  if (m.svg) return m.src;
  const w = m.widths.find((x) => x >= want) ?? m.widths[m.widths.length - 1];
  return { url: `/assets/img/${m.base}-${w}.${m.fallbackFmt}`, width: w, height: Math.round((m.height / m.width) * w) };
}

/**
 * <picture> markup. Missing images render a neutral, on-brand fallback and
 * are reported by the build.
 */
export function picture(rel, { alt = '', sizes = '100vw', cls = '', loading = 'lazy', ratio = '' } = {}) {
  const m = manifest.get(rel);
  if (!m) {
    warn(`Missing image: src/images/${rel}`);
    const style = ratio ? ` style="aspect-ratio:${esc(ratio)}"` : '';
    return `<div class="media-fallback ${esc(cls)}"${style} role="img" aria-label="${esc(alt)}"><span class="media-fallback__mark" aria-hidden="true"></span></div>`;
  }
  if (m.svg) {
    return `<img class="${esc(cls)}" src="${m.src}" alt="${esc(alt)}" loading="${loading}" decoding="async">`;
  }
  const set = (fmt) => m.widths.map((w) => `/assets/img/${m.base}-${w}.${fmt} ${w}w`).join(', ');
  const mid = m.widths.find((w) => w >= 1200) ?? m.widths[m.widths.length - 1];
  const priority = loading === 'eager' ? ' fetchpriority="high"' : '';
  return `<picture class="${esc(cls)}">` +
    `<source type="image/avif" srcset="${set('avif')}" sizes="${esc(sizes)}">` +
    `<source type="image/webp" srcset="${set('webp')}" sizes="${esc(sizes)}">` +
    `<img src="/assets/img/${m.base}-${mid}.${m.fallbackFmt}" srcset="${set(m.fallbackFmt)}" sizes="${esc(sizes)}" width="${m.width}" height="${m.height}" alt="${esc(alt)}" loading="${loading}" decoding="async"${priority}>` +
    `</picture>`;
}

/** Replace <ns-img …> tags in page source with picture markup. */
export function expandImgTags(html) {
  return html.replace(/<ns-img\b([^>]*)\/?>/g, (_, attrs) => {
    const a = {};
    attrs.replace(/([\w-]+)(?:="([^"]*)")?/g, (__, k, v) => { a[k] = v ?? true; });
    return picture(a.src, {
      alt: a.alt ?? '',
      sizes: a.sizes ?? '100vw',
      cls: a.class ?? '',
      loading: a.priority ? 'eager' : 'lazy',
      ratio: a.ratio ?? ''
    });
  });
}
