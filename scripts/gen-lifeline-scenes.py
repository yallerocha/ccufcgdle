"""Generator for the lifeline pixel-art scenes (src/client/components/ShowLifelineScene.tsx).

Each scene is a 64x40 grid of characters, one per pixel, keyed to the shared
PALETTE below. Scenes are assembled from reusable stamps (a person, a card, a
speech bubble) rather than drawn cell by cell, because they are crowds of small
repeated figures.

Prints the SCENES block to paste into the component.
"""
W, H = 64, 40

PALETTE = {
    'o': '#241d30',  # outline
    's': '#f2bd94',  # skin
    'S': '#d1906a',  # skin shadow
    'q': '#241d30',  # eye / ink
    'm': '#8a4a52',  # mouth
    '1': '#3a2c26',  # hair: dark
    '2': '#8a5a34',  # hair: brown
    '3': '#d8c48a',  # hair: blond
    '4': '#c3cbe4',  # hair: grey
    '5': '#4a7ac4',  # shirt: blue
    '6': '#c4574a',  # shirt: red
    '7': '#4aa87a',  # shirt: green
    '8': '#a06fc0',  # shirt: purple
    '9': '#d99b12',  # shirt: amber
    'b': '#111a3d',  # back wall
    'B': '#1b2450',  # wall, lit
    'w': '#8a5f3a',  # wood
    'W': '#5f3f26',  # wood, dark
    'p': '#f6f8ff',  # paper
    'P': '#c9d3ee',  # paper shade
    'r': '#de5d60',  # red accent
    'g': '#5ed99a',  # green accent
    'c': '#3ce0e6',  # cyan accent
    'G': '#ffd24a',  # gold
}

def blank(fill='b'):
    return [[fill] * W for _ in range(H)]

def stamp(g, x0, y0, rows, subs=None):
    """' ' and '.' leave what is underneath; subs remaps chars to palette keys."""
    for dy, row in enumerate(rows):
        for dx, ch in enumerate(row):
            if ch in ' .':
                continue
            if subs:
                ch = subs.get(ch, ch)
            x, y = x0 + dx, y0 + dy
            if 0 <= x < W and 0 <= y < H:
                g[y][x] = ch

def band(g, y0, y1, ch):
    for y in range(y0, y1 + 1):
        for x in range(W):
            g[y][x] = ch

# ── Stamps ──────────────────────────────────────────────────────────────────
# 'A' = hair colour, 'C' = shirt colour; both remapped per figure.
PERSON = [
    '..ooooo..',
    '.oAAAAAo.',
    'oAAAAAAAo',
    'oAsssssAo',
    'osqsssqso',
    'ossssssso',
    'osssmssso',
    '.ossssso.',
    '..ossso..',
    'oCCCCCCCo',
    'oCCCCCCCo',
    'oCCCCCCCo',
    'oCCCCCCCo',
    'ooooooooo',
]

SMALL_PERSON = [
    '.ooo.',
    'oAAAo',
    'oqsqo',
    '.oso.',
    'oCCCo',
    'oCCCo',
    'ooooo',
]

BUBBLE = [
    '.ooooooo.',
    'opppppppo',
    'opqpqpqpo',
    'opppppppo',
    '.ooooooo.',
    '..opo....',
    '...o.....',
]

CARD = [
    'ooooooooooooo',
    'opppppppppppo',
    'oppXppppppppo',
    'opppppppppppo',
    'opppppppppppo',
    'oppppXXXpppppo'[:13],
    'opppXXXXXppppo'[:13],
    'oppXXXXXXXpppo'[:13],
    'opppXXXXXppppo'[:13],
    'oppppXXXpppppo'[:13],
    'opppppppppppo',
    'opppppppppppo',
    'opppppppppppo',
    'opppppppppppo',
    'oppppppppXppo',
    'opppppppppppo',
    'ooooooooooooo',
]

CROSS = [
    'rr.......rr',
    'rrr.....rrr',
    '.rrr...rrr.',
    '..rrr.rrr..',
    '...rrrrr...',
    '....rrr....',
    '...rrrrr...',
    '..rrr.rrr..',
    '.rrr...rrr.',
    'rrr.....rrr',
    'rr.......rr',
]

