# qsdem.github.io

Public website for qsDEM. **No solver code lives in this repository** — the code is distributed
on request through a separate private repository (see the Apply page).

## Pages

| file | tab | contents |
|---|---|---|
| `index.html` | — | **black** page, full-bleed looping sweep of 10 render frames |
| `apply.html` | Apply | access request form. **Currently a demo: it does not submit anywhere.** |
| `wiki.html` | Wiki | placeholder. Intended to point at a public wiki repo once one exists. |
| `about.html` | About | what qsDEM is, the method, and the interactive DEM vs qsDEM explorable |
| `assets/css/main.css` | — | shared styles: brand, nav, and the site layout width |

Plain static HTML with no build step. Edit a file and push; GitHub Pages redeploys in about a minute.

## Homepage sweep

`index.html` is the only dark page. It overrides `--bg`, `--ink` and `--muted` in its own `<style>`
block so the black sky in the render frames meets the page with no seam, and its `.sweep` container
is the one deliberate exception to the layout width below: it spans the full viewport.

The ten frames in `assets/img/sed04km/` are evenly spaced across the sediment run
`SWEEP/sediment/runs/subduction_N191890_sed04km.h5` (600x20 km plate, 30 deg wedge, 0.4 km sediment
cap, 191,890 particles, 200 km of convergence, 73.6 km of slab). All share one 16:9 crop of
x 150-450 km, y 10-178.75 km, the bottom lifted clear of the floor whose boundary layer was visible
at y = 0. Rendered by `../9.2/geometrytest/frames_16x9.py`, which takes any run HDF5, so swapping
the homepage to a different run is one command plus the two file lists in `index.html`. Two widths per frame, 3840 and 1920, so `srcset`
can spare phones the desktop file. About 39 MB for the desktop set, which is why frame 0 ships in
the HTML and the other nine are attached by script after first paint.

Transitions fade the incoming frame in **on top of** the outgoing one, which stays opaque
underneath. Fading both at once would let the black container show through and dip the whole image
dark at every step.

The sweep fills the viewport below the header. One 16:9 copy is taller than that space on a wide
screen, so a desktop sees a single whole frame. On a portrait phone or tablet one copy would be a
thin band with dead black beneath it, so the frame **repeats down the page** instead. That is done
with `background-repeat: repeat-y` on two crossfading layers rather than cloned `<img>` per tile,
which keeps it at one decoded bitmap per frame no matter how many tiles are on screen.

## Layout width — keep this consistent

The site width is defined once, in `assets/css/main.css`:

```css
:root {
  --page-max: 1200px;                    /* content column */
  --page-pad: clamp(24px, 4.5vw, 64px);  /* left/right gutter */
}
```

`main` is capped at `--page-max` and centred. The **header is full width and left-aligned**, so
the brand and tabs sit in the `--page-pad` gutter at any window size; it deliberately does not take
`--page-max`. Both use the same gutter.

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
