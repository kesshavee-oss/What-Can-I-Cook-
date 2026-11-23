// Pure ingredient substitution map & allergy/diet-safe lookup helpers.
import { getIngredientById } from './recipes.js';

/**
 * Curated kitchen substitutions (>= 45 swap entries) keyed by missing ingredientId.
 * Each swap entry has { ingredientId, note, ratioText }.
 */
export const SUBSTITUTIONS = {
  yogurt: [
    { ingredientId: 'hung_curd', note: 'Curd or hung curd thins with a splash of water for marinades or raita.', ratioText: '3/4 cup + 2 tbsp water per 1 cup yogurt' },
    { ingredientId: 'buttermilk', note: 'Use thinner buttermilk and reduce cooking water slightly.', ratioText: '1 cup per 1 cup yogurt' },
    { ingredientId: 'fresh_cream', note: 'Adds richness; finish with a squeeze of lemon for tang.', ratioText: '3/4 cup + 1 tsp lemon per 1 cup' },
    { ingredientId: 'coconut_milk', note: 'Dairy-free creamy swap with a squeeze of lemon juice.', ratioText: '1 cup per 1 cup yogurt' },
  ],
  hung_curd: [
    { ingredientId: 'yogurt', note: 'Drain regular curd through a clean cloth for 15 minutes.', ratioText: '1.25 cups yogurt per 1 cup hung curd' },
    { ingredientId: 'cream_cheese', note: 'Thick creamy texture for wraps and spreads.', ratioText: '1:1' },
    { ingredientId: 'paneer', note: 'Whisk soft crumbled paneer with a splash of milk.', ratioText: '1:1 by weight' },
  ],
  paneer: [
    { ingredientId: 'hung_curd', note: 'Chilled spiced hung curd works in wraps and tikka skewers.', ratioText: '1:1' },
    { ingredientId: 'cheese', note: 'Grated cheese adds mild dairy richness in bhurji or toasties.', ratioText: '3/4 cup per 1 cup paneer' },
    { ingredientId: 'mozzarella', note: 'Mild melty alternative for toasties or stir-ins.', ratioText: '3/4 amount' },
    { ingredientId: 'egg', note: 'Hard-boiled or scrambled eggs match the protein in bhurji or curry.', ratioText: '2 eggs per 100 g paneer' },
  ],
  jaggery: [
    { ingredientId: 'honey', note: 'Stir honey in off the heat to keep floral sweetness.', ratioText: '3/4 tbsp per 1 tbsp jaggery' },
    { ingredientId: 'dates', note: 'Finely chopped or pasted dates sweeten chutneys and porridges.', ratioText: '1:1' },
  ],
  honey: [
    { ingredientId: 'jaggery', note: 'Warm grated jaggery with a teaspoon of water until dissolved.', ratioText: '1:1' },
    { ingredientId: 'dates', note: 'Mashed dates add natural caramel sweetness.', ratioText: '1:1' },
  ],
  ghee: [
    { ingredientId: 'butter', note: 'Salted or unsalted butter gives similar rich aroma.', ratioText: '1:1' },
    { ingredientId: 'oil', note: 'Neutral cooking oil keeps sautéing light.', ratioText: '1:1' },
    { ingredientId: 'olive_oil', note: 'Mild olive oil works well for parathas and veg sauté.', ratioText: '1:1' },
  ],
  butter: [
    { ingredientId: 'ghee', note: 'Ghee resists high heat better and adds nutty depth.', ratioText: '3/4 tbsp ghee per 1 tbsp butter' },
    { ingredientId: 'olive_oil', note: 'Light dairy-free fat for pan-searing and sautéing.', ratioText: '3/4 amount' },
    { ingredientId: 'oil', note: 'Standard neutral oil works cleanly in batters and tadka.', ratioText: '3/4 amount' },
  ],
  lemon: [
    { ingredientId: 'tamarind', note: 'Diluted tamarind pulp brings tangy sourness to rice & curries.', ratioText: '1 tbsp pulp per 1 lemon' },
    { ingredientId: 'amchur', note: 'Dried mango powder gives sharp dry tang in chaat & sabzi.', ratioText: '1 tsp amchur per 1 tbsp juice' },
    { ingredientId: 'vinegar', note: 'Neutral sharp acidity for wok tosses and marinades.', ratioText: '1/2 tbsp per 1 tbsp lemon juice' },
  ],
  tamarind: [
    { ingredientId: 'lemon', note: 'Fresh lemon juice brightens dals, sambar, and chaat.', ratioText: '1 tbsp juice per 1 tbsp tamarind' },
    { ingredientId: 'amchur', note: 'Stir amchur in toward the end of cooking for tang.', ratioText: '1 tsp per 1 tbsp tamarind pulp' },
  ],
  fresh_cream: [
    { ingredientId: 'milk', note: 'Simmer milk slightly longer for curry body.', ratioText: '1 cup milk per 3/4 cup cream' },
    { ingredientId: 'yogurt', note: 'Whisk smooth curd off low heat to avoid splitting.', ratioText: '1:1' },
    { ingredientId: 'cashews', note: 'Soak and blend cashews with warm water into cream.', ratioText: '1/4 cup cashews per 1/2 cup cream' },
    { ingredientId: 'coconut_milk', note: 'Rich dairy-free finish for coastal or spiced gravies.', ratioText: '1:1' },
  ],
  coconut_milk: [
    { ingredientId: 'fresh_cream', note: 'Use cream diluted with a little water for smooth gravy.', ratioText: '1/2 cup cream + 1/2 cup water per 1 cup' },
    { ingredientId: 'milk', note: 'Pair whole milk with grated fresh coconut if available.', ratioText: '1:1' },
    { ingredientId: 'cashews', note: 'Blended cashew paste thickens curries with gentle sweetness.', ratioText: '1/3 cup cashews blended with 1 cup water' },
  ],
  milk: [
    { ingredientId: 'coconut_milk', note: 'Dairy-free option for porridge and creamy curries.', ratioText: '1:1' },
    { ingredientId: 'buttermilk', note: 'Works well in batters like chilla or soft dough.', ratioText: '1:1' },
    { ingredientId: 'yogurt', note: 'Whisk 1 part yogurt with 1 part water as quick milk swap.', ratioText: '1/2 cup yogurt + 1/2 cup water' },
  ],
  green_chilli: [
    { ingredientId: 'red_chilli_powder', note: 'Adjust heat gently since chilli powder concentrates quickly.', ratioText: '1/4 tsp per 1 green chilli' },
    { ingredientId: 'black_pepper', note: 'Warm aromatic heat when avoiding chillies.', ratioText: '1/2 tsp crushed per 1 green chilli' },
    { ingredientId: 'kashmiri_chilli', note: 'Mild fruity heat and bright red color.', ratioText: '1/2 tsp per 1 green chilli' },
  ],
  coriander_leaves: [
    { ingredientId: 'mint_leaves', note: 'Chopped fresh mint gives cooling herbal brightness.', ratioText: '3/4 amount' },
    { ingredientId: 'curry_leaves', note: 'Tempered curry leaves replace fresh herb aroma in rice/tadka.', ratioText: '6–8 leaves per 2 tbsp coriander' },
    { ingredientId: 'kasuri_methi', note: 'Crush dried fenugreek leaves between palms at the end.', ratioText: '1 tsp dried per 2 tbsp fresh coriander' },
  ],
  mint_leaves: [
    { ingredientId: 'coriander_leaves', note: 'Fresh coriander replaces leafy brightness in chaats & raita.', ratioText: '1:1' },
    { ingredientId: 'basil_herb', note: 'Sweet herbal finish for salads and wraps.', ratioText: '3/4 amount' },
  ],
  spinach: [
    { ingredientId: 'fenugreek_leaves', note: 'Slightly earthy methi greens work similarly in parathas & dal.', ratioText: '3/4 amount' },
    { ingredientId: 'green_peas', note: 'Adds sweet green bites to eggs, pulao, and curries.', ratioText: '1/2 cup per 1 cup spinach' },
  ],
  ginger_garlic_paste: [
    { ingredientId: 'garlic', note: 'Finely mince fresh garlic; pair with ginger if on hand.', ratioText: '3 cloves per 1 tbsp paste' },
    { ingredientId: 'ginger', note: 'Grated fresh ginger lifts curries cleanly when garlic is out.', ratioText: '1 inch piece per 1 tbsp paste' },
  ],
  rice: [
    { ingredientId: 'brown_rice', note: 'Increase cooking water by 1/2 cup and simmer 15 min longer.', ratioText: '1:1' },
    { ingredientId: 'quinoa', note: 'Cooks in 15 minutes with high protein for pulao or bowls.', ratioText: '1:1' },
    { ingredientId: 'poha', note: 'Quick stovetop swap for light spiced lunch bowls.', ratioText: '1:1' },
  ],
  brown_rice: [
    { ingredientId: 'rice', note: 'White rice cooks faster with 20% less water.', ratioText: '1:1' },
    { ingredientId: 'quinoa', note: 'Nutty high-fiber grain bowl base.', ratioText: '1:1' },
  ],
  toor_dal: [
    { ingredientId: 'moong_dal', note: 'Yellow moong dal cooks faster and stays light on digestion.', ratioText: '1:1' },
    { ingredientId: 'masoor_dal', note: 'Red lentils turn creamy in 12–15 minutes.', ratioText: '1:1' },
    { ingredientId: 'chana_dal', note: 'Soak chana dal 30 minutes first for a richer texture.', ratioText: '1:1' },
  ],
  moong_dal: [
    { ingredientId: 'masoor_dal', note: 'Simmers into soft dal quickly without long soaking.', ratioText: '1:1' },
    { ingredientId: 'toor_dal', note: 'Needs 1–2 extra whistles in a pressure cooker.', ratioText: '1:1' },
  ],
  besan: [
    { ingredientId: 'wheat_flour', note: 'Whole wheat flour binds cutlets and makes quick chilla.', ratioText: '1:1' },
    { ingredientId: 'oats', note: 'Grind rolled oats into flour for savory pancakes.', ratioText: '1:1' },
    { ingredientId: 'semolina', note: 'Crisp binding coat for cutlets and tikkis.', ratioText: '3/4 amount' },
  ],
  pav: [
    { ingredientId: 'bread', note: 'Toast bread slices with a brush of butter.', ratioText: '2 slices per 2 pav' },
    { ingredientId: 'roti_wrap', note: 'Serve keema or bhaji rolled inside warm chapati.', ratioText: '1 wrap per 2 pav' },
  ],
  bread: [
    { ingredientId: 'roti_wrap', note: 'Roll fillings into a toasted roti for quick kathi wraps.', ratioText: '1 wrap per 2 slices' },
    { ingredientId: 'pav', note: 'Slice and toast halved pav buns.', ratioText: '1 pav per 2 slices' },
  ],
  roti_wrap: [
    { ingredientId: 'bread', note: 'Folded or toasted sandwich alternative.', ratioText: '2 slices per 1 wrap' },
    { ingredientId: 'wheat_flour', note: 'Knead quick 10-minute dough for fresh phulkas.', ratioText: '35 g flour per roti' },
  ],
  peanuts: [
    { ingredientId: 'cashews', note: 'Lightly toast broken cashews for poha or chaat crunch.', ratioText: '1:1' },
    { ingredientId: 'almonds', note: 'Slivered toasted almonds add wholesome crunch.', ratioText: '1:1' },
    { ingredientId: 'sesame_seeds', note: 'Toasted sesame gives nutty crunch to chikki & stir-fries.', ratioText: '3/4 amount' },
  ],
  cashews: [
    { ingredientId: 'almonds', note: 'Blanch and peel almonds for creamy gravies or garnish.', ratioText: '1:1' },
    { ingredientId: 'peanuts', note: 'Dry-roasted skinless peanuts work in chutneys & garnish.', ratioText: '1:1' },
  ],
  chicken_breast: [
    { ingredientId: 'chicken_curry_cut', note: 'Use boneless pieces or adjust simmer time by 5 minutes.', ratioText: '1:1 by weight' },
    { ingredientId: 'chicken_keema', note: 'Great for quick spiced stir-fries and fillings.', ratioText: '1:1 by weight' },
    { ingredientId: 'paneer', note: 'Vegetarian protein swap for curries and tikkas.', ratioText: '1:1 by weight' },
  ],
  chicken_curry_cut: [
    { ingredientId: 'chicken_breast', note: 'Simmer slightly shorter so boneless cuts stay tender.', ratioText: '85% weight boneless' },
    { ingredientId: 'chicken_drumsticks', note: 'Bone-in thighs and drumsticks stay juicy in curry.', ratioText: '1:1 by weight' },
  ],
  fish_fillet: [
    { ingredientId: 'rohu_fish', note: 'Simmer gently 6–8 minutes in coastal curry.', ratioText: '1:1 by weight' },
    { ingredientId: 'pomfret', note: 'Mild white fish steaks pan-sear cleanly.', ratioText: '1:1 by weight' },
    { ingredientId: 'prawns', note: 'Reduce cook time to 4 minutes.', ratioText: '1:1 by weight' },
  ],
  prawns: [
    { ingredientId: 'fish_fillet', note: 'Cut firm white fish into bite-size cubes.', ratioText: '1:1 by weight' },
    { ingredientId: 'paneer', note: 'Crisp seared paneer works in spiced masala.', ratioText: '1:1 by weight' },
  ],
  broccoli: [
    { ingredientId: 'cauliflower', note: 'Similar roasting and sautéing bite in stir-fries.', ratioText: '1:1' },
    { ingredientId: 'french_beans', note: 'Crisp green crunch in quick wok dishes.', ratioText: '1:1' },
  ],
  cauliflower: [
    { ingredientId: 'potato', note: 'Dice small so it cooks evenly with spices.', ratioText: '1:1' },
    { ingredientId: 'broccoli', note: 'Shorter sauté time keeps florets bright green.', ratioText: '1:1' },
  ],
  bell_pepper: [
    { ingredientId: 'carrot', note: 'Julienne thinly for colorful crunch in fried rice & wraps.', ratioText: '1:1' },
    { ingredientId: 'cabbage', note: 'Shredded cabbage gives fast wok crunch.', ratioText: '1:1' },
  ],
  tomato: [
    { ingredientId: 'yogurt', note: 'Whisk yogurt into the spice base for tangy curry body.', ratioText: '3 tbsp per 1 tomato' },
    { ingredientId: 'tamarind', note: 'Use a splash of tamarind water for sour depth.', ratioText: '1 tsp pulp per 1 tomato' },
  ],
  cumin_seeds: [
    { ingredientId: 'mustard_seeds', note: 'Crackled mustard seeds bring nutty tadka warmth.', ratioText: '1:1' },
    { ingredientId: 'cumin_powder', note: 'Add ground cumin after onions to avoid scorching.', ratioText: '3/4 tsp per 1 tsp seeds' },
    { ingredientId: 'carom_seeds', note: 'Ajwain gives savory warmth in parathas and chilla.', ratioText: '1/2 tsp per 1 tsp cumin' },
  ],
  chaat_masala: [
    { ingredientId: 'amchur', note: 'Combine dry mango powder with a pinch of black pepper & cumin.', ratioText: '1:1' },
    { ingredientId: 'lemon', note: 'Finish chaats with fresh lemon and a pinch of roasted cumin.', ratioText: '1 tsp juice per 1/2 tsp' },
  ],
  mustard_oil: [
    { ingredientId: 'oil', note: 'Neutral oil works for everyday sautéing.', ratioText: '1:1' },
    { ingredientId: 'ghee', note: 'Adds rich aroma for North Indian curries.', ratioText: '1:1' },
  ],
  olive_oil: [
    { ingredientId: 'oil', note: 'Neutral cooking oil works for all skillet recipes.', ratioText: '1:1' },
    { ingredientId: 'butter', note: 'Adds rich flavor when pan-searing.', ratioText: '1:1' },
  ],
  soy_sauce: [
    { ingredientId: 'vinegar', note: 'Mix vinegar with a pinch of jaggery & salt for wok tang.', ratioText: '1/2 tbsp + pinch jaggery per 1 tbsp' },
  ],
};

