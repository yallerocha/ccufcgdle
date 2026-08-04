"""Generator for the pixel-art host sprite (src/client/components/ShowHost.tsx).

The head is hand-drawn row by row — no procedural shading, which is what made
an early version look airbrushed instead of like pixel art. The suit is laid
out with a few loops because it is just tapered bands. This script validates
row widths, stamps the per-mood faces, and prints the SPRITE / MOOD_ROWS
blocks to paste into the component.

Geometry: 48x57, centred on x=23.5.
  head   x8..x39, y3..y41        eyes   x13..x20 and x27..x34, y24..y28
  hair   y3..y17 + temples       nose   x21..x26, y29..y33
  neck   y42..y44               mouth   x18..x29, y35..y37
  suit   y45..y56
"""
W, H = 48, 57

def center(inner):
    pad = W - len(inner)
    return '.' * (pad // 2) + inner + '.' * (pad - pad // 2)

def head(interior):
    """Head row: outline on x8/x39, 30 px of interior between."""
    assert len(interior) == 30, (len(interior), interior)
    return '........o' + interior + 'o........'

def hair_row(face24):
    """Rows where the hair still covers the temples."""
    return head('kii' + face24 + 'iik')

def bare_row(face28):
    """Rows below the temples: cheek shadow on both edges."""
    return head('3' + face28 + '3')


def hair(lead, hi, shadow=2):
    """Hair row: base tone, a mid step, the swept highlight, then edge shadow."""
    core = 'i' * lead + 'H' + 'h' * hi + 'H'
    return head(core + 'i' * (30 - len(core) - shadow) + 'k' * shadow)

def hair_top(width, lead, hi):
    """Same, for the tapering rows above the full-width skull."""
    core = 'i' * lead + 'H' + 'h' * hi + 'H'
    return center('o' + core + 'i' * (width - len(core)) + 'o')

S = '2'  # skin
HEAD = {
    3:  center('o' * 14),
    4:  hair_top(15, 1, 5),
    5:  hair_top(19, 2, 6),
    6:  hair_top(23, 2, 7),
    7:  hair_top(26, 2, 7),
    8:  center('o' + 'i' * 3 + 'H' + 'h' * 7 + 'H' + 'i' * 17 + 'k' + 'o'),
    9:  hair(3, 7),
    10: hair(3, 6),
    11: hair(2, 6),
    12: hair(2, 5),
    13: hair(1, 5),
    14: hair(1, 4),
    15: hair(0, 4),
    16: hair(0, 3),
    17: hair(0, 2),
    18: hair_row('1' + S * 21 + '33'),   # hairline / forehead
    19: hair_row(S * 22 + '33'),
    20: hair_row(S * 22 + '33'),
    21: hair_row(S * 22 + '33'),         # brows (stamped)
    22: hair_row(S * 22 + '33'),         # brows (stamped)
    23: hair_row(S * 22 + '33'),
    24: hair_row(S * 22 + '33'),         # lashes (stamped)
    25: hair_row(S * 22 + '33'),         # eyes (stamped)
    26: hair_row(S * 22 + '33'),         # eyes (stamped)
    27: hair_row(S * 22 + '33'),         # eyes (stamped)
    28: hair_row(S * 22 + '33'),         # lower lid (stamped)
    29: bare_row(S * 4 + '33' + S * 16 + '33' + S * 4),   # under-eye
    30: bare_row(S * 14 + '33' + S * 12),                 # nose bridge (lit from the left)
    31: bare_row(S * 14 + '33' + S * 12),
    32: bare_row(S * 12 + '3333' + S * 12),               # nose tip
    33: bare_row(S * 11 + '5' + '3333' + '5' + S * 11),   # nostrils
    34: bare_row(S * 28),
    35: bare_row(S * 28),                # mouth (stamped)
    36: bare_row(S * 28),                # mouth (stamped)
    37: bare_row(S * 28),                # mouth (stamped)
    38: center('o3' + S * 26 + '3o'),    # jaw taper
    39: center('o3' + S * 22 + '3o'),
    40: center('o3' + S * 16 + '3o'),
    41: center('o' + '3' * 14 + 'o'),    # chin
    42: center('o' + '3' * 12 + 'o'),    # neck
    43: center('o' + '3' * 12 + 'o'),
    44: center('o' + '3' * 12 + 'o'),
}

def paint(g, y, x0, art):
    """' ' means leave whatever is underneath."""
    for i, ch in enumerate(art):
        if ch != ' ':
            g[y][x0 + i] = ch

def suit(g):
    """Shoulders, shirt V, tie, lapels — tapered bands, drawn back to front."""
    for y in range(45, H):
        half = min(21.5, 9.5 + (y - 45) * 2.3)
        for x in range(W):
            if abs(x - 23.5) <= half:
                edge = half - abs(x - 23.5)
                g[y][x] = ('S' if x < 23.5 else 'd') if edge < 2.5 else 's'
    for y in range(46, H):   # lapels
        off = 5.0 + (y - 46) * 0.55
        for x in range(W):
            for side in (-1, 1):
                if off <= (x - 23.5) * side <= off + 3.4 and g[y][x] in 'sS':
                    g[y][x] = 'D'
    for y in range(45, 51):  # shirt V
        half = 7.0 - (y - 45) * 1.35
        for x in range(W):
            if abs(x - 23.5) <= half:
                g[y][x] = 'W' if x < 23.5 else 'v'
    paint(g, 48, 21, 'GGGGFF')          # knot
    for y in range(49, H):              # blade
        paint(g, y, 21, 'gGGGFF')
    src = [row[:] for row in g]         # outline the suit silhouette
    for y in range(45, H):
        for x in range(W):
            if src[y][x] == '.':
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < W and 0 <= ny < H and src[ny][nx] == '.':
                    g[y][x] = 'o'
                    break

MIC = [
    (47, 32, ' CCCC '),
    (48, 32, 'cCCCCC'),
    (49, 32, 'cCCCCC'),
    (50, 32, 'cCCCCC'),
    (51, 32, ' CCCC '),
    (52, 32, ' KKKK '),
    (53, 32, ' KKLL '),
    (54, 32, '122KLL'),
    (55, 32, '12233L'),
    (56, 32, ' 2333 '),
]

# 8 px wide, 5 rows tall: lash, three eye rows, lower lid.
EYE = [
    ' oooooo ',
    'oeeIwIeo',
    'oeIqqIeo',
    'oeeIIIeo',
    ' oooooo ',
]
# Irises pushed to the +x side of both eye boxes: a glance to the viewer's
# right. Drawn unmirrored on both eyes, otherwise they would look apart.
GLANCE = [
    ' oooooo ',
    'oeeeIwIo',
    'oeeIqqIo',
    'oeeeIIIo',
    ' oooooo ',
]

# Startled: a thin iris ringed by white on every side.
EYE_WIDE = [
    ' oooooo ',
    'oeeeeeeo',
    'oeeIqIeo',
    'oeeeeeeo',
    ' oooooo ',
]

# Closed lids, stamped over the same 8x5 box as EYE for the blink layer.
LIDS = [
    '22222222',
    '22222222',
    'oooooooo',
    '33333333',
    '22222222',
]
BROW = ['bbbbbbbb', ' bbbbbb ']
BROW_ANGRY = ['bbbbb   ', '  bbbbbb']   # inner end low: furrowed, concentrating
BROW_SAD = ['   bbbbb', 'bbbbbb  ']     # inner end high: crestfallen
BROW_SCARED = ['    bbbb', 'bbbbbb  ']  # inner end high and steeper: alarmed

MOODS = {
    'idle': dict(
        brow=21, bl=BROW, br=[r[::-1] for r in BROW],
        mouth=[(35, 18, 'm          m'), (36, 19, 'mmmmmmmmmm'), (37, 20, 'tttttttt')],
    ),
    'tense': dict(
        brow=22, bl=BROW_ANGRY, br=[r[::-1] for r in BROW_ANGRY],
        mouth=[(36, 18, 'mmmmmmmmmmmm'), (37, 20, 'tttttttt')],
    ),
    'scared': dict(
        brow=20, bl=BROW_SCARED, br=[r[::-1] for r in BROW_SCARED], eyes=EYE_WIDE,
        # Small round gasp, plus a sweat bead on the temple.
        mouth=[(35, 21, ' mmmm '), (36, 21, 'mnnnnm'), (37, 21, ' mmmm ')],
        sweat=True,
    ),
    'correct': dict(
        brow=20, bl=BROW, br=[r[::-1] for r in BROW],
        # Open laugh: corners turned up, a row of teeth, then the dark interior.
        # A solid red block just read as a scream.
        mouth=[(34, 18, 'm          m'), (35, 19, 'mmmmmmmmmm'),
               (36, 18, 'mWWWWWWWWWWm'), (37, 18, 'mnnnnnnnnnnm'),
               (38, 19, 'mmmmmmmmmm')],
    ),
    'wrong': dict(
        brow=21, bl=BROW_SAD, br=[r[::-1] for r in BROW_SAD], droop=True,
        mouth=[(35, 21, 'mmmmmm'), (36, 19, 'mm      mm'),
               (37, 18, 'm          m')],
    ),
}

def eye_overlay(left, right):
    """Only the eye rows, redrawn — an overlay the CSS flashes on, so neither
    the blink nor the glance needs a JS timer or a re-render."""
    g = [['.'] * W for _ in range(H)]
    for y, row in HEAD.items():
        g[y] = list(row)
    for dy in range(5):
        paint(g, 24 + dy, 13, left[dy])
        paint(g, 24 + dy, 27, right[dy])
    return {y: ''.join(g[y]) for y in range(24, 29)}

def build(mood):
    g = [['.'] * W for _ in range(H)]
    for y, row in HEAD.items():
        g[y] = list(row)
    suit(g)
    for i, y in enumerate(range(10, 18)):      # one swept strand on the dark side
        g[y][34 - i // 3] = 'k'
    for y, x, art in MIC:
        paint(g, y, x, art)
    cfg = MOODS[mood]
    eyes = cfg.get('eyes', EYE)
    for dy, art in enumerate(eyes):
        paint(g, 24 + dy, 13, art)
        paint(g, 24 + dy, 27, art[::-1])
    if cfg.get('sweat'):
        # Floating beside the head: on the temple it collided with the eyebrow.
        # Teardrop shape — a plain rectangle read as a stray blue box.
        for dy, art in enumerate(['  o  ', ' oBo ', ' oBo ', 'oWBBo', 'oBBBo', ' ooo ']):
            paint(g, 17 + dy, 41, art)
    if cfg.get('droop'):                      # heavy lids over the top of the iris
        paint(g, 25, 13, 'oooooooo')
        paint(g, 25, 27, 'oooooooo')
    for dy, art in enumerate(cfg['bl']):
        paint(g, cfg['brow'] + dy, 13, art)
    for dy, art in enumerate(cfg['br']):
        paint(g, cfg['brow'] + dy, 27, art)
    for y, x, art in cfg['mouth']:
        paint(g, y, x, art)
    return [''.join(r) for r in g]

for y, row in HEAD.items():
    assert len(row) == W, (y, len(row), row)

base = build('idle')
print('const SPRITE = [')
for r in base:
    print(f"  '{r}',")
print('];')
print()
for name, doc, rows in (
    ('BLINK_ROWS', 'Shut lids, flashed over the sprite by CSS to blink.',
     eye_overlay(LIDS, [a[::-1] for a in LIDS])),
    ('GLANCE_ROWS', 'Eyes cut to the right, flashed the same way.',
     eye_overlay(GLANCE, GLANCE)),
):
    print(f'/** {doc} */')
    print(f'const {name}: Record<number, string> = {{')
    for i, r in rows.items():
        print(f"  {i}: '{r}',")
    print('};')
    print()
print()
print('const MOOD_ROWS: Record<HostMood, Record<number, string>> = {')
for mood in MOODS:
    print(f'  {mood}: {{')
    for i, r in enumerate(build(mood)):
        if r != base[i]:
            print(f"    {i}: '{r}',")
    print('  },')
print('};')
