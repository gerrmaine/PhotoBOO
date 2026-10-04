// ---------------------------------------------------------------------------
// Theme definitions.
//
// A theme is pure data plus a few drawing functions - adding one never requires
// touching application code. Run `npm run assets && npm run seed` after editing.
//
// IMPORTANT: frames must never paint an opaque background. The strip's colour
// comes from the canvas underneath, so an opaque frame would silently disable
// the colour picker (which is exactly the bug this file used to have).
// ---------------------------------------------------------------------------

import {
  STRIP, HEAD, svg, sticker, character, kahootBuddy, linear, radial, star, sparkle, heart, blob,
  rrect, circle, ellipse, path, stroke, gloss, text, polar,
  slotOutlines, cornerBrackets, gapMotifs, edgeMotifs,
} from './art.mjs'

const { width: W, height: H, footer: F } = STRIP

/** Divider + small flourishes in the footer. The caption itself is drawn on the
 *  canvas at export time so it can pick a colour that contrasts the strip. */
const footerRule = (color, motif = '') => {
  const y = H - F + 16
  return stroke(`M${W * 0.22} ${y} H${W * 0.78}`, color, 3, 'opacity=".55"') + motif
}

const thumb = (body, defs = '') => svg(320, 220, body, defs)

// ===========================================================================
// 1 - Fish Tank
// ===========================================================================

const fishTank = {
  slug: 'fish-tank',
  name: 'Fish Tank',
  tagline: 'Dive in with your friends',
  accentColor: '#0FA3BF',
  defaultFrameColor: '#E6F7FB',
  frame() {
    const [d1, water] = linear('#0FA3BF', '#0B6E85')
    return svg(W, H, [
      slotOutlines('#0FA3BF', 3, 0.5),
      cornerBrackets(water, 46, 8),
      gapMotifs((cx, cy, i) =>
        [circle(cx - 44 + i * 10, cy, 7, '#7FD9EC'), circle(cx, cy, 11, '#4FC3DD'), circle(cx + 48 - i * 8, cy, 5, '#A5E6F4')].join(''),
      ),
      edgeMotifs((x, y, i) => circle(x, y, 4 + (i % 3) * 3, '#7FD9EC', 'opacity=".9"'), 10),
      footerRule('#0FA3BF', [circle(W / 2 - 54, H - F + 16, 6, '#7FD9EC'), circle(W / 2 + 54, H - F + 16, 6, '#7FD9EC')].join('')),
    ].join(''), d1)
  },
  thumb() {
    const [d, sea] = linear('#19B8D6', '#076B82')
    return thumb(
      `<rect width="320" height="220" fill="${sea}"/>` +
        [40, 150, 250].map((x, i) => ellipse(x, 70 + i * 42, 34, 23, '#FFD166') + path(`M${x + 32} ${70 + i * 42} l26 -16 v32z`, '#F2A33C')).join('') +
        [60, 180, 280].map((x, i) => circle(x, 40 + i * 20, 7 + i * 3, '#BEEBF7', 'opacity=".75"')).join('') +
        [20, 90, 230, 300].map((x) => stroke(`M${x} 220 q-16 -50 4 -86`, '#2E9E5B', 14)).join(''),
      d,
    )
  },
  characters: [
    {
      slug: 'clownfish', name: 'Clownfish',
      art: () => {
        const [d, body] = linear('#FFA45C', '#F2752B')
        return character({
          defs: d,
          behind: path('M398 338 l96 -70 v140z', '#E8651C') + path('M256 214 l-76 -58 h152z', '#E8651C'),
          body: ellipse(256, 338, 152, 122, body) + rrect(196, 228, 32, 222, 16, '#FFF6EC') + rrect(300, 228, 32, 222, 16, '#FFF6EC') + gloss(220, 300, 70, 0.25),
          headFill: '#FFC9A0', ring: '#E8651C',
        })
      },
    },
    {
      slug: 'pufferfish', name: 'Pufferfish',
      art: () => {
        const [d, body] = radial('#FFE9A8', '#F0B429')
        return character({
          defs: d,
          behind: Array.from({ length: 18 }, (_, i) => {
            const a = (i / 18) * Math.PI * 2
            const [x1, y1] = polar(256, 336, 138, a)
            const [x2, y2] = polar(256, 336, 182, a)
            return stroke(`M${x1} ${y1} L${x2} ${y2}`, '#E09B14', 12)
          }).join(''),
          body: circle(256, 336, 142, body) + gloss(256, 336, 142, 0.3),
          headFill: '#FFEFCB', ring: '#E09B14',
        })
      },
    },
    {
      slug: 'octopus', name: 'Octopus',
      art: () => {
        const [d, body] = linear('#D6A0EC', '#9B51C9')
        return character({
          defs: d,
          behind: [-3, -2, -1, 1, 2, 3].map((i) =>
            stroke(`M${256 + i * 54} 344 q${i * 16} 92 ${i * 30} 148`, '#B071D9', 30),
          ).join(''),
          body: ellipse(256, 324, 148, 128, body) + gloss(224, 282, 72, 0.3),
          front: [[196, 414], [256, 430], [316, 414]].map(([x, y]) => circle(x, y, 13, '#7E3CA8', 'opacity=".5"')).join(''),
          headFill: '#F2DCFA', ring: '#8E44C4',
        })
      },
    },
    {
      slug: 'turtle', name: 'Sea Turtle',
      art: () => {
        const [d, shell] = radial('#7FC97F', '#3F7F49')
        return character({
          defs: d,
          behind: [[116, 408], [396, 408], [148, 254], [364, 254]].map(([x, y]) => ellipse(x, y, 50, 33, '#8FD68F')).join(''),
          body: ellipse(256, 342, 158, 132, shell) +
            [[256, 298], [188, 360], [324, 360], [256, 410]].map(([x, y]) => path(`M${x} ${y - 36} l36 36 l-36 36 l-36 -36z`, '#2F6B3A', 'opacity=".55"')).join(''),
          headFill: '#C6E8C6', ring: '#2F6B3A',
        })
      },
    },
    {
      slug: 'seahorse', name: 'Seahorse',
      art: () => {
        const [d, body] = linear('#FFD166', '#EE8C1F')
        return character({
          defs: d,
          behind: stroke('M300 336 q112 54 64 124 q-36 50 -86 10', '#E8841C', 34) +
            [0, 1, 2, 3].map((i) => path(`M368 ${286 + i * 42} l40 -18 v36z`, '#E8841C')).join(''),
          body: ellipse(256, 344, 118, 126, body) + gloss(220, 306, 58, 0.3),
          front: path('M170 104 q-42 -28 -14 -58 q30 -28 52 16z', '#FFE3A3'),
          headFill: '#FFE9BE', ring: '#E8841C',
        })
      },
    },
    {
      slug: 'crab', name: 'Crab',
      art: () => {
        const [d, body] = radial('#FF8A6B', '#D4381F')
        return character({
          defs: d,
          behind: [-1, 1].map((s) =>
            stroke(`M${256 + s * 128} 338 H${256 + s * 182}`, '#D4381F', 22) +
            path(`M${256 + s * 182} 300 q${s * 56} 38 ${s * 2} 76 l${s * -22} -30 l${s * 18} -18z`, '#FF6B4A') +
            [0, 1, 2].map((i) => stroke(`M${256 + s * 118} ${396 + i * 20} q${s * 48} ${18 + i * 8} ${s * 58} ${44 + i * 6}`, '#D4381F', 13)).join(''),
          ).join(''),
          body: ellipse(256, 358, 150, 110, body) + gloss(218, 320, 60, 0.26),
          headFill: '#FFD2C4', ring: '#D4381F',
        })
      },
    },
    {
      slug: 'whale', name: 'Whale',
      art: () => {
        const [d, body] = linear('#7FC3EC', '#2A6CA6')
        return character({
          defs: d,
          behind: path('M392 296 q66 -58 92 -12 q-32 20 -24 54 q-42 -20 -68 -42z', '#2A6CA6') +
            stroke('M256 88 V44', '#A8DCF5', 15) +
            [[212, 30, 20], [256, 14, 25], [302, 30, 18]].map(([x, y, r]) => circle(x, y, r, '#A8DCF5', 'opacity=".92"')).join(''),
          body: ellipse(256, 352, 160, 116, body) + ellipse(250, 398, 110, 54, '#DCF0FC') + gloss(214, 310, 62, 0.26),
          headFill: '#CDE9FA', ring: '#2A6CA6',
        })
      },
    },
    {
      slug: 'axolotl', name: 'Axolotl',
      art: () => {
        const [d, body] = linear('#FFC2DE', '#F26FAC')
        return character({
          defs: d,
          behind: [-1, 1].map((s) => [0, 1, 2].map((i) =>
            stroke(`M${256 + s * 100} ${154 + i * 36} q${s * 56} ${-20 - i * 6} ${s * 80} ${10 + i * 12}`, '#F26FAC', 15) +
            circle(256 + s * (182 + i * 2), 166 + i * 40, 16, '#FF8FC0'),
          ).join('')).join(''),
          body: ellipse(256, 358, 140, 116, body) + gloss(220, 318, 58, 0.3),
          headFill: '#FFE1EE', ring: '#F26FAC',
        })
      },
    },
  ],
  stickers: [
    { slug: 'bubble', name: 'Bubbles', art: () => sticker([circle(92, 152, 54, '#8FE3F5', 'opacity=".8"'), gloss(92, 152, 54, 0.9), circle(178, 86, 36, '#8FE3F5', 'opacity=".8"'), gloss(178, 86, 36, 0.9), circle(190, 182, 22, '#8FE3F5', 'opacity=".8"')].join('')) },
    { slug: 'seaweed', name: 'Seaweed', art: () => sticker([stroke('M96 244 q-42 -62 0 -112 q42 -52 -4 -108', '#2E9E5B', 26), stroke('M160 244 q38 -56 2 -102 q-34 -46 6 -94', '#4FBD72', 22)].join('')) },
    { slug: 'starfish', name: 'Starfish', art: () => sticker(star(128, 132, 106, 46, 5, '#FF9B54') + star(128, 132, 106, 46, 5, 'none', 'stroke="#E07B32" stroke-width="5"') + [[128, 96], [96, 146], [160, 146]].map(([x, y]) => circle(x, y, 7, '#E07B32', 'opacity=".5"')).join('')) },
    { slug: 'shell', name: 'Shell', art: () => sticker(path('M128 226 A104 104 0 0 1 24 122 A104 104 0 0 1 232 122 Z', '#FFC6D9') + [-66, -33, 0, 33, 66].map((dx) => stroke(`M128 226 L${128 + dx * 1.5} ${122 - Math.abs(dx) * 0.35}`, '#F093B0', 8)).join('')) },
    { slug: 'anchor', name: 'Anchor', art: () => sticker([circle(128, 46, 26, 'none', 'stroke="#5A7D9A" stroke-width="18"'), stroke('M128 72 V216', '#5A7D9A', 20), stroke('M70 108 H186', '#5A7D9A', 18), stroke('M42 150 q10 76 86 76 q76 0 86 -76', '#5A7D9A', 20)].join('')) },
    { slug: 'treasure', name: 'Treasure', art: () => sticker([rrect(32, 112, 192, 106, 12, '#C88B3F'), path('M32 112 a96 58 0 0 1 192 0z', '#E0A657'), rrect(32, 146, 192, 22, 0, '#8B5E24'), circle(128, 170, 17, '#FFD95E'), gloss(128, 170, 17, 0.6)].join('')) },
    { slug: 'jellyfish', name: 'Jellyfish', art: () => sticker([path('M34 130 a94 94 0 0 1 188 0z', '#E5A8F0'), gloss(128, 110, 70, 0.4), ...[-60, -30, 0, 30, 60].map((d) => stroke(`M${128 + d} 132 q${d / 3} 50 ${-d / 4} 100`, '#D98FE8', 10))].join('')) },
    { slug: 'wave', name: 'Wave', art: () => sticker([path('M8 150 q40 -46 80 0 t80 0 t80 0 v70 H8z', '#4FC3DD'), path('M8 182 q40 -40 80 0 t80 0 t80 0 v44 H8z', '#2A9EC0')].join('')) },
  ],
}

// ===========================================================================
// 2 - Farm Day
// ===========================================================================

