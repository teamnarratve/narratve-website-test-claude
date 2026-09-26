import { esc, pad2, fmtDate } from './util.mjs';
import { picture, hasImage } from './images.mjs';
import { contactLinks, socialLinks } from './layout.mjs';

/* Decorative stand-ins used only for draft projects without imagery. */
const ART = {
  launch: '<div class="art art--launch" aria-hidden="true"><span class="art__sun"></span><span class="art__horizon"></span><span class="art__headline">Arrive<br>slower.</span><span class="art__tag">Campaign · OOH · Film</span></div>',
  identity: '<div class="art art--identity" aria-hidden="true"><span class="art__mono">N°</span><span class="art__stack"><i></i><i></i><i></i><i></i></span><span class="art__caption">Identity system — v1.0</span></div>',
  commerce: '<div class="art art--commerce" aria-hidden="true"><span class="art__card"><i></i><i></i><i></i></span><span class="art__card art__card--b"><i></i><i></i><i></i></span><span class="art__btn">Add to bag</span></div>',
  social: '<div class="art art--social" aria-hidden="true"><span class="art__post"></span><span class="art__post"></span><span class="art__post art__post--hero">“</span><span class="art__post"></span><span class="art__post"></span></div>'
};

export function workMedia(w, { sizes = '100vw', priority = false } = {}) {
  if (hasImage(w.cover) || !w.art) {
    return picture(w.cover, { alt: w.coverAlt ?? `${w.client} — ${w.title}`, sizes, loading: priority ? 'eager' : 'lazy' });
  }
  return ART[w.art] ?? '';
}

/* ---- Services ------------------------------------------------------------ */
export function serviceRows({ services }) {
  return `<ol class="service-list" data-services>${services.map((s, i) => `
  <li class="service" data-art="${i + 1}">
    <a class="service__link" href="/services/${s.slug}/">
      <span class="service__num">${pad2(i + 1)}</span>
      <h3 class="service__title">${esc(s.title)}</h3>
      <p class="service__desc">${esc(s.short)}</p>
      <span class="service__arrow" aria-hidden="true">→</span>
    </a>
  </li>`).join('')}
</ol>
<div class="service-preview" aria-hidden="true" data-service-preview><div class="service-preview__inner" data-service-preview-inner></div></div>`;
}

/* ---- Work ---------------------------------------------------------------- */
function workCard(w, variant, sizes) {
  return `<article class="work work--${variant}" data-reveal>
  <a class="work__link" href="/work/${w.slug}/">
    <figure class="work__media">${workMedia(w, { sizes })}</figure>
    <div class="work__meta">
      <p class="work__client">${esc(w.client)}</p>
      <p class="work__cat">${esc(w.categories.join(' · '))}</p>
      <p class="work__statement">${esc(w.summary)}</p>
      <span class="work__cta">View project <span aria-hidden="true">→</span></span>
    </div>
  </a>
</article>`;
}

const VARIANTS = ['feature', 'tall', 'offset', 'wide'];
const SIZES = {
  feature: '(max-width: 833px) 100vw, 92vw',
  tall: '(max-width: 833px) 100vw, 55vw',
  offset: '(max-width: 833px) 100vw, 34vw',
  wide: '(max-width: 833px) 100vw, 76vw'
};

/** Home: Selected Work section (hidden when there is no published work). */
export function workSection({ work }) {
  const items = work.filter((w) => w.featured).slice(0, 4);
  if (!items.length) return '';
  return `<section class="section section--elevated work" id="work" aria-labelledby="work-title">
  <div class="container">
    <header class="section-head grid">
      <p class="eyebrow" data-reveal>Selected work</p>
      <h2 class="display display--lg section-head__title" id="work-title" data-reveal>Work that had<br>something to say.</h2>
      <p class="lead section-head__intro" data-reveal>We believe the best advertising does not simply fill a media space. It earns attention.</p>
    </header>
    <div class="work-layout">
      ${items.map((w, i) => workCard(w, VARIANTS[i], SIZES[VARIANTS[i]])).join('\n')}
    </div>
    <div class="section-foot" data-reveal><a class="btn btn--primary" href="/work/">View all work</a></div>
  </div>
</section>`;
}

