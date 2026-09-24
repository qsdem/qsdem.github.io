"""make_results.py -- the results figure of getting-started.html.

    python biaxial/make_results.py        (about a minute)  ->  biaxial/results.svg

Runs biaxial.py as written, every cell but the last, then draws what its Results cell
plots in the site's style: one 0.8 pt line weight, Myriad Pro from ~/Library/Fonts, 780 px wide
so the page shows it at its drawn size.  The discs are rasterized inside the SVG.  The strain
axes run a little past the last step, and each curve ends in a dot, so the ends read as ends.
"""
import re
import sys
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from matplotlib.collections import EllipseCollection

HERE = Path(__file__).resolve().parent
parts = re.split(r'^# %% (.+)$', (HERE / 'biaxial.py').read_text(), flags=re.M)
ns = {}
for title, code in zip(parts[1::2], parts[2::2]):
    if title.strip() != 'Results':
        exec(compile(code, f'biaxial.py [{title.strip()}]', 'exec'), ns)
curve, sp = ns['curve'], ns['sp']

INK, MUTED, GRID = '#111111', '#6b6a67', '#e4e3df'
LW = 0.8
FONT_DIR = Path.home() / 'Library' / 'Fonts'
for f in ('MYRIADPRO-REGULAR.OTF', 'MyriadPro-It.otf'):
    fm.fontManager.addfont(str(FONT_DIR / f))
plt.rcParams.update({
    'font.family': 'Myriad Pro', 'mathtext.fontset': 'custom', 'mathtext.rm': 'Myriad Pro',
    'mathtext.it': 'Myriad Pro:italic', 'svg.fonttype': 'path',
    'axes.linewidth': LW, 'lines.linewidth': LW, 'xtick.major.width': LW,
    'ytick.major.width': LW, 'xtick.major.size': 2.8, 'ytick.major.size': 2.8,
    'xtick.labelsize': 9, 'ytick.labelsize': 9, 'axes.labelsize': 10,
    'axes.edgecolor': INK, 'xtick.color': INK, 'ytick.color': INK, 'axes.labelcolor': INK,
    'text.color': INK, 'axes.spines.top': False, 'axes.spines.right': False})

ea, ratio, ev = curve[:, 0] * 100, curve[:, 1], curve[:, 2] * 100
k = int(np.argmax(ratio))
w = sp.walls

fig = plt.figure(figsize=(780 / 96, 254 / 96))
a1 = fig.add_axes([0.062, 0.175, 0.255, 0.77])
a2 = fig.add_axes([0.405, 0.175, 0.255, 0.77])
a3 = fig.add_axes([0.70, 0.035, 0.29, 0.93])
for ax in (a1, a2):
    ax.set_xlim(0, 10.6)
    ax.set_xticks([0, 2, 4, 6, 8, 10])
    ax.set_xlabel('axial strain (%)')
a1.plot(ea, ratio, color=INK)
a1.plot([ea[-1]], [ratio[-1]], 'o', ms=2.6, color=INK)
a1.plot([ea[k]], [ratio[k]], 'o', ms=3.2, mfc='white', mec=INK, mew=LW)
a1.annotate(f'peak {ratio[k]:.2f}', (ea[k], ratio[k]), xytext=(-6, 4),
            textcoords='offset points', ha='right', va='bottom', fontsize=9, color=MUTED)
a1.set_ylim(1, 3.3)
a1.set_ylabel(r'stress ratio  $\sigma_1/\sigma_3$')
a2.axhline(0, color=GRID, lw=LW, zorder=0)
a2.plot(ea, ev, color=INK)
a2.plot([ea[-1]], [ev[-1]], 'o', ms=2.6, color=INK)
a2.set_ylabel('volumetric strain (%), compaction +')
lim = np.percentile(np.abs(sp.rot), 98)
discs = EllipseCollection(2 * sp.R, 2 * sp.R, np.zeros(len(sp.R)), units='x', offsets=sp.pos,
                          offset_transform=a3.transData, cmap='RdBu_r', edgecolor='none')
discs.set_array(sp.rot)
discs.set_clim(-lim, lim)
discs.set_rasterized(True)
a3.add_collection(discs)
a3.plot([w[0], w[1], w[1], w[0], w[0]], [w[2], w[2], w[3], w[3], w[2]], color=INK, lw=LW)
a3.set_xlim(w[0] - 0.3, w[1] + 0.3)
a3.set_ylim(w[2] - 0.3, w[3] + 0.3)
a3.set_aspect('equal')
a3.axis('off')
out = HERE / 'results.svg'
fig.savefig(out, transparent=True, dpi=192)       # 2x for the rasterized discs
if len(sys.argv) > 1:                             # optional PNG preview
    fig.savefig(sys.argv[1], dpi=192, facecolor='white')
print(f'wrote {out} ({out.stat().st_size / 1e3:.0f} kB)')
