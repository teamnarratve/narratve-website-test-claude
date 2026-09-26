import { esc, pad2, fmtDate } from './util.mjs';
import { picture } from './images.mjs';
import { cta, workMedia } from './partials.mjs';

export function breadcrumbs(items) {
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${items.map((b, i) =>
    i === items.length - 1
      ? `<li><span aria-current="page">${esc(b.name)}</span></li>`
      : `<li><a href="${b.path}">${esc(b.name)}</a></li>`).join('')}</ol></nav>`;
}

/* ---- Service detail ------------------------------------------------------ */
export function servicePage(ctx, s, index) {
  const { services } = ctx;
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Services', path: '/services/' }, { name: s.title, path: `/services/${s.slug}/` }];
  const related = s.related.map((slug) => services.find((x) => x.slug === slug)).filter(Boolean);
  const half = Math.ceil(s.deliverables.length / 2);

  const body = `
<section class="page-hero page-hero--service">
  <div class="container">
    ${breadcrumbs(crumbs)}
    <p class="eyebrow" data-reveal>Service ${pad2(index + 1)} <span class="eyebrow__sep">/</span> ${pad2(services.length)}</p>
    <h1 class="display page-hero__title" data-reveal>${esc(s.title)}</h1>
    <div class="page-hero__foot grid">
      <p class="lead page-hero__lead" data-reveal>${esc(s.short)}</p>
      <div class="page-hero__actions" data-reveal><a class="btn btn--primary" href="/contact/?service=${encodeURIComponent(s.title)}">Discuss a project</a></div>
    </div>
  </div>
</section>

<div class="container page-media" data-reveal>
  ${picture(s.image, { alt: s.imageAlt, sizes: '(max-width: 1905px) 92vw, 1760px', cls: 'page-media__img', loading: 'eager', ratio: '21/9' })}
</div>

<section class="section statement" aria-labelledby="svc-statement">
  <div class="container grid">
    <h2 class="display display--lg statement__title" id="svc-statement" data-reveal>${esc(s.headline)}</h2>
    <p class="lead statement__text" data-reveal>${esc(s.intro)}</p>
  </div>
</section>

<section class="section section--elevated" aria-labelledby="svc-included">
  <div class="container">
    <header class="section-head grid">
      <p class="eyebrow" data-reveal>What’s included</p>
      <h2 class="display display--lg section-head__title" id="svc-included" data-reveal>Everything the work needs.<br>Nothing it doesn’t.</h2>
    </header>
    <div class="deliverables" data-reveal>
      <ol class="deliverables__col">${s.deliverables.slice(0, half).map((d, i) => `<li><span>${pad2(i + 1)}</span>${esc(d)}</li>`).join('')}</ol>
      <ol class="deliverables__col" start="${half + 1}">${s.deliverables.slice(half).map((d, i) => `<li><span>${pad2(half + i + 1)}</span>${esc(d)}</li>`).join('')}</ol>
    </div>
  </div>
</section>

<section class="section section--dark" aria-labelledby="svc-approach">
  <div class="container">
    <p class="eyebrow eyebrow--on-dark" data-reveal>How we approach it</p>
    <h2 class="display display--lg" id="svc-approach" data-reveal>Four steps.<br><span class="muted-on-dark">No guesswork.</span></h2>
    <ol class="pillars">${s.approach.map((a, i) => `
      <li class="pillar" data-reveal>
        <span class="pillar__num">${pad2(i + 1)} /</span>
        <h3 class="pillar__title">${esc(a.title)}</h3>
        <p class="pillar__text">${esc(a.text)}</p>
      </li>`).join('')}
    </ol>
  </div>
</section>

<section class="section" aria-labelledby="svc-faq">
  <div class="container grid faq">
    <div class="faq__head">
      <p class="eyebrow" data-reveal>Questions</p>
      <h2 class="display display--lg" id="svc-faq" data-reveal>Good questions.<br>Straight answers.</h2>
    </div>
    <div class="faq__list" data-reveal>${s.faqs.map((f) => `
      <details class="faq__item">
        <summary><span>${esc(f.q)}</span><span class="faq__icon" aria-hidden="true"></span></summary>
        <p>${esc(f.a)}</p>
      </details>`).join('')}
    </div>
  </div>
</section>

<section class="section section--elevated" aria-labelledby="svc-related">
  <div class="container">
    <header class="section-head grid">
      <p class="eyebrow" data-reveal>Works well with</p>
      <h2 class="display display--lg section-head__title" id="svc-related" data-reveal>Better together.</h2>
    </header>
    <ol class="service-list service-list--compact">${related.map((r) => `
      <li class="service">
        <a class="service__link" href="/services/${r.slug}/">
          <span class="service__num">${pad2(services.indexOf(r) + 1)}</span>
          <h3 class="service__title">${esc(r.title)}</h3>
          <p class="service__desc">${esc(r.short)}</p>
          <span class="service__arrow" aria-hidden="true">→</span>
        </a>
      </li>`).join('')}
    </ol>
  </div>
</section>
${cta(ctx, 'service')}`;

  return {
    path: `/services/${s.slug}/`,
    title: s.metaTitle,
    description: s.metaDescription,
    ogImage: s.image,
    ogAlt: s.imageAlt,
    breadcrumbs: crumbs,
    service: s,
    faqs: s.faqs,
    body
  };
}

/* ---- Case study ---------------------------------------------------------- */
export function workPage(ctx, w, index) {
  const { work, services } = ctx;
  const next = work[(index + 1) % work.length];
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Work', path: '/work/' }, { name: w.client, path: `/work/${w.slug}/` }];
  const svc = (w.services ?? []).map((slug) => services.find((s) => s.slug === slug)).filter(Boolean);
  const blocks = [['The challenge', w.challenge], ['The idea', w.idea], ['The result', w.result]].filter(([, t]) => t);
  const gallery = (w.gallery ?? []).map((g, i) =>
    `<figure class="gallery__item${g.wide ? ' gallery__item--wide' : ''}" data-reveal>${picture(g.src, { alt: g.alt, sizes: g.wide ? '92vw' : '(max-width: 833px) 100vw, 46vw' })}${g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ''}</figure>`).join('');

  const body = `
<section class="page-hero page-hero--case">
  <div class="container">
    ${breadcrumbs(crumbs)}
    <p class="eyebrow" data-reveal>${esc(w.client)}</p>
    <h1 class="display page-hero__title page-hero__title--case" data-reveal>${esc(w.title)}</h1>
    <dl class="case-meta" data-reveal>
      <div><dt>Client</dt><dd>${esc(w.client)}</dd></div>
      <div><dt>Discipline</dt><dd>${esc(w.categories.join(', '))}</dd></div>
      ${w.year ? `<div><dt>Year</dt><dd>${esc(w.year)}</dd></div>` : ''}
      ${w.market ? `<div><dt>Market</dt><dd>${esc(w.market)}</dd></div>` : ''}
    </dl>
  </div>
</section>

<div class="container page-media page-media--case" data-reveal>
  <figure class="work__media work__media--hero">${workMedia(w, { sizes: '92vw', priority: true })}</figure>
</div>

<section class="section statement" aria-label="Overview">
  <div class="container grid">
    <p class="display display--lg statement__title" data-reveal>${esc(w.summary)}</p>
    ${svc.length ? `<div class="statement__text" data-reveal><p class="footer__label">Services</p><ul class="tag-list">${svc.map((s) => `<li><a href="/services/${s.slug}/">${esc(s.title)}</a></li>`).join('')}</ul></div>` : ''}
  </div>
</section>

${blocks.length ? `<section class="section section--elevated" aria-label="Case study">
  <div class="container">
    <div class="case-blocks">${blocks.map(([h, t]) => `
      <div class="case-block" data-reveal><h2 class="case-block__title">${h}</h2><p class="lead">${esc(t)}</p></div>`).join('')}
    </div>
  </div>
</section>` : ''}

${gallery ? `<section class="section" aria-label="Gallery"><div class="container gallery">${gallery}</div></section>` : ''}

${next && next !== w ? `<section class="next-project" aria-label="Next project">
  <a class="container next-project__link" href="/work/${next.slug}/">
    <span class="eyebrow">Next project</span>
    <span class="display display--xl next-project__title">${esc(next.client)} <span aria-hidden="true">→</span></span>
    <span class="lead lead--muted">${esc(next.summary)}</span>
  </a>
</section>` : ''}
${cta(ctx)}`;

  return {
    path: `/work/${w.slug}/`,
    title: `${w.client} — ${w.categories[0]} Case Study`,
    description: w.summary,
    ogImage: w.cover,
    breadcrumbs: crumbs,
    noindex: !!w.draft,
    body
  };
}

/* ---- Article ------------------------------------------------------------- */
export function articlePage(ctx, p, content) {
  const { insights } = ctx;
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Insights', path: '/insights/' }, { name: p.title, path: `/insights/${p.slug}/` }];
  const words = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 220));
  const more = insights.filter((x) => x.slug !== p.slug).slice(0, 2);

  const body = `
<article class="article">
  <header class="page-hero page-hero--article">
    <div class="container">
      ${breadcrumbs(crumbs)}
      <p class="eyebrow" data-reveal>${esc(p.category)} <span class="eyebrow__sep">/</span> <time datetime="${p.date}">${fmtDate(p.date)}</time> <span class="eyebrow__sep">/</span> ${mins} min read</p>
      <h1 class="display page-hero__title page-hero__title--article" data-reveal>${esc(p.title)}</h1>
      <p class="lead page-hero__lead" data-reveal>${esc(p.excerpt)}</p>
    </div>
  </header>
  <div class="container page-media" data-reveal>
    ${picture(p.image, { alt: p.imageAlt ?? '', sizes: '(max-width: 1905px) 92vw, 1760px', loading: 'eager', ratio: '21/9', cls: 'page-media__img' })}
  </div>
  <div class="container">
    <div class="prose">${content}</div>
    <footer class="article__foot">
      <p class="article__by">Written by the ${esc(ctx.site.name)} team.</p>
      <a class="link-arrow" href="/insights/">All insights <span aria-hidden="true">→</span></a>
    </footer>
  </div>
</article>

${more.length ? `<section class="section section--elevated" aria-labelledby="more-title">
  <div class="container">
    <header class="section-head grid"><p class="eyebrow">Keep reading</p><h2 class="display display--lg section-head__title" id="more-title">More thinking.</h2></header>
    <ul class="insight-list">${more.map((m) => `
      <li class="insight"><a class="insight__link" href="/insights/${m.slug}/">
        <figure class="insight__media">${picture(m.image, { alt: m.imageAlt ?? '', sizes: '(max-width: 833px) 100vw, 40vw', ratio: '4/3' })}</figure>
        <div class="insight__body"><p class="insight__meta"><span>${esc(m.category)}</span><time datetime="${m.date}">${fmtDate(m.date)}</time></p>
        <h3 class="insight__title">${esc(m.title)}</h3><p class="insight__excerpt">${esc(m.excerpt)}</p></div>
      </a></li>`).join('')}
    </ul>
  </div>
</section>` : ''}
${cta(ctx)}`;

  return {
    path: `/insights/${p.slug}/`,
    title: p.title,
    description: p.excerpt,
    ogImage: p.image,
    ogType: 'article',
    article: { date: p.date, title: p.title, category: p.category },
    breadcrumbs: crumbs,
    body
  };
}
