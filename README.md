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

The sweep fills the page under the nav. One 16:9 copy is taller than that space on a wide screen,
so a desktop sees a whole frame; on a portrait phone the frame repeats down the page instead of
leaving black, via `background-repeat: repeat-y`, which keeps one decoded bitmap per frame.

## Styling

The site mirrors `braydennoh.github.io/style.css` exactly: the same self-hosted Myriad Pro, the
same 15px / 1.5 body on a 960px left-aligned column with 30x40 padding, the same `#003399` links,
the same 13px dot-separated top nav, and the same two-column layout.

**Apply, Wiki and About have a left sidebar.** `.columns` is a flex row of a fixed 280px
`.sidebar` and a flexible `.main`, with a 40px gap. The page heading (`h1`) and that page's standing
text live in the sidebar (the access terms on Apply, the model description on About); the content
lives in `.main`. Below 700px the columns stack and the sidebar goes full width.

The nav is `position: fixed` rather than `sticky`, because sticky fails silently in some mobile
browsers and inside certain flex ancestors; `body` therefore carries a `--nav-h` top padding to
reserve its space. The sidebar is sticky under the nav at every width, mobile included, where it
needs its own background and z-index so the content slides underneath instead of showing through.

`index.html` is the exception: no sidebar and no 960px column. It overrides the body to a black
full-bleed page whose nav links are white for legibility, with the looping sweep filling everything
below the nav.

Fonts are the three woff2 files in `assets/fonts/`, copied from the reference site.

## About page

`about.html` carries page-specific styles inline for the explorable (canvas, equations, panel
grid) and a self-contained script with no libraries. Each method is one `.col` holding its title,
canvas, legend and readout, so below 900px they stack as DEM title, DEM plot, DEM numbers, then the
same for qsDEM, rather than interleaving. The standalone version of the same demo
lives outside this repo at `Research/qsdem2/demos/qsdem_explorable.html`; the two are separate
files, so a change to one does not propagate to the other.
