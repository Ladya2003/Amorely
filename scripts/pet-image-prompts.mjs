/**
 * Prompt templates for Amorely pet assets.
 * Style: cozy home portrait, warm light, AmoreCoin charm (gold circle + white heart).
 * Run via: node scripts/generate-pet-images.mjs
 */

export const STYLE_BASE = [
  'Cozy home pet portrait, warm soft window light, cream and blush pink blurred background.',
  'Highly detailed semi-realistic digital illustration, soft fur texture, expressive eyes.',
  'NOT cartoon, NOT chibi, NOT sci-fi, NOT cyberpunk, NOT neon, NOT space.',
  'Small collar charm: tiny golden yellow circular coin pendant with white heart inside.',
  'Portrait 3:4 vertical composition, pet centered, soft natural shadows.',
  'No text, no watermark, no UI elements.',
].join(' ');

export const SPECIES = ['kitten', 'puppy', 'gecko', 'bunny', 'owlet'];

export const VARIANTS = {
  kitten: ['orange', 'gray', 'black'],
  puppy: ['golden', 'brown', 'spotted'],
  gecko: ['green', 'blue', 'yellow'],
  bunny: ['white', 'gray', 'cream'],
  owlet: ['brown', 'gray', 'white'],
};

/** Visual description per species + variant for consistent coloring. */
export const VARIANT_DESC = {
  kitten: {
    orange: 'orange tabby kitten with warm ginger stripes',
    gray: 'gray tabby kitten with soft silver stripes',
    black: 'sleek black kitten with subtle brown undertones in fur',
  },
  puppy: {
    golden: 'golden retriever puppy with fluffy golden fur',
    brown: 'chocolate brown puppy with floppy ears',
    spotted: 'cream puppy with brown spots and patches',
  },
  gecko: {
    green: 'bright green gecko with subtle scale texture',
    blue: 'teal-blue gecko with gentle scale shimmer',
    yellow: 'sunny yellow-green gecko with warm tones',
  },
  bunny: {
    white: 'snow-white fluffy bunny with pink inner ears',
    gray: 'soft gray lop-eared bunny',
    cream: 'cream-colored bunny with warm beige fur',
  },
  owlet: {
    brown: 'brown owlet with speckled chest feathers',
    gray: 'gray owlet with soft downy feathers',
    white: 'white snowy owlet with fluffy plumage',
  },
};

export const SPECIES_DESC = {
  kitten: 'domestic kitten',
  puppy: 'domestic puppy dog',
  gecko: 'cute gecko lizard standing on hind legs',
  bunny: 'domestic rabbit bunny',
  owlet: 'baby owl owlet',
};

export const LEVEL_SCENE = {
  egg: (species, variant) => {
    const pet = VARIANT_DESC[species][variant];
    return [
      STYLE_BASE,
      `A cozy woven nest on a soft cream knit blanket near a sunlit window.`,
      `A warm cream-colored egg with a gentle crack, tiny ${pet} face peeking out.`,
      `Anticipation of hatching, tender and heartwarming mood.`,
    ].join(' ');
  },
  1: (species, variant) => {
    const pet = VARIANT_DESC[species][variant];
    return [
      STYLE_BASE,
      `Very young baby ${pet}, sleepy innocent expression, sitting upright.`,
      `Holding a small classic milk bottle or cuddling a tiny plush heart toy.`,
      `Smallest size, newborn-like cuteness, level 1 baby pet.`,
    ].join(' ');
  },
  2: (species, variant) => {
    const pet = VARIANT_DESC[species][variant];
    return [
      STYLE_BASE,
      `Young ${pet}, slightly larger than a newborn, curious bright eyes.`,
      `Wearing a small pastel pink ribbon bow on collar alongside the gold heart charm.`,
      `Level 2 growing pet, gentle playful mood.`,
    ].join(' ');
  },
  3: (species, variant) => {
    const pet = VARIANT_DESC[species][variant];
    return [
      STYLE_BASE,
      `${pet} in playful pose, batting or holding a small yarn ball or rope toy.`,
      `Energetic but still adorable, level 3 active pet.`,
    ].join(' ');
  },
  4: (species, variant) => {
    const pet = VARIANT_DESC[species][variant];
    return [
      STYLE_BASE,
      `Confident adolescent ${pet}, well-groomed fluffy fur.`,
      `Wearing a soft coral bandana with the gold heart charm visible on collar.`,
      `Level 4 mature young pet, proud calm pose.`,
    ].join(' ');
  },
  5: (species, variant) => {
    const pet = VARIANT_DESC[species][variant];
    return [
      STYLE_BASE,
      `Magnificent adult-sized ${pet}, full fluffy coat, radiant healthy appearance.`,
      `Wearing an elegant golden satin ribbon bow and prominent gold heart AmoreCoin charm.`,
      `Level 5 champion pet, regal proud pose, warm golden hour light accent.`,
    ].join(' ');
  },
};

/** All asset jobs: { outPath relative to client/public/pets, prompt } */
export function buildAllJobs() {
  const jobs = [];

  for (const species of SPECIES) {
    for (const variant of VARIANTS[species]) {
      jobs.push({
        outPath: `${species}/${variant}/egg.png`,
        prompt: LEVEL_SCENE.egg(species, variant),
      });

      for (let level = 1; level <= 5; level++) {
        jobs.push({
          outPath: `${species}/${variant}/level-${level}.png`,
          prompt: LEVEL_SCENE[level](species, variant),
        });
      }
    }
  }

  return jobs;
}