const farm = {
  slug: 'farm',
  name: 'Farm Day',
  tagline: 'Barnyard buddies assemble',
  accentColor: '#D97A2B',
  defaultFrameColor: '#FFF6E5',
  frame() {
    return svg(W, H, [
      slotOutlines('#D97A2B', 3, 0.5),
      cornerBrackets('#C0392B', 46, 8),
      gapMotifs((cx, cy) => [stroke(`M${cx - 70} ${cy} H${cx + 70}`, '#D9A441', 4, 'opacity=".6"'), path(`M${cx} ${cy - 11} l9 11 l-9 11 l-9 -11z`, '#C0392B')].join('')),
      edgeMotifs((x, y, i) => (i % 2 ? circle(x, y, 6, '#D9A441') : path(`M${x} ${y - 9} l8 9 l-8 9 l-8 -9z`, '#8FBF5B')), 10),
      footerRule('#C0392B', [path(`M${W / 2 - 60} ${H - F + 16} l0 0`, 'none'), circle(W / 2 - 60, H - F + 16, 6, '#D9A441'), circle(W / 2 + 60, H - F + 16, 6, '#D9A441')].join('')),
    ].join(''))
  },
  thumb() {
    const [d, sky] = linear('#9FDBF5', '#D6F0FA')
    return thumb(
      `<rect width="320" height="220" fill="${sky}"/>` +
        circle(266, 42, 28, '#FFD166') +
        `<rect y="120" width="320" height="100" fill="#8FC96B"/>` +
        path('M54 120 V62 l58 -42 l58 42 v58z', '#C0392B') + rrect(96, 80, 32, 40, 4, '#FFF3DC') +
        [24, 212, 266].map((x, i) => ellipse(x, 160 + (i % 2) * 14, 32, 20, '#FFFFFF')).join('') +
        [[150, 60], [210, 40]].map(([x, y]) => blob(x, y, 24, '#FFFFFF', x)).join(''),
      d,
    )
  },
  characters: [
    {
      slug: 'cow', name: 'Cow',
      art: () => character({
        behind: ellipse(118, 192, 46, 31, '#F2C3C3', 'transform="rotate(-25 118 192)"') + ellipse(394, 192, 46, 31, '#F2C3C3', 'transform="rotate(25 394 192)"'),
        body: ellipse(256, 358, 158, 114, '#FFFFFF') +
          [[160, 332, 40, 27], [332, 382, 31, 21], [250, 424, 27, 17]].map(([x, y, rx, ry]) => ellipse(x, y, rx, ry, '#33333B')).join('') +
          ellipse(256, 406, 54, 36, '#F7C6CE'),
        front: path('M156 118 q-22 -34 10 -42 q26 -6 30 28z', '#E9E2D6') + path('M356 118 q22 -34 -10 -42 q-26 -6 -30 28z', '#E9E2D6'),
        headFill: '#FFF7F0', ring: '#33333B',
      }),
    },
    {
      slug: 'pig', name: 'Pig',
      art: () => {
        const [d, body] = radial('#FFC2D6', '#EE88AC')
        return character({
          defs: d,
          behind: path('M146 124 l-28 76 l76 -24z', '#E8789F') + path('M366 124 l28 76 l-76 -24z', '#E8789F'),
          body: ellipse(256, 358, 152, 112, body) + ellipse(256, 376, 48, 36, '#E8789F') + circle(240, 376, 9, '#C45C80') + circle(272, 376, 9, '#C45C80') + gloss(214, 318, 62, 0.3),
          headFill: '#FFD6E4', ring: '#E8789F',
        })
      },
    },
    {
      slug: 'chicken', name: 'Chicken',
      art: () => character({
        behind: stroke('M118 362 q-56 26 -18 80', '#F2E2C2', 26) + stroke('M394 362 q56 26 18 80', '#F2E2C2', 26),
        body: ellipse(256, 362, 138, 118, '#FFFBF2') + path('M256 250 l-32 28 l32 28 l32 -28z', '#F7A440'),
        front: [-46, 0, 46].map((d) => circle(256 + d, 80 - Math.abs(d) * 0.26, 27, '#E04F4F')).join(''),
        headFill: '#FFFDF8', ring: '#E8C46A',
      }),
    },
    {
      slug: 'sheep', name: 'Sheep',
      art: () => character({
        behind: [[146, 332], [366, 332], [186, 436], [326, 436], [256, 462], [116, 402], [396, 402]].map(([x, y], i) => blob(x, y, 64, '#FFFFFF', i)).join(''),
        body: ellipse(256, 368, 152, 112, '#FFFFFF'),
        front: [[256, 88], [182, 116], [330, 116]].map(([x, y], i) => blob(x, y, 54, '#F7F7F7', i + 7)).join('') +
          path('M142 184 q-30 -6 -32 24 q30 10 40 -10z', '#D8D2C8') + path('M370 184 q30 -6 32 24 q-30 10 -40 -10z', '#D8D2C8'),
        headFill: '#E9E3DA', ring: '#C4BDB2',
      }),
    },
    {
      slug: 'duck', name: 'Duck',
      art: () => character({
        behind: ellipse(120, 372, 52, 36, '#F2CE62', 'transform="rotate(-20 120 372)"') +
          ellipse(392, 372, 52, 36, '#F2CE62', 'transform="rotate(20 392 372)"'),
        body: ellipse(256, 356, 146, 116, '#FFE37A') + ellipse(256, 392, 92, 58, '#FFF0B8') + gloss(218, 316, 58, 0.3),
        front: path('M192 120 q-82 -12 -84 -44 q2 -32 84 -24z', '#F79A2B') + circle(136, 80, 8, '#C96F10'),
        headFill: '#FFF3C4', ring: '#F2A615',
      }),
    },
    {
      slug: 'horse', name: 'Horse',
      art: () => {
        const [d, coat] = linear('#C98A52', '#8C5527')
        return character({
          defs: d,
          behind: path('M150 130 q-18 -52 14 -58 q28 -2 32 50z', '#8C5527') +
            path('M362 130 q18 -52 -14 -58 q-28 -2 -32 50z', '#8C5527') +
            [-60, -20, 20, 60].map((dx) => stroke(`M${256 + dx} 110 q${dx * 0.5} -42 ${dx * 0.7} -62`, '#4A2C14', 20)).join(''),
          body: ellipse(256, 356, 150, 116, coat) + ellipse(256, 398, 70, 46, '#F0D7BC') + gloss(220, 316, 58, 0.24),
          headFill: '#E8C39A', ring: '#4A2C14',
        })
      },
    },
    {
      slug: 'goat', name: 'Goat',
      art: () => character({
        behind: stroke('M176 108 q-46 -46 -16 -78', '#C8B9A4', 22) + stroke('M336 108 q46 -46 16 -78', '#C8B9A4', 22),
        body: ellipse(256, 356, 146, 114, '#EFE7DA') + ellipse(256, 398, 64, 44, '#D9CDBA'),
        front: path('M150 178 q-38 -8 -40 22 q36 12 48 -8z', '#D9CDBA') +
          path('M362 178 q38 -8 40 22 q-36 12 -48 -8z', '#D9CDBA') +
          [-18, 18].map((dx) => stroke(`M${256 + dx} 318 v42`, '#D9CDBA', 9)).join(''),
        headFill: '#F7F2E8', ring: '#C8B9A4',
      }),
    },
    {
      slug: 'scarecrow', name: 'Scarecrow',
      art: () => character({
        behind: stroke('M256 330 H88', '#B08A52', 22) + stroke('M256 330 H424', '#B08A52', 22) +
          [-1, 1].map((s) => [0, 1, 2].map((i) =>
            stroke(`M${256 + s * (152 + i * 16)} 340 q${s * 16} 36 ${s * 4} 58`, '#E8C46A', 11)).join('')).join(''),
        body: path('M138 304 h236 l26 170 H112z', '#4C9A4C') +
          [0, 1, 2].map((i) => stroke(`M${150 + i * 2} ${348 + i * 42} H${368 - i * 2}`, '#2E6B33', 9)).join('') +
          path('M212 304 l44 62 l44 -62z', '#C0392B'),
        front: ellipse(256, 86, 152, 26, '#E8C46A') + path('M172 86 q10 -70 84 -70 q74 0 84 70z', '#C9A14A'),
        headFill: '#F2DFAE', ring: '#C9A14A',
      }),
    },
  ],
  stickers: [
    { slug: 'sun', name: 'Sun', art: () => { const [d, g] = radial('#FFE9A8', '#F0A313'); return sticker(Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; const [x1, y1] = polar(128, 128, 78, a); const [x2, y2] = polar(128, 128, 114, a); return stroke(`M${x1} ${y1} L${x2} ${y2}`, '#FFC93C', 16) }).join('') + circle(128, 128, 70, g), d) } },
    { slug: 'barn', name: 'Barn', art: () => sticker([path('M28 222 V110 l100 -68 l100 68 v112z', '#C0392B'), rrect(98, 140, 60, 82, 4, '#FFF3DC'), stroke('M28 110 l100 -68 l100 68', '#8E2A1F', 14), stroke('M98 140 l60 82 M158 140 l-60 82', '#C0392B', 7)].join('')) },
    { slug: 'hay', name: 'Hay Bale', art: () => sticker([rrect(26, 84, 204, 128, 24, '#E8C46A'), ...[118, 160].map((y) => stroke(`M34 ${y} H222`, '#C9A14A', 7)), rrect(26, 84, 204, 128, 24, 'none', 'stroke="#C9A14A" stroke-width="8"')].join('')) },
    { slug: 'apple', name: 'Apple', art: () => sticker([path('M128 74 q-72 -18 -72 68 q0 88 72 112 q72 -24 72 -112 q0 -86 -72 -68z', '#E04F4F'), gloss(104, 124, 34, 0.45), stroke('M128 74 V34', '#7A4A22', 12), path('M132 50 q42 -32 58 2 q-44 22 -58 -2z', '#5BA85B')].join('')) },
    { slug: 'flower', name: 'Flower', art: () => sticker(Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2; return ellipse(128 + Math.cos(a) * 54, 112 + Math.sin(a) * 54, 36, 36, '#F7A8C4') }).join('') + circle(128, 112, 32, '#FFD166') + stroke('M128 144 V234', '#5BA85B', 14) + path('M128 190 q-40 -24 -48 6 q34 20 48 -6z', '#5BA85B')) },
    { slug: 'tractor', name: 'Tractor', art: () => sticker([rrect(48, 106, 132, 58, 10, '#4C9A4C'), rrect(88, 62, 64, 48, 8, '#6FBF6F'), circle(188, 174, 50, '#2B2B33'), circle(188, 174, 23, '#9A9A9A'), circle(74, 188, 34, '#2B2B33'), circle(74, 188, 15, '#9A9A9A')].join('')) },
    { slug: 'egg', name: 'Egg', art: () => sticker(path('M128 26 C70 86 52 134 52 164 a76 76 0 0 0 152 0 c0 -30 -18 -78 -76 -138z', '#FFFBF0') + gloss(104, 140, 34, 0.5)) },
    { slug: 'boot', name: 'Welly', art: () => sticker([path('M72 26 h64 v120 h56 a28 28 0 0 1 28 28 v46 H72z', '#2E8B57'), rrect(64, 206, 176, 24, 10, '#1F5E3A'), stroke('M72 150 H136', '#1F5E3A', 7)].join('')) },
  ],
}

// ===========================================================================
// 3 - Dress to Impress
// ===========================================================================

