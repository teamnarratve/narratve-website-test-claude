import { esc, abs } from './util.mjs';

export const INLINE_JS = "document.documentElement.classList.add('js')";

function isActive(href, pagePath) {
  if (href === '/') return pagePath === '/';
  return pagePath.startsWith(href);
}

export function socialLinks(site, cls = '') {
  const labels = { instagram: 'Instagram', linkedin: 'LinkedIn', facebook: 'Facebook', behance: 'Behance', youtube: 'YouTube', x: 'X' };
  return Object.entries(site.social)
    .filter(([, url]) => url)
    .map(([k, url]) => `<li><a class="${cls}" href="${esc(url)}" rel="noopener" target="_blank">${labels[k] ?? k}<span class="visually-hidden"> (opens in a new tab)</span></a></li>`)
    .join('');
}

export function contactLinks(site) {
  const c = site.contact;
  const out = [];
  if (c.email) out.push(`<li><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>`);
  if (c.phone) out.push(`<li><a href="tel:${esc(c.phone.replace(/[^\d+]/g, ''))}">${esc(c.phone)}</a></li>`);
  if (c.whatsapp) out.push(`<li><a href="https://wa.me/${esc(c.whatsapp)}" rel="noopener" target="_blank">WhatsApp</a></li>`);
  return out.join('');
}

export function head({ site, page, assets, jsonld }) {
  let title = page.titleFull ?? (page.title ? `${page.title} | ${site.name}` : site.name);
  // Keep titles within ~65 characters: drop the brand suffix for long page titles.
  if (!page.titleFull && page.title && title.length > 65) title = page.title;
  const desc = page.description ?? site.description;
  const url = abs(site, page.path);
  const og = page.og ?? { url: '/assets/og/og-default.png', width: 1200, height: 630 };
  const ogUrl = og.url.startsWith('http') ? og.url : abs(site, og.url);
  const robots = page.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large';
  const analytics = [];
  if (site.analytics.plausibleDomain) {
    analytics.push(`<script defer data-domain="${esc(site.analytics.plausibleDomain)}" src="https://plausible.io/js/script.js"></script>`);
  }
  if (site.analytics.ga4) {
    analytics.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(site.analytics.ga4)}"></script>`);
    analytics.push(`<script src="${assets.gtag}" data-id="${esc(site.analytics.ga4)}" defer></script>`);
  }
  return `<!doctype html>
<html lang="${site.language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<script>${INLINE_JS}</script>
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${esc(url)}">
<meta name="theme-color" content="#F5F5F7">
<meta name="color-scheme" content="light">
<meta name="format-detection" content="telephone=no">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:locale" content="${site.locale}">
<meta property="og:type" content="${page.ogType ?? 'website'}">
<meta property="og:title" content="${esc(page.ogTitle ?? title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(ogUrl)}">
<meta property="og:image:width" content="${og.width}">
<meta property="og:image:height" content="${og.height}">
<meta property="og:image:alt" content="${esc(page.ogAlt ?? site.name)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(page.ogTitle ?? title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(ogUrl)}">
${page.article ? `<meta property="article:published_time" content="${page.article.date}">` : ''}
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="${assets.font}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${assets.css}">
<script src="${assets.js}" defer></script>
${analytics.join('\n')}
<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>
</head>`;
}

export function header({ site, page }) {
  const links = site.nav
    .map((n) => `<a href="${n.href}"${isActive(n.href, page.path) ? ' aria-current="page"' : ''}>${esc(n.label)}</a>`)
    .join('');
  const mobile = [{ label: 'Home', href: '/' }, ...site.nav, { label: 'Contact', href: '/contact/' }]
    .map((n) => `<a href="${n.href}"${(n.href === '/' ? page.path === '/' : isActive(n.href, page.path)) ? ' aria-current="page"' : ''}>${esc(n.label)}</a>`)
    .join('');
  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="nav${page.navDark ? ' nav--dark' : ''}" data-nav>
  <div class="nav__inner container">
    <a class="nav__brand" href="/" aria-label="${esc(site.name)} — home">${logo(site)}</a>
    <nav class="nav__links" aria-label="Primary">${links}</nav>
    <a class="btn btn--primary btn--sm nav__cta" href="/contact/">Let’s talk</a>
    <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="nav-menu" data-nav-toggle>
      <span class="visually-hidden">Menu</span>
      <span class="nav__toggle-bar" aria-hidden="true"></span>
      <span class="nav__toggle-bar" aria-hidden="true"></span>
    </button>
  </div>
  <div class="nav__menu" id="nav-menu" data-nav-menu hidden>
    <nav class="container" aria-label="Mobile">${mobile}
      <a class="btn btn--primary nav__menu-cta" href="/contact/">Let’s talk</a>
    </nav>
  </div>
</header>`;
}

export function logo(site) {
  // Uses /logo.svg when supplied (src/static/logo.svg), otherwise the interim wordmark.
  return site._hasLogo
    ? `<img class="nav__logo" src="/logo.svg" alt="${esc(site.name)}" width="${site._logoSize.w}" height="${site._logoSize.h}">`
    : `<span class="nav__mark" aria-hidden="true"></span><span>${esc(site.name)}</span>`;
}

export function footer({ site }) {
  const nav = site.footerNav.map((n) => `<li><a href="${n.href}">${esc(n.label)}</a></li>`).join('');
  const markets = site.markets.map((m) => `<li>${esc(m.name)}</li>`).join('');
  const connect = contactLinks(site) + socialLinks(site);
  const a = site.address;
  const addr = [a.streetAddress, a.locality, a.region, a.postalCode].filter(Boolean).map(esc).join(', ');
  const year = new Date().getFullYear();
  return `<footer class="footer">
  <div class="container">
    <p class="footer__statement display" data-reveal>Let’s build<br>something<br>worth remembering.</p>
    <div class="footer__cols">
      <nav class="footer__col" aria-label="Footer">
        <h2 class="footer__label">Navigation</h2>
        <ul>${nav}</ul>
      </nav>
      <div class="footer__col">
        <h2 class="footer__label">Locations</h2>
        <ul>${markets}</ul>
      </div>
      <div class="footer__col">
        <h2 class="footer__label">Connect</h2>
        <ul>${connect || '<li><a href="/contact/">Contact us</a></li>'}</ul>
      </div>
      <div class="footer__col footer__col--brand">
        <a href="/" class="footer__logo" aria-label="${esc(site.name)} — home">${site._hasLogo ? `<img src="/logo.svg" alt="" width="${site._logoSize.w}" height="${site._logoSize.h}">` : '<span class="nav__mark nav__mark--lg" aria-hidden="true"></span>'}</a>
        <p>${esc(site.tagline)}.<br>${a.locality || a.streetAddress ? `${addr}.` : 'Kerala · India · GCC.'}</p>
      </div>
    </div>
    <div class="footer__bottom">
      <p>© ${year} ${esc(site.legalName)}. All rights reserved.</p>
      <ul class="footer__legal">
        <li><a href="/privacy/">Privacy</a></li>
        <li><a href="/terms/">Terms</a></li>
        <li><a href="#top" class="footer__top">Back to top <span aria-hidden="true">↑</span></a></li>
      </ul>
    </div>
  </div>
</footer>`;
}

export function layout(ctx, body) {
  return `${head(ctx)}
<body class="${esc(ctx.page.bodyClass ?? '')}" id="top">
${header(ctx)}
<main id="main">
${body}
</main>
${footer(ctx)}
</body>
</html>
`;
}
