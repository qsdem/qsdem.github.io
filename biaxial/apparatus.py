"""apparatus.py -- schematic of the qsDEM biaxial apparatus (9.24/biaxial), drawn after Fig. 1
of Combe and Roux, PRL 85, 3628 (2000): the box, the wall roles, the loads, the dimension lines
and the x-y frame, one thin line weight throughout.

    python apparatus.py        -> apparatus.svg and apparatus.png next to this file

What it shows.  Top platen displacement-controlled (moved down by delta per step, mu 0.5),
bottom platen fixed (hatched, mu 0.5), left and right walls stress-controlled servo walls that
each hold the force sigma_3 x H (frictionless, the membrane).  The disc cluster is 19 real grains
from the center of the consolidated 10k specimen (bidisperse R 0.5 / 0.3), scaled into the
sketch; the grain-to-box ratio is not to scale, as in the paper's figure.
"""
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from matplotlib.patches import Circle, FancyArrowPatch, Rectangle

HERE = Path(__file__).resolve().parent
INK, MUTED = '#111111', '#6b6a67'
LW = 0.8                      # one line weight
FS_SYM, FS_TXT = 13, 8.5      # symbols, role labels

# Myriad Pro, the site's face, from the user's font folder; the SVG embeds glyphs as paths so
# the published file needs no font.
FONT_DIR = Path.home() / 'Library' / 'Fonts'
FONTS = {'regular': 'MYRIADPRO-REGULAR.OTF', 'italic': 'MyriadPro-It.otf', 'bold': 'MYRIADPRO-BOLD.OTF'}
if all((FONT_DIR / f).exists() for f in FONTS.values()):
    for f in FONTS.values():
        fm.fontManager.addfont(str(FONT_DIR / f))
    plt.rcParams.update({'font.family': 'Myriad Pro', 'mathtext.fontset': 'custom',
                         'mathtext.rm': 'Myriad Pro', 'mathtext.it': 'Myriad Pro:italic',
                         'mathtext.bf': 'Myriad Pro:bold', 'mathtext.sf': 'Myriad Pro'})
else:
    print('Myriad Pro not found in ~/Library/Fonts, drawing with the default sans')
plt.rcParams.update({'lines.linewidth': LW, 'patch.linewidth': LW, 'text.color': INK,
                     'svg.fonttype': 'path'})

# (x, y, R) of the 19 grains within 1.9 of the center of packs/consol_N10000_sigauto.npz
# (9.24/biaxial), relative to that center, grain units.
CLUSTER = [(-0.001, -1.493, 0.5), (-0.748, -1.722, 0.3), (-1.615, -0.051, 0.5),
           (-1.635, 0.817, 0.3), (-0.134, -0.716, 0.3), (0.541, -0.93, 0.3),
           (-0.879, 0.599, 0.5), (0.065, 0.351, 0.5), (-0.896, -0.859, 0.5),
           (0.333, -0.384, 0.3), (-0.566, -0.135, 0.3), (1.103, -0.763, 0.3),
           (1.701, -0.34, 0.3), (0.966, -1.344, 0.3), (0.994, 0.019, 0.5),
           (0.53, 0.984, 0.3), (-0.191, 1.313, 0.5), (1.096, 0.8, 0.3), (0.96, 1.38, 0.3)]
CLUSTER_EDGE = 2.177          # outermost disc edge of that set, grain units
CLUSTER_R = 0.215             # its radius in the sketch, box units

fig = plt.figure(figsize=(5.4, 4.4))
ax = fig.add_axes([0, 0, 1, 1])
ax.set_xlim(-0.92, 1.66)
ax.set_ylim(-0.58, 1.52)
ax.set_aspect('equal')
ax.axis('off')


def arrow(p0, p1, style='-|>', scale=8):
    ax.add_patch(FancyArrowPatch(p0, p1, arrowstyle=style, mutation_scale=scale, color=INK,
                                 lw=LW, shrinkA=0, shrinkB=0, joinstyle='miter'))


def text(x, y, s, size=FS_TXT, color=MUTED, **kw):
    ax.text(x, y, s, fontsize=size, color=color, **kw)


# the box: unit square, W = H (the specimen is 1:1)
ax.add_patch(Rectangle((0, 0), 1, 1, fill=False, ec=INK, lw=LW))

# bottom platen fixed: the paper's hatching, short strokes leaning right under the wall
for x in [0.03 + 0.04 * k for k in range(25)]:
    ax.plot([x - 0.03, x], [-0.035, 0.0], color=INK, lw=0.6, solid_capstyle='butt')

# top platen: displacement control
arrow((0.5, 1.33), (0.5, 1.0))
text(0.55, 1.215, r'$\delta$', FS_SYM, INK, ha='left', va='center')
text(0.55, 1.115, 'strain control', ha='left', va='center')

# servo walls: each face at sigma_3 H
for x0, x1, xc in ((-0.40, 0.0, -0.20), (1.40, 1.0, 1.20)):
    arrow((x0, 0.5), (x1, 0.5))
    text(xc, 0.545, r'$\sigma_3 H$', FS_SYM, INK, ha='center', va='bottom')
    text(xc, 0.455, 'stress control', ha='center', va='top')

# wall roles inside, in the place of the paper's wall numbers
text(0.5, 0.955, 'top platen, μ = 0.5', ha='center', va='top')
text(0.5, 0.045, 'bottom platen, fixed, μ = 0.5', ha='center', va='bottom')
text(0.045, 0.5, 'servo wall, μ = 0', rotation=90, ha='center', va='center')
text(0.955, 0.5, 'servo wall, μ = 0', rotation=-90, ha='center', va='center')

# dimensions
arrow((-0.58, 0.0), (-0.58, 1.0), '<|-|>')
text(-0.635, 0.5, r'$H$', FS_SYM, INK, ha='right', va='center')
arrow((0.0, -0.20), (1.0, -0.20), '<|-|>')
text(0.5, -0.255, r'$W$', FS_SYM, INK, ha='center', va='top')

# the x-y frame, as in the paper
arrow((-0.80, -0.44), (1.55, -0.44))
arrow((-0.80, -0.44), (-0.80, 1.42))
text(1.565, -0.465, r'$x$', FS_SYM, INK, ha='left', va='top')
text(-0.765, 1.42, r'$y$', FS_SYM, INK, ha='left', va='center')

# the grains
s = CLUSTER_R / CLUSTER_EDGE
for x, y, r in CLUSTER:
    ax.add_patch(Circle((0.5 + s * x, 0.5 + s * y), s * r, fc='white', ec=INK, lw=0.7))

for name, kw in (('apparatus.svg', {}), ('apparatus.png', {'dpi': 300})):
    fig.savefig(HERE / name, transparent=True, **kw)
    print('wrote', HERE / name)
