# qsdem.github.io

Public website for qsDEM. **The qsDEM solver does not live in this repository.** The Getting
Started page carries a separate teaching version of the Kishino method in plain Python,
`biaxial/biaxial.py`, which imports nothing from qsDEM.

## Pages

| file | tab | contents |
|---|---|---|
| `index.html` | — | **black** page, full-bleed looping sweep of 10 render frames |
| `getting-started.html` | Getting Started | concepts and applications: the Kishino solver as code, the biaxial test, the SPH mantle (see below) |
| `apply.html` | — | redirect to `getting-started.html`, which replaced the Apply form |
| `wiki.html` | Wiki | placeholder. Intended to point at a public wiki repo once one exists. |
| `about.html` | About | what qsDEM is, the method, and the interactive DEM vs qsDEM explorable |
| `assets/css/main.css` | — | shared styles: brand, nav, and the site layout width |

Plain static HTML with no build step. Edit a file and push; GitHub Pages redeploys in about a minute.

## Homepage sweep

`index.html` is the only dark page. It overrides `--bg`, `--ink` and `--muted` in its own `<style>`
block so the black sky in the render frames meets the page with no seam, and its `.sweep` container
is the one deliberate exception to the layout width below: it spans the full viewport.

The ten frames in `assets/img/sed06km/` are evenly spaced across the sediment run
`SWEEP/sediment/runs/subduction_N193052_sed06km.h5` (600x20 km plate, 30 deg wedge, 0.6 km sediment
cap, 193,052 particles, 200 km of convergence, 80.7 km of slab). All share one 16:9 crop of
x 150-450 km, y 20-188.75 km. The bottom clears the floor boundary layer; the top was raised from
the 0.4 km run's 178.75 because the thicker cap lifts the plate crest to 169.6 km. Rendered by
`../9.2/geometrytest/frames_16x9.py`, which takes any run HDF5, so swapping the homepage to a
different run is one command plus the two file lists in `index.html`. Two widths per frame, 3840
and 1920, so `srcset` can spare phones the desktop file.

Transitions fade the incoming frame in **on top of** the outgoing one, which stays opaque
underneath. Fading both at once would let the black container show through and dip the whole image
dark at every step.

The sweep fills the page under the nav. A landscape window needs barely more than one frame, so a
script picks `background-size: cover` there; tiling in that case left a sliver of the next frame
whose black sky met this frame's red mantle bottom, reading as a faint red line. On a portrait phone
or tablet, where more than about one and a half frames fit, it switches to `background-repeat:
repeat-y` so the frame repeats down the page instead of leaving black, which keeps one decoded
bitmap per frame however many tiles are on screen.

## Styling

The site mirrors `braydennoh.github.io/style.css` exactly: the same self-hosted Myriad Pro, the
same 15px / 1.5 body on a 960px left-aligned column with 30x40 padding, `#031326` links (the darkest colour of cmcrameri lipari),
the same 13px dot-separated top nav, and the same two-column layout.

**Getting Started, Wiki and About have a left sidebar.** `.columns` is a flex row of a fixed 280px
`.sidebar` and a flexible `.main`, with a 40px gap. The page heading (`h1`) and that page's standing
text live in the sidebar (the contents list on Getting Started and Wiki, the model description on About); the content
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

## Getting Started page

`getting-started.html` is a wiki of qsDEM's concepts and the applications built on them, in four
sections: Setup, the Kishino solver, the biaxial test, and the SPH mantle. The Kishino and SPH
text is the Wiki's, without the momentum paragraphs, and the Kishino section adds the solver as
code cells. Future applications (subduction) go in as sections of their own.

The code cells, the downloadable script and the notebook all come from one file,
`biaxial/biaxial.py`, where each `# %% Title` line starts a cell. Edit that file, then run

    python biaxial/sync_code.py

which refills every `<!-- cell: Title -->` block in the page and rewrites
`biaxial/biaxial.ipynb`. The prose around the cells is edited by hand. The page's own
script highlights the code and adds the Copy buttons, with no library. The output blocks under
the cells are pasted from a run, so rerun the tutorial when the code changes and update them.

The other files in `biaxial/`:

| file | made by |
|---|---|
| `apparatus.svg` | `python biaxial/apparatus.py`, Figure 1 of the page, the biaxial apparatus |
| `results.svg` | `python biaxial/make_results.py`, which runs `biaxial.py` (about a minute) and redraws its last cell |
| `platiness_1M.mp4` | the 1M-grain 9.24 run, see below |
| `platiness_1M_poster.webp` | the master's last frame, `cwebp -q 88 -m 6 -sharp_yuv` |

The movie is rendered from `../9.24/biaxial/runs/biaxial_N999939.h5` by
`../9.24/biaxial/render_platiness_web.py`, which is `render_platiness.py` with a white field
around the specimen and the specimen's wall box underlaid in lipari's darkest colour, so the
pores read as they do on black:

    python render_platiness_web.py runs/biaxial_N999939.h5 --canvas 1560x1448 --bitrate 40000k
    ffmpeg -i results/biaxial_N999939_platiness_1560x1448.mp4 -an -vf setpts=PTS/1.3 -r 31.2 \
        -c:v libx264 -preset slow -crf 30 -pix_fmt yuv420p -profile:v high \
        -movflags +faststart platiness_1M.mp4

The master runs 21.6 s at 24 fps. `setpts=PTS/1.3 -r 31.2` plays it 1.3 times faster with every
frame kept, 16.6 s. 1560 px is twice the 780 px column, so a DPR-2 screen draws it pixel for
pixel, and CRF 30 keeps it at 8.5 MB. The page loads and plays it only while it is on screen,
and a click pauses it.
