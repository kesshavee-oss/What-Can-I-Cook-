import { getIngredientById } from '../recipes.js';
import { IngredientCategory, ScaledIngredient } from '../types/cook';

export interface NutrientProfilePer100g {
  fiber: number; // g
  vitaminA: number; // mcg RAE
  vitaminC: number; // mg
  folate: number; // mcg
  calcium: number; // mg
  iron: number; // mg
  potassium: number; // mg
  magnesium: number; // mg
}

export type KeyNutrientKey = keyof NutrientProfilePer100g;

export type KeyNutrientGroup = 'fiber' | 'vitamins' | 'minerals';

export interface KeyNutrientSpec {
  key: KeyNutrientKey;
  label: string;
  unit: string;
  group: KeyNutrientGroup;
  dailyTarget: number;
  benefit: string;
  color: string;
}

export const KEY_NUTRIENT_SPECS: KeyNutrientSpec[] = [
  {
    key: 'fiber',
    label: 'Dietary Fiber',
    unit: 'g',
    group: 'fiber',
    dailyTarget: 28,
    benefit: 'Supports digestion and steady energy release.',
    color: '#5B2E91',
  },
  {
    key: 'vitaminC',
    label: 'Vitamin C',
    unit: 'mg',
    group: 'vitamins',
    dailyTarget: 90,
    benefit: 'Supports immune health and boosts plant iron absorption.',
    color: '#C5411B',
  },
  {
    key: 'vitaminA',
    label: 'Vitamin A',
    unit: 'mcg',
    group: 'vitamins',
    dailyTarget: 900,
    benefit: 'Important for vision, skin, and immune defense.',
    color: '#D97706',
  },
  {
    key: 'folate',
    label: 'Folate (Vit B9)',
    unit: 'mcg',
    group: 'vitamins',
    dailyTarget: 400,
    benefit: 'Supports red blood cell formation and cell growth.',
    color: '#1F6E42',
  },
  {
    key: 'calcium',
    label: 'Calcium',
    unit: 'mg',
    group: 'minerals',
    dailyTarget: 1000,
    benefit: 'Builds and maintains strong bones and teeth.',
    color: '#2563EB',
  },
  {
    key: 'iron',
    label: 'Iron',
    unit: 'mg',
    group: 'minerals',
    dailyTarget: 18,
    benefit: 'Carries oxygen in the blood and helps prevent fatigue.',
    color: '#991B1B',
  },
  {
    key: 'potassium',
    label: 'Potassium',
    unit: 'mg',
    group: 'minerals',
    dailyTarget: 3500,
    benefit: 'Helps balance fluids, nerve signals, and blood pressure.',
    color: '#0F766E',
  },
  {
    key: 'magnesium',
    label: 'Magnesium',
    unit: 'mg',
    group: 'minerals',
    dailyTarget: 400,
    benefit: 'Supports muscle recovery, nerve function, and metabolism.',
    color: '#7C3AED',
  },
];

