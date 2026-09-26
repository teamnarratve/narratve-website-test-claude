# Narratve Space — Website

Production website for **Narratve Space**, an advertising and creative agency based in Kerala, working with brands across India and the GCC.

It is a fast, static site with no framework at runtime. A small Node build turns the content in `src/` into a host-ready folder, `dist/`, which can be uploaded to any web host.

- **`dist/` is the final package.** Upload its contents as they are.
- **`src/` is where content is edited.** Run `npm run build` after any change.

---

## Pages

| URL | Page |
| --- | --- |
| `/` | Home |
| `/about/` | About |
| `/services/` | Services overview |
| `/services/<slug>/` | 8 service pages: `brand-strategy-identity`, `creative-campaigns`, `website-design`, `ecommerce-design` (keeps the existing live URL), `performance-marketing`, `social-media`, `video-production`, `ai-creative` |
| `/work/` | Work index, with category filters |
| `/work/<slug>/` | Case studies, generated from `src/data/work.json` |
| `/insights/` + `/insights/<slug>/` | Articles |
| `/careers/` | Careers |
| `/contact/` | Contact form and details |
| `/privacy/`, `/terms/` | Legal |
| `/thank-you/`, `/404.html` | Utility pages (`noindex`) |

## Built in

- **SEO:** unique titles and descriptions, canonical URLs, Open Graph and Twitter cards, and JSON-LD structured data (Organization, WebSite, BreadcrumbList, Service, FAQPage, BlogPosting). Also `sitemap.xml`, `robots.txt`, and 301 redirects for common legacy URLs.
- **Performance:** hashed and minified CSS (~52 KB, ~10 KB gzipped) and JS (~6 KB), a self-hosted Inter variable font, and responsive AVIF/WebP/JPEG images with `srcset`. Images lazy-load and have fixed dimensions, so there is no layout shift. Cache headers are set.
- **Security:** a Content-Security-Policy with a hashed inline script, plus HSTS, `nosniff`, a referrer policy and a permissions policy.
- **Accessibility:** semantic landmarks, a skip link, visible focus rings, AA colour contrast, reduced-motion support, and labelled form fields.
- **Lighthouse (mobile):** 99–100 for Performance, Accessibility, Best Practices and SEO on every page tested.

---

## Commands

```sh
npm install              # once
npm run build            # production build → dist/
npm run preview          # serve dist/ at http://localhost:4173
npm run check            # link / anchor / asset / metadata checks on dist/
npm run build:drafts     # include draft case studies (review only)
npm run build:strict     # fails if launch-critical content is missing
```

Requires Node 18 or later.

---

## Before launch — content checklist

`npm run build` prints everything still missing. You need to supply:

1. **Business details** in `src/data/site.json`: email, phone, WhatsApp, studio address, map link and social profile URLs. Empty values are hidden on the site automatically.
2. **Logo:** save the official logo as `src/static/logo.svg`. The header, footer and structured data switch to it automatically; until then an interim wordmark is shown. Replace `src/static/favicon.svg` too, because the app icons are generated from it.
3. **Client logos:** put files in `src/images/clients/` and list them in `src/data/clients.json`:
   ```json
   [{ "name": "Client Brand", "logo": "clients/client-brand.svg" }]
   ```
   The "Brands we work with" section appears automatically once at least one logo exists. Logos are shown in monochrome.
