import { getIngredientById } from '../recipes.js';

export type IngredientUnitSystem =
  | 'household'
  | 'metric'
  | 'imperial'
  | 'grams'
  | 'ounces';

export interface UnitSystemOption {
  id: 'household' | 'metric' | 'imperial';
  label: string;
}

export const UNIT_SYSTEM_OPTIONS: UnitSystemOption[] = [
  { id: 'household', label: 'Cups / tbsp' },
  { id: 'metric', label: 'Metric (g / ml)' },
  { id: 'imperial', label: 'Imperial (oz / fl oz)' },
];

export interface ConvertedMeasure {
  amount: number;
  unit: string;
  converted: boolean;
}

const GRAMS_PER_OZ = 28.3495;
const GRAMS_PER_LB = 453.592;
const ML_PER_FL_OZ = 29.5735;
const ML_PER_CUP = 240;

const LIQUID_IDS = new Set([
  'milk',
  'yogurt',
  'buttermilk',
  'water',
  'idli_batter',
  'soy_sauce',
  'vinegar',
  'coconut_milk',
  'tomato_ketchup',
  'condensed_milk',
  'oil',
  'olive_oil',
  'mustard_oil',
  'ghee',
  'honey',
]);

const OIL_FAT_IDS = new Set([
  'oil',
  'olive_oil',
  'mustard_oil',
  'ghee',
  'butter',
  'honey',
]);

const FLOUR_IDS = new Set(['wheat_flour', 'besan', 'semolina', 'oats']);

const GRAIN_PULSE_IDS = new Set([
  'rice',
  'brown_rice',
  'quinoa',
  'poha',
  'toor_dal',
  'moong_dal',
  'urad_dal',
  'masoor_dal',
  'chana_dal',
  'black_chana',
  'rajma',
  'chickpeas',
  'roasted_chana',
  'moong_sprouts',
  'peanuts',
]);

const LEAFY_HERB_IDS = new Set([
  'coriander_leaves',
  'mint_leaves',
  'spinach',
  'curry_leaves',
  'fenugreek_leaves',
]);

/**
 * Estimate culinary grams per 1 US/metric cup (240 ml) based on ingredient type.
 */
function getGramsPerCup(ingredientId: string): number {
  if (LIQUID_IDS.has(ingredientId)) return 240;
  if (OIL_FAT_IDS.has(ingredientId)) return 220;
  if (FLOUR_IDS.has(ingredientId)) return 120;
  if (GRAIN_PULSE_IDS.has(ingredientId)) return 185;
  if (LEAFY_HERB_IDS.has(ingredientId)) return 60;
  if (ingredientId === 'salt') return 288;

  const ing = getIngredientById(ingredientId);
  if (ing?.category === 'spices_herbs') return 144;
  if (ing?.category === 'grains_pulses') return 170;
  if (ing?.category === 'eggs_dairy') return 200;
  return 150;
}

function getGramsPerTbsp(ingredientId: string): number {
  return getGramsPerCup(ingredientId) / 16;
}

function getGramsPerTsp(ingredientId: string): number {
  return getGramsPerCup(ingredientId) / 48;
}

function normalizeUnit(unit: string): string {
  return (unit || '').trim().toLowerCase();
}

function isVolumeUnit(normUnit: string): boolean {
  return (
    normUnit === 'ml' ||
    normUnit === 'milliliter' ||
    normUnit === 'millilitre' ||
    normUnit === 'l' ||
    normUnit === 'litre' ||
    normUnit === 'liter' ||
    normUnit === 'litres' ||
    normUnit === 'liters' ||
    normUnit === 'fl oz' ||
    normUnit === 'fl_oz' ||
    normUnit === 'cup' ||
    normUnit === 'cups' ||
    normUnit === 'tbsp' ||
    normUnit === 'tablespoon' ||
    normUnit === 'tablespoons' ||
    normUnit === 'tsp' ||
    normUnit === 'teaspoon' ||
    normUnit === 'teaspoons'
  );
}