ARROW = [
    '.....cc.....',
    '.....ccc....',
    'cccccccccc..',
    'ccccccccccc.',
    'cccccccccccc',
    'ccccccccccc.',
    'cccccccccc..',
    '.....ccc....',
    '.....cc.....',
]

# ── Scenes ──────────────────────────────────────────────────────────────────
def scene_students():
    """Three students at a table, talking it over."""
    g = blank('b')
    band(g, 0, 21, 'B')
    stamp(g, 14, 1, BUBBLE)
    stamp(g, 40, 3, BUBBLE)
    for x, hair, shirt in ((6, '2', '5'), (27, '1', '7'), (48, '3', '8')):
        stamp(g, x, 8, PERSON, {'A': hair, 'C': shirt})
    band(g, 22, 25, 'w')          # table top
    band(g, 26, 26, 'W')
    band(g, 27, 32, 'W')          # table front
    band(g, 33, 39, 'b')          # floor
    for x in (17, 39):            # books resting on the table
        stamp(g, x, 18, [
            'oooooooo',
            'opppppPo',
            'oPPPPPPo',
            'oooooooo',
        ])
    return g

def scene_audience():
    """A hall voting, with the tally they produce above them.

    Individual raised arms were tried first: at five pixels per figure a 1px
    arm just reads as a floating bar, so the vote is shown as bars instead.
    """
    g = blank('b')
    bars = ((6, 11, 'c'), (20, 7, 'g'), (34, 14, 'G'), (48, 4, 'r'))
    for x, h, col in bars:
        for dy in range(h):
            for dx in range(9):
                g[15 - dy][x + dx] = col
        for dx in range(9):                      # letter plate under each bar
            g[16][x + dx] = 'o'
    for y, x0, shirts in ((19, 2, '5679'), (29, 6, '9576')):
        for i in range(8):
            x = x0 + i * 8
            if x + 5 > W:
                break
            stamp(g, x, y, SMALL_PERSON, {'A': '1234'[i % 4], 'C': shirts[i % 4]})
        band(g, y + 7, y + 8, 'W')               # bench in front of the row
    return g

def scene_fifty():
    """Four options on the table, two of them struck out."""
    g = blank('b')
    band(g, 4, 35, 'B')
    for i, x in enumerate((2, 18, 34, 50)):
        struck = i in (1, 2)
        stamp(g, x, 10, CARD, {'X': 'P' if struck else 'c'})
        if struck:
            stamp(g, x + 1, 13, CROSS)
    band(g, 32, 33, 'w')
    band(g, 34, 39, 'W')
    return g

def scene_skip():
    """The question on the left slides out, a fresh one arrives."""
    g = blank('b')
    band(g, 4, 35, 'B')
    stamp(g, 1, 11, CARD, {'X': 'P', 'p': 'P'})     # the one being left behind
    stamp(g, 26, 15, ARROW)
    stamp(g, 44, 11, CARD, {'X': 'G'})
    band(g, 33, 34, 'w')
    band(g, 35, 39, 'W')
    return g

SCENES = {
    'fifty': scene_fifty,
    'skip': scene_skip,
    'audience': scene_audience,
    'students': scene_students,
}

for row in CARD:
    assert len(row) == 13, (len(row), row)
for row in PERSON:
    assert len(row) == 9, (len(row), row)
for row in SMALL_PERSON:
    assert len(row) == 5, (len(row), row)
for row in BUBBLE:
    assert len(row) == 9, (len(row), row)
for row in CROSS:
    assert len(row) == 11, (len(row), row)

print('const PALETTE: Palette = {')
for k, v in PALETTE.items():
    print(f"  {k}: '{v}',")
print('};')
print()
print('const SCENES: Record<LifelineType, string[]> = {')
for name, build in SCENES.items():
    g = build()
    print(f'  {name}: [')
    for row in g:
        line = ''.join(row)
        assert len(line) == W, (name, len(line))
        print(f"    '{line}',")
    print('  ],')
print('};')
