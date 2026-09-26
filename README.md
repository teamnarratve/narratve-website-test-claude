# Narratve Space — Website

Homepage for Narratve Space, an advertising and creative agency based in Kerala, working with brands across India and the GCC.

Static HTML/CSS/JS. No build step.

```
index.html              Home page
assets/css/tokens.css   Design tokens (colour, type, spacing, radius, motion, z-index)
assets/css/main.css     Components and page layout
assets/js/main.js       Interactions (nav, reveals, hero fragments, service preview, market clocks)
assets/img/favicon.svg
```

## Run locally

```sh
npx serve .
# or
python3 -m http.server
```

## Homepage narrative

Hero → Introduction → Capabilities → Selected Work → Approach → Why Narratve Space → Clients → Reach → Final CTA → Footer

## Design system in brief

- **Colour:** surface `#F5F5F7`, elevated `#FAFAFC`, text `#000`, muted `#6B6B6B`. Accent `#0071E3` (hover `#005AB6`) is kept for one word or one detail per section.
- **Type:** SF Pro, falling back to Inter. Headlines are 600 weight with tight leading (0.94–1.1) and negative tracking. Set `--headline-case: uppercase` in `tokens.css` to switch every headline to all caps.
- **Spacing:** 4px grid (4, 8, 12, 16, 20, 24, 52, 60, 72…), 12-column grid.
- **Shape:** 11px button radius, 20px media radius, no shadows.
- **Interaction:** buttons scale to `0.95` when pressed. Focus ring is 2px `#0071E3`.
- **Breakpoints:** 1068 / 833 / 734 / 480px.
- **Motion:** 600ms copy, 800ms slides. All motion is switched off under `prefers-reduced-motion`.

## Placeholders to replace before launch

| Where | What |
| --- | --- |
| Selected Work (`#work`) | The four case studies use placeholder client names and statements, with CSS art standing in for imagery. Replace each `.art` element inside `.work__media` with an `<img>` or `<video>`. |
| Clients | The 12 logo slots are empty on purpose. Put real SVG logos inside each `.client`; CSS renders them monochrome. |
| Footer → Connect | Email, phone, Instagram and LinkedIn links point to `#`. |
| Linked pages | `about.html`, `work.html`, `services.html`, `insights.html`, `careers.html` and `contact.html` don't exist yet. |