4. **Case studies:** replace the four `"draft": true` entries in `src/data/work.json` with real projects. Put the images in `src/images/work/<slug>/`. Drafts never appear in a production build. Until real work exists, `/work/` shows a "request our credentials" message and the homepage hides Selected Work.
5. **Photography:** add images at these paths. Use JPG or PNG at least 2400px wide; the build creates every smaller size and format.

   | Path (`src/images/…`) | Suggested subject | Ratio |
   | --- | --- | --- |
   | `about/studio.jpg` | Team at work in the studio | 21:9 |
   | `about/team-at-work.jpg` | Strategy or creative session, wall of ideas | 4:5 |
   | `about/production.jpg` | On set / shoot | 3:4 |
   | `careers/team.jpg` | Team, candid | 21:9 |
   | `services/overview.jpg` | Creative team collaborating | 21:9 |
   | `services/brand-strategy-identity.jpg` | Identity work, print, packaging | 21:9 |
   | `services/creative-campaigns.jpg` | OOH / campaign in situ | 21:9 |
   | `services/website-design.jpg` | Website on devices | 21:9 |
   | `services/ecommerce-design.jpg` | Online store on mobile | 21:9 |
   | `services/performance-marketing.jpg` | Campaign dashboard / team | 21:9 |
   | `services/social-media.jpg` | Content creation | 21:9 |
   | `services/video-production.jpg` | Film set | 21:9 |
   | `services/ai-creative.jpg` | Generative design exploration | 21:9 |
   | `insights/<article-slug>.jpg` | One per article | 4:3 / 21:9 |

   Missing images show a neutral placeholder and are listed by the build.
6. **Contact form delivery:** either deploy on Netlify (Netlify Forms is detected automatically), or set `forms.endpoint` in `site.json` to a Formspree, Getform or Basin URL. The CSP is updated for it automatically.
7. **Analytics (optional):** set `analytics.ga4` or `analytics.plausibleDomain`. Update the privacy policy if you do.
8. **Review:** check the service copy, the three Insights articles and the Privacy/Terms pages. The legal pages are sensible defaults, not legal advice.

---

## Deploying

The build generates server configuration for the common hosts.

### Shared hosting / cPanel / Apache / LiteSpeed

Upload **the contents of `dist/`**, including the hidden `.htaccess`, to `public_html/`. The `.htaccess` forces HTTPS, strips `www`, sets security and cache headers, enables compression, handles the 404 page and adds the legacy redirects.

### Netlify / Cloudflare Pages

- Build command: `npm run build`
- Publish directory: `dist`

`_headers` and `_redirects` are picked up automatically.

### Nginx

```nginx
root /var/www/narratv.space/dist;
index index.html;
error_page 404 /404.html;
location / { try_files $uri $uri/ =404; }
location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
```

Copy the security headers from `dist/_headers`.

### After going live

- Submit `https://narratv.space/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
- Check that old URLs from the previous site redirect correctly. Add any missing ones to `REDIRECTS` in `scripts/lib/seo.mjs`.

---

## Editing content

| What | Where |
| --- | --- |
| Business details, nav, markets | `src/data/site.json` |
| Services (all copy, FAQs, deliverables) | `src/data/services.json` |
| Case studies | `src/data/work.json` |
| Articles | `src/data/insights.json` + `src/content/insights/<slug>.html` |
| Open roles | `src/data/careers.json`: `[{ "title", "type", "location", "summary" }]` |
| Page copy | `src/pages/**/*.html` (JSON front matter holds each page's SEO title and description) |
| Design tokens | `src/assets/css/tokens.css` |
| Styles / scripts | `src/assets/css/*.css`, `src/assets/js/main.js` |

Page templates support `{{ site.contact.email }}` values, `{{#if …}}…{{else}}…{{/if}}`, partials (`{{> serviceRows }}`), and responsive images via `<ns-img src="about/studio.jpg" alt="…">`.

## Design system

- **Colour:** surface `#F5F5F7`, elevated `#FAFAFC`, text `#000`. The accent `#0071E3` is used on one word or one detail per section.
- **Type:** SF Pro on Apple devices, self-hosted Inter elsewhere. Headlines are 600 weight with tight leading and negative tracking. Set `--headline-case: uppercase` for an all-caps treatment.
- **Grid:** 4px spacing grid and 12 columns.
- **Shape:** 11px button radius, 20px media radius, flat (no shadows).
- **Motion:** 600ms for copy, 800ms for slides. All motion is off under `prefers-reduced-motion`.