/**
 * Count total swap options defined across the catalog.
 * @returns {number}
 */
export function getTotalSubstitutionCount() {
  let count = 0;
  for (const list of Object.values(SUBSTITUTIONS)) {
    if (Array.isArray(list)) count += list.length;
  }
  return count;
}

/**
 * Look up valid owned substitutes for a missing ingredient, enforcing diet & allergy rules:
 * - Veg recipes (or veg household diet) never suggest non-veg/meat swaps.
 * - Allergy filters hide any swap ingredient that contains a filtered allergen.
 * - Only returns swaps whose ingredientId is present in `selectedIds` (what user already has).
 *
 * @param {string} ingredientId
 * @param {{ adults?: number, children?: Array<{ ageGroup: string }> } | null} _household
 * @param {string[]} selectedIds
 * @param {{ diet?: "veg" | "nonveg", recipeDiet?: "veg" | "nonveg", allergies?: string[] }} [filters]
 * @returns {Array<{ ingredientId: string, name: string, note: string, ratioText: string }>}
 */
export function getSubstitutesFor(ingredientId, _household, selectedIds = [], filters = {}) {
  if (typeof ingredientId !== 'string' || !ingredientId.trim()) {
    return [];
  }

  const rawSwaps = SUBSTITUTIONS[ingredientId.trim()];
  if (!Array.isArray(rawSwaps) || rawSwaps.length === 0) {
    return [];
  }

  const ownedSet = new Set(Array.isArray(selectedIds) ? selectedIds : []);
  const allergySet = new Set(Array.isArray(filters?.allergies) ? filters.allergies : []);
  const isVegOnly = filters?.recipeDiet === 'veg' || filters?.diet === 'veg';

  const valid = [];
  for (const entry of rawSwaps) {
    if (!entry || !entry.ingredientId || entry.ingredientId === ingredientId) continue;
    if (!ownedSet.has(entry.ingredientId)) continue;

    const catalog = getIngredientById(entry.ingredientId);
    if (!catalog) continue;

    // Veg recipe/diet never suggests a non-veg meat/fish swap
    if (isVegOnly && !catalog.isVeg) continue;

    // Allergy filter hides swaps containing that allergen
    if (
      Array.isArray(catalog.allergens) &&
      catalog.allergens.some((a) => allergySet.has(a))
    ) {
      continue;
    }

    valid.push({
      ingredientId: entry.ingredientId,
      name: catalog.name,
      note: entry.note,
      ratioText: entry.ratioText,
    });
  }

  return valid;
}

