import { abs, sha256b64 } from './util.mjs';
import { INLINE_JS } from './layout.mjs';

/* ---- JSON-LD ------------------------------------------------------------- */
export function jsonld(ctx, page) {
  const { site } = ctx;
  const orgId = abs(site, '/#organization');
  const a = site.address;
  const sameAs = Object.values(site.social).filter(Boolean);

  const org = {
    '@type': a.locality ? ['Organization', 'ProfessionalService'] : 'Organization',
    '@id': orgId,
    name: site.name,
    legalName: site.legalName,
    url: abs(site, '/'),
    logo: { '@type': 'ImageObject', url: abs(site, site._hasLogo ? '/logo.svg' : '/icon-512.png') },
    image: abs(site, '/assets/og/og-default.png'),
    description: site.description,
    slogan: 'We make brands worth talking about.',
    areaServed: site.areaServed.map((name) => ({ '@type': 'Place', name })),
    knowsAbout: ctx.services.map((s) => s.title)
  };
  if (site.foundingYear) org.foundingDate = site.foundingYear;
  if (site.contact.email) org.email = site.contact.email;
  if (site.contact.phone) org.telephone = site.contact.phone;
  if (sameAs.length) org.sameAs = sameAs;
  if (a.locality || a.streetAddress) {
    org.address = {
      '@type': 'PostalAddress',
      streetAddress: a.streetAddress || undefined,
      addressLocality: a.locality || undefined,
      addressRegion: a.region,
      postalCode: a.postalCode || undefined,
      addressCountry: a.country
    };
    if (a.geo?.lat) org.geo = { '@type': 'GeoCoordinates', latitude: a.geo.lat, longitude: a.geo.lng };
    if (site.contact.phone || site.contact.email) {
      org.contactPoint = { '@type': 'ContactPoint', contactType: 'sales', telephone: site.contact.phone || undefined, email: site.contact.email || undefined, areaServed: ['IN', 'AE', 'SA', 'QA'], availableLanguage: ['English', 'Malayalam'] };
    }
  }

  const graph = [org];
  const url = abs(site, page.path);

  if (page.path === '/') {
    graph.push({ '@type': 'WebSite', '@id': abs(site, '/#website'), url: abs(site, '/'), name: site.name, publisher: { '@id': orgId }, inLanguage: 'en' });
  }

  graph.push({
    '@type': page.article ? 'WebPage' : (page.pageType ?? 'WebPage'),
    '@id': url + '#webpage',
    url,
    name: page.titleFull ?? page.title ?? site.name,
    description: page.description ?? site.description,
    isPartOf: { '@id': abs(site, '/#website') },
    about: { '@id': orgId },
    inLanguage: 'en'
  });

  if (page.breadcrumbs) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: page.breadcrumbs.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, item: abs(site, b.path) }))
    });
  }

  if (page.service) {
    graph.push({
      '@type': 'Service',
      name: page.service.title,
      description: page.service.metaDescription,
      serviceType: page.service.title,
      provider: { '@id': orgId },
      areaServed: site.areaServed.map((name) => ({ '@type': 'Place', name })),
      url,
      hasOfferCatalog: { '@type': 'OfferCatalog', name: page.service.title, itemListElement: page.service.deliverables.map((d) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: d } })) }
    });
  }

  if (page.faqs?.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: page.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
    });
  }

  if (page.article) {
    graph.push({
      '@type': 'BlogPosting',
      headline: page.article.title,
      description: page.description,
      datePublished: page.article.date,
      dateModified: page.article.date,
      articleSection: page.article.category,
      author: { '@id': orgId },
      publisher: { '@id': orgId },
      mainEntityOfPage: { '@id': url + '#webpage' },
      image: page.og ? abs(site, page.og.url) : undefined
    });
  }

  if (page.itemList) {
    graph.push({ '@type': 'ItemList', itemListElement: page.itemList.map((it, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(site, it.path), name: it.name })) });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

/* ---- Sitemap / robots ---------------------------------------------------- */
export function sitemap(site, pages) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = pages
    .filter((p) => !p.noindex && !p.exclude)
    .map((p) => {
      const depth = p.path === '/' ? 0 : p.path.split('/').filter(Boolean).length;
      const priority = p.path === '/' ? '1.0' : depth === 1 ? '0.8' : '0.6';
      return `  <url><loc>${abs(site, p.path)}</loc><lastmod>${p.article?.date ?? today}</lastmod><priority>${priority}</priority></url>`;
    });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}