function isConvertibleUnit(unit: string): boolean {
  const u = normalizeUnit(unit);
  return (
    u === 'g' ||
    u === 'gram' ||
    u === 'grams' ||
    u === 'kg' ||
    u === 'kilogram' ||
    u === 'kilograms' ||
    u === 'oz' ||
    u === 'ounce' ||
    u === 'ounces' ||
    u === 'lb' ||
    u === 'lbs' ||
    u === 'pound' ||
    u === 'pounds' ||
    isVolumeUnit(u)
  );
}

function toMilliliters(amount: number, unit: string): number | null {
  const u = normalizeUnit(unit);
  if (u === 'ml' || u === 'milliliter' || u === 'millilitre') return amount;
  if (u === 'l' || u === 'litre' || u === 'liter' || u === 'litres' || u === 'liters') {
    return amount * 1000;
  }
  if (u === 'fl oz' || u === 'fl_oz') return amount * ML_PER_FL_OZ;
  if (u === 'cup' || u === 'cups') return amount * ML_PER_CUP;
  if (u === 'tbsp' || u === 'tablespoon' || u === 'tablespoons') {
    return amount * (ML_PER_CUP / 16);
  }
  if (u === 'tsp' || u === 'teaspoon' || u === 'teaspoons') {
    return amount * (ML_PER_CUP / 48);
  }
  return null;
}

function toGrams(
  amount: number,
  unit: string,
  ingredientId: string
): number | null {
  const u = normalizeUnit(unit);
  if (u === 'g' || u === 'gram' || u === 'grams') return amount;
  if (u === 'kg' || u === 'kilogram' || u === 'kilograms') return amount * 1000;
  if (u === 'oz' || u === 'ounce' || u === 'ounces') return amount * GRAMS_PER_OZ;
  if (u === 'lb' || u === 'lbs' || u === 'pound' || u === 'pounds') {
    return amount * GRAMS_PER_LB;
  }
  if (u === 'ml' || u === 'milliliter' || u === 'millilitre') return amount;
  if (u === 'l' || u === 'litre' || u === 'liter' || u === 'litres' || u === 'liters') {
    return amount * 1000;
  }
  if (u === 'fl oz' || u === 'fl_oz') return amount * ML_PER_FL_OZ;
  if (u === 'cup' || u === 'cups') return amount * getGramsPerCup(ingredientId);
  if (u === 'tbsp' || u === 'tablespoon' || u === 'tablespoons') {
    return amount * getGramsPerTbsp(ingredientId);
  }
  if (u === 'tsp' || u === 'teaspoon' || u === 'teaspoons') {
    return amount * getGramsPerTsp(ingredientId);
  }
  return null;
}

function roundGramsOrMl(value: number): number {
  if (value <= 0) return 0;
  if (value < 1) return Math.round(value * 100) / 100;
  if (value < 10) return Math.round(value * 10) / 10;
  return Math.round(value);
}

function roundImperialSmall(value: number): number {
  if (value <= 0) return 0;
  if (value < 0.2) return Math.round(value * 100) / 100;
  return Math.round(value * 10) / 10;
}

function roundQuarterStep(val: number): number {
  if (val <= 0) return 0;
  if (val < 0.25) return Math.round(val * 100) / 100;
  return Math.round(val * 4) / 4;
}

function roundHalfStep(val: number): number {
  if (val <= 0) return 0;
  if (val < 0.5) return Math.round(val * 4) / 4;
  return Math.round(val * 2) / 2;
}

/**
 * Convert an ingredient quantity & unit between Household (cups/tbsp),
 * Metric (g/kg/ml/L), and Imperial (oz/lb/fl oz).
 * Non-convertible count units (pcs, slices, cloves, leaves) remain unchanged.
 */
