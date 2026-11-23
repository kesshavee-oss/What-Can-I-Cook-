# What Can I Cook?

**What Can I Cook?** helps households decide what to cook using ingredients already in the kitchen, plan the week ahead, collect missing groceries, and track cooked meals on a local kitchen calendar.

## App Tabs & Features

1. **Cook**:
   - **Household Portion Scaling**: Configure adults and children (`Toddler (1-3)`, `Child (4-12)`, `Teen (13-18)`) so recipe ingredient quantities and household nutrition totals scale automatically.
   - **4-Step Flow**: Choose Vegetarian (eggs allowed) or Non-vegetarian, pick Breakfast / Lunch / Snacks / Dinner, check off ingredients with alias search (e.g. `pyaz`, `aloo`, `palak`) and pantry presets, and inspect ranked matches (`>= 50%` required ingredients).
   - **Interactive Cooking View**: Scaled ingredients, built-in step timers with Web Audio chime and optional notifications, per-adult and household estimated nutrition breakdown, favorites toggle, grocery additions, and one-tap **I cooked this** logging.
2. **Plan**:
   - Weekly Monday–Sunday planner across Breakfast, Lunch, Snacks, and Dinner (up to 3 recipes per slot).
   - Copy meals from the previous week, add all missing ingredients for the week's pending meals to the Grocery List, respond to past-due **"Did you cook this?"** reminders, or launch **Cook now** directly into the recipe.
3. **Calendar**:
   - Month, Week, and Day views in your local timezone with veg/non-veg indicators, filters, period summary stats, and full edit/delete history management.
4. **Grocery**:
   - Missing ingredients grouped by kitchen category (`Vegetables`, `Fruits`, `Meat & Fish`, `Eggs & Dairy`, `Grains & Pulses`, `Spices & Herbs`, `Pantry`), merged by ingredient and scaled quantities across recipes, with check-off, copy plain text, print, and clear controls.
5. **Profile**:
   - Household configuration, default diet preference, allergy exclusions, saved favorites, local storage privacy overview, and full JSON export/import backup and device reset.

## Local Data Storage

All data stays strictly in your browser's `localStorage` (nothing is sent to a server):

- **Household**: `wcc_household_v1`
- **Default Diet**: `wcc_default_diet_v1`
- **Allergies**: `wcc_allergies_v1`
- **Favorites**: `wcc_favorite_recipe_ids_v1`
- **Cooked Meals (Calendar)**: `wcc_cooked_meals_v1`
- **Cook Flow Selection**: `wcc_cook_selection_v1`
- **Grocery List**: `wcc_grocery_list_v1`
- **Meal Plan**: `wcc_planned_meals_v1`
- **Saved AI Recipes (max 30)**: `wcic_ai_recipes`
- **Ingredient Price Overrides (INR paise)**: `wcic_prices`
- **Display & Budget Settings**: `wcic_settings`

You can export all data slices (including your grocery list, meal plan, saved AI recipes, and custom ingredient prices) via **Profile -> Export JSON** and restore them on another device via **Import JSON**.

## How to Run Locally

```bash
npm install
npm run dev
```

The app runs on `http://localhost:3000`.

### Production Build & Start

```bash
npm run lint
npm run build
npm start
```

### Run Data & Helper Self-Tests

```bash
node src/recipes.js
node src/utils/aiRecipes.js
node src/utils/budgetUtils.js
node src/utils/calendarHelpers.js
node src/utils/groceryUtils.js
node src/utils/planUtils.js
node src/utils/profileBackup.js
node src/utils/recipeSearch.js
node src/utils/visualUtils.js
```

## Customizing the Recipe List (`src/recipes.js`)

All ingredients (`INGREDIENTS`) and recipes (`RECIPES`) live in `src/recipes.js` with zero external database dependencies.

To add a recipe, append an object to `RECIPES` following this schema:

```js
{
  id: "unique_snake_case_id",
  name: "Recipe Title",
  mealTypes: ["lunch", "dinner"], // breakfast | lunch | snacks | dinner
  diet: "veg",                    // "veg" or "nonveg"
  allergens: [],                  // subset of: "dairy" | "gluten" | "nut" | "soy" | "egg"
  cuisine: "Indian",
  difficulty: "easy",             // "easy" | "medium" | "hard"
  prepMinutes: 10,
  cookMinutes: 15,
  baseServings: 2,
  ingredients: [
    { ingredientId: "onion", amount: 1, unit: "pcs", optional: false }
  ],
  steps: [
    { text: "Cook onions until golden.", timerSeconds: 240 } // or null
  ],
  nutritionPerServing: {
    calories: 280, protein: 10, calcium: 60, iron: 2.2,
    vitaminC: 12, fiber: 4, fat: 9, carbs: 38
  },
  tags: ["quick"]
}
```

Every `ingredientId` must match an entry in `INGREDIENTS`. Run `node src/recipes.js` after editing to verify all `console.assert` integrity checks pass.

## Adding a New Allergen

1. Add the allergen key to `AllergyKey` in `src/types/cook.ts` and `VALID_ALLERGIES` in `src/utils/storage.ts` and `src/utils/profileBackup.js`.
2. Tag relevant ingredients in `INGREDIENTS` (`allergens: ["new_key"]`) and corresponding recipes in `RECIPES` inside `src/recipes.js`.
3. Add a toggle entry to `ALLERGY_ITEMS` in `src/components/profile/AllergyCard.tsx`. Filtering in `getRecipesForFilters()` and the Meal Plan recipe picker will automatically enforce the new key.

## Nutrition & Allergy Disclaimer

All nutrition values displayed in the app are **estimated values for meal planning purposes only and do not constitute medical or dietary advice**. Allergy filters are provided as a convenience based on recipe ingredient metadata and are not a guarantee; always verify product labels and ingredients before cooking.