// Typical per-100g USDA-aligned nutritional values for catalog ingredients
const INGREDIENT_NUTRIENTS_PER_100G: Record<string, NutrientProfilePer100g> = {
  // Vegetables
  onion: { fiber: 1.7, vitaminA: 0, vitaminC: 7.4, folate: 19, calcium: 23, iron: 0.21, potassium: 146, magnesium: 10 },
  tomato: { fiber: 1.2, vitaminA: 42, vitaminC: 13.7, folate: 15, calcium: 10, iron: 0.27, potassium: 237, magnesium: 11 },
  potato: { fiber: 2.2, vitaminA: 0, vitaminC: 19.7, folate: 16, calcium: 12, iron: 0.78, potassium: 421, magnesium: 23 },
  garlic: { fiber: 2.1, vitaminA: 0, vitaminC: 31.2, folate: 3, calcium: 181, iron: 1.7, potassium: 401, magnesium: 25 },
  ginger: { fiber: 2.0, vitaminA: 0, vitaminC: 5.0, folate: 11, calcium: 16, iron: 0.6, potassium: 415, magnesium: 43 },
  green_chilli: { fiber: 1.5, vitaminA: 59, vitaminC: 144, folate: 23, calcium: 14, iron: 1.03, potassium: 322, magnesium: 23 },
  spinach: { fiber: 2.2, vitaminA: 469, vitaminC: 28.1, folate: 194, calcium: 99, iron: 2.71, potassium: 558, magnesium: 79 },
  bell_pepper: { fiber: 1.7, vitaminA: 18, vitaminC: 80.4, folate: 10, calcium: 10, iron: 0.34, potassium: 175, magnesium: 10 },
  carrot: { fiber: 2.8, vitaminA: 835, vitaminC: 5.9, folate: 19, calcium: 33, iron: 0.3, potassium: 320, magnesium: 12 },
  green_peas: { fiber: 5.7, vitaminA: 38, vitaminC: 40.0, folate: 65, calcium: 25, iron: 1.47, potassium: 244, magnesium: 33 },
  cauliflower: { fiber: 2.0, vitaminA: 0, vitaminC: 48.2, folate: 57, calcium: 22, iron: 0.42, potassium: 299, magnesium: 15 },
  cucumber: { fiber: 0.5, vitaminA: 5, vitaminC: 2.8, folate: 7, calcium: 16, iron: 0.28, potassium: 147, magnesium: 13 },
  cabbage: { fiber: 2.5, vitaminA: 5, vitaminC: 36.6, folate: 43, calcium: 40, iron: 0.47, potassium: 170, magnesium: 12 },
  sweet_corn: { fiber: 2.0, vitaminA: 9, vitaminC: 6.8, folate: 42, calcium: 2, iron: 0.52, potassium: 270, magnesium: 37 },
  french_beans: { fiber: 2.7, vitaminA: 35, vitaminC: 12.2, folate: 33, calcium: 37, iron: 1.03, potassium: 211, magnesium: 25 },
  broccoli: { fiber: 2.6, vitaminA: 31, vitaminC: 89.2, folate: 63, calcium: 47, iron: 0.73, potassium: 316, magnesium: 21 },
  coriander_leaves: { fiber: 2.8, vitaminA: 337, vitaminC: 27.0, folate: 62, calcium: 67, iron: 1.77, potassium: 521, magnesium: 26 },
  mint_leaves: { fiber: 8.0, vitaminA: 212, vitaminC: 31.8, folate: 114, calcium: 243, iron: 5.08, potassium: 569, magnesium: 80 },
  curry_leaves: { fiber: 6.4, vitaminA: 378, vitaminC: 4.0, folate: 93, calcium: 830, iron: 0.93, potassium: 500, magnesium: 44 },
  lemon: { fiber: 2.8, vitaminA: 1, vitaminC: 53.0, folate: 11, calcium: 26, iron: 0.6, potassium: 138, magnesium: 8 },
  okra: { fiber: 3.2, vitaminA: 36, vitaminC: 23.0, folate: 60, calcium: 82, iron: 0.62, potassium: 299, magnesium: 57 },
  brinjal: { fiber: 3.0, vitaminA: 1, vitaminC: 2.2, folate: 22, calcium: 9, iron: 0.23, potassium: 229, magnesium: 14 },
  bottle_gourd: { fiber: 0.5, vitaminA: 1, vitaminC: 10.1, folate: 6, calcium: 26, iron: 0.2, potassium: 150, magnesium: 11 },
  beetroot: { fiber: 2.8, vitaminA: 2, vitaminC: 4.9, folate: 109, calcium: 16, iron: 0.8, potassium: 325, magnesium: 23 },
  mushroom: { fiber: 1.0, vitaminA: 0, vitaminC: 2.1, folate: 17, calcium: 3, iron: 0.5, potassium: 318, magnesium: 9 },
  fenugreek_leaves: { fiber: 1.1, vitaminA: 117, vitaminC: 52.0, folate: 84, calcium: 395, iron: 1.93, potassium: 31, magnesium: 20 },
  radish: { fiber: 1.6, vitaminA: 0, vitaminC: 14.8, folate: 25, calcium: 25, iron: 0.34, potassium: 233, magnesium: 10 },

  // Fruits
  banana: { fiber: 2.6, vitaminA: 3, vitaminC: 8.7, folate: 20, calcium: 5, iron: 0.26, potassium: 358, magnesium: 27 },
  apple: { fiber: 2.4, vitaminA: 3, vitaminC: 4.6, folate: 3, calcium: 6, iron: 0.12, potassium: 107, magnesium: 5 },
  pomegranate: { fiber: 4.0, vitaminA: 0, vitaminC: 10.2, folate: 38, calcium: 10, iron: 0.3, potassium: 236, magnesium: 12 },
  papaya: { fiber: 1.7, vitaminA: 47, vitaminC: 60.9, folate: 37, calcium: 20, iron: 0.25, potassium: 182, magnesium: 21 },
  mango: { fiber: 1.6, vitaminA: 54, vitaminC: 36.4, folate: 43, calcium: 11, iron: 0.16, potassium: 168, magnesium: 10 },
  orange: { fiber: 2.4, vitaminA: 11, vitaminC: 53.2, folate: 30, calcium: 40, iron: 0.1, potassium: 181, magnesium: 10 },
  grapes: { fiber: 0.9, vitaminA: 3, vitaminC: 3.2, folate: 2, calcium: 10, iron: 0.36, potassium: 191, magnesium: 7 },
  pineapple: { fiber: 1.4, vitaminA: 3, vitaminC: 47.8, folate: 18, calcium: 13, iron: 0.29, potassium: 109, magnesium: 12 },
  watermelon: { fiber: 0.4, vitaminA: 28, vitaminC: 8.1, folate: 3, calcium: 7, iron: 0.24, potassium: 112, magnesium: 10 },
  guava: { fiber: 5.4, vitaminA: 31, vitaminC: 228.3, folate: 49, calcium: 18, iron: 0.26, potassium: 417, magnesium: 22 },
  pear: { fiber: 3.1, vitaminA: 1, vitaminC: 4.3, folate: 7, calcium: 9, iron: 0.18, potassium: 116, magnesium: 7 },
  dates: { fiber: 6.7, vitaminA: 7, vitaminC: 0, folate: 15, calcium: 64, iron: 0.9, potassium: 696, magnesium: 54 },
  kiwi: { fiber: 3.0, vitaminA: 4, vitaminC: 92.7, folate: 25, calcium: 34, iron: 0.31, potassium: 312, magnesium: 17 },
  fresh_coconut: { fiber: 9.0, vitaminA: 0, vitaminC: 3.3, folate: 26, calcium: 14, iron: 2.43, potassium: 356, magnesium: 32 },

  // Meat & Fish
  chicken_curry_cut: { fiber: 0, vitaminA: 18, vitaminC: 0, folate: 5, calcium: 11, iron: 0.9, potassium: 229, magnesium: 23 },
  chicken_breast: { fiber: 0, vitaminA: 9, vitaminC: 0, folate: 4, calcium: 11, iron: 0.49, potassium: 256, magnesium: 28 },
  chicken_keema: { fiber: 0, vitaminA: 14, vitaminC: 0, folate: 6, calcium: 11, iron: 0.8, potassium: 240, magnesium: 24 },
  fish_fillet: { fiber: 0, vitaminA: 15, vitaminC: 0, folate: 14, calcium: 15, iron: 0.56, potassium: 310, magnesium: 27 },
  prawns: { fiber: 0, vitaminA: 54, vitaminC: 0, folate: 19, calcium: 70, iron: 0.51, potassium: 259, magnesium: 39 },
  mutton: { fiber: 0, vitaminA: 0, vitaminC: 0, folate: 18, calcium: 14, iron: 1.88, potassium: 310, magnesium: 23 },
  salmon: { fiber: 0, vitaminA: 12, vitaminC: 0, folate: 25, calcium: 12, iron: 0.8, potassium: 363, magnesium: 27 },

  // Eggs & Dairy
  egg: { fiber: 0, vitaminA: 160, vitaminC: 0, folate: 47, calcium: 56, iron: 1.75, potassium: 138, magnesium: 12 },
  paneer: { fiber: 0, vitaminA: 65, vitaminC: 0, folate: 12, calcium: 480, iron: 0.1, potassium: 100, magnesium: 18 },
  milk: { fiber: 0, vitaminA: 46, vitaminC: 0, folate: 5, calcium: 113, iron: 0.03, potassium: 132, magnesium: 10 },
  yogurt: { fiber: 0, vitaminA: 27, vitaminC: 0.5, folate: 7, calcium: 121, iron: 0.05, potassium: 155, magnesium: 12 },
  butter: { fiber: 0, vitaminA: 684, vitaminC: 0, folate: 3, calcium: 24, iron: 0.02, potassium: 24, magnesium: 2 },
  ghee: { fiber: 0, vitaminA: 820, vitaminC: 0, folate: 0, calcium: 4, iron: 0, potassium: 5, magnesium: 0 },
  cheese: { fiber: 0, vitaminA: 263, vitaminC: 0, folate: 18, calcium: 721, iron: 0.68, potassium: 98, magnesium: 28 },
  fresh_cream: { fiber: 0, vitaminA: 411, vitaminC: 0.6, folate: 4, calcium: 66, iron: 0.03, potassium: 95, magnesium: 7 },

  // Grains & Pulses
  rice: { fiber: 1.3, vitaminA: 0, vitaminC: 0, folate: 8, calcium: 28, iron: 0.8, potassium: 115, magnesium: 25 },
  brown_rice: { fiber: 3.5, vitaminA: 0, vitaminC: 0, folate: 20, calcium: 23, iron: 1.47, potassium: 223, magnesium: 143 },
  poha: { fiber: 1.8, vitaminA: 0, vitaminC: 0, folate: 10, calcium: 20, iron: 2.4, potassium: 115, magnesium: 32 },
  semolina: { fiber: 3.9, vitaminA: 0, vitaminC: 0, folate: 72, calcium: 17, iron: 1.23, potassium: 186, magnesium: 47 },
  oats: { fiber: 10.6, vitaminA: 0, vitaminC: 0, folate: 56, calcium: 54, iron: 4.72, potassium: 429, magnesium: 177 },
  wheat_flour: { fiber: 10.7, vitaminA: 0, vitaminC: 0, folate: 44, calcium: 34, iron: 3.6, potassium: 363, magnesium: 137 },
  bread: { fiber: 2.7, vitaminA: 0, vitaminC: 0, folate: 85, calcium: 144, iron: 3.61, potassium: 126, magnesium: 23 },
  pav: { fiber: 2.3, vitaminA: 0, vitaminC: 0, folate: 75, calcium: 110, iron: 3.1, potassium: 115, magnesium: 22 },
  idli_batter: { fiber: 2.1, vitaminA: 0, vitaminC: 0, folate: 28, calcium: 18, iron: 1.1, potassium: 125, magnesium: 28 },
  toor_dal: { fiber: 15.0, vitaminA: 1, vitaminC: 0, folate: 456, calcium: 130, iron: 5.23, potassium: 1392, magnesium: 183 },
  moong_dal: { fiber: 16.3, vitaminA: 6, vitaminC: 4.8, folate: 625, calcium: 132, iron: 6.74, potassium: 1246, magnesium: 189 },
  moong_sprouts: { fiber: 1.8, vitaminA: 1, vitaminC: 13.2, folate: 61, calcium: 13, iron: 0.91, potassium: 149, magnesium: 21 },
  rajma: { fiber: 15.2, vitaminA: 0, vitaminC: 4.5, folate: 394, calcium: 143, iron: 8.2, potassium: 1406, magnesium: 140 },
  chickpeas: { fiber: 12.2, vitaminA: 3, vitaminC: 4.0, folate: 557, calcium: 57, iron: 4.31, potassium: 718, magnesium: 79 },
  roasted_chana: { fiber: 14.0, vitaminA: 3, vitaminC: 0, folate: 360, calcium: 58, iron: 4.8, potassium: 780, magnesium: 115 },
  besan: { fiber: 10.8, vitaminA: 2, vitaminC: 0, folate: 437, calcium: 45, iron: 4.86, potassium: 846, magnesium: 166 },
  roti_wrap: { fiber: 6.8, vitaminA: 0, vitaminC: 0, folate: 30, calcium: 28, iron: 2.7, potassium: 245, magnesium: 92 },
  quinoa: { fiber: 7.0, vitaminA: 1, vitaminC: 0, folate: 184, calcium: 47, iron: 4.57, potassium: 563, magnesium: 197 },
  urad_dal: { fiber: 18.3, vitaminA: 0, vitaminC: 0, folate: 216, calcium: 138, iron: 7.57, potassium: 983, magnesium: 267 },
  masoor_dal: { fiber: 10.7, vitaminA: 2, vitaminC: 4.5, folate: 479, calcium: 35, iron: 6.51, potassium: 677, magnesium: 47 },
  chana_dal: { fiber: 15.4, vitaminA: 2, vitaminC: 0, folate: 410, calcium: 56, iron: 4.9, potassium: 840, magnesium: 130 },
  black_chana: { fiber: 17.4, vitaminA: 3, vitaminC: 0, folate: 430, calcium: 105, iron: 6.24, potassium: 875, magnesium: 115 },

  // Spices & Herbs
  turmeric: { fiber: 22.7, vitaminA: 0, vitaminC: 0.7, folate: 20, calcium: 168, iron: 55.0, potassium: 2080, magnesium: 208 },
  red_chilli_powder: { fiber: 27.2, vitaminA: 1483, vitaminC: 0.8, folate: 28, calcium: 278, iron: 14.3, potassium: 1950, magnesium: 152 },
  cumin_seeds: { fiber: 10.5, vitaminA: 64, vitaminC: 7.7, folate: 10, calcium: 931, iron: 66.36, potassium: 1788, magnesium: 366 },
  garam_masala: { fiber: 18.0, vitaminA: 30, vitaminC: 4.0, folate: 15, calcium: 620, iron: 26.0, potassium: 1200, magnesium: 220 },
  coriander_powder: { fiber: 41.9, vitaminA: 0, vitaminC: 21.0, folate: 0, calcium: 709, iron: 16.32, potassium: 1267, magnesium: 330 },
  mustard_seeds: { fiber: 12.2, vitaminA: 3, vitaminC: 7.1, folate: 162, calcium: 266, iron: 9.21, potassium: 738, magnesium: 370 },
  black_pepper: { fiber: 25.3, vitaminA: 27, vitaminC: 0, folate: 17, calcium: 443, iron: 9.71, potassium: 1329, magnesium: 171 },
  chaat_masala: { fiber: 11.0, vitaminA: 20, vitaminC: 12.0, folate: 12, calcium: 310, iron: 12.0, potassium: 780, magnesium: 120 },
  whole_spices: { fiber: 28.0, vitaminA: 25, vitaminC: 6.0, folate: 18, calcium: 780, iron: 18.0, potassium: 950, magnesium: 180 },

  // Pantry
  oil: { fiber: 0, vitaminA: 0, vitaminC: 0, folate: 0, calcium: 0, iron: 0, potassium: 0, magnesium: 0 },
  salt: { fiber: 0, vitaminA: 0, vitaminC: 0, folate: 0, calcium: 24, iron: 0.33, potassium: 8, magnesium: 1 },
  water: { fiber: 0, vitaminA: 0, vitaminC: 0, folate: 0, calcium: 3, iron: 0, potassium: 0, magnesium: 1 },
  jaggery: { fiber: 0, vitaminA: 0, vitaminC: 0, folate: 0, calcium: 80, iron: 2.6, potassium: 105, magnesium: 70 },
  honey: { fiber: 0.2, vitaminA: 0, vitaminC: 0.5, folate: 2, calcium: 6, iron: 0.42, potassium: 52, magnesium: 2 },
  peanuts: { fiber: 8.5, vitaminA: 0, vitaminC: 0, folate: 240, calcium: 92, iron: 4.58, potassium: 705, magnesium: 168 },
  soy_sauce: { fiber: 0.8, vitaminA: 0, vitaminC: 0, folate: 14, calcium: 33, iron: 1.45, potassium: 435, magnesium: 74 },
  cashews: { fiber: 3.3, vitaminA: 0, vitaminC: 0.5, folate: 25, calcium: 37, iron: 6.68, potassium: 660, magnesium: 292 },
  almonds: { fiber: 12.5, vitaminA: 0, vitaminC: 0, folate: 44, calcium: 269, iron: 3.71, potassium: 733, magnesium: 270 },
  sesame_seeds: { fiber: 11.8, vitaminA: 0, vitaminC: 0, folate: 97, calcium: 975, iron: 14.55, potassium: 468, magnesium: 351 },
  raisins: { fiber: 3.7, vitaminA: 0, vitaminC: 2.3, folate: 5, calcium: 50, iron: 1.88, potassium: 749, magnesium: 32 },
  tamarind: { fiber: 5.1, vitaminA: 2, vitaminC: 3.5, folate: 14, calcium: 74, iron: 2.8, potassium: 628, magnesium: 92 },
  coconut_milk: { fiber: 2.2, vitaminA: 0, vitaminC: 2.8, folate: 16, calcium: 16, iron: 1.64, potassium: 263, magnesium: 37 },
  olive_oil: { fiber: 0, vitaminA: 0, vitaminC: 0, folate: 0, calcium: 1, iron: 0.56, potassium: 1, magnesium: 0 },
  mustard_oil: { fiber: 0, vitaminA: 0, vitaminC: 0, folate: 0, calcium: 0, iron: 0, potassium: 0, magnesium: 0 },
  ginger_garlic_paste: { fiber: 2.0, vitaminA: 0, vitaminC: 16.0, folate: 7, calcium: 88, iron: 1.1, potassium: 408, magnesium: 34 },
};

