"""lees_edwards.py -- the Lees-Edwards boundary, drawn like Getting Started's apparatus figure
(biaxial/apparatus.py): one thin line weight, Myriad Pro, ink and a muted gray.

    python lees_edwards.py        -> lees_edwards.svg next to this file

The periodic cell (ink) is seen inside a window onto its copies (gray seams).  The row of copies
above is shifted right by gamma H and the row below left by gamma H, so their seams do not line
up with the cell's.  One grain (filled) touches the top of the cell, and its copy through the
boundary touches the bottom, gamma H to the left.  The discs are the 19-grain cluster of
apparatus.py.
"""
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from matplotlib.patches import Circle, FancyArrowPatch, Rectangle

HERE = Path(__file__).resolve().parent
INK, MUTED, SEAM, FILL = '#111111', '#6b6a67', '#b9b8b3', '#031326'
LW = 0.8
FS_SYM, FS_TXT = 13, 8.5
FONT_DIR = Path.home() / 'Library' / 'Fonts'
for f in ('MYRIADPRO-REGULAR.OTF', 'MyriadPro-It.otf'):
    fm.fontManager.addfont(str(FONT_DIR / f))
plt.rcParams.update({'font.family': 'Myriad Pro', 'mathtext.fontset': 'custom',
                     'mathtext.rm': 'Myriad Pro', 'mathtext.it': 'Myriad Pro:italic',
                     'lines.linewidth': LW, 'patch.linewidth': LW, 'text.color': INK,
                     'svg.fonttype': 'path'})

CLUSTER = [(-0.001, -1.493, 0.5), (-0.748, -1.722, 0.3), (-1.615, -0.051, 0.5),
           (-1.635, 0.817, 0.3), (-0.134, -0.716, 0.3), (0.541, -0.93, 0.3),
           (-0.879, 0.599, 0.5), (0.065, 0.351, 0.5), (-0.896, -0.859, 0.5),
           (0.333, -0.384, 0.3), (-0.566, -0.135, 0.3), (1.103, -0.763, 0.3),
           (1.701, -0.34, 0.3), (0.966, -1.344, 0.3), (0.994, 0.019, 0.5),
           (0.53, 0.984, 0.3), (-0.191, 1.313, 0.5), (1.096, 0.8, 0.3), (0.96, 1.38, 0.3)]
S = 0.18 / 2.177              # the cluster fills a circle of radius 0.18 of the cell
D = 0.30                      # the drawn offset gamma H, as a fraction of the cell
X0, X1, Y0, Y1 = -0.42, 1.42, -0.40, 1.40     # the window onto the copies
GX, GR = 0.66, 0.045          # the marked grain: x and radius

fig = plt.figure(figsize=(5.4, 5.2))
ax = fig.add_axes([0, 0, 1, 1])
ax.set_xlim(-0.86, 1.74)
ax.set_ylim(-0.80, 1.70)
ax.set_aspect('equal')
ax.axis('off')


def arrow(p0, p1, style='-|>'):
    ax.add_patch(FancyArrowPatch(p0, p1, arrowstyle=style, mutation_scale=8, color=INK, lw=LW,
                                 shrinkA=0, shrinkB=0, joinstyle='miter'))


def text(x, y, s, size=FS_TXT, color=MUTED, **kw):
    ax.text(x, y, s, fontsize=size, color=color, **kw)


def seam(x0, y0, x1, y1):
    ax.plot([x0, x1], [y0, y1], color=SEAM, lw=LW, solid_capstyle='butt')


# the copies, cut to the window by hand: row boundaries, then each row's vertical seams
for y in (0.0, 1.0):
    seam(X0, y, 0.0, y)
    seam(1.0, y, X1, y)
for row, shift, ya, yb in ((1, D, 1.0, Y1), (0, 0.0, 0.0, 1.0), (-1, -D, Y0, 0.0)):
    for k in range(-2, 3):
        x = k + shift
        if X0 < x < X1 and not (row == 0 and x in (0.0, 1.0)):
            seam(x, ya, x, yb)

# the cell and its grains
ax.add_patch(Rectangle((0, 0), 1, 1, fill=False, ec=INK, lw=LW, zorder=3))
for cx, cy, cr in CLUSTER:
    ax.add_patch(Circle((0.5 + S * cx, 0.5 + S * cy), S * cr, fc='white', ec=INK, lw=0.7, zorder=3))
text(0.035, 0.5, 'periodic', rotation=90, ha='center', va='center')
text(0.965, 0.5, 'periodic', rotation=-90, ha='center', va='center')

# one grain at the top of the cell, and its copy through the boundary, gamma H to the left
for gx, gy in ((GX, 1.0 - 0.35 * GR), (GX - D, -0.35 * GR)):
    ax.add_patch(Circle((gx, gy), GR, fc=FILL, ec=FILL, lw=0.7, zorder=4))
text(GX - D - 0.07, -0.05, 'the same grain,\n' + r'$\gamma H$ to the left', ha='right', va='top',
     linespacing=1.3)

# the offset between the cell and the row above
arrow((0.0, 1.12), (D, 1.12), '<|-|>')
text(0.5 * D, 1.17, r'$\gamma H$', FS_SYM, INK, ha='center', va='bottom')

# the rows of copies slide opposite ways as the strain grows
arrow((0.25, Y1 + 0.12), (0.75, Y1 + 0.12))
text(0.80, Y1 + 0.12, 'copies above slide right', ha='left', va='center')
arrow((0.75, Y0 - 0.12), (0.25, Y0 - 0.12))
text(0.20, Y0 - 0.12, 'copies below slide left', ha='right', va='center')

# the cell's height
arrow((-0.55, 0.0), (-0.55, 1.0), '<|-|>')
text(-0.60, 0.5, r'$H$', FS_SYM, INK, ha='right', va='center')

# the x-y frame
arrow((-0.76, -0.70), (1.62, -0.70))
arrow((-0.76, -0.70), (-0.76, 1.62))
text(1.635, -0.725, r'$x$', FS_SYM, INK, ha='left', va='top')
text(-0.725, 1.62, r'$y$', FS_SYM, INK, ha='left', va='center')

out = HERE / 'lees_edwards.svg'
fig.savefig(out, transparent=True)
print('wrote', out)
if __import__('sys').argv[1:]:
    fig.savefig(__import__('sys').argv[1], dpi=220, facecolor='white')