export function convertIngredientMeasure(
  amount: number,
  unit: string,
  ingredientId: string,
  targetSystem: IngredientUnitSystem
): ConvertedMeasure {
  if (
    typeof amount !== 'number' ||
    Number.isNaN(amount) ||
    amount <= 0 ||
    !isConvertibleUnit(unit)
  ) {
    return { amount, unit, converted: false };
  }

  const norm = normalizeUnit(unit);
  const isLiquidVolume = LIQUID_IDS.has(ingredientId) && isVolumeUnit(norm);

  if (targetSystem === 'household') {
    if (
      norm === 'cup' ||
      norm === 'cups' ||
      norm === 'tbsp' ||
      norm === 'tablespoon' ||
      norm === 'tablespoons' ||
      norm === 'tsp' ||
      norm === 'teaspoon' ||
      norm === 'teaspoons'
    ) {
      return { amount, unit, converted: false };
    }

    const grams = toGrams(amount, unit, ingredientId);
    if (grams === null) return { amount, unit, converted: false };

    const gPerCup = getGramsPerCup(ingredientId);
    const gPerTbsp = getGramsPerTbsp(ingredientId);
    const gPerTsp = getGramsPerTsp(ingredientId);

    const cups = grams / gPerCup;
    if (cups >= 0.25) {
      const roundedCups = roundQuarterStep(cups);
      return {
        amount: roundedCups,
        unit: roundedCups === 1 ? 'cup' : 'cups',
        converted: true,
      };
    }

    const tbsps = grams / gPerTbsp;
    if (tbsps >= 0.75) {
      return {
        amount: roundHalfStep(tbsps),
        unit: 'tbsp',
        converted: true,
      };
    }

    const tsps = Math.max(0.125, grams / gPerTsp);
    return {
      amount: roundQuarterStep(tsps),
      unit: 'tsp',
      converted: true,
    };
  }

  // Metric (g / kg for solids, ml / L for liquid volumes) or legacy 'grams'
  if (targetSystem === 'metric' || targetSystem === 'grams') {
    if (targetSystem === 'metric' && isLiquidVolume) {
      const ml = toMilliliters(amount, unit);
      if (ml !== null) {
        if (ml >= 1000) {
          const liters = Math.round((ml / 1000) * 100) / 100;
          return {
            amount: liters,
            unit: 'L',
            converted: norm !== 'l' && norm !== 'liter' && norm !== 'litre',
          };
        }
        return {
          amount: roundGramsOrMl(ml),
          unit: 'ml',
          converted: norm !== 'ml' && norm !== 'milliliter' && norm !== 'millilitre',
        };
      }
    }

    const grams = toGrams(amount, unit, ingredientId);
    if (grams === null) return { amount, unit, converted: false };

    if (targetSystem === 'metric' && grams >= 1000) {
      const kg = Math.round((grams / 1000) * 100) / 100;
      return {
        amount: kg,
        unit: 'kg',
        converted: norm !== 'kg' && norm !== 'kilogram' && norm !== 'kilograms',
      };
    }

    return {
      amount: roundGramsOrMl(grams),
      unit: 'g',
      converted: norm !== 'g' && norm !== 'gram' && norm !== 'grams',
    };
  }

  // Imperial (oz / lb for solids, fl oz for liquid volumes) or legacy 'ounces'
  if (targetSystem === 'imperial' && isLiquidVolume) {
    const ml = toMilliliters(amount, unit);
    if (ml !== null) {
      const flOz = ml / ML_PER_FL_OZ;
      return {
        amount: roundImperialSmall(flOz),
        unit: 'fl oz',
        converted: norm !== 'fl oz' && norm !== 'fl_oz',
      };
    }
  }

  const grams = toGrams(amount, unit, ingredientId);
  if (grams === null) return { amount, unit, converted: false };

  const oz = grams / GRAMS_PER_OZ;
  if (targetSystem === 'imperial' && oz >= 16) {
    const lb = Math.round((oz / 16) * 100) / 100;
    return {
      amount: lb,
      unit: 'lb',
      converted: norm !== 'lb' && norm !== 'lbs' && norm !== 'pound' && norm !== 'pounds',
    };
  }

  return {
    amount: roundImperialSmall(oz),
    unit: 'oz',
    converted: norm !== 'oz' && norm !== 'ounce' && norm !== 'ounces',
  };
}