const CATEGORY_FALLBACK_NUTRIENTS: Record<IngredientCategory, NutrientProfilePer100g> = {
  vegetables: { fiber: 2.4, vitaminA: 75, vitaminC: 22, folate: 36, calcium: 32, iron: 0.7, potassium: 260, magnesium: 20 },
  fruits: { fiber: 2.6, vitaminA: 15, vitaminC: 32, folate: 18, calcium: 16, iron: 0.3, potassium: 210, magnesium: 14 },
  meat_fish: { fiber: 0, vitaminA: 14, vitaminC: 0, folate: 10, calcium: 18, iron: 0.9, potassium: 270, magnesium: 25 },
  eggs_dairy: { fiber: 0, vitaminA: 120, vitaminC: 0, folate: 12, calcium: 180, iron: 0.3, potassium: 130, magnesium: 14 },
  grains_pulses: { fiber: 8.5, vitaminA: 1, vitaminC: 0.5, folate: 180, calcium: 55, iron: 3.4, potassium: 480, magnesium: 95 },
  spices_herbs: { fiber: 20, vitaminA: 45, vitaminC: 6, folate: 22, calcium: 420, iron: 16, potassium: 1100, magnesium: 210 },
  pantry: { fiber: 1.5, vitaminA: 0, vitaminC: 0.5, folate: 12, calcium: 40, iron: 1.2, potassium: 180, magnesium: 35 },
};

