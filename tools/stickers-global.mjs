// ---------------------------------------------------------------------------
// Stickers available in every theme, whatever the host picked.
//
// Deliberately spans registers - cute, funny, dry, pretty - so a strip can be
// soft or sarcastic without the theme dictating the tone.
// ---------------------------------------------------------------------------

import { sticker, circle, ellipse, rrect, path, stroke, heart, sparkle, star, text, gloss, linear } from './art.mjs'

export const GLOBAL_STICKERS = [
  // --- cute ---------------------------------------------------------------
  {
    slug: 'blush',
    name: 'Blush',
    mood: 'cute',
    art: () =>
      sticker(
        [54, 202].map((cx) => ellipse(cx, 136, 46, 32, '#FF8FA8', 'opacity=".85"')).join('') +
          [54, 202]
            .map((cx) =>
              [-18, 0, 18]
                .map((d) => stroke(`M${cx + d} ${118} v36`, '#E8637F', 7, 'opacity=".55"'))
                .join(''),
            )
            .join(''),
      ),
  },
  {
    slug: 'bow',
    name: 'Bow',
    mood: 'cute',
    art: () => {
      const [defs, grad] = linear('#FF8FC5', '#E8437F')
      return sticker(
        path('M126 128 C90 72 36 60 26 86 c-10 26 14 62 100 42z', grad) +
          path('M130 128 C166 72 220 60 230 86 c10 26 -14 62 -100 42z', grad) +
          path('M112 150 l-30 70 l44 -42z', '#D62D6E') +
          path('M144 150 l30 70 l-44 -42z', '#D62D6E') +
          circle(128, 136, 24, '#FFB3D1') +
          gloss(128, 136, 24, 0.5),
        defs,
      )
    },
  },
  {
    slug: 'heart-eyes',
    name: 'Heart Eyes',
    mood: 'cute',
    art: () =>
      sticker(
        heart(72, 120, 72, '#FF4D6D') +
          heart(184, 120, 72, '#FF4D6D') +
          sparkle(214, 58, 20, '#FFD6E0'),
      ),
  },
  {
    slug: 'flower-daisy',
    name: 'Daisy',
    mood: 'cute',
    art: () =>
      sticker(
        Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2
          return ellipse(128 + Math.cos(a) * 58, 128 + Math.sin(a) * 58, 38, 28, '#FFFFFF', `transform="rotate(${(a * 180) / Math.PI} ${128 + Math.cos(a) * 58} ${128 + Math.sin(a) * 58})"`)
        }).join('') +
          circle(128, 128, 36, '#FFD43B') +
          circle(128, 128, 36, 'none', 'stroke="#E8A317" stroke-width="4"'),
      ),
  },
  {
    slug: 'star-eyes',
    name: 'Star Struck',
    mood: 'cute',
    art: () =>
      sticker(
        star(74, 124, 58, 24, 5, '#FFD43B') +
          star(182, 124, 58, 24, 5, '#FFD43B') +
          sparkle(128, 48, 22, '#FFF3BF'),
      ),
  },

  // --- funny --------------------------------------------------------------
  {
    slug: 'snore',
    name: 'Snore',
    mood: 'funny',
    art: () =>
      sticker(
        text(66, 110, 'z', { size: 72, fill: '#7DA8E8' }) +
          text(132, 76, 'z', { size: 54, fill: '#9BBEF0' }) +
          text(186, 50, 'z', { size: 38, fill: '#B7D2F5' }) +
          ellipse(104, 186, 68, 36, '#FFFFFF', 'opacity=".9"') +
          ellipse(170, 206, 38, 22, '#FFFFFF', 'opacity=".7"'),
      ),
  },
  {
    slug: 'sweat-drop',
    name: 'Awkward',
    mood: 'funny',
    art: () =>
      sticker(
        path('M128 34 C92 96 62 128 62 160 a66 66 0 0 0 132 0 c0 -32 -30 -64 -66 -126z', '#5FB8F0') +
          ellipse(104, 162, 20, 28, '#FFFFFF', 'opacity=".45" transform="rotate(-18 104 162)"'),
      ),
  },
  {
    slug: 'exclaim',
    name: 'Wait What',
    mood: 'funny',
    art: () =>
      sticker(
        path('M58 28 h44 l-10 132 h-24z', '#FF3B3B') +
          circle(80, 206, 24, '#FF3B3B') +
          path('M150 28 c56 0 72 56 36 84 c-18 14 -22 24 -22 48 h-34 c0 -40 8 -52 28 -68 c16 -12 10 -32 -8 -32 c-14 0 -22 10 -22 26 h-36 c0 -36 24 -58 58 -58z', '#FFB400') +
          circle(170, 206, 24, '#FFB400'),
      ),
  },
  {
    slug: 'hundred',
    name: '100',
    mood: 'funny',
    art: () =>
      sticker(
        text(128, 162, '100', { size: 84, fill: '#E8203A', family: 'Georgia,serif', extra: 'font-style="italic"' }) +
          stroke('M44 190 h168', '#E8203A', 11) +
          stroke('M44 212 h168', '#E8203A', 11),
      ),
  },
  {
    slug: 'speech-omg',
    name: 'OMG',
    mood: 'funny',
    art: () =>
      sticker(
        path('M20 40 h216 a16 16 0 0 1 16 16 v110 a16 16 0 0 1 -16 16 h-96 l-44 48 l6 -48 h-82 a16 16 0 0 1 -16 -16 v-110 a16 16 0 0 1 16 -16z', '#FFFFFF') +
          path('M20 40 h216 a16 16 0 0 1 16 16 v110 a16 16 0 0 1 -16 16 h-96 l-44 48 l6 -48 h-82 a16 16 0 0 1 -16 -16 v-110 a16 16 0 0 1 16 -16z', 'none', 'stroke="#2B2B33" stroke-width="8"') +
          text(128, 132, 'OMG', { size: 54, fill: '#2B2B33' }),
      ),
  },
  {
    slug: 'halo',
    name: 'Angel',
    mood: 'funny',
    art: () =>
      sticker(
        ellipse(128, 128, 96, 34, 'none', 'stroke="#FFD43B" stroke-width="20"') +
          ellipse(128, 128, 96, 34, 'none', 'stroke="#FFF3BF" stroke-width="7"') +
          sparkle(214, 86, 18, '#FFF3BF'),
      ),
  },

  // --- cool / serious -----------------------------------------------------
  {
    slug: 'shades',
    name: 'Shades',
    mood: 'cool',
    art: () => {
      const [defs, grad] = linear('#3A3A46', '#13131A')
      return sticker(
        rrect(16, 96, 98, 76, 18, grad) +
          rrect(142, 96, 98, 76, 18, grad) +
          path('M114 118 q14 -10 28 0 v-12 q-14 -8 -28 0z', '#2B2B33') +
          stroke('M16 112 H4', '#2B2B33', 10) +
          stroke('M240 112 H252', '#2B2B33', 10) +
          path('M26 106 l34 0 l-40 44 l0 -32z', '#FFFFFF', 'opacity=".22"') +
          path('M152 106 l34 0 l-40 44 l0 -32z', '#FFFFFF', 'opacity=".22"'),
        defs,
      )
    },
  },
  {
    slug: 'lightning',
    name: 'Bolt',
    mood: 'cool',
    art: () => {
      const [defs, grad] = linear('#FFE066', '#F08C00')
      return sticker(path('M150 12 L58 146 h56 l-18 98 l106 -146 h-60z', grad) + path('M150 12 L58 146 h56 l-18 98 l106 -146 h-60z', 'none', 'stroke="#C96A00" stroke-width="6"'), defs)
    },
  },
  {
    slug: 'sparkle-trio',
    name: 'Sparkles',
    mood: 'pretty',
    art: () =>
      sticker(
        sparkle(112, 112, 76, '#FFE066') +
          sparkle(206, 58, 30, '#FFF3BF') +
          sparkle(58, 208, 24, '#FFF3BF'),
      ),
  },
  {
    slug: 'film-strip',
    name: 'Film',
    mood: 'serious',
    art: () =>
      sticker(
        rrect(52, 20, 152, 216, 12, '#23232B') +
          [0, 1, 2, 3].map((i) => rrect(76, 36 + i * 52, 104, 38, 5, '#E9E4F0')).join('') +
          [0, 1, 2, 3].map((i) => rrect(58, 42 + i * 52, 12, 14, 3, '#5A5A66')).join('') +
          [0, 1, 2, 3].map((i) => rrect(186, 42 + i * 52, 12, 14, 3, '#5A5A66')).join(''),
      ),
  },
  {
    slug: 'arrow-label',
    name: 'This One',
    mood: 'funny',
    art: () =>
      sticker(
        stroke('M30 206 C70 150 110 128 178 112', '#2B2B33', 12) +
          path('M178 112 l-44 -8 l24 34z', '#2B2B33') +
          text(120, 56, 'me', { size: 52, fill: '#2B2B33', family: 'Georgia,serif', extra: 'font-style="italic"' }),
      ),
  },
]