export const robots = (site) => `User-agent: *
Allow: /
Disallow: /thank-you/

Sitemap: ${abs(site, '/sitemap.xml')}
`;

/* ---- Security headers ---------------------------------------------------- */
export function csp(site, extraScriptHashes = []) {
  const script = ["'self'", `'sha256-${sha256b64(INLINE_JS)}'`, ...extraScriptHashes];
  const connect = ["'self'"];
  const form = ["'self'"];
  if (site.analytics.plausibleDomain) { script.push('https://plausible.io'); connect.push('https://plausible.io'); }
  if (site.analytics.ga4) { script.push('https://www.googletagmanager.com'); connect.push('https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://www.googletagmanager.com'); }
  if (site.forms.endpoint) {
    const origin = new URL(site.forms.endpoint).origin;
    connect.push(origin); form.push(origin);
  }
  return [
    "default-src 'self'",
    `script-src ${script.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    `connect-src ${connect.join(' ')}`,
    `form-action ${form.join(' ')} mailto:`,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests'
  ].join('; ');
}

const SEC = (site) => ({
  'Content-Security-Policy': csp(site),
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'X-Frame-Options': 'SAMEORIGIN',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
});

/** Netlify / Cloudflare Pages */
export function netlifyHeaders(site) {
  const sec = Object.entries(SEC(site)).map(([k, v]) => `  ${k}: ${v}`).join('\n');
  return `/*
${sec}

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=0, must-revalidate

/sitemap.xml
  Cache-Control: public, max-age=3600
`;
}

export const REDIRECTS = [
  ['/about-us/', '/about/'],
  ['/about-us', '/about/'],
  ['/contact-us/', '/contact/'],
  ['/contact-us', '/contact/'],
  ['/blog/', '/insights/'],
  ['/blog', '/insights/'],
  ['/portfolio/', '/work/'],
  ['/portfolio', '/work/'],
  ['/our-work/', '/work/'],
  ['/career/', '/careers/'],
  ['/privacy-policy/', '/privacy/'],
  ['/terms-and-conditions/', '/terms/'],
  ['/index.html', '/']
];

export const netlifyRedirects = () =>
  REDIRECTS.map(([from, to]) => `${from.padEnd(28)} ${to.padEnd(14)} 301`).join('\n') + '\n';

/** Apache / cPanel / LiteSpeed (most shared hosting in India) */
export function htaccess(site) {
  const host = new URL(site.url).host;
  const sec = Object.entries(SEC(site)).map(([k, v]) => `  Header always set ${k} "${v.replace(/"/g, '\\"')}"`).join('\n');
  const redirects = REDIRECTS.map(([from, to]) => `RedirectMatch 301 ^${from.replace(/\./g, '\\.')}$ ${to}`).join('\n');
  return `# Narratve Space — Apache / LiteSpeed configuration (generated by the build)
Options -Indexes
DirectoryIndex index.html
ErrorDocument 404 /404.html
AddDefaultCharset UTF-8

<IfModule mod_rewrite.c>
  RewriteEngine On
  # Force HTTPS
  RewriteCond %{HTTPS} !=on
  RewriteCond %{HTTP:X-Forwarded-Proto} !https
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  # Canonical host (no www)
  RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]
  RewriteRule ^ https://%1%{REQUEST_URI} [L,R=301]
  # Add trailing slash to directory URLs
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteCond %{REQUEST_URI} !/$
  RewriteRule ^(.*)$ /$1/ [L,R=301]
</IfModule>
# Canonical host: ${host}

# Legacy URLs
${redirects}

<IfModule mod_headers.c>
${sec}
  <FilesMatch "\\.(css|js|woff2|avif|webp|jpg|jpeg|png|svg|ico)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\\.(html|xml|txt|webmanifest)$">
    Header set Cache-Control "public, max-age=0, must-revalidate"
  </FilesMatch>
</IfModule>

<IfModule mod_mime.c>
  AddType image/avif .avif
  AddType image/webp .webp
  AddType font/woff2 .woff2
  AddType application/manifest+json .webmanifest
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/plain text/xml application/javascript application/json application/xml image/svg+xml application/manifest+json
</IfModule>
`;
}

export function manifest(site) {
  return JSON.stringify({
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F5F7',
    theme_color: '#F5F5F7',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  }, null, 2);
}
