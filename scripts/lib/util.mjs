import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
export const SRC = path.join(ROOT, 'src');
export const DIST = path.join(ROOT, 'dist');

const ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ENT[c]);

export const get = (obj, key) =>
  key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

export const hash = (buf, len = 10) =>
  crypto.createHash('sha256').update(buf).digest('hex').slice(0, len);

export const sha256b64 = (s) => crypto.createHash('sha256').update(s).digest('base64');

export const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

export const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });

export function write(file, content) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content);
}

export function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

export const pad2 = (n) => String(n).padStart(2, '0');

/** Absolute URL for a site path. */
export const abs = (site, p = '/') => site.url.replace(/\/$/, '') + p;

export const warnings = [];
export const warn = (msg) => warnings.push(msg);

/** Format an ISO date as "26 Sep 2026". */
export function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