const PIECE_GRAMS: Record<string, number> = {
  egg: 50,
  onion: 110,
  tomato: 100,
  potato: 150,
  green_chilli: 5,
  garlic: 3, // per clove when unit is 'cloves', handled cleanly below
  ginger: 15,
  carrot: 70,
  bell_pepper: 120,
  cucumber: 180,
  lemon: 55,
  banana: 118,
  apple: 180,
  pomegranate: 140,
  papaya: 250,
  mango: 200,
  orange: 130,
  guava: 110,
  pear: 170,
  kiwi: 75,
  bread: 30,
  pav: 50,
  roti_wrap: 45,
  curry_leaves: 0.25,
  coriander_leaves: 0.5,
  mint_leaves: 0.5,
  whole_spices: 3,
  dry_red_chilli: 2,
  bay_leaf: 0.5,
  cardamom: 0.4,
  cloves: 0.2,
};

const CUP_GRAMS_BY_ID: Record<string, number> = {
  milk: 240,
  yogurt: 240,
  water: 240,
  idli_batter: 240,
  soy_sauce: 250,
  coconut_milk: 240,
  buttermilk: 240,
  oil: 220,
  ghee: 220,
  butter: 227,
  honey: 340,
  wheat_flour: 120,
  besan: 100,
  semolina: 167,
  oats: 90,
  rice: 185,
  brown_rice: 185,
  poha: 95,
  toor_dal: 195,
  moong_dal: 195,
  rajma: 185,
  chickpeas: 180,
  roasted_chana: 145,
  moong_sprouts: 105,
  peanuts: 145,
  spinach: 45,
  coriander_leaves: 30,
  mint_leaves: 30,
  curry_leaves: 25,
  carrot: 125,
  green_peas: 145,
  broccoli: 90,
  cauliflower: 105,
  cabbage: 90,
  sweet_corn: 150,
  french_beans: 110,
  paneer: 150,
  cheese: 115,
};