/** /work/: filterable index. */
export function workIndex({ work }) {
  if (!work.length) {
    return `<div class="empty-state" data-reveal>
  <p class="display display--lg">Case studies are<br>on their way.</p>
  <p class="lead">We are preparing our latest work for publication. In the meantime, we are happy to walk you through relevant projects and credentials in person.</p>
  <a class="btn btn--primary" href="/contact/">Request our credentials</a>
</div>`;
  }
  const cats = [...new Set(work.flatMap((w) => w.categories))].sort();
  const filters = cats.length > 1
    ? `<div class="filters" role="toolbar" aria-label="Filter work by category" data-filters>
  <button type="button" class="chip" aria-pressed="true" data-filter="*">All</button>
  ${cats.map((c) => `<button type="button" class="chip" aria-pressed="false" data-filter="${esc(c)}">${esc(c)}</button>`).join('')}
</div>` : '';
  const cards = work.map((w, i) => {
    const v = ['a', 'b', 'c', 'd', 'e'][i % 5];
    return `<article class="work-card work-card--${v}" data-cats="${esc(w.categories.join('|'))}" data-reveal>
  <a class="work__link" href="/work/${w.slug}/">
    <figure class="work__media">${workMedia(w, { sizes: '(max-width: 833px) 100vw, 50vw' })}</figure>
    <div class="work__meta">
      <p class="work__client">${esc(w.client)}</p>
      <p class="work__cat">${esc(w.categories.join(' · '))}</p>
      <p class="work__statement">${esc(w.summary)}</p>
    </div>
  </a>
</article>`;
  }).join('\n');
  return `${filters}<div class="work-index" data-work-grid>${cards}</div>
<p class="work-index__empty" data-work-empty hidden>No projects in this category yet.</p>`;
}

/* ---- Clients ------------------------------------------------------------- */
export function clientsSection({ clients }) {
  const items = clients.filter((c) => hasImage(c.logo));
  if (!items.length) return '';
  return `<section class="section clients" aria-labelledby="clients-title">
  <div class="container">
    <header class="section-head grid">
      <p class="eyebrow" data-reveal>Brands we work with</p>
      <h2 class="display display--lg section-head__title" id="clients-title" data-reveal>Trusted by brands<br>with something to build.</h2>
      <p class="lead section-head__intro" data-reveal>From growing businesses to established brands, we work with teams looking for sharper thinking and better creative.</p>
    </header>
    <ul class="client-grid" data-reveal>
      ${items.map((c) => `<li class="client">${picture(c.logo, { alt: c.name, sizes: '200px', cls: 'client__logo' })}</li>`).join('\n      ')}
    </ul>
  </div>
</section>`;
}

/* ---- Markets ------------------------------------------------------------- */
export function markets({ site }) {
  return `<ul class="markets" data-reveal>${site.markets.map((m) => `
  <li class="market${m.home ? ' market--home' : ''}">
    <span class="market__name">${esc(m.name)}</span>
    <span class="market__time"><span data-clock="${esc(m.timezone)}">--:--</span> ${esc(m.abbr)}</span>
  </li>`).join('')}
</ul>`;
}

/* ---- CTA ----------------------------------------------------------------- */
export function cta(_, variant = 'default') {
  const copy = {
    default: ['Have a brand<br>worth <em class="accent-word">building?</em>', 'Tell us what you are trying to solve.', 'We’ll figure out what needs to happen next.'],
    service: ['Got a problem<br>worth <em class="accent-word">solving?</em>', 'Tell us where the business needs to go.', 'We’ll bring the right people together around it.'],
    careers: ['Want to make<br>work <em class="accent-word">worth talking about?</em>', 'Send us your portfolio and a few lines about you.', 'We read every application.']
  }[variant];
  const secondary = variant === 'careers'
    ? '<a class="btn btn--on-dark btn--lg" href="/about/">About us</a>'
    : '<a class="btn btn--on-dark btn--lg" href="/contact/#project">Start a project</a>';
  const primary = variant === 'careers'
    ? '<a class="btn btn--primary btn--lg" href="#apply">Apply now</a>'
    : '<a class="btn btn--primary btn--lg" href="/contact/">Let’s talk</a>';
  return `<section class="cta" aria-labelledby="cta-title">
  <div class="container">
    <h2 class="display cta__title" id="cta-title" data-reveal>${copy[0]}</h2>
    <div class="cta__foot" data-reveal>
      <div class="cta__text">
        <p class="lead lead--on-dark">${copy[1]}</p>
        <p class="lead lead--on-dark lead--muted">${copy[2]}</p>
      </div>
      <div class="actions">${primary}${secondary}</div>
    </div>
  </div>
</section>`;
}

