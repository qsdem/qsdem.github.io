# qsdem.github.io

Public website for qsDEM. **No solver code lives in this repository** — the code is distributed
on request through a separate private repository (see the Apply page).

## Pages

| file | tab | contents |
|---|---|---|
| `index.html` | — | landing page, intentionally near-empty |
| `apply.html` | Apply | access request form. **Currently a demo: it does not submit anywhere.** |
| `wiki.html` | Wiki | placeholder. Intended to point at a public wiki repo once one exists. |
| `about.html` | About | what qsDEM is, the method, and the interactive DEM vs qsDEM explorable |
| `assets/css/main.css` | — | shared styles: brand, nav, and the site layout width |

Plain static HTML with no build step. Edit a file and push; GitHub Pages redeploys in about a minute.

## Layout width — keep this consistent

The site width is defined once, in `assets/css/main.css`:

```css
:root {
  --page-max: 1200px;                    /* content column */
  --page-pad: clamp(24px, 4.5vw, 64px);  /* left/right gutter */
}
```

`header.site` and `main` both use those two values, which is what keeps the brand, the nav tabs
and the page content aligned on one left edge at every window size.

**Every new page must wrap its content in `<main>`** so it inherits this. Do not set a
`max-width` on `main` in a page's own `<style>` block; change the tokens above instead.

## Fonts

`Myriad Pro` is first in the stack, so it renders for viewers who have it installed locally.
Everyone else gets `Source Sans 3` from Google Fonts, the closest open humanist sans. Serving
Myriad Pro itself would need a webfont licence from Adobe.

## About page

`about.html` carries page-specific styles inline for the explorable (canvas, equations, panel
grid) and a self-contained script with no libraries. The standalone version of the same demo
lives outside this repo at `Research/qsdem2/demos/qsdem_explorable.html`; the two are separate
files, so a change to one does not propagate to the other.