/**
 * Estimate ingredient weight in grams from a recipe's amount + unit.
 */
export function estimateIngredientGrams(
  amount: number,
  unit: string,
  ingredientId: string
): number {
  if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
    return 0;
  }

  const u = (unit || '').trim().toLowerCase();

  if (u === 'g' || u === 'gram' || u === 'grams') return amount;
  if (u === 'kg' || u === 'kilogram' || u === 'kilograms') return amount * 1000;
  if (u === 'oz' || u === 'ounce' || u === 'ounces') return amount * 28.3495;
  if (u === 'lb' || u === 'lbs' || u === 'pound' || u === 'pounds') {
    return amount * 453.592;
  }
  if (u === 'ml' || u === 'milliliter' || u === 'millilitre') return amount;
  if (u === 'l' || u === 'litre' || u === 'liter' || u === 'litres' || u === 'liters') {
    return amount * 1000;
  }

  const ing = getIngredientById(ingredientId);
  const categoryDefaultCup =
    ing?.category === 'spices_herbs'
      ? 110
      : ing?.category === 'grains_pulses'
      ? 175
      : ing?.category === 'eggs_dairy'
      ? 210
      : ing?.category === 'vegetables'
      ? 115
      : 150;
  const gPerCup = CUP_GRAMS_BY_ID[ingredientId] ?? categoryDefaultCup;

  if (u === 'cup' || u === 'cups') return amount * gPerCup;
  if (u === 'tbsp' || u === 'tablespoon' || u === 'tablespoons') {
    return amount * (gPerCup / 16);
  }
  if (u === 'tsp' || u === 'teaspoon' || u === 'teaspoons') {
    return amount * (gPerCup / 48);
  }
  if (u === 'pinch') return amount * 0.5;
  if (u === 'clove' || u === 'cloves') {
    return amount * (ingredientId === 'garlic' ? 3 : 0.3);
  }
  if (u === 'leaf' || u === 'leaves') {
    return amount * (PIECE_GRAMS[ingredientId] ?? 0.35);
  }
  if (u === 'slice' || u === 'slices') {
    return amount * (PIECE_GRAMS[ingredientId] ?? 30);
  }
  if (u === 'pc' || u === 'pcs' || u === 'piece' || u === 'pieces') {
    if (ingredientId === 'garlic') return amount * 25;
    return amount * (PIECE_GRAMS[ingredientId] ?? 90);
  }

  return amount * (PIECE_GRAMS[ingredientId] ?? 50);
}