const dress = {
  slug: 'dress-to-impress',
  name: 'Dress to Impress',
  tagline: 'Serve looks, strike poses',
  accentColor: '#D6336C',
  defaultFrameColor: '#FFF0F6',
  frame() {
    const [d, g] = linear('#D6336C', '#7048E8', { x2: 1, y2: 1 })
    return svg(W, H, [
      slotOutlines('#D6336C', 3, 0.5),
      cornerBrackets(g, 48, 8),
      gapMotifs((cx, cy) => [sparkle(cx, cy, 13, '#E8B4CC'), sparkle(cx - 54, cy, 8, '#E8B4CC'), sparkle(cx + 54, cy, 8, '#E8B4CC')].join('')),
      edgeMotifs((x, y, i) => sparkle(x, y, 7 + (i % 3) * 4, '#D6336C', 0.8), 11),
      footerRule('#D6336C', [sparkle(W / 2 - 62, H - F + 16, 9, '#D6336C'), sparkle(W / 2 + 62, H - F + 16, 9, '#D6336C')].join('')),
    ].join(''), d)
  },
  thumb() {
    const [d, g] = linear('#F06595', '#9B51C9', { x2: 1, y2: 1 })
    return thumb(
      `<rect width="320" height="220" fill="${g}"/>` +
        path('M0 220 L160 56 L320 220Z', '#FFFFFF', 'opacity=".16"') +
        circle(160, 118, 46, '#FFF0F6') +
        [[48, 48, 18], [272, 42, 14], [160, 28, 11], [86, 160, 12], [240, 170, 16]].map(([x, y, r]) => sparkle(x, y, r, '#FFE066')).join(''),
      d,
    )
  },
  characters: [
    {
      slug: 'glam', name: 'Glam Star',
      art: () => { const [d, g] = linear('#F06595', '#C2255C')
        return character({ defs: d,
          behind: path(`M${HEAD.cx - 134} ${HEAD.cy - 30} q134 -148 268 0 q-16 -124 -134 -124 q-118 0 -134 124z`, '#4A2A1C'),
          body: path('M256 304 l-154 172 h308z', g) + path('M256 304 l-66 172 h132z', '#F7A8C4', 'opacity=".55"') + ellipse(256, 304, 92, 40, '#F06595'),
          front: sparkle(400, 122, 26, '#FFE066') + sparkle(112, 150, 16, '#FFE066'),
          headFill: '#F8D9C4', ring: '#C2255C', ringWidth: 8 })
      },
    },
    {
      slug: 'tux', name: 'Sharp Tux',
      art: () => character({
        behind: path(`M${HEAD.cx - 120} ${HEAD.cy - 46} q120 -118 240 0 q-58 -40 -120 -40 q-62 0 -120 40z`, '#2B2B33'),
        body: path('M256 294 l-142 62 l-18 122 h320 l-18 -122z', '#2B2B33') + path('M256 294 l-54 42 l54 142 l54 -142z', '#FFFFFF') + path('M256 332 l-28 22 l28 24 l28 -24z', '#C0392B'),
        front: circle(256, 410, 9, '#2B2B33') + circle(256, 446, 9, '#2B2B33'),
        headFill: '#EDC3A0', ring: '#1C1C22', ringWidth: 8,
      }),
    },
    {
      slug: 'diva', name: 'Disco Diva',
      art: () => { const [d, g] = linear('#9775FA', '#5F3DC4')
        return character({ defs: d,
          behind: circle(HEAD.cx, HEAD.cy - 18, HEAD.r + 48, '#1F1017'),
          body: path('M256 300 q-134 38 -134 178 h268 q0 -140 -134 -178z', g) +
            Array.from({ length: 16 }, (_, i) => sparkle(146 + (i % 6) * 44, 344 + Math.floor(i / 6) * 46, 9, '#D0BFFF')).join(''),
          headFill: '#C9906A', ring: '#1F1017', ringWidth: 10 })
      },
    },
    {
      slug: 'red-carpet', name: 'Red Carpet',
      art: () => { const [d, g] = linear('#FF6B6B', '#C92A2A')
        return character({ defs: d,
          behind: path(`M${HEAD.cx - 126} ${HEAD.cy - 24} q126 -152 252 0 q-22 -88 -126 -88 q-104 0 -126 88z`, '#D9A441'),
          body: path('M256 298 q-122 30 -128 180 h256 q-6 -150 -128 -180z', g) + path('M160 474 q96 -42 192 0z', '#A51D1D'),
          front: star(256, 58, 34, 15, 5, '#FFE066'),
          headFill: '#F3CDB0', ring: '#C92A2A', ringWidth: 8 })
      },
    },
    {
      slug: 'gown', name: 'Ball Gown',
      art: () => { const [d, g] = linear('#A5D8FF', '#1971C2')
        return character({ defs: d,
          behind: path(`M${HEAD.cx - 128} ${HEAD.cy - 20} q128 -146 256 0 q10 -112 -128 -112 q-138 0 -128 112z`, '#1F1017'),
          body: path('M256 296 q-26 50 -138 180 q138 44 276 0 q-112 -130 -138 -180z', g) +
            ellipse(256, 300, 86, 30, '#1971C2') +
            Array.from({ length: 10 }, (_, i) => sparkle(154 + (i % 5) * 52, 382 + Math.floor(i / 5) * 50, 10, '#E7F5FF')).join(''),
          front: [[114, 148], [398, 148]].map(([x, y]) => circle(x, y, 14, '#A5D8FF')).join(''),
          headFill: '#F3CDB0', ring: '#1971C2', ringWidth: 8 })
      },
    },
    {
      slug: 'rocker', name: 'Rockstar',
      art: () => character({
        behind: path(`M${HEAD.cx - 132} ${HEAD.cy + 16} q4 -186 132 -186 q128 0 132 186 q-40 -100 -132 -100 q-92 0 -132 100z`, '#15151C'),
        body: path('M256 292 l-146 56 l-16 124 h324 l-16 -124z', '#15151C') +
          path('M256 292 l-52 34 l52 146 l52 -146z', '#C2255C') +
          [[176, 396], [336, 396]].map(([x, y]) => star(x, y, 26, 11, 5, '#FFE066')).join(''),
        front: path('M124 72 q132 -58 264 0 l-10 30 q-122 -52 -244 0z', '#C2255C') +
          stroke('M124 72 q-30 12 -42 46', '#C2255C', 14),
        headFill: '#EDC3A0', ring: '#15151C', ringWidth: 8,
      }),
    },
    {
      slug: 'princess', name: 'Princess',
      art: () => { const [d, g] = linear('#FFD6E7', '#D6336C')
        return character({ defs: d,
          behind: path(`M${HEAD.cx - 136} ${HEAD.cy + 40} q-6 -210 136 -210 q142 0 136 210 q-30 -128 -136 -128 q-106 0 -136 128z`, '#F5D08A'),
          body: path('M256 298 q-30 44 -136 178 q136 40 272 0 q-106 -134 -136 -178z', g) +
            ellipse(256, 302, 88, 30, '#D6336C') +
            [[186, 398], [256, 428], [326, 398]].map(([x, y]) => heart(x, y, 34, '#FFF0F6')).join(''),
          front: path('M164 86 l24 -54 l26 36 l42 -62 l42 62 l26 -36 l24 54z', '#FFE066') +
            [[188, 42], [256, 14], [324, 42]].map(([x, y]) => circle(x, y, 10, '#F06595')).join(''),
          headFill: '#F8D9C4', ring: '#D6336C', ringWidth: 8 })
      },
    },
    {
      slug: 'trendsetter', name: 'Trendsetter',
      art: () => { const [d, g] = linear('#D0BFFF', '#6741D9')
        return character({ defs: d,
          behind: path(`M${HEAD.cx - 124} ${HEAD.cy - 30} q124 -140 248 0 q-24 -112 -124 -112 q-100 0 -124 112z`, '#2B1B12'),
          body: path('M256 294 q-128 34 -134 180 h268 q-6 -146 -134 -180z', g) +
            rrect(198, 300, 116, 176, 14, '#F8F0FF', 'opacity=".9"') +
            [340, 384].map((y) => circle(256, y, 11, '#6741D9')).join('') +
            rrect(92, 374, 92, 62, 16, '#F59F00') + stroke('M108 374 q30 -40 60 0', '#F59F00', 10),
          front: path('M118 54 q138 -46 276 0 l-16 40 q-122 -40 -244 0z', '#F59F00'),
          headFill: '#EDC3A0', ring: '#6741D9', ringWidth: 8 })
      },
    },
  ],
  stickers: [
    { slug: 'crown', name: 'Crown', art: () => { const [d, g] = linear('#FFE066', '#F0A313'); return sticker([path('M32 192 L50 70 l56 52 l22 -86 l22 86 l56 -52 l18 122z', g), rrect(32, 192, 192, 28, 10, '#E0960B'), circle(128, 150, 14, '#E03131'), circle(74, 162, 10, '#4DABF7'), circle(182, 162, 10, '#4DABF7')].join(''), d) } },
    { slug: 'lipstick', name: 'Lipstick', art: () => sticker([rrect(92, 120, 72, 112, 10, '#C2255C'), rrect(92, 110, 72, 20, 6, '#F8F0F3'), path('M98 110 V50 q30 -24 60 0 v60z', '#E64980'), gloss(120, 76, 20, 0.4)].join('')) },
    { slug: 'diamond', name: 'Diamond', art: () => sticker([path('M72 70 h112 l48 56 l-104 122 l-104 -122z', '#66D9E8'), path('M72 70 l28 56 h56 l28 -56', 'none', 'stroke="#FFFFFF" stroke-width="7" opacity=".85"'), path('M100 126 l28 122 l28 -122', 'none', 'stroke="#FFFFFF" stroke-width="7" opacity=".85"')].join('')) },
    { slug: 'heels', name: 'Heels', art: () => sticker([path('M44 96 q86 10 112 70 l52 0 v34 H78 q-34 0 -34 -34z', '#E64980'), rrect(188, 166, 20, 66, 6, '#C2255C'), gloss(96, 128, 26, 0.35)].join('')) },
    { slug: 'mirror', name: 'Mirror', art: () => sticker([ellipse(128, 104, 74, 88, '#D0BFFF'), ellipse(128, 104, 74, 88, 'none', 'stroke="#9775FA" stroke-width="12"'), gloss(128, 92, 50, 0.5), rrect(116, 186, 24, 62, 10, '#9775FA')].join('')) },
    { slug: 'perfume', name: 'Perfume', art: () => sticker([rrect(76, 110, 104, 124, 18, '#F7A8C4'), rrect(104, 74, 48, 42, 8, '#E8E0F0'), rrect(96, 56, 64, 24, 10, '#9775FA'), gloss(104, 150, 26, 0.5)].join('')) },
    { slug: 'ribbon', name: 'Ribbon', art: () => sticker([path('M128 128 L28 66 v126z', '#F06595'), path('M128 128 L228 66 v126z', '#F06595'), circle(128, 128, 28, '#D6336C'), gloss(128, 122, 20, 0.4)].join('')) },
    { slug: 'camera-flash', name: 'Flash', art: () => sticker([rrect(28, 94, 200, 126, 18, '#2B2B33'), rrect(96, 72, 64, 28, 8, '#2B2B33'), circle(128, 158, 46, '#4DABF7'), circle(128, 158, 26, '#1864AB'), gloss(118, 144, 18, 0.7), circle(196, 120, 11, '#FFE066')].join('')) },
  ],
}

// ===========================================================================
// 4 - Space Cadet
// ===========================================================================

