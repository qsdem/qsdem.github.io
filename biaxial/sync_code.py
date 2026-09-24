"""sync_code.py -- copy the cells of biaxial.py into the page and the notebook.

    python biaxial/sync_code.py        (from the site root, or from biaxial/)

biaxial.py is the one source.  Each '# %% Title' line starts a cell.  In
getting-started.html every  <!-- cell: Title --> ... <!-- /cell -->  pair is refilled with that
cell's code, HTML-escaped (the page highlights it in the browser), and biaxial.ipynb is
rewritten with one heading and one code cell per cell, outputs empty.  Nothing else in the page
changes, so the prose around the cells stays hand-edited.
"""
import html
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE / 'biaxial.py'
PAGE = HERE.parent / 'getting-started.html'
NB = HERE / 'biaxial.ipynb'


def cells(text):
    parts = re.split(r'^# %% (.+)$', text, flags=re.M)
    return [(parts[k].strip(), parts[k + 1].strip('\n')) for k in range(1, len(parts), 2)]


def main():
    cs = cells(SRC.read_text())
    page = PAGE.read_text()
    for title, code in cs:
        pat = re.compile(r'(<!-- cell: ' + re.escape(title) + r' -->\n).*?(<!-- /cell -->)', re.S)
        if not pat.search(page):
            raise SystemExit(f'no <!-- cell: {title} --> marker in {PAGE.name}')
        block = f'<pre class="code"><code>{html.escape(code, quote=False)}</code></pre>\n'
        page = pat.sub(lambda m: m.group(1) + block + m.group(2), page, count=1)
    PAGE.write_text(page)

    nb_cells = [{'cell_type': 'markdown', 'metadata': {}, 'source': [
        '# qsDEM Getting Started: the biaxial test\n', '\n',
        'The Kishino solver and a biaxial compression test in plain Python. The text that goes ',
        'with each cell is at [qsdem.github.io/getting-started.html]',
        '(https://qsdem.github.io/getting-started.html).']}]
    for title, code in cs:
        nb_cells.append({'cell_type': 'markdown', 'metadata': {}, 'source': [f'## {title}']})
        lines = code.split('\n')
        nb_cells.append({'cell_type': 'code', 'execution_count': None, 'metadata': {},
                         'outputs': [], 'source': [l + '\n' for l in lines[:-1]] + lines[-1:]})
    nb = {'cells': nb_cells, 'metadata': {
        'kernelspec': {'display_name': 'Python 3', 'language': 'python', 'name': 'python3'},
        'language_info': {'name': 'python'}}, 'nbformat': 4, 'nbformat_minor': 5}
    for k, c in enumerate(nb['cells']):
        c['id'] = f'cell-{k:02d}'
    NB.write_text(json.dumps(nb, indent=1) + '\n')
    print(f'{len(cs)} cells -> {PAGE.name}, {NB.name}')


if __name__ == '__main__':
    main()