// Self-tests
(function runSelfTests() {
  const totalSwaps = getTotalSubstitutionCount();
  console.assert(
    totalSwaps >= 40,
    `Expected at least 40 substitution entries, got ${totalSwaps}`
  );

  // 1. Veg recipe never suggests a meat swap even if user owns chicken
  const vegPaneerSwaps = getSubstitutesFor(
    'chicken_breast',
    { adults: 2, children: [] },
    ['chicken_curry_cut', 'paneer'],
    { diet: 'veg', recipeDiet: 'veg', allergies: [] }
  );
  console.assert(
    vegPaneerSwaps.length === 1 && vegPaneerSwaps[0].ingredientId === 'paneer',
    `Expected only veg swap "paneer", got ${JSON.stringify(vegPaneerSwaps)}`
  );

  // 2. Dairy allergy hides dairy swaps while keeping dairy-free swaps
  const dairyAllergyCreamSwaps = getSubstitutesFor(
    'fresh_cream',
    { adults: 2, children: [] },
    ['milk', 'yogurt', 'coconut_milk', 'cashews'],
    { diet: 'veg', allergies: ['dairy'] }
  );
  const dairyIds = dairyAllergyCreamSwaps.map((s) => s.ingredientId);
  console.assert(
    !dairyIds.includes('milk') &&
      !dairyIds.includes('yogurt') &&
      dairyIds.includes('coconut_milk') &&
      dairyIds.includes('cashews'),
    `Expected dairy swaps filtered out for dairy allergy, got ${dairyIds.join(',')}`
  );

  // 3. Returns only swaps present in selectedIds
  const yogurtSwaps = getSubstitutesFor(
    'yogurt',
    { adults: 1, children: [] },
    ['buttermilk'],
    { diet: 'veg', allergies: [] }
  );
  console.assert(
    yogurtSwaps.length === 1 && yogurtSwaps[0].ingredientId === 'buttermilk',
    `Expected only owned swap "buttermilk", got ${JSON.stringify(yogurtSwaps)}`
  );

  // 4. Every swap ingredientId references a valid catalog ingredient
  for (const [sourceId, entries] of Object.entries(SUBSTITUTIONS)) {
    console.assert(
      Boolean(getIngredientById(sourceId)),
      `Invalid source ingredientId "${sourceId}" in SUBSTITUTIONS`
    );
    for (const entry of entries) {
      console.assert(
        Boolean(getIngredientById(entry.ingredientId)) &&
          typeof entry.note === 'string' &&
          entry.note.length > 0 &&
          typeof entry.ratioText === 'string' &&
          entry.ratioText.length > 0,
        `Invalid swap entry under "${sourceId}": ${JSON.stringify(entry)}`
      );
    }
  }
})();