const space = {
  slug: 'space-cadet',
  name: 'Space Cadet',
  tagline: 'Zero gravity, maximum chaos',
  accentColor: '#6C5CE7',
  defaultFrameColor: '#0E0B2B',
  frame() {
    const [d, g] = linear('#6C5CE7', '#22D3EE', { x2: 1, y2: 1 })
    return svg(W, H, [
      slotOutlines('#8B7BF0', 3, 0.6),
      cornerBrackets(g, 48, 8),
      gapMotifs((cx, cy, i) => [star(cx, cy, 13, 5, 4, '#FFE066'), circle(cx - 56, cy, 5, '#22D3EE'), circle(cx + 56, cy, 4 + i, '#A78BFA')].join('')),
      edgeMotifs((x, y, i) => (i % 3 === 0 ? star(x, y, 9, 4, 4, '#FFE066') : circle(x, y, 3 + (i % 2) * 2, '#C7B9FF')), 13),
      footerRule('#8B7BF0', [star(W / 2 - 64, H - F + 16, 9, 4, 4, '#FFE066'), star(W / 2 + 64, H - F + 16, 9, 4, 4, '#FFE066')].join('')),
    ].join(''), d)
  },
  thumb() {
    const [d, g] = radial('#4C3BCF', '#0B0820', { r: 0.8 })
    return thumb(
      `<rect width="320" height="220" fill="${g}"/>` +
        Array.from({ length: 26 }, (_, i) => circle((i * 73) % 320, (i * 47) % 220, 1.6 + (i % 3), '#FFFFFF', `opacity="${0.4 + (i % 4) * 0.15}"`)).join('') +
        ellipse(228, 70, 46, 46, '#F6AD55') + ellipse(228, 70, 74, 15, 'none', 'stroke="#FBD38D" stroke-width="8" transform="rotate(-18 228 70)"') +
        path('M78 170 q0 -70 34 -104 q34 34 34 104 z', '#E2E8F0') + path('M96 170 h32 l-16 30z', '#FC8181') + circle(112, 108, 15, '#63B3ED'),
      d,
    )
  },
  characters: [
    {
      slug: 'astronaut', name: 'Astronaut',
      art: () => { const [d, g] = linear('#FFFFFF', '#CBD5E0')
        return character({ defs: d,
          behind: rrect(96, 268, 60, 130, 20, '#A0AEC0') + rrect(356, 268, 60, 130, 20, '#A0AEC0'),
          body: rrect(140, 282, 232, 190, 46, g) + rrect(196, 332, 120, 76, 14, '#4C51BF') + circle(226, 370, 11, '#F6E05E') + circle(286, 370, 11, '#68D391'),
          front: circle(HEAD.cx, HEAD.cy, HEAD.r + 26, 'none', 'stroke="#E2E8F0" stroke-width="22"') + circle(HEAD.cx, HEAD.cy, HEAD.r + 26, 'none', 'stroke="#A0AEC0" stroke-width="6"') + ellipse(196, 150, 34, 22, '#FFFFFF', 'opacity=".45" transform="rotate(-32 196 150)"'),
          headFill: '#F6D5BC', ring: '#4C51BF', ringWidth: 8 })
      },
    },
    {
      slug: 'alien', name: 'Little Green',
      art: () => { const [d, g] = radial('#9AE6B4', '#38A169')
        return character({ defs: d,
          behind: [[130, 300], [382, 300]].map(([x, y]) => ellipse(x, y, 34, 76, '#68D391', `transform="rotate(${x < 256 ? -18 : 18} ${x} ${y})"`)).join(''),
          body: ellipse(256, 364, 136, 116, g) + [[212, 392], [256, 410], [300, 392]].map(([x, y]) => circle(x, y, 13, '#2F855A', 'opacity=".5"')).join(''),
          front: [[186, 78], [326, 78]].map(([x, y]) => stroke(`M${x} ${y + 46} q${x < 256 ? -14 : 14} -40 0 -56`, '#38A169', 11) + circle(x + (x < 256 ? -12 : 12), y - 14, 15, '#F6E05E')).join(''),
          headFill: '#C6F6D5', ring: '#2F855A' })
      },
    },
    {
      slug: 'rocket', name: 'Rocket Rider',
      art: () => { const [d, g] = linear('#FC8181', '#C53030')
        return character({ defs: d,
          behind: path('M118 410 q-44 48 -10 70 q40 -16 48 -54z', '#F6AD55') + path('M394 410 q44 48 10 70 q-40 -16 -48 -54z', '#F6AD55'),
          body: path('M256 268 q104 44 104 148 q0 48 -104 48 q-104 0 -104 -48 q0 -104 104 -148z', g) + path('M152 400 l-50 52 h50z', '#E53E3E') + path('M360 400 l50 52 h-50z', '#E53E3E') + circle(256, 378, 32, '#90CDF4') + gloss(256, 378, 32, 0.6),
          front: path('M256 60 l-26 46 h52z', '#E53E3E'),
          headFill: '#F6D5BC', ring: '#C53030' })
      },
    },
    {
      slug: 'star-pal', name: 'Star Pal',
      art: () => { const [d, g] = radial('#FEF3C7', '#F6AD55')
        return character({ defs: d,
          behind: star(256, 318, 210, 92, 5, g),
          body: '',
          front: [[122, 376], [390, 376]].map(([x, y]) => circle(x, y, 20, '#ED8936')).join(''),
          headFill: '#FFF8E1', ring: '#DD6B20' })
      },
    },
    {
      slug: 'martian', name: 'Martian',
      art: () => { const [d, g] = radial('#FBB6CE', '#B83280')
        return character({ defs: d,
          behind: [-1, 1].map((s) => [0, 1, 2].map((i) =>
            stroke(`M${256 + s * 110} ${330 + i * 40} q${s * 70} ${10 - i * 14} ${s * 96} ${34 + i * 16}`, '#97266D', 17)).join('')).join(''),
          body: ellipse(256, 356, 134, 114, g) + [[212, 388], [300, 388]].map(([x, y]) => circle(x, y, 14, '#FBD5E8')).join(''),
          front: [-1, 1].map((s) => stroke(`M${256 + s * 58} 94 q${s * 34} -48 ${s * 58} -62`, '#97266D', 12) + circle(256 + s * 120, 26, 18, '#F6E05E')).join(''),
          headFill: '#FBD5E8', ring: '#97266D' })
      },
    },
    {
      slug: 'moon-buddy', name: 'Moon Buddy',
      art: () => { const [d, g] = radial('#F7FAFC', '#A0AEC0')
        return character({ defs: d,
          behind: rrect(92, 290, 56, 128, 18, '#CBD5E0') + rrect(364, 290, 56, 128, 18, '#CBD5E0'),
          body: circle(256, 360, 142, g) +
            [[184, 330, 22], [318, 396, 17], [240, 432, 13], [330, 320, 11]].map(([x, y, r]) => circle(x, y, r, '#CBD5E0')).join(''),
          front: [[146, 94, 16], [374, 118, 12], [256, 28, 11]].map(([x, y, r]) => sparkle(x, y, r, '#FDE68A')).join(''),
          headFill: '#EDF2F7', ring: '#A0AEC0' })
      },
    },
    {
      slug: 'comet-kid', name: 'Comet Kid',
      art: () => { const [d, g] = radial('#FDE68A', '#F59E0B')
        return character({ defs: d,
          behind: stroke('M150 406 L8 468', '#A78BFA', 26, 'opacity=".45"') +
            stroke('M160 350 L14 384', '#C4B5FD', 18, 'opacity=".55"') +
            stroke('M170 436 L52 496', '#DDD6FE', 13, 'opacity=".5"'),
          body: circle(256, 356, 136, g) + gloss(256, 356, 136, 0.45),
          front: [[118, 118], [394, 102], [256, 26]].map(([x, y]) => sparkle(x, y, 20, '#FFFBEB')).join(''),
          headFill: '#FEF3C7', ring: '#D97706' })
      },
    },
    {
      slug: 'satellite-pal', name: 'Satellite',
      art: () => character({
        behind: rrect(26, 300, 104, 128, 10, '#4C51BF') + rrect(382, 300, 104, 128, 10, '#4C51BF') +
          [50, 78, 106, 406, 434, 462].map((x) => stroke(`M${x} 300 V428`, '#7F9CF5', 5)).join('') +
          stroke('M130 364 H162', '#A0AEC0', 12) + stroke('M350 364 H382', '#A0AEC0', 12),
        body: rrect(158, 288, 196, 184, 28, '#CBD5E0') + rrect(196, 326, 120, 64, 12, '#2D3748') +
          [[226, 358], [286, 358]].map(([x, y]) => circle(x, y, 12, '#63B3ED')).join('') +
          ellipse(256, 436, 56, 22, 'none', 'stroke="#A0AEC0" stroke-width="8"'),
        front: stroke(`M${HEAD.cx} 84 V30`, '#A0AEC0', 8) + circle(HEAD.cx, 22, 16, '#F6E05E'),
        headFill: '#E2E8F0', ring: '#4C51BF', ringWidth: 8,
      }),
    },
  ],
  stickers: [
    { slug: 'planet', name: 'Planet', art: () => { const [d, g] = radial('#F6AD55', '#C05621'); return sticker(circle(128, 128, 74, g) + gloss(128, 128, 74, 0.3) + ellipse(128, 128, 116, 26, 'none', 'stroke="#FBD38D" stroke-width="12" transform="rotate(-20 128 128)"'), d) } },
    { slug: 'rocket', name: 'Rocket', art: () => sticker([path('M128 16 q52 52 52 118 v44 h-104 v-44 q0 -66 52 -118z', '#E2E8F0'), circle(128, 108, 24, '#63B3ED'), path('M76 150 l-32 46 h32z', '#FC8181'), path('M180 150 l32 46 h-32z', '#FC8181'), path('M104 178 h48 l-24 62z', '#F6AD55')].join('')) },
    { slug: 'ufo', name: 'UFO', art: () => sticker([ellipse(128, 118, 56, 42, '#90CDF4', 'opacity=".9"'), ellipse(128, 150, 110, 40, '#A0AEC0'), ellipse(128, 150, 110, 40, 'none', 'stroke="#718096" stroke-width="6"'), ...[70, 128, 186].map((x) => circle(x, 162, 11, '#F6E05E')), path('M88 186 L52 240 h152 L168 186z', '#F6E05E', 'opacity=".35"')].join('')) },
    { slug: 'moon', name: 'Moon', art: () => sticker(path('M170 20 a108 108 0 1 0 0 216 a86 86 0 0 1 0 -216z', '#E2E8F0') + [[96, 90, 15], [74, 150, 11], [116, 182, 9]].map(([x, y, r]) => circle(x, y, r, '#CBD5E0')).join('')) },
    { slug: 'comet', name: 'Comet', art: () => sticker([stroke('M28 220 L150 96', '#A78BFA', 20, 'opacity=".4"'), stroke('M58 230 L160 124', '#C4B5FD', 12, 'opacity=".5"'), circle(180, 78, 44, '#FDE68A'), gloss(180, 78, 44, 0.6)].join('')) },
    { slug: 'satellite', name: 'Satellite', art: () => sticker([rrect(104, 100, 48, 58, 8, '#CBD5E0'), rrect(18, 106, 74, 46, 5, '#4C51BF'), rrect(164, 106, 74, 46, 5, '#4C51BF'), ...[36, 60, 182, 206].map((x) => stroke(`M${x} 106 V152`, '#7F9CF5', 4)), stroke('M128 158 V206', '#A0AEC0', 7), ellipse(128, 216, 34, 14, 'none', 'stroke="#A0AEC0" stroke-width="7"')].join('')) },
    { slug: 'constellation', name: 'Constellation', art: () => sticker([stroke('M44 196 L96 112 L158 150 L212 60', '#C7B9FF', 4, 'opacity=".7"'), ...[[44, 196, 11], [96, 112, 15], [158, 150, 10], [212, 60, 13]].map(([x, y, r]) => star(x, y, r, r * 0.42, 4, '#FFE066'))].join('')) },
    { slug: 'black-hole', name: 'Black Hole', art: () => { const [d, g] = radial('#4C1D95', '#0B0820', { r: 0.62 }); return sticker(ellipse(128, 128, 118, 44, 'none', 'stroke="#7C3AED" stroke-width="16" opacity=".55" transform="rotate(-18 128 128)"') + circle(128, 128, 62, g) + circle(128, 128, 62, 'none', 'stroke="#A78BFA" stroke-width="5"'), d) } },
  ],
}

// ===========================================================================
// 5 - Cafe Days
// ===========================================================================