export function getIngredientNutrientProfile(
  ingredientId: string
): NutrientProfilePer100g {
  if (INGREDIENT_NUTRIENTS_PER_100G[ingredientId]) {
    return INGREDIENT_NUTRIENTS_PER_100G[ingredientId];
  }
  const ing = getIngredientById(ingredientId);
  const cat = ing?.category ?? 'vegetables';
  return CATEGORY_FALLBACK_NUTRIENTS[cat] ?? CATEGORY_FALLBACK_NUTRIENTS.vegetables;
}

export interface IngredientNutrientContribution {
  ingredientId: string;
  ingredientName: string;
  optional: boolean;
  estimatedGrams: number;
  amount: number;
  unit: string;
  nutrients: NutrientProfilePer100g;
}

export interface NutrientSummaryRow extends KeyNutrientSpec {
  totalAmount: number;
  pctDaily: number;
  contributors: {
    ingredientId: string;
    ingredientName: string;
    amount: number;
    sharePct: number;
    optional: boolean;
  }[];
}

export interface RecipeKeyNutrientsSummary {
  scope: 'perServing' | 'household';
  divisor: number;
  nutrients: NutrientSummaryRow[];
  highlights: {
    key: KeyNutrientKey;
    label: string;
    pctDaily: number;
    valueText: string;
    topSources: string[];
  }[];
  ingredientContributions: IngredientNutrientContribution[];
}

