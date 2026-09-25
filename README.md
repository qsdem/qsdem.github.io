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
| `blog.html` | Blog | dated posts, newest first (see below) |
| `wiki.html` | — | redirect to `getting-started.html`, where the Wiki's two articles now live. Its old anchors land on their sections |
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

**Getting Started, Blog and About have a left sidebar.** `.columns` is a flex row of a fixed 280px
`.sidebar` and a flexible `.main`, with a 40px gap. The page heading (`h1`) and that page's standing
text live in the sidebar (the contents list on Getting Started, the model description on About); the content
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

## Blog page

`blog.html` is one page of dated posts, newest first. Each post is a `<details class="post">`:
its `<summary>` holds the title, the date and a one or two sentence summary, which always show,
and a click opens the full article underneath. No JavaScript is needed for that. A small script
opens the post named in the address (`blog.html#<post id>`) and writes a post's id into the
address when it is opened, so an open post can be shared.

To add a post, copy the commented template at the top of the list in `blog.html`, fill it in and
put it above the newest post. Its id is its date and a slug, `2026-09-25-slug`, and its date goes
in a `<time datetime>`. Give images `loading="lazy"` and videos `preload="none"`, so a closed post
downloads nothing. "No posts yet." hides itself once the list holds a post.

## Getting Started page

`getting-started.html` is a wiki of qsDEM's concepts and the applications built on them, in four
sections: Setup, the Kishino solver, the biaxial test, and the SPH mantle. The Kishino and SPH
text is the old Wiki's articles, without the momentum paragraphs, and the Kishino section adds
the solver as code cells. Future applications (subduction) go in as sections of their own.

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
| `mu_sweep_1M.mp4` | the 1M-grain friction sweep, see below |
| `mu_sweep_1M_poster.webp` | its last frame at 1560 px, `cwebp -q 88 -m 6 -sharp_yuv -resize 1560 0` |

The movie shows the four 1M runs of the 9.24 friction sweep,
`../9.24/biaxial/runs/biaxial_N999939_mu{00,10,20,30}.h5`, side by side. It is made by
`../9.24/biaxial/mu_sheet_web.py`, the site version of `mu_sheet.py`. It keeps the same panels
and renderer (white page, black pores, one scale for every panel, drawn at 2x like
`mu_sheet.py`), and sets the labels in Myriad Pro Regular with the page figures' colors. The row
is 3120 px wide, 4x the 780 px column, like the homepage hero: H.264 keeps color at half
resolution, so at 3120 the color is 1560 wide, pixel for pixel on a DPR-2 screen. It uses all
483 frames to 10% strain, at 31.2 fps, 1.3 times `mu_sheet.py`'s 24 fps, and is tagged BT.709
with TV range like the hero:

    cd ../9.24/biaxial
    python mu_sheet_web.py         # about 6 min: lossless 1.7 GB master, then the MP4
    cp results/mu_sweep_1M_web.mp4 <site>/biaxial/mu_sweep_1M.mp4
    cwebp -q 88 -m 6 -sharp_yuv -resize 1560 0 results/mu_sweep_1M_web_last.png \
        -o <site>/biaxial/mu_sweep_1M_poster.webp

The MP4 uses `mu_sheet.py`'s own encoding, CRF 21 capped at 14 Mb/s, which gives 30 MB.
`python mu_sheet_web.py --encode-only --crf C` re-encodes from the master without redrawing.
CRF 26 gives 18 MB with slightly softer speckle. A 1560 px row gives 10 MB but loses the grain
texture. The page loads and plays the movie only while it is on screen, and a click pauses it.