const cafe = {
  slug: 'cafe-days',
  name: 'Café Days',
  tagline: 'Slow mornings, warm light',
  accentColor: '#A9714B',
  defaultFrameColor: '#FBF3E6',
  frame() {
    return svg(W, H, [
      slotOutlines('#A9714B', 3, 0.45),
      cornerBrackets('#7B4B2A', 44, 7),
      gapMotifs((cx, cy) => [stroke(`M${cx - 62} ${cy} H${cx - 16}`, '#C9A182', 3), stroke(`M${cx + 16} ${cy} H${cx + 62}`, '#C9A182', 3), circle(cx, cy, 7, '#A9714B'), circle(cx - 14, cy, 4, '#C9A182'), circle(cx + 14, cy, 4, '#C9A182')].join('')),
      edgeMotifs((x, y, i) => (i % 2 ? circle(x, y, 4, '#C9A182') : ellipse(x, y, 4, 8, '#8FA67B')), 11),
      footerRule('#A9714B', [circle(W / 2 - 58, H - F + 16, 5, '#A9714B'), circle(W / 2 + 58, H - F + 16, 5, '#A9714B')].join('')),
    ].join(''))
  },
  thumb() {
    const [d, g] = linear('#F3E0C8', '#D9BFA0')
    return thumb(
      `<rect width="320" height="220" fill="${g}"/>` +
        [40, 92].map((y, i) => stroke(`M${120 + i * 36} ${y + 20} q-14 -22 0 -40`, '#C9A182', 7, 'opacity=".7"')).join('') +
        path('M92 92 h116 v46 a58 58 0 0 1 -116 0z', '#FFFFFF') +
        path('M208 100 a28 28 0 0 1 0 44', 'none', 'stroke="#FFFFFF" stroke-width="12"') +
        ellipse(150, 196, 96, 16, '#B08968') +
        ellipse(150, 100, 58, 12, '#8B5E3C'),
      d,
    )
  },
  characters: [
    {
      slug: 'barista', name: 'Barista',
      art: () => character({
        behind: path(`M${HEAD.cx - 122} ${HEAD.cy - 40} q122 -112 244 0 q-54 -46 -122 -46 q-68 0 -122 46z`, '#4A3426'),
        body: path('M256 294 q-130 32 -138 184 h276 q-8 -152 -138 -184z', '#3F5E4C') + rrect(196, 330, 120, 142, 10, '#FBF3E6') + circle(256, 350, 10, '#7B4B2A') + circle(256, 392, 10, '#7B4B2A'),
        front: rrect(HEAD.cx - 126, HEAD.cy - 118, 252, 34, 16, '#2E4637'),
        headFill: '#E8BE9A', ring: '#3F5E4C', ringWidth: 8,
      }),
    },
    {
      slug: 'cat-cafe', name: 'Café Cat',
      art: () => { const [d, g] = linear('#D9A05B', '#B5783A')
        return character({ defs: d,
          behind: stroke('M396 400 q74 -16 56 -92', '#C98A45', 28),
          body: ellipse(256, 362, 140, 118, g) + ellipse(256, 398, 62, 44, '#FBE3C8') + circle(256, 388, 11, '#8A5A2B'),
          front: path('M148 118 l-14 -86 l80 46z', '#C98A45') + path('M364 118 l14 -86 l-80 46z', '#C98A45') + path('M158 112 l-6 -48 l44 26z', '#F2C8A0') + path('M354 112 l6 -48 l-44 26z', '#F2C8A0'),
          headFill: '#FBE3C8', ring: '#A9714B' })
      },
    },
    {
      slug: 'bookworm', name: 'Bookworm',
      art: () => character({
        behind: path(`M${HEAD.cx - 118} ${HEAD.cy - 44} q118 -104 236 0 q-20 -78 -118 -78 q-98 0 -118 78z`, '#6B4226'),
        body: path('M256 296 q-126 34 -132 182 h264 q-6 -148 -132 -182z', '#8FA67B') +
          rrect(166, 380, 180, 96, 8, '#C0392B') + rrect(166, 380, 180, 96, 8, 'none', 'stroke="#8E2A1F" stroke-width="6"') + stroke('M256 380 V476', '#8E2A1F', 6),
        front: circle(206, 196, 48, 'none', 'stroke="#4A3426" stroke-width="8"') + circle(306, 196, 48, 'none', 'stroke="#4A3426" stroke-width="8"') + stroke('M254 196 H258', '#4A3426', 8),
        headFill: '#F0CBA8', ring: '#6B4226', ringWidth: 8,
      }),
    },
    {
      slug: 'croissant', name: 'Croissant Pal',
      art: () => { const [d, g] = radial('#FBD9A0', '#D99B4E')
        return character({ defs: d,
          body: path('M106 406 q-26 -128 150 -128 q176 0 150 128 q-62 26 -150 26 q-88 0 -150 -26z', g) +
            [-96, -48, 0, 48, 96].map((dx) => stroke(`M${256 + dx} ${300 + Math.abs(dx) * 0.22} V${420 - Math.abs(dx) * 0.3}`, '#C98A45', 7, 'opacity=".6"')).join('') +
            path('M106 406 q-54 -10 -66 42 q46 18 76 -14z', '#D99B4E') + path('M406 406 q54 -10 66 42 q-46 18 -76 -14z', '#D99B4E'),
          headFill: '#FBE9CC', ring: '#C98A45' })
      },
    },
    {
      slug: 'latte', name: 'Latte Cup',
      art: () => { const [d, g] = linear('#FBF3E6', '#E4D2B8')
        return character({ defs: d,
          behind: circle(406, 378, 52, 'none', 'stroke="#E4D2B8" stroke-width="24"'),
          body: path('M134 300 h244 l-26 176 h-192z', g) + rrect(126, 288, 260, 30, 14, '#FFFFFF') +
            path('M162 364 h188 l-14 92 h-160z', '#B07A48') +
            stroke('M214 404 q42 -28 84 0', '#FBF3E6', 10) + stroke('M214 430 q42 -28 84 0', '#FBF3E6', 10),
          front: [-1, 0, 1].map((s) => stroke(`M${256 + s * 60} 74 q${s * 18 + 14} -34 ${-s * 6} -60`, '#E4D2B8', 10, 'opacity=".85"')).join(''),
          headFill: '#F7E7CE', ring: '#B07A48' })
      },
    },
    {
      slug: 'donut', name: 'Donut',
      art: () => { const [d, g] = radial('#F7A8C4', '#D6336C')
        return character({ defs: d,
          behind: circle(256, 368, 150, '#D99B4E'),
          body: circle(256, 356, 148, g) + circle(256, 356, 52, '#FBE9CC') +
            Array.from({ length: 14 }, (_, i) => {
              const a = (i / 14) * Math.PI * 2
              const [x, y] = polar(256, 356, 96 + (i % 3) * 14, a)
              return stroke(`M${x.toFixed(1)} ${y.toFixed(1)} l${(Math.cos(a + 1.1) * 20).toFixed(1)} ${(Math.sin(a + 1.1) * 20).toFixed(1)}`, ['#FFE066', '#7CFC9E', '#4CC9F0', '#FFFFFF'][i % 4], 9)
            }).join(''),
          headFill: '#FBE9CC', ring: '#D6336C' })
      },
    },
    {
      slug: 'teapot', name: 'Teapot',
      art: () => { const [d, g] = linear('#A3D9C9', '#2F7D68')
        return character({ defs: d,
          behind: path('M120 330 q-76 12 -84 74 q36 10 58 -22 q16 -24 40 -16z', '#2F7D68') +
            circle(402, 380, 54, 'none', 'stroke="#2F7D68" stroke-width="26"'),
          body: path('M126 346 q0 -62 130 -62 q130 0 130 62 q0 130 -130 130 q-130 0 -130 -130z', g) +
            ellipse(256, 346, 130, 24, '#8FCFBC', 'opacity=".55"') +
            [[204, 394], [308, 394], [256, 432]].map(([x, y]) => circle(x, y, 15, '#E8F7F2', 'opacity=".8"')).join(''),
          front: rrect(216, 56, 80, 22, 11, '#2F7D68') + circle(256, 38, 20, '#E8F7F2'),
          headFill: '#E8F7F2', ring: '#2F7D68' })
      },
    },
    {
      slug: 'waffle', name: 'Waffle',
      art: () => { const [d, g] = linear('#F3C96B', '#C98A45')
        return character({ defs: d,
          body: rrect(128, 290, 256, 186, 30, g) +
            [0, 1, 2, 3].map((i) => stroke(`M${158 + i * 58} 304 V462`, '#B0762F', 8, 'opacity=".5"')).join('') +
            [0, 1, 2].map((i) => stroke(`M142 ${340 + i * 48} H370`, '#B0762F', 8, 'opacity=".5"')).join('') +
            path('M128 322 q64 36 128 0 q64 -36 128 0 v-38 q-64 36 -128 0 q-64 -36 -128 0z', '#FBE9CC', 'opacity=".92"'),
          front: heart(256, 52, 52, '#E04F4F'),
          headFill: '#FBE9CC', ring: '#C98A45' })
      },
    },
  ],
  stickers: [
    { slug: 'latte', name: 'Latte', art: () => sticker([path('M48 92 h128 v54 a64 64 0 0 1 -128 0z', '#FFFFFF'), path('M176 102 a30 30 0 0 1 0 48', 'none', 'stroke="#FFFFFF" stroke-width="14"'), ellipse(112, 92, 64, 14, '#C68B5B'), path('M112 78 q-18 8 0 16 q18 8 0 16', 'none', 'stroke="#FBF3E6" stroke-width="6"'), ellipse(112, 216, 74, 12, '#D9BFA0')].join('')) },
    { slug: 'croissant', name: 'Croissant', art: () => sticker(path('M40 170 q-18 -92 88 -92 q106 0 88 92 q-40 20 -88 20 q-48 0 -88 -20z', '#E0A94E') + [-54, -18, 18, 54].map((dx) => stroke(`M${128 + dx} ${92 + Math.abs(dx) * 0.2} V${182 - Math.abs(dx) * 0.25}`, '#C08A32', 6, 'opacity=".6"')).join('') + path('M40 170 q-30 -6 -36 24 q26 12 44 -8z', '#D19A3E') + path('M216 170 q30 -6 36 24 q-26 12 -44 -8z', '#D19A3E')) },
    { slug: 'bean', name: 'Coffee Bean', art: () => sticker(ellipse(128, 128, 62, 86, '#6B4226', 'transform="rotate(-24 128 128)"') + path('M128 46 q-24 82 0 164', 'none', 'stroke="#3E2616" stroke-width="10" transform="rotate(-24 128 128)"')) },
    { slug: 'donut', name: 'Donut', art: () => sticker([circle(128, 132, 92, '#E8A86B'), circle(128, 132, 92, 'none', 'stroke="#C98A45" stroke-width="5"'), path('M128 40 a92 92 0 0 1 0 184 a92 92 0 0 1 0 -184z', '#F striped', 'opacity="0"'), circle(128, 132, 88, '#F2A1C0'), circle(128, 132, 32, '#FBF3E6'), ...[[88, 90], [168, 100], [76, 166], [172, 170], [128, 62], [128, 202]].map(([x, y], i) => rrect(x - 11, y - 4, 22, 8, 4, ['#FFE066', '#63B3ED', '#68D391', '#FF8FA8'][i % 4], `transform="rotate(${i * 37} ${x} ${y})"`))].join('')) },
    { slug: 'book', name: 'Book', art: () => sticker([rrect(36, 58, 184, 140, 8, '#C0392B'), rrect(36, 58, 184, 140, 8, 'none', 'stroke="#8E2A1F" stroke-width="6"'), stroke('M128 58 V198', '#8E2A1F', 6), ...[0, 1, 2].map((i) => stroke(`M58 ${96 + i * 26} H112 M144 ${96 + i * 26} H198`, '#E8BBA8', 5))].join('')) },
    { slug: 'plant', name: 'Plant', art: () => sticker([path('M76 162 h104 l-14 78 h-76z', '#C9794B'), ...[[-1, 40], [0, 56], [1, 40]].map(([dir, h]) => stroke(`M128 162 q${dir * 34} -${h} ${dir * 44} -${h + 48}`, '#4F7A46', 13))].join('')) },
    { slug: 'vinyl', name: 'Vinyl', art: () => sticker([circle(128, 128, 102, '#23232B'), ...[84, 64, 44].map((r) => circle(128, 128, r, 'none', 'stroke="#3A3A46" stroke-width="3"')), circle(128, 128, 30, '#E8A86B'), circle(128, 128, 7, '#FBF3E6')].join('')) },
    { slug: 'steam', name: 'Steam', art: () => sticker([-40, 0, 40].map((d, i) => stroke(`M${128 + d} 220 q-22 -40 0 -70 q22 -30 0 -70 q-14 -26 0 -44`, '#C9A182', 11, `opacity="${0.75 - i * 0.12}"`)).join('')) },
  ],
}

// ===========================================================================
// 6 - Arcade Night
// ===========================================================================