export function formatNutrientValue(value: number, unit: string): string {
  if (!Number.isFinite(value) || value <= 0) return `0 ${unit}`;
  if (value < 1) return `${Math.round(value * 10) / 10} ${unit}`;
  if (value < 20) return `${Math.round(value * 10) / 10} ${unit}`;
  return `${Math.round(value)} ${unit}`;
}

/**
 * Compute per-ingredient and recipe-level breakdown of key nutrients
 * (Dietary Fiber, Vitamins A/C/Folate, Minerals Calcium/Iron/Potassium/Magnesium).
 */
export function computeRecipeKeyNutrients(
  scaledIngredients: ScaledIngredient[],
  householdMultiplier: number,
  options: {
    scope?: 'perServing' | 'household';
    includeOptional?: boolean;
  } = {}
): RecipeKeyNutrientsSummary {
  const scope = options.scope ?? 'perServing';
  const includeOptional = options.includeOptional ?? true;
  const safeMult =
    typeof householdMultiplier === 'number' && householdMultiplier > 0
      ? householdMultiplier
      : 1;
  const divisor = scope === 'perServing' ? safeMult : 1;

  const filtered = (Array.isArray(scaledIngredients) ? scaledIngredients : []).filter(
    (item) => includeOptional || !item.optional
  );

  const ingredientContributions: IngredientNutrientContribution[] = filtered.map(
    (item) => {
      const catalog = getIngredientById(item.ingredientId);
      const ingredientName = catalog?.name ?? item.ingredientId;
      const estimatedGrams =
        estimateIngredientGrams(item.scaledAmount, item.unit, item.ingredientId) /
        divisor;
      const profile = getIngredientNutrientProfile(item.ingredientId);
      const factor = estimatedGrams / 100;

      const nutrients: NutrientProfilePer100g = {
        fiber: profile.fiber * factor,
        vitaminA: profile.vitaminA * factor,
        vitaminC: profile.vitaminC * factor,
        folate: profile.folate * factor,
        calcium: profile.calcium * factor,
        iron: profile.iron * factor,
        potassium: profile.potassium * factor,
        magnesium: profile.magnesium * factor,
      };

      return {
        ingredientId: item.ingredientId,
        ingredientName,
        optional: Boolean(item.optional),
        estimatedGrams,
        amount: item.scaledAmount / divisor,
        unit: item.unit,
        nutrients,
      };
    }
  );

  const targetMultiplier = scope === 'household' ? safeMult : 1;

  const nutrients: NutrientSummaryRow[] = KEY_NUTRIENT_SPECS.map((spec) => {
    const totalRaw = ingredientContributions.reduce(
      (sum, entry) => sum + entry.nutrients[spec.key],
      0
    );
    const totalAmount = Math.round(totalRaw * 10) / 10;
    const scaledTarget = spec.dailyTarget * targetMultiplier;
    const pctDaily =
      scaledTarget > 0 ? Math.round((totalRaw / scaledTarget) * 100) : 0;

    const contributors = ingredientContributions
      .map((entry) => {
        const amt = entry.nutrients[spec.key];
        const sharePct = totalRaw > 0 ? Math.round((amt / totalRaw) * 100) : 0;
        return {
          ingredientId: entry.ingredientId,
          ingredientName: entry.ingredientName,
          amount: Math.round(amt * 10) / 10,
          sharePct,
          optional: entry.optional,
        };
      })
      .filter((c) => c.amount > 0 && c.sharePct >= 1)
      .sort((a, b) => b.amount - a.amount);

    return {
      ...spec,
      totalAmount,
      pctDaily,
      contributors,
    };
  });

  const highlights = [...nutrients]
    .filter((n) => n.pctDaily >= 10)
    .sort((a, b) => b.pctDaily - a.pctDaily)
    .slice(0, 3)
    .map((n) => ({
      key: n.key,
      label: n.label,
      pctDaily: n.pctDaily,
      valueText: formatNutrientValue(n.totalAmount, n.unit),
      topSources: n.contributors.slice(0, 2).map((c) => c.ingredientName),
    }));

  return {
    scope,
    divisor,
    nutrients,
    highlights,
    ingredientContributions,
  };
}