/* ---- Contact ------------------------------------------------------------- */
export function contactDetails({ site }) {
  const c = site.contact;
  const a = site.address;
  const rows = [];
  if (c.email) rows.push(['Email', `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`]);
  if (c.phone) rows.push(['Phone', `<a href="tel:${esc(c.phone.replace(/[^\d+]/g, ''))}">${esc(c.phone)}</a>`]);
  if (c.whatsapp) rows.push(['WhatsApp', `<a href="https://wa.me/${esc(c.whatsapp)}" rel="noopener" target="_blank">Message us on WhatsApp</a>`]);
  const addr = [a.streetAddress, a.locality, a.region, a.postalCode, a.countryName].filter(Boolean).map(esc).join('<br>');
  if (a.streetAddress || a.locality) {
    rows.push(['Studio', `<address>${addr}</address>${a.mapUrl ? `<a class="link-arrow link-arrow--sm" href="${esc(a.mapUrl)}" rel="noopener" target="_blank">Get directions <span aria-hidden="true">→</span></a>` : ''}`]);
  }
  if (c.hours) rows.push(['Hours', esc(c.hours)]);
  const social = socialLinks(site);
  if (social) rows.push(['Follow', `<ul class="inline-list">${social}</ul>`]);
  return `<dl class="details">${rows.map(([k, v]) => `<div class="details__row"><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
}

export function serviceOptions({ services }) {
  return services.map((s) => `<option value="${esc(s.title)}">${esc(s.title)}</option>`).join('');
}

/* ---- Insights ------------------------------------------------------------ */
export function insightsList({ insights }, limit) {
  const items = limit ? insights.slice(0, +limit) : insights;
  return `<ul class="insight-list">${items.map((p) => `
  <li class="insight" data-reveal>
    <a class="insight__link" href="/insights/${p.slug}/">
      <figure class="insight__media">${picture(p.image, { alt: p.imageAlt ?? '', sizes: '(max-width: 833px) 100vw, 40vw', ratio: '4/3' })}</figure>
      <div class="insight__body">
        <p class="insight__meta"><span>${esc(p.category)}</span><time datetime="${p.date}">${fmtDate(p.date)}</time></p>
        <h3 class="insight__title">${esc(p.title)}</h3>
        <p class="insight__excerpt">${esc(p.excerpt)}</p>
        <span class="work__cta">Read <span aria-hidden="true">→</span></span>
      </div>
    </a>
  </li>`).join('')}
</ul>`;
}

/* ---- Careers ------------------------------------------------------------- */
export function roles({ careers, site }) {
  const email = site.contact.careersEmail || site.contact.email;
  if (!careers.length) {
    return `<div class="roles-empty" data-reveal>
  <p class="lead lead--strong">There are no open roles right now.</p>
  <p class="lead">We are always interested in hearing from strategists, writers, designers, filmmakers and marketers who care about the work. Send us your portfolio and a few lines about what you want to do next${email ? ` at <a href="mailto:${esc(email)}?subject=${encodeURIComponent('Open application')}">${esc(email)}</a>` : ''}.</p>
</div>`;
  }
  return `<ul class="roles">${careers.map((r) => `
  <li class="role" data-reveal>
    <div class="role__head"><h3 class="role__title">${esc(r.title)}</h3><p class="role__meta">${esc([r.type, r.location].filter(Boolean).join(' · '))}</p></div>
    <p class="role__desc">${esc(r.summary)}</p>
    ${email ? `<a class="link-arrow" href="mailto:${esc(email)}?subject=${encodeURIComponent('Application: ' + r.title)}">Apply <span aria-hidden="true">→</span></a>` : ''}
  </li>`).join('')}
</ul>`;
}

export function contactList({ site }) {
  return contactLinks(site);
}

export function careersEmail({ site }) {
  const email = site.contact.careersEmail || site.contact.email;
  return email
    ? `<a class="btn btn--primary btn--lg" href="mailto:${esc(email)}?subject=${encodeURIComponent('Application')}">Email your portfolio</a>`
    : '<a class="btn btn--primary btn--lg" href="/contact/">Get in touch</a>';
}

/* ---- FAQ list from page front matter ------------------------------------- */
export function faqList({ page }) {
  return `<div class="faq__list" data-reveal>${(page.faqs ?? []).map((f) => `
  <details class="faq__item">
    <summary><span>${esc(f.q)}</span><span class="faq__icon" aria-hidden="true"></span></summary>
    <p>${esc(f.a)}</p>
  </details>`).join('')}
</div>`;
}