const arcade = {
  slug: 'arcade-night',
  name: 'Arcade Night',
  tagline: 'Insert coin, strike a pose',
  accentColor: '#F72585',
  defaultFrameColor: '#120B24',
  frame() {
    const [d, g] = linear('#F72585', '#4CC9F0', { x2: 1, y2: 1 })
    return svg(W, H, [
      slotOutlines('#F72585', 4, 0.7),
      slotOutlines('#4CC9F0', 1.5, 0.85),
      cornerBrackets(g, 50, 9),
      gapMotifs((cx, cy, i) => [
        rrect(cx - 72, cy - 5, 24, 10, 3, '#4CC9F0'), rrect(cx + 48, cy - 5, 24, 10, 3, '#4CC9F0'),
        i === 1 ? heart(cx, cy, 26, '#F72585') : rrect(cx - 11, cy - 11, 22, 22, 4, '#FFE066'),
      ].join('')),
      edgeMotifs((x, y, i) => rrect(x - 4, y - 4, 8, 8, 2, i % 2 ? '#4CC9F0' : '#F72585'), 13),
      footerRule('#F72585', [rrect(W / 2 - 70, H - F + 11, 10, 10, 2, '#4CC9F0'), rrect(W / 2 + 60, H - F + 11, 10, 10, 2, '#4CC9F0')].join('')),
    ].join(''), d)
  },
  thumb() {
    const [d, g] = linear('#2B0B3F', '#0B0820')
    return thumb(
      `<rect width="320" height="220" fill="${g}"/>` +
        Array.from({ length: 9 }, (_, i) => stroke(`M0 ${150 + i * 9} H320`, '#F72585', 1.5, `opacity="${0.1 + i * 0.05}"`)).join('') +
        [[60, 70], [120, 70], [180, 70], [240, 70]].map(([x, y], i) => rrect(x - 16, y - 16, 32, 32, 6, ['#F72585', '#4CC9F0', '#FFE066', '#7CFC9E'][i])).join('') +
        heart(80, 130, 36, '#F72585') +
        [150, 186, 222].map((x) => circle(x, 130, 9, '#FFE066')).join(''),
      d,
    )
  },
  characters: [
    {
      slug: 'pixel-hero', name: 'Pixel Hero',
      art: () => character({
        body: rrect(146, 292, 220, 182, 12, '#4CC9F0') + rrect(182, 330, 148, 42, 6, '#F72585') + rrect(146, 400, 220, 16, 4, '#2B0B3F'),
        behind: rrect(96, 300, 48, 128, 10, '#3BA7C9') + rrect(368, 300, 48, 128, 10, '#3BA7C9'),
        front: rrect(HEAD.cx - 128, HEAD.cy - 126, 256, 40, 8, '#F72585') + rrect(HEAD.cx - 128, HEAD.cy - 94, 256, 14, 4, '#B81A63'),
        headFill: '#F6D5BC', ring: '#2B0B3F', ringWidth: 10,
      }),
    },
    {
      slug: 'ghost', name: 'Arcade Ghost',
      art: () => { const [d, g] = linear('#B197FC', '#7048E8')
        return character({ defs: d,
          body: path('M120 380 q0 -124 136 -124 q136 0 136 124 v96 l-34 -30 l-34 30 l-34 -30 l-34 30 l-34 -30 l-34 30 l-34 -30z', g),
          front: '',
          headFill: '#E5DBFF', ring: '#5F3DC4' })
      },
    },
    {
      slug: 'robo', name: 'Robo Player',
      art: () => character({
        behind: rrect(86, 296, 54, 136, 14, '#8D99AE') + rrect(372, 296, 54, 136, 14, '#8D99AE'),
        body: rrect(142, 288, 228, 188, 26, '#CBD5E0') + rrect(188, 330, 136, 86, 12, '#2B2B33') + [[224, 364], [288, 364]].map(([x, y]) => rrect(x - 16, y - 8, 32, 16, 4, '#7CFC9E')).join('') + circle(256, 440, 15, '#F72585'),
        front: stroke(`M${HEAD.cx} ${HEAD.cy - HEAD.r - 10} V${HEAD.cy - HEAD.r - 54}`, '#8D99AE', 9) + circle(HEAD.cx, HEAD.cy - HEAD.r - 62, 16, '#FFE066'),
        headFill: '#E2E8F0', ring: '#4CC9F0', ringWidth: 10,
      }),
    },
    {
      slug: 'joystick', name: 'Joystick',
      art: () => { const [d, g] = linear('#2B2B33', '#15151C')
        return character({ defs: d,
          body: rrect(116, 316, 280, 160, 34, g) + circle(196, 396, 30, '#F72585') + [[300, 370], [344, 396], [300, 422], [256, 396]].map(([x, y], i) => circle(x, y, 18, ['#FFE066', '#7CFC9E', '#4CC9F0', '#F72585'][i])).join(''),
          front: stroke(`M${HEAD.cx} ${HEAD.cy + HEAD.r} V${HEAD.cy + HEAD.r + 36}`, '#8D99AE', 16),
          headFill: '#F72585', ring: '#FFE066', ringWidth: 10 })
      },
    },
    {
      slug: 'invader', name: 'Space Invader',
      art: () => character({
        behind: [88, 392].map((x) => rrect(x, 330, 32, 112, 6, '#7CFC9E')).join(''),
        body: rrect(140, 292, 232, 150, 10, '#7CFC9E') +
          [176, 336].map((x) => rrect(x - 18, 308, 36, 36, 4, '#15151C')).join('') +
          rrect(196, 384, 120, 22, 4, '#15151C') +
          [156, 220, 292, 356].map((x) => rrect(x - 20, 442, 40, 34, 4, '#4CC9F0')).join(''),
        front: [164, 348].map((x) => rrect(x - 13, 56, 26, 48, 5, '#7CFC9E')).join(''),
        headFill: '#D7FFE5', ring: '#2B0B3F', ringWidth: 10,
      }),
    },
    {
      slug: 'pixel-dino', name: 'Pixel Dino',
      art: () => character({
        behind: rrect(58, 366, 112, 40, 8, '#2E9E5B') + rrect(58, 406, 44, 42, 8, '#2E9E5B') +
          [0, 1, 2, 3].map((i) => rrect(352 - i * 4, 298 + i * 46, 46, 38, 8, '#2E9E5B')).join(''),
        body: rrect(146, 290, 224, 186, 14, '#3FBF72') +
          rrect(190, 396, 132, 60, 10, '#C8F5D8') +
          [200, 292].map((x) => rrect(x, 464, 44, 36, 6, '#2E9E5B')).join(''),
        headFill: '#D7F5E3', ring: '#2E9E5B', ringWidth: 10,
      }),
    },
    {
      slug: 'power-coin', name: 'Power Coin',
      art: () => { const [d, g] = radial('#FFE066', '#E8A317')
        return character({ defs: d,
          behind: circle(256, 360, 152, '#B07A0E'),
          body: circle(256, 350, 146, g) + circle(256, 350, 114, 'none', 'stroke="#FFF3C4" stroke-width="9" opacity=".75"') +
            text(256, 438, '1UP', { size: 54, fill: '#B07A0E' }),
          front: [[124, 112], [390, 96]].map(([x, y]) => sparkle(x, y, 22, '#FFF3C4')).join(''),
          headFill: '#FFF3C4', ring: '#E8A317', ringWidth: 10 })
      },
    },
    {
      slug: 'headset', name: 'Pro Gamer',
      art: () => character({
        behind: rrect(92, 306, 50, 128, 12, '#3BA7C9') + rrect(370, 306, 50, 128, 12, '#3BA7C9'),
        body: rrect(142, 292, 228, 184, 26, '#2B0B3F') + rrect(186, 330, 140, 50, 10, '#4CC9F0') +
          [204, 256, 308].map((x) => circle(x, 422, 17, '#F72585')).join(''),
        front: stroke(`M118 ${HEAD.cy} q0 -132 138 -132 q138 0 138 132`, '#F72585', 18) +
          rrect(92, 170, 54, 86, 20, '#2B0B3F') + rrect(366, 170, 54, 86, 20, '#2B0B3F') +
          stroke('M140 236 q34 56 14 92', '#F72585', 9) + circle(154, 332, 13, '#4CC9F0'),
        headFill: '#F6D5BC', ring: '#4CC9F0', ringWidth: 10,
      }),
    },
  ],
  stickers: [
    { slug: 'coin', name: 'Coin', art: () => { const [d, g] = radial('#FFF3BF', '#F0A313'); return sticker(circle(128, 128, 92, g) + circle(128, 128, 70, 'none', 'stroke="#E0960B" stroke-width="7"') + text(128, 158, '$', { size: 84, fill: '#E0960B' }), d) } },
    { slug: 'pixel-heart', name: 'Pixel Heart', art: () => { const px = 26; const grid = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000']; return sticker(grid.flatMap((row, r) => [...row].map((c, q) => (c === '1' ? rrect(26 + q * px, 44 + r * px, px, px, 2, '#F72585') : ''))).join('')) } },
    { slug: 'gamepad', name: 'Gamepad', art: () => sticker([rrect(16, 88, 224, 108, 34, '#2B2B33'), rrect(50, 128, 16, 44, 4, '#CBD5E0'), rrect(34, 144, 48, 16, 4, '#CBD5E0'), circle(182, 130, 15, '#F72585'), circle(214, 158, 15, '#FFE066'), circle(150, 158, 15, '#4CC9F0')].join('')) },
    { slug: 'invader', name: 'Invader', art: () => { const px = 22; const grid = ['0010100', '0111110', '1101011', '1111111', '0101010', '1000001']; return sticker(grid.flatMap((row, r) => [...row].map((c, q) => (c === '1' ? rrect(50 + q * px, 62 + r * px, px, px, 2, '#7CFC9E') : ''))).join('')) } },
    { slug: 'level-up', name: 'Level Up', art: () => sticker([path('M128 24 L222 128 h-52 v88 h-84 v-88 H34z', '#7CFC9E'), path('M128 24 L222 128 h-52 v88 h-84 v-88 H34z', 'none', 'stroke="#2F9E5B" stroke-width="7"'), text(128, 198, '+1', { size: 40, fill: '#17421F' })].join('')) },
    { slug: 'neon-star', name: 'Neon Star', art: () => sticker(star(128, 128, 104, 44, 5, '#FFE066') + star(128, 128, 104, 44, 5, 'none', 'stroke="#F72585" stroke-width="8"')) },
    { slug: 'glitch', name: 'Glitch', art: () => sticker([rrect(28, 92, 200, 30, 2, '#F72585', 'opacity=".85"'), rrect(44, 124, 170, 26, 2, '#4CC9F0', 'opacity=".85"'), rrect(20, 152, 196, 22, 2, '#FFE066', 'opacity=".85"'), rrect(60, 176, 140, 18, 2, '#7CFC9E', 'opacity=".85"')].join('')) },
    { slug: 'crt', name: 'Game Over', art: () => sticker([rrect(14, 60, 228, 140, 18, '#2B2B33'), rrect(30, 76, 196, 108, 10, '#0B0820'), text(128, 126, 'GAME', { size: 34, fill: '#F72585' }), text(128, 164, 'OVER', { size: 34, fill: '#F72585' })].join('')) },
  ],
}

// ===========================================================================
// 7 - Enchanted Forest
// ===========================================================================

const forest = {
  slug: 'enchanted-forest',
  name: 'Enchanted Forest',
  tagline: 'Mossy, magic and a little feral',
  accentColor: '#2F9E5B',
  defaultFrameColor: '#F0F7EC',
  frame() {
    const [d, g] = linear('#2F9E5B', '#7048E8', { x2: 1, y2: 1 })
    return svg(W, H, [
      slotOutlines('#2F9E5B', 3, 0.5),
      cornerBrackets(g, 46, 8),
      gapMotifs((cx, cy) => [
        path(`M${cx - 40} ${cy} q20 -16 40 0 q-20 16 -40 0z`, '#4F9E57'),
        path(`M${cx + 40} ${cy} q-20 -16 -40 0 q20 16 40 0z`, '#6FBF6F'),
        circle(cx, cy, 6, '#B197FC'),
      ].join('')),
      edgeMotifs((x, y, i) => (i % 3 === 0 ? sparkle(x, y, 8, '#B197FC') : ellipse(x, y, 5, 10, '#4F9E57', `transform="rotate(${i * 24} ${x} ${y})"`)), 12),
      footerRule('#2F9E5B', [path(`M${W / 2 - 60} ${H - F + 16} q14 -12 28 0 q-14 12 -28 0z`, '#4F9E57'), path(`M${W / 2 + 60} ${H - F + 16} q-14 -12 -28 0 q14 12 28 0z`, '#4F9E57')].join('')),
    ].join(''), d)
  },
  thumb() {
    const [d, g] = linear('#CFE8C4', '#7FB98A')
    return thumb(
      `<rect width="320" height="220" fill="${g}"/>` +
        [40, 110, 250].map((x, i) => path(`M${x} 200 V140 M${x - 40} 140 L${x} 54 L${x + 40} 140z`, '#3F7F49')).join('') +
        [[180, 90], [300, 70], [86, 60]].map(([x, y], i) => sparkle(x, y, 14 - i * 2, '#D0BFFF')).join('') +
        [[200, 180, 20], [240, 190, 14]].map(([x, y, r]) => circle(x, y, r, '#E8637F')).join(''),
      d,
    )
  },
  characters: [
    {
      slug: 'fox', name: 'Fox',
      art: () => { const [d, g] = linear('#F08C3A', '#D2691E')
        return character({ defs: d,
          behind: path('M398 392 q96 -18 76 -116 q-40 18 -48 62z', '#E8A05C'),
          body: ellipse(256, 362, 142, 118, g) + ellipse(256, 400, 72, 50, '#FFF3E6'),
          front: path('M150 112 l-16 -82 l80 44z', '#D2691E') + path('M362 112 l16 -82 l-80 44z', '#D2691E') + path('M160 108 l-8 -44 l42 24z', '#FFD9B8') + path('M352 108 l8 -44 l-42 24z', '#FFD9B8'),
          headFill: '#FFE0C2', ring: '#B4521A' })
      },
    },
    {
      slug: 'mushroom', name: 'Mushroom',
      art: () => { const [d, g] = radial('#FF8787', '#C92A2A')
        return character({ defs: d,
          body: rrect(196, 300, 120, 176, 24, '#FFF4E6'),
          front: path('M62 322 q0 -168 194 -168 q194 0 194 168z', g) + [[128, 258, 22], [222, 222, 16], [318, 246, 19], [384, 288, 14], [172, 300, 12]].map(([x, y, r]) => circle(x, y, r, '#FFF4E6')).join(''),
          headFill: '#FFE8D6', ring: '#C92A2A', ringWidth: 0 })
      },
    },
    {
      slug: 'deer', name: 'Deer',
      art: () => character({
        behind: [[-1, 150], [1, 362]].map(([dir, x]) => stroke(`M${x} 120 q${dir * 10} -56 ${dir * 30} -74 M${x + dir * 14} 86 q${dir * 26} -10 ${dir * 34} -30 M${x + dir * 22} 62 q${dir * 22} -6 ${dir * 30} -24`, '#8B5E3C', 11)).join(''),
        body: ellipse(256, 364, 136, 116, '#C9874F') + [[200, 336], [300, 352], [252, 400]].map(([x, y]) => ellipse(x, y, 17, 12, '#F2D5B0')).join(''),
        front: ellipse(256, 406, 42, 30, '#8B5E3C'),
        headFill: '#E8C3A0', ring: '#8B5E3C',
      }),
    },
    {
      slug: 'sprite', name: 'Forest Sprite',
      art: () => { const [d, g] = radial('#D0BFFF', '#7048E8')
        return character({ defs: d,
          behind: [[-1, 120], [1, 392]].map(([dir, x]) => path(`M${x} 300 q${dir * -70} -70 ${dir * -10} -120 q${dir * 70} 30 ${dir * 10} 120z`, '#C4B5FD', 'opacity=".75"')).join(''),
          body: ellipse(256, 350, 116, 110, g) + Array.from({ length: 7 }, (_, i) => sparkle(170 + i * 30, 320 + (i % 3) * 36, 9, '#F3E8FF')).join(''),
          front: circle(HEAD.cx, HEAD.cy, HEAD.r + 30, 'none', 'stroke="#D0BFFF" stroke-width="5" opacity=".65"'),
          headFill: '#F3E8FF', ring: '#7048E8' })
      },
    },
    {
      slug: 'owl', name: 'Owl',
      art: () => { const [d, g] = linear('#B08968', '#7F5539')
        return character({ defs: d,
          behind: [-1, 1].map((s) => path(`M${256 + s * 132} 300 q${s * 76} 54 ${s * 46} 150 q${s * -52} -22 ${s * -62} -108z`, '#9C6B45')).join(''),
          body: ellipse(256, 362, 140, 118, g) +
            [0, 1, 2].map((i) => [-1, 0, 1].map((s) => path(`M${256 + s * 48 - 24} ${338 + i * 44} a26 22 0 0 1 48 0z`, '#D9BFA3', 'opacity=".65"')).join('')).join('') +
            path('M256 302 l-20 34 h40z', '#E8A317'),
          front: [-1, 1].map((s) => path(`M${256 + s * 76} 96 q${s * 26} -62 ${s * 58} -58 q${s * 8} 40 ${s * -22} 70z`, '#7F5539')).join(''),
          headFill: '#F2DFC8', ring: '#7F5539' })
      },
    },
    {
      slug: 'fairy', name: 'Fairy',
      art: () => { const [d, g] = linear('#FFD6E7', '#E64980')
        return character({ defs: d,
          // Pale pink wings vanished against the pink dress; they need to be a
          // different hue, not just a lighter one.
          behind: [-1, 1].map((s) => [
            path(`M256 318 q${s * 166} -138 ${s * 186} -22 q${s * 10} 70 ${s * -66} 76z`, '#C4B5FD', 'opacity=".92"'),
            path(`M256 344 q${s * 136} 30 ${s * 112} 128 q${s * -52} 22 ${s * -98} -78z`, '#A5F3FC', 'opacity=".92"'),
          ].join('')).join(''),
          body: path('M256 296 q-96 34 -100 180 h200 q-4 -146 -100 -180z', g) +
            Array.from({ length: 6 }, (_, i) => sparkle(196 + (i % 3) * 60, 358 + Math.floor(i / 3) * 56, 11, '#FFF0F6')).join(''),
          front: ellipse(256, 64, 112, 26, 'none', 'stroke="#FFE066" stroke-width="9"') +
            [[160, 60], [256, 42], [352, 60]].map(([x, y]) => sparkle(x, y, 15, '#FFE066')).join(''),
          headFill: '#F8D9C4', ring: '#E64980' })
      },
    },
    {
      slug: 'acorn', name: 'Acorn',
      art: () => { const [d, g] = linear('#D9A05B', '#8B5E3C')
        return character({ defs: d,
          body: path('M136 332 q0 144 120 144 q120 0 120 -144z', g) +
            path('M120 300 q0 -60 136 -60 q136 0 136 60 q0 36 -136 36 q-136 0 -136 -36z', '#6B4226') +
            [0, 1, 2].map((i) => stroke(`M${170 + i * 58} 266 V330`, '#5A3620', 7, 'opacity=".45"')).join(''),
          front: stroke('M256 84 V34', '#4E7B3C', 13) + path('M262 56 q54 -40 72 2 q-56 28 -72 -2z', '#5BA85B'),
          headFill: '#F2DFC8', ring: '#6B4226' })
      },
    },
    {
      slug: 'wolf', name: 'Wolf Cub',
      art: () => { const [d, g] = linear('#A3AEBF', '#5A6678')
        return character({ defs: d,
          behind: path('M392 392 q94 -24 70 -120 q-42 22 -46 66z', '#8A95A6'),
          body: ellipse(256, 362, 142, 118, g) + ellipse(256, 400, 74, 50, '#E2E8F0') + circle(256, 388, 13, '#2D3748'),
          front: path('M152 104 l-18 -86 l84 50z', '#5A6678') + path('M360 104 l18 -86 l-84 50z', '#5A6678') +
            path('M162 100 l-10 -48 l46 28z', '#C7CFDA') + path('M350 100 l10 -48 l-46 28z', '#C7CFDA'),
          headFill: '#E2E8F0', ring: '#445061' })
      },
    },
  ],
  stickers: [
    { slug: 'leaf', name: 'Leaf', art: () => sticker(path('M36 220 q-16 -150 184 -192 q24 182 -184 192z', '#4F9E57') + stroke('M36 220 Q128 134 206 42', '#2F6B3A', 8)) },
    { slug: 'mushroom', name: 'Toadstool', art: () => sticker([rrect(104, 128, 48, 104, 14, '#FFF4E6'), path('M22 140 q0 -108 106 -108 q106 0 106 108z', '#E03131'), ...[[70, 100, 15], [128, 76, 11], [182, 102, 13]].map(([x, y, r]) => circle(x, y, r, '#FFF4E6'))].join('')) },
    { slug: 'acorn', name: 'Acorn', art: () => sticker([path('M60 112 q68 86 136 0 q-14 118 -68 118 q-54 0 -68 -118z', '#C9874F'), path('M48 108 q80 -28 160 0 q-6 -58 -80 -58 q-74 0 -80 58z', '#7B4B2A'), stroke('M128 50 V24', '#7B4B2A', 9)].join('')) },
    { slug: 'firefly', name: 'Fireflies', art: () => sticker([[72, 160, 26], [168, 92, 20], [204, 190, 15]].map(([x, y, r]) => circle(x, y, r * 1.9, '#FFE066', 'opacity=".2"') + circle(x, y, r, '#FFF3BF')).join('')) },
    { slug: 'berry', name: 'Berries', art: () => sticker([[88, 160, 36], [160, 142, 30], [126, 206, 26]].map(([x, y, r]) => circle(x, y, r, '#C2255C') + gloss(x, y, r, 0.4)).join('') + stroke('M126 120 q10 -46 56 -62', '#4F9E57', 9) + path('M182 58 q38 -22 52 8 q-40 20 -52 -8z', '#4F9E57')) },
    { slug: 'feather', name: 'Feather', art: () => sticker(path('M196 36 q-40 160 -142 192 q-14 -118 142 -192z', '#8FD6E8') + stroke('M196 36 Q130 140 54 228', '#4A90A4', 7) + [0, 1, 2, 3].map((i) => stroke(`M${166 - i * 28} ${86 + i * 34} l-34 22`, '#4A90A4', 4)).join('')) },
    { slug: 'moon-phase', name: 'Crescent', art: () => sticker(path('M172 26 a104 104 0 1 0 0 208 a82 82 0 0 1 0 -208z', '#E8DEF8') + sparkle(74, 60, 18, '#D0BFFF')) },
    { slug: 'vine', name: 'Vine', art: () => sticker(stroke('M40 240 q56 -50 36 -102 q-20 -52 40 -94 q58 -40 50 -18', '#4F9E57', 11) + [[66, 182], [84, 112], [142, 66], [40, 222]].map(([x, y], i) => path(`M${x} ${y} q18 -16 36 0 q-18 16 -36 0z`, i % 2 ? '#6FBF6F' : '#3F7F49')).join('')) },
  ],
}

// ===========================================================================
// 8 - Y2K Mall
// ===========================================================================

const y2k = {
  slug: 'y2k-mall',
  name: 'Y2K Mall',
  tagline: 'Butterfly clips and frosted everything',
  accentColor: '#22D3EE',
  defaultFrameColor: '#EAF9FF',
  frame() {
    const [d, g] = linear('#22D3EE', '#F472B6', { x2: 1, y2: 1 })
    return svg(W, H, [
      slotOutlines('#22D3EE', 4, 0.65),
      cornerBrackets(g, 50, 9),
      gapMotifs((cx, cy, i) => [
        stroke(`M${cx - 72} ${cy} H${cx - 28}`, '#F472B6', 4),
        stroke(`M${cx + 28} ${cy} H${cx + 72}`, '#F472B6', 4),
        i === 1 ? star(cx, cy, 14, 5, 4, '#FDE68A') : heart(cx, cy, 22, '#F472B6'),
      ].join('')),
      edgeMotifs((x, y, i) => (i % 2 ? star(x, y, 9, 3.6, 4, '#22D3EE') : circle(x, y, 5, '#F472B6')), 12),
      footerRule('#22D3EE', [star(W / 2 - 64, H - F + 16, 10, 4, 4, '#F472B6'), star(W / 2 + 64, H - F + 16, 10, 4, 4, '#F472B6')].join('')),
    ].join(''), d)
  },
  thumb() {
    const [d, g] = linear('#A5F3FC', '#F9A8D4', { x2: 1, y2: 1 })
    return thumb(
      `<rect width="320" height="220" fill="${g}"/>` +
        [[56, 60], [250, 56], [160, 150]].map(([x, y], i) => [
          path(`M${x} ${y} q-40 -40 -56 -10 q-14 28 56 10z`, '#F472B6'),
          path(`M${x} ${y} q40 -40 56 -10 q14 28 -56 10z`, '#F472B6'),
          path(`M${x} ${y} q-30 34 -48 18 q-10 -22 48 -18z`, '#EC4899'),
          path(`M${x} ${y} q30 34 48 18 q10 -22 -48 -18z`, '#EC4899'),
        ].join('')).join('') +
        [[128, 40, 12], [220, 160, 15], [50, 170, 10]].map(([x, y, r]) => star(x, y, r, r * 0.4, 4, '#FDE68A')).join(''),
      d,
    )
  },
  characters: [
    {
      slug: 'mall-girl', name: 'Mall Icon',
      art: () => { const [d, g] = linear('#67E8F9', '#0891B2')
        return character({ defs: d,
          behind: path(`M${HEAD.cx - 132} ${HEAD.cy - 24} q132 -150 264 0 q0 -130 -132 -130 q-132 0 -132 130z`, '#8B5E3C'),
          body: path('M256 300 q-140 36 -140 176 h280 q0 -140 -140 -176z', g) + rrect(186, 356, 140, 14, 7, '#F472B6'),
          front: [[146, 132], [368, 132]].map(([x, y]) => [
            path(`M${x} ${y} q-32 -32 -46 -8 q-10 22 46 8z`, '#F472B6'),
            path(`M${x} ${y} q32 -32 46 -8 q10 22 -46 8z`, '#F472B6'),
            circle(x, y, 9, '#EC4899'),
          ].join('')).join(''),
          headFill: '#F6D5BC', ring: '#0891B2', ringWidth: 8 })
      },
    },
    {
      slug: 'skater', name: 'Skater',
      art: () => character({
        behind: rrect(96, 440, 320, 26, 13, '#F472B6') + circle(166, 480, 20, '#FDE68A') + circle(346, 480, 20, '#FDE68A'),
        body: rrect(146, 290, 220, 150, 24, '#FDE68A') + rrect(186, 326, 140, 42, 8, '#22D3EE') + text(256, 418, 'Y2K', { size: 42, fill: '#EC4899' }),
        front: rrect(HEAD.cx - 124, HEAD.cy - 122, 248, 36, 18, '#EC4899') + path(`M${HEAD.cx - 124} ${HEAD.cy - 92} h248 l-28 22 h-192z`, '#BE185D'),
        headFill: '#EDC3A0', ring: '#BE185D', ringWidth: 8,
      }),
    },
    {
      slug: 'flip-phone', name: 'Flip Phone',
      art: () => { const [d, g] = linear('#F9A8D4', '#DB2777')
        return character({ defs: d,
          body: rrect(150, 286, 212, 196, 30, g) + rrect(184, 318, 144, 52, 10, '#A5F3FC') + Array.from({ length: 9 }, (_, i) => rrect(188 + (i % 3) * 48, 388 + Math.floor(i / 3) * 34, 36, 24, 6, '#FBCFE8')).join(''),
          front: stroke(`M${HEAD.cx + 96} ${HEAD.cy - 70} q46 -34 24 -84`, '#9D174D', 9) + circle(HEAD.cx + 122, HEAD.cy - 160, 13, '#FDE68A'),
          headFill: '#FBCFE8', ring: '#9D174D', ringWidth: 9 })
      },
    },
    {
      slug: 'butterfly', name: 'Butterfly',
      art: () => { const [d, g] = linear('#67E8F9', '#C026D3')
        return character({ defs: d,
          behind: [[-1, 1], [1, 1]].map(([dir]) => [
            path(`M256 320 q${dir * 190} -120 ${dir * 196} -10 q${dir * 6} 70 ${dir * -60} 70z`, g),
            path(`M256 340 q${dir * 150} 30 ${dir * 120} 120 q${dir * -50} 24 ${dir * -110} -70z`, '#F472B6'),
          ].join('')).join(''),
          body: rrect(236, 272, 40, 198, 20, '#581C87'),
          front: [[-1, 1], [1, 1]].map(([dir]) => stroke(`M${256 + dir * 16} 240 q${dir * 46} -60 ${dir * 70} -86`, '#581C87', 8) + circle(256 + dir * 86, 150, 11, '#FDE68A')).join(''),
          headFill: '#F8D9C4', ring: '#7E22CE', ringWidth: 8 })
      },
    },
    {
      slug: 'boombox', name: 'Boombox',
      art: () => { const [d, g] = linear('#A5F3FC', '#0E7490')
        return character({ defs: d,
          behind: stroke('M150 290 q106 -72 212 0', '#0E7490', 16),
          body: rrect(112, 300, 288, 176, 22, g) +
            [184, 328].map((x) => circle(x, 382, 52, '#164E63') + circle(x, 382, 28, '#67E8F9') + gloss(x, 382, 28, 0.5)).join('') +
            rrect(236, 318, 40, 28, 6, '#FDE68A') +
            [0, 1, 2].map((i) => rrect(230 + i * 14, 438, 8, 22, 4, '#F472B6')).join(''),
          front: [[118, 112], [396, 96]].map(([x, y]) =>
            ellipse(x, y, 20, 15, '#F472B6', `transform="rotate(-20 ${x} ${y})"`) +
            stroke(`M${x + 19} ${y - 4} V${y - 58}`, '#F472B6', 8) +
            path(`M${x + 19} ${y - 58} q30 6 34 30 q-14 -16 -34 -12z`, '#F472B6')).join(''),
          headFill: '#CFFAFE', ring: '#0E7490', ringWidth: 9 })
      },
    },
    {
      slug: 'cd-kid', name: 'CD Kid',
      art: () => { const [d, g] = radial('#F5D0FE', '#A21CAF')
        return character({ defs: d,
          behind: circle(256, 366, 152, '#E9D5FF'),
          body: circle(256, 356, 146, g) +
            Array.from({ length: 10 }, (_, i) => {
              const a = (i / 10) * Math.PI
              const [dx, dy] = [Math.cos(a) * 140, Math.sin(a) * 140]
              return stroke(`M${(256 - dx).toFixed(1)} ${(356 - dy).toFixed(1)} L${(256 + dx).toFixed(1)} ${(356 + dy).toFixed(1)}`, ['#67E8F9', '#FDE68A', '#F472B6'][i % 3], 7, 'opacity=".5"')
            }).join('') +
            circle(256, 356, 44, '#FDF4FF') + circle(256, 356, 17, '#A21CAF'),
          front: [[116, 116], [398, 100]].map(([x, y]) => sparkle(x, y, 20, '#F0ABFC')).join(''),
          headFill: '#FDF4FF', ring: '#A21CAF', ringWidth: 9 })
      },
    },
    {
      slug: 'scrunchie', name: 'Scrunchie',
      art: () => { const [d, g] = linear('#FDE68A', '#F59E0B')
        return character({ defs: d,
          behind: path(`M${HEAD.cx - 134} ${HEAD.cy + 20} q-10 -196 134 -196 q144 0 134 196 q-34 -116 -134 -116 q-100 0 -134 116z`, '#8B5E3C'),
          body: path('M256 298 q-132 34 -138 178 h276 q-6 -144 -138 -178z', g) +
            [0, 1, 2, 3, 4].map((i) => circle(176 + i * 40, 374 + (i % 2) * 40, 17, '#FFFFFF', 'opacity=".65"')).join(''),
          front: [-1, 1].map((s) => {
            const cx = 256 + s * 152
            return ellipse(cx, 196, 46, 40, 'none', 'stroke="#F472B6" stroke-width="26"') +
              Array.from({ length: 7 }, (_, i) => circle(cx + Math.cos(i) * 42, 196 + Math.sin(i * 1.7) * 36, 11, '#F9A8D4')).join('')
          }).join(''),
          headFill: '#F8D9C4', ring: '#8B5E3C', ringWidth: 8 })
      },
    },
    {
      slug: 'rollerblader', name: 'Rollerblader',
      art: () => character({
        behind: rrect(96, 444, 130, 34, 16, '#22D3EE') + rrect(286, 444, 130, 34, 16, '#22D3EE') +
          [126, 196, 316, 386].map((x) => circle(x, 490, 18, '#FDE68A')).join(''),
        body: rrect(148, 288, 216, 156, 26, '#F472B6') + rrect(186, 320, 140, 44, 10, '#FDE68A') +
          [196, 256, 316].map((x) => star(x, 402, 20, 9, 5, '#FFFFFF')).join(''),
        front: rrect(HEAD.cx - 122, HEAD.cy - 128, 244, 44, 22, '#22D3EE') +
          stroke(`M${HEAD.cx - 122} ${HEAD.cy - 106} H${HEAD.cx + 122}`, '#0E7490', 8) +
          [-1, 1].map((s) => rrect(256 + s * 142 - 22, 152, 44, 56, 18, '#0E7490')).join(''),
        headFill: '#EDC3A0', ring: '#BE185D', ringWidth: 8,
      }),
    },
  ],
  stickers: [
    { slug: 'butterfly-clip', name: 'Butterfly', art: () => { const [d, g] = linear('#67E8F9', '#C026D3'); return sticker([path('M128 128 q-78 -62 -96 -18 q-16 44 96 18z', g), path('M128 128 q78 -62 96 -18 q16 44 -96 18z', g), path('M128 128 q-58 54 -88 30 q-20 -32 88 -30z', '#F472B6'), path('M128 128 q58 54 88 30 q20 -32 -88 -30z', '#F472B6'), rrect(118, 110, 20, 72, 10, '#581C87')].join(''), d) } },
    { slug: 'cd', name: 'Burned CD', art: () => { const [d, g] = radial('#F9A8D4', '#67E8F9', { r: 0.7 }); return sticker(circle(128, 128, 104, g) + circle(128, 128, 104, 'none', 'stroke="#E0E7FF" stroke-width="4"') + circle(128, 128, 34, '#EAF9FF') + circle(128, 128, 12, '#CBD5E0'), d) } },
    { slug: 'gloss', name: 'Lip Gloss', art: () => sticker([rrect(94, 104, 68, 128, 16, '#F9A8D4', 'opacity=".9"'), rrect(102, 60, 52, 54, 12, '#DB2777'), gloss(118, 140, 22, 0.6), star(196, 78, 18, 7, 4, '#FDE68A')].join('')) },
    { slug: 'star-y2k', name: 'Y2K Star', art: () => sticker(star(128, 128, 102, 36, 4, '#22D3EE') + star(128, 128, 60, 20, 4, '#FDE68A')) },
    { slug: 'phone', name: 'Flip Phone', art: () => sticker([rrect(76, 36, 104, 184, 20, '#DB2777'), rrect(92, 56, 72, 60, 8, '#A5F3FC'), ...Array.from({ length: 9 }, (_, i) => rrect(94 + (i % 3) * 24, 130 + Math.floor(i / 3) * 26, 18, 18, 5, '#FBCFE8'))].join('')) },
    { slug: 'rainbow', name: 'Rainbow', art: () => sticker(['#F472B6', '#FDE68A', '#7CFC9E', '#22D3EE'].map((c, i) => path(`M${30 + i * 18} 210 a${98 - i * 18} ${98 - i * 18} 0 0 1 ${(98 - i * 18) * 2} 0z`, 'none') + `<path d="M${30 + i * 18} 210 a${98 - i * 18} ${98 - i * 18} 0 0 1 ${(98 - i * 18) * 2} 0" fill="none" stroke="${c}" stroke-width="18"/>`).join('')) },
    { slug: 'frosted', name: 'No Cap', art: () => sticker([rrect(16, 84, 224, 92, 24, '#A5F3FC', 'opacity=".92"'), rrect(16, 84, 224, 92, 24, 'none', 'stroke="#22D3EE" stroke-width="6"'), text(128, 148, 'no cap', { size: 42, fill: '#0E7490', family: 'Verdana,Geneva,sans-serif' })].join('')) },
    { slug: 'peace', name: 'Peace', art: () => sticker([circle(128, 128, 94, 'none', 'stroke="#F472B6" stroke-width="16"'), stroke('M128 34 V222', '#F472B6', 16), stroke('M128 128 L58 198', '#F472B6', 16), stroke('M128 128 L198 198', '#F472B6', 16)].join('')) },
  ],
}

// Extra Kahoot-style pals — bright, simple, distinct silhouettes — tacked onto
// every theme so the roster feels like picking an avatar, not a costume rack.
const ears = (color, dx = 118, dy = 70, r = 38) =>
  circle(HEAD.cx - dx, HEAD.cy - dy, r, color) + circle(HEAD.cx + dx, HEAD.cy - dy, r, color)

const extras = {
  'fish-tank': [
    { slug: 'neon-buddy', name: 'Neon Buddy', body: '#22D3EE', accent: '#0E7490', ears: ears('#67E8F9') },
    { slug: 'bubble-pal', name: 'Bubble Pal', body: '#7CFC9E', accent: '#2F9E5B', hat: circle(HEAD.cx, HEAD.cy - 148, 28, '#A5F3FC', 'opacity=".7"') },
  ],
  'y2k-mall': [
    { slug: 'cyber-kitty', name: 'Cyber Kitty', body: '#F472B6', accent: '#BE185D', ears: path(`M${HEAD.cx - 90} ${HEAD.cy - 40} l-50 -88 l70 40z`, '#F9A8D4') + path(`M${HEAD.cx + 90} ${HEAD.cy - 40} l50 -88 l-70 40z`, '#F9A8D4') },
    { slug: 'cd-pal', name: 'CD Pal', body: '#22D3EE', accent: '#0891B2', hat: circle(HEAD.cx + 110, HEAD.cy - 130, 26, '#FDE68A') },
  ],
  'dress-to-impress': [
    { slug: 'runway-fox', name: 'Runway Fox', body: '#F06595', accent: '#A61E4D', ears: path(`M${HEAD.cx - 80} ${HEAD.cy - 30} l-46 -96 l66 50z`, '#FFA8CC') + path(`M${HEAD.cx + 80} ${HEAD.cy - 30} l46 -96 l-66 50z`, '#FFA8CC') },
    { slug: 'glitter-bug', name: 'Glitter Bug', body: '#9775FA', accent: '#5F3DC4', hat: star(HEAD.cx, HEAD.cy - 156, 22, 9, 5, '#FFE066') },
  ],
  'arcade-night': [
    { slug: 'pixel-fox', name: 'Pixel Fox', body: '#F72585', accent: '#A61E4D', ears: path(`M${HEAD.cx - 78} ${HEAD.cy - 28} l-40 -80 l58 44z`, '#FF8FA8') + path(`M${HEAD.cx + 78} ${HEAD.cy - 28} l40 -80 l-58 44z`, '#FF8FA8') },
    { slug: 'high-score', name: 'High Score', body: '#4CC9F0', accent: '#1864AB', hat: text(HEAD.cx, HEAD.cy - 142, '1UP', { size: 28, fill: '#FFE066' }) },
  ],
  'space-cadet': [
    { slug: 'cosmo-cat', name: 'Cosmo Cat', body: '#7C3AED', accent: '#4C1D95', ears: path(`M${HEAD.cx - 82} ${HEAD.cy - 32} l-44 -90 l62 48z`, '#C4B5FD') + path(`M${HEAD.cx + 82} ${HEAD.cy - 32} l44 -90 l-62 48z`, '#C4B5FD') },
    { slug: 'orbit-owl', name: 'Orbit Owl', body: '#63B3ED', accent: '#2B6CB0', hat: ellipse(HEAD.cx, HEAD.cy - 150, 70, 16, 'none', 'stroke="#F6E05E" stroke-width="8"') },
  ],
  'cafe-days': [
    { slug: 'mocha-pup', name: 'Mocha Pup', body: '#C68B5B', accent: '#6B4226', ears: ellipse(HEAD.cx - 118, HEAD.cy + 8, 28, 52, '#8B5E3C') + ellipse(HEAD.cx + 118, HEAD.cy + 8, 28, 52, '#8B5E3C') },
    { slug: 'sugar-fox', name: 'Sugar Fox', body: '#F2A1C0', accent: '#C2255C', ears: path(`M${HEAD.cx - 76} ${HEAD.cy - 28} l-42 -84 l58 42z`, '#F7A8C4') + path(`M${HEAD.cx + 76} ${HEAD.cy - 28} l42 -84 l-58 42z`, '#F7A8C4') },
  ],
  'enchanted-forest': [
    { slug: 'moss-fox', name: 'Moss Fox', body: '#5BA85B', accent: '#2F6B3A', ears: path(`M${HEAD.cx - 80} ${HEAD.cy - 30} l-44 -88 l62 46z`, '#8FD68F') + path(`M${HEAD.cx + 80} ${HEAD.cy - 30} l44 -88 l-62 46z`, '#8FD68F') },
    { slug: 'firefly-pal', name: 'Firefly Pal', body: '#68D391', accent: '#276749', hat: circle(HEAD.cx + 118, HEAD.cy - 124, 16, '#FDE68A') + circle(HEAD.cx - 126, HEAD.cy - 90, 10, '#FFE066', 'opacity=".7"') },
  ],
  farm: [
    { slug: 'barn-owl', name: 'Barn Owl', body: '#E8C46A', accent: '#C08A32', hat: path(`M${HEAD.cx - 100} ${HEAD.cy - 40} l-20 -70 l50 40z`, '#FFF3DC') + path(`M${HEAD.cx + 100} ${HEAD.cy - 40} l20 -70 l-50 40z`, '#FFF3DC') },
    { slug: 'tractor-pup', name: 'Tractor Pup', body: '#C0392B', accent: '#8E2A1F', ears: ellipse(HEAD.cx - 120, HEAD.cy + 4, 26, 50, '#8E2A1F') + ellipse(HEAD.cx + 120, HEAD.cy + 4, 26, 50, '#8E2A1F') },
  ],
}

for (const theme of [fishTank, y2k, dress, arcade, space, cafe, forest, farm]) {
  for (const pal of extras[theme.slug] ?? []) {
    theme.characters.push({
      slug: pal.slug,
      name: pal.name,
      art: () => kahootBuddy({ body: pal.body, accent: pal.accent, ears: pal.ears ?? '', hat: pal.hat ?? '' }),
    })
  }
}

export const THEMES = [fishTank, y2k, dress, arcade, space, cafe, forest, farm]
