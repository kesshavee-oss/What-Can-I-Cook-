/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CalendarRange,
  ChefHat,
  HelpCircle,
  RefreshCw,
  ShoppingBasket,
  User,
  UtensilsCrossed,
} from 'lucide-react';
import { INGREDIENTS, RECIPES, getIngredientById } from './recipes.js';
import { CookFlow } from './components/CookFlow';
import { HowToUseGuide } from './components/HowToUseGuide.jsx';
import { TabErrorBoundary } from './components/TabErrorBoundary';
import { Toast } from './components/Toast';
import {
  AllergyKey,
  AppTab,
  CookedMeal,
  CookFlowSelection,
  DietType,
  GroceryItem,
  Household,
  MealType,
  PlannedMeal,
  PlannedMealStatus,
  PriceMap,
  Recipe,
  RecipeMatch,
  WcicSettings,
  WeeklyNutritionGoal,
} from './types/cook';
import { checkAiAvailability, mergeAiRecipesStore } from './utils/aiRecipes.js';
import { mergePricesWithDefaults } from './utils/budgetUtils.js';
import { addRecipeItems } from './utils/groceryUtils.js';
import { calculateHouseholdServings, formatServingsLabel } from './utils/nutrition';
import {
  addPlannedMeal,
  addWeekMissingToGrocery,
  copyLastWeek,
  removePlannedMeal,
  updatePlannedMealStatus,
} from './utils/planUtils.js';
import { BackupData } from './utils/profileBackup.js';
import { isSharedGroceryHash } from './utils/shareUtils.js';
import {
  clearAiRecipesStorage,
  clearAllAppData,
  clearCorruptedWcicFlag,
  clearPriceOverridesStorage,
  hadCorruptedWcicRecovery,
  isLocalStorageAvailable,
  loadAiRecipes,
  loadAllergies,
  loadCookedMeals,
  loadCookSelection,
  loadDefaultDiet,
  loadFavoriteRecipeIds,
  loadGroceryList,
  loadHousehold,
  loadPlannedMeals,
  loadPriceOverrides,
  loadWcicSettings,
  saveAiRecipes,
  saveAllergies,
  saveCookedMeals,
  saveCookSelection,
  saveDefaultDiet,
  saveFavoriteRecipeIds,
  saveGroceryList,
  saveHousehold,
  savePlannedMeals,
  savePriceOverrides,
  saveWcicSettings,
} from './utils/storage';

function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return React.lazy(async () => {
    try {
      return await factory();
    } catch (firstErr) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      try {
        return await factory();
      } catch {
        throw firstErr;
      }
    }
  });
}

const PlanScreen = lazyWithRetry(() =>
  import('./components/PlanScreen').then((m) => ({ default: m.PlanScreen }))
);
const CalendarScreen = lazyWithRetry(() =>
  import('./components/CalendarScreen').then((m) => ({ default: m.CalendarScreen }))
);
const GroceryScreen = lazyWithRetry(() =>
  import('./components/GroceryScreen.jsx').then((m) => ({ default: m.GroceryScreen }))
);
const ProfileScreen = lazyWithRetry(() =>
  import('./components/ProfileScreen').then((m) => ({ default: m.ProfileScreen }))
);
const RecipeDetail = lazyWithRetry(() =>
  import('./components/RecipeDetail').then((m) => ({ default: m.RecipeDetail }))
);
const WelcomeSetup = lazyWithRetry(() =>
  import('./components/WelcomeSetup').then((m) => ({ default: m.WelcomeSetup }))
);
const SharedListScreen = lazyWithRetry(() =>
  import('./components/SharedListScreen.jsx').then((m) => ({
    default: m.SharedListScreen,
  }))
);

function TabLoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-white rounded-2xl p-8 border border-[#EADFD2] shadow-sm text-center text-sm text-[#6B6B6B]"
    >
      Loading view...
    </div>
  );
}

function getSmartDefaultMealType(): MealType {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 19) return 'snacks';
  return 'dinner';
}

function getDefaultPantryIds(): string[] {
  if (!Array.isArray(INGREDIENTS)) return [];
  return INGREDIENTS.filter((i) => i.assumedAvailable).map((i) => i.id);
}

export default function App() {
  const [dataErrorRetryCount, setDataErrorRetryCount] = useState(0);
  const [storageUnavailable, setStorageUnavailable] = useState<boolean>(
    () => !isLocalStorageAvailable()
  );

  const hasValidData =
    Array.isArray(INGREDIENTS) &&
    INGREDIENTS.length > 0 &&
    Array.isArray(RECIPES) &&
    RECIPES.length > 0;

  if (!hasValidData) {
    console.error('Recipe database failed to load or returned empty data.', {
      ingredientsCount: Array.isArray(INGREDIENTS) ? INGREDIENTS.length : null,
      recipesCount: Array.isArray(RECIPES) ? RECIPES.length : null,
    });
  }

  const [household, setHousehold] = useState<Household | null>(() =>
    loadHousehold()
  );
  const [defaultDiet, setDefaultDiet] = useState<DietType>(() =>
    loadDefaultDiet()
  );
  const [allergies, setAllergies] = useState<AllergyKey[]>(() =>
    loadAllergies()
  );
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<string[]>(() =>
    loadFavoriteRecipeIds()
  );
  const [cookedMeals, setCookedMeals] = useState<CookedMeal[]>(() =>
    loadCookedMeals()
  );
  const [groceryList, setGroceryList] = useState<GroceryItem[]>(() =>
    loadGroceryList()
  );
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>(() =>
    loadPlannedMeals()
  );
  const [aiRecipes, setAiRecipes] = useState<Recipe[]>(() => loadAiRecipes());
  const [priceOverrides, setPriceOverrides] = useState<PriceMap>(() =>
    loadPriceOverrides()
  );
  const [wcicSettings, setWcicSettings] = useState<WcicSettings>(() =>
    loadWcicSettings()
  );
  const [aiKeyAvailable, setAiKeyAvailable] = useState<boolean>(false);
  const [aiSessionDisabled, setAiSessionDisabled] = useState<boolean>(false);
  const [selection, setSelection] = useState<CookFlowSelection>(() =>
    loadCookSelection({
      diet: loadDefaultDiet(),
      mealType: getSmartDefaultMealType(),
      selectedIngredientIds: getDefaultPantryIds(),
      customIngredients: [],
      lastStep: 1,
    })
  );

  const [activeTab, setActiveTab] = useState<AppTab>('cook');
  const [openPriceEditOnGrocery, setOpenPriceEditOnGrocery] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<RecipeMatch | null>(null);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [recoveryToast, setRecoveryToast] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [sharedHash, setSharedHash] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && isSharedGroceryHash(window.location.hash)) {
      return window.location.hash;
    }
    return null;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onHashChange = () => {
      if (isSharedGroceryHash(window.location.hash)) {
        setSharedHash(window.location.hash);
      } else {
        setSharedHash(null);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const effectivePrices = useMemo(
    () => mergePricesWithDefaults(priceOverrides),
    [priceOverrides]
  );

  useEffect(() => {
    if (hadCorruptedWcicRecovery()) {
      clearCorruptedWcicFlag();
      setRecoveryToast('Some saved settings were reset.');
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void checkAiAvailability(controller.signal).then((available) => {
      if (!controller.signal.aborted) {
        setAiKeyAvailable(available);
      }
    });
    return () => controller.abort();
  }, []);

  const trackWrite = (ok: boolean): boolean => {
    if (!ok) {
      setStorageUnavailable(true);
    }
    return ok;
  };

  const handleSaveHousehold = (next: Household): boolean => {
    setHousehold(next);
    return trackWrite(saveHousehold(next));
  };

  const handleUpdateSelection = (next: CookFlowSelection) => {
    setSelection(next);
    trackWrite(saveCookSelection(next));
  };

  const handlePersistDefaultDietFromCook = (diet: DietType) => {
    setDefaultDiet(diet);
    trackWrite(saveDefaultDiet(diet));
  };

  const handleUpdateDefaultDiet = (diet: DietType): boolean => {
    setDefaultDiet(diet);
    const ok = trackWrite(saveDefaultDiet(diet));

    // Pre-select default diet on the Cook tab while stripping non-veg ingredients if veg
    const filteredIds =
      diet === 'veg'
        ? selection.selectedIngredientIds.filter((id) => {
            const ing = getIngredientById(id);
            return !ing || ing.isVeg;
          })
        : selection.selectedIngredientIds;

    handleUpdateSelection({
      ...selection,
      diet,
      selectedIngredientIds: filteredIds,
    });

    return ok;
  };

  const handleUpdateAllergies = (nextAllergies: AllergyKey[]): boolean => {
    setAllergies(nextAllergies);
    return trackWrite(saveAllergies(nextAllergies));
  };

  const handleToggleFavorite = (recipeId: string): boolean => {
    const exists = favoriteRecipeIds.includes(recipeId);
    const nextFavorites = exists
      ? favoriteRecipeIds.filter((id) => id !== recipeId)
      : [...favoriteRecipeIds, recipeId];
    setFavoriteRecipeIds(nextFavorites);
    return trackWrite(saveFavoriteRecipeIds(nextFavorites));
  };

  const handleRemoveFavorite = (recipeId: string): boolean => {
    const nextFavorites = favoriteRecipeIds.filter((id) => id !== recipeId);
    setFavoriteRecipeIds(nextFavorites);
    return trackWrite(saveFavoriteRecipeIds(nextFavorites));
  };

  const handleToggleHaveIngredient = (ingredientId: string) => {
    const exists = selection.selectedIngredientIds.includes(ingredientId);
    const nextIds = exists
      ? selection.selectedIngredientIds.filter((x) => x !== ingredientId)
      : [...selection.selectedIngredientIds, ingredientId];
    handleUpdateSelection({ ...selection, selectedIngredientIds: nextIds });
  };

  const handleLogCookedMeal = (meal: CookedMeal): boolean => {
    const nextMeals = [meal, ...cookedMeals];
    setCookedMeals(nextMeals);
    const saved = trackWrite(saveCookedMeals(nextMeals));

    if (activePlanId) {
      const nextPlan = updatePlannedMealStatus(plannedMeals, activePlanId, 'cooked');
      setPlannedMeals(nextPlan);
      trackWrite(savePlannedMeals(nextPlan));
      setActivePlanId(null);
    }

    return saved;
  };

  const handleUpdateMeal = (updated: CookedMeal): boolean => {
    const nextMeals = cookedMeals.map((m) => (m.id === updated.id ? updated : m));
    const ok = trackWrite(saveCookedMeals(nextMeals));
    if (ok) {
      setCookedMeals(nextMeals);
    }
    return ok;
  };

  const handleDeleteMeal = (mealId: string): boolean => {
    const nextMeals = cookedMeals.filter((m) => m.id !== mealId);
    const ok = trackWrite(saveCookedMeals(nextMeals));
    if (ok) {
      setCookedMeals(nextMeals);
    }
    return ok;
  };

  const handleImportData = (data: BackupData): boolean => {
    const importedGrocery = Array.isArray(data.groceryList) ? data.groceryList : [];
    const importedPlanned = Array.isArray(data.plannedMeals) ? data.plannedMeals : [];
    const importedAi = Array.isArray(data.wcic_ai_recipes) ? data.wcic_ai_recipes : [];
    const importedPrices =
      data.wcic_prices && typeof data.wcic_prices === 'object' ? data.wcic_prices : {};
    const importedSettings: WcicSettings =
      data.wcic_settings && typeof data.wcic_settings === 'object'
        ? {
            showCost:
              typeof data.wcic_settings.showCost === 'boolean'
                ? data.wcic_settings.showCost
                : true,
            showVisuals:
              typeof data.wcic_settings.showVisuals === 'boolean'
                ? data.wcic_settings.showVisuals
                : true,
            showIngredientImages:
              typeof data.wcic_settings.showIngredientImages === 'boolean'
                ? data.wcic_settings.showIngredientImages
                : true,
          }
        : { showCost: true, showVisuals: true, showIngredientImages: true };

    const okH = saveHousehold(data.household);
    const okD = saveDefaultDiet(data.defaultDiet);
    const okA = saveAllergies(data.allergies);
    const okF = saveFavoriteRecipeIds(data.favoriteRecipeIds);
    const okM = saveCookedMeals(data.cookedMeals);
    const okG = saveGroceryList(importedGrocery);
    const okP = savePlannedMeals(importedPlanned);
    const okAi = saveAiRecipes(importedAi);
    const okPr = savePriceOverrides(importedPrices);
    const okSt = saveWcicSettings(importedSettings);

    setHousehold(data.household);
    setDefaultDiet(data.defaultDiet);
    setAllergies(data.allergies);
    setFavoriteRecipeIds(data.favoriteRecipeIds);
    setCookedMeals(data.cookedMeals);
    setGroceryList(importedGrocery);
    setPlannedMeals(importedPlanned);
    setAiRecipes(importedAi);
    setPriceOverrides(importedPrices);
    setWcicSettings(importedSettings);

    const filteredIds =
      data.defaultDiet === 'veg'
        ? selection.selectedIngredientIds.filter((id) => {
            const ing = getIngredientById(id);
            return !ing || ing.isVeg;
          })
        : selection.selectedIngredientIds;

    handleUpdateSelection({
      ...selection,
      diet: data.defaultDiet,
      selectedIngredientIds: filteredIds,
    });

    const allOk = okH && okD && okA && okF && okM && okG && okP && okAi && okPr && okSt;
    return trackWrite(allOk);
  };

  const handleAddRecipeToGroceryList = (
    recipe: Recipe,
    includeOptional = false,
    ownedIngredientIds?: string[]
  ): string => {
    if (!household) return 'Set up your household first.';

    const nextList = addRecipeItems(
      groceryList,
      recipe,
      household,
      includeOptional,
      ownedIngredientIds
    );

    // Count items that were newly added or updated for this recipe
    const prevById = new Map(groceryList.map((g) => [g.id, g]));
    let addedOrMergedCount = 0;
    for (const item of nextList) {
      if (!item.fromRecipeIds.includes(recipe.id)) continue;
      const prev = prevById.get(item.id);
      if (!prev || !prev.fromRecipeIds.includes(recipe.id)) {
        addedOrMergedCount += 1;
      }
    }

    if (addedOrMergedCount > 0) {
      setGroceryList(nextList);
      trackWrite(saveGroceryList(nextList));
      return `Added ${addedOrMergedCount} ${
        addedOrMergedCount === 1 ? 'item' : 'items'
      } to your list`;
    }

    // Check if the recipe actually had any missing non-assumed ingredients
    const ownedSet = new Set(ownedIngredientIds ?? []);
    const hasMissingCandidate = recipe.ingredients.some((ingItem) => {
      if (ingItem.optional && !includeOptional) return false;
      const catalog = getIngredientById(ingItem.ingredientId);
      return !(catalog?.assumedAvailable || ownedSet.has(ingItem.ingredientId));
    });

    return hasMissingCandidate
      ? 'Already on your list'
      : 'All ingredients already in your kitchen';
  };

  const handleToggleGroceryChecked = (itemId: string) => {
    const nextList = groceryList.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    setGroceryList(nextList);
    trackWrite(saveGroceryList(nextList));
  };

  const handleRemoveGroceryItem = (itemId: string) => {
    const nextList = groceryList.filter((item) => item.id !== itemId);
    setGroceryList(nextList);
    trackWrite(saveGroceryList(nextList));
  };

  const handleClearCheckedGrocery = () => {
    const nextList = groceryList.filter((item) => !item.checked);
    setGroceryList(nextList);
    trackWrite(saveGroceryList(nextList));
  };

  const handleClearAllGrocery = () => {
    setGroceryList([]);
    trackWrite(saveGroceryList([]));
  };

  const handleAddPlannedMeal = (input: {
    date: string;
    mealType: MealType;
    recipeId: string;
    servings: number;
  }) => {
    const res = addPlannedMeal(plannedMeals, input);
    if (!res.error) {
      setPlannedMeals(res.nextList);
      trackWrite(savePlannedMeals(res.nextList));
    }
    return { error: res.error };
  };

  const handleUpdatePlannedStatus = (
    planId: string,
    status: PlannedMealStatus
  ) => {
    const nextList = updatePlannedMealStatus(plannedMeals, planId, status);
    setPlannedMeals(nextList);
    trackWrite(savePlannedMeals(nextList));
  };

  const handleRemovePlannedMeal = (planId: string) => {
    const nextList = removePlannedMeal(plannedMeals, planId);
    setPlannedMeals(nextList);
    trackWrite(savePlannedMeals(nextList));
    if (activePlanId === planId) {
      setActivePlanId(null);
    }
  };

  const handleCopyLastWeek = (targetMondayIso: string) => {
    const result = copyLastWeek(plannedMeals, targetMondayIso);
    if (result.copiedCount > 0) {
      setPlannedMeals(result.nextList);
      trackWrite(savePlannedMeals(result.nextList));
    }
    return {
      copiedCount: result.copiedCount,
      skippedCount: result.skippedCount,
      sourceCount: result.sourceCount,
    };
  };

  const handleAddWeekMissingToGrocery = (weekDateIsos: string[]): number => {
    if (!household) return 0;
    const recipeMap = new Map(RECIPES.map((r) => [r.id, r]));
    for (const r of aiRecipes) {
      recipeMap.set(r.id, r);
    }
    const { nextGroceryList, addedCount } = addWeekMissingToGrocery(
      groceryList,
      plannedMeals,
      weekDateIsos,
      recipeMap,
      household,
      selection.selectedIngredientIds
    );
    if (addedCount > 0) {
      setGroceryList(nextGroceryList);
      trackWrite(saveGroceryList(nextGroceryList));
    }
    return addedCount;
  };

  const handleCookPlannedMeal = (meal: PlannedMeal) => {
    setActivePlanId(meal.id);
    setSelectedMatch(null);
    setSelectedRecipeId(meal.recipeId);
  };

  const handleSaveAiRecipes = (newlyGenerated: Recipe[]) => {
    const merged = mergeAiRecipesStore(aiRecipes, newlyGenerated);
    setAiRecipes(merged);
    trackWrite(saveAiRecipes(merged));
  };

  const handleClearAiRecipes = () => {
    clearAiRecipesStorage();
    setAiRecipes([]);
    if (selectedRecipeId && selectedRecipeId.startsWith('ai_')) {
      setSelectedRecipeId(null);
      setSelectedMatch(null);
    }
  };

  const handleSavePrices = (nextOverrides: PriceMap) => {
    setPriceOverrides(nextOverrides);
    trackWrite(savePriceOverrides(nextOverrides));
  };

  const handleResetItemPrice = (ingredientId: string) => {
    if (!priceOverrides[ingredientId]) return;
    const nextOverrides = { ...priceOverrides };
    delete nextOverrides[ingredientId];
    setPriceOverrides(nextOverrides);
    trackWrite(savePriceOverrides(nextOverrides));
  };

  const handleResetAllPrices = () => {
    clearPriceOverridesStorage();
    setPriceOverrides({});
  };

  const handleToggleShowCost = (nextShowCost: boolean) => {
    const next = { ...wcicSettings, showCost: nextShowCost };
    setWcicSettings(next);
    trackWrite(saveWcicSettings(next));
  };

  const handleToggleShowVisuals = (nextShowVisuals: boolean) => {
    const next = { ...wcicSettings, showVisuals: nextShowVisuals };
    setWcicSettings(next);
    trackWrite(saveWcicSettings(next));
  };

  const handleToggleShowIngredientImages = (nextShowIngredientImages: boolean) => {
    const next = {
      ...wcicSettings,
      showIngredientImages: nextShowIngredientImages,
    };
    setWcicSettings(next);
    trackWrite(saveWcicSettings(next));
  };

  const handleUpdateWeeklyNutritionGoal = (nextGoal: WeeklyNutritionGoal | null) => {
    const next = {
      ...wcicSettings,
      weeklyNutritionGoal: nextGoal,
    };
    setWcicSettings(next);
    trackWrite(saveWcicSettings(next));
  };

  const handleClearAllData = () => {
    clearAllAppData();
    setHousehold(null);
    setCookedMeals([]);
    setGroceryList([]);
    setPlannedMeals([]);
    setAiRecipes([]);
    setPriceOverrides({});
    setWcicSettings({
      showCost: true,
      showVisuals: true,
      showIngredientImages: true,
    });
    setDefaultDiet('veg');
    setAllergies([]);
    setFavoriteRecipeIds([]);
    setSelection({
      diet: 'veg',
      mealType: getSmartDefaultMealType(),
      selectedIngredientIds: getDefaultPantryIds(),
      customIngredients: [],
      lastStep: 1,
    });
    setSelectedRecipeId(null);
    setSelectedMatch(null);
    setActivePlanId(null);
    setActiveTab('cook');
  };

  // Friendly error screen if recipes.js failed or returned no data
  if (!hasValidData) {
    return (
      <div
        key={dataErrorRetryCount}
        className="min-h-screen bg-[#FFF9F2] flex items-center justify-center p-6"
      >
        <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-sm border border-[#EADFD2] text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#C5411B]/10 text-[#B83915] flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-[#2B2B2B]">
              Could not load kitchen recipes
            </h1>
            <p className="text-sm text-[#6B6B6B] mt-1">
              Our built-in recipe list did not load properly. Please try reloading
              the page.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDataErrorRetryCount((c) => c + 1);
              window.location.reload();
            }}
            className="h-11 px-5 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold text-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const clearSharedHashFragment = () => {
    if (typeof window !== 'undefined') {
      if (window.history && typeof window.history.replaceState === 'function') {
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        );
      } else {
        window.location.hash = '';
      }
    }
    setSharedHash(null);
  };

  const handleSaveSharedListCopy = (itemsToSave: GroceryItem[]) => {
    setGroceryList(itemsToSave);
    trackWrite(saveGroceryList(itemsToSave));
    clearSharedHashFragment();
    setSelectedRecipeId(null);
    setSelectedMatch(null);
    setActivePlanId(null);
    setActiveTab('grocery');
  };

  // Show read-only shared grocery list screen when loaded with a #list= fragment
  if (sharedHash !== null) {
    return (
      <Suspense fallback={<TabLoadingFallback />}>
        <SharedListScreen
          hashFragment={sharedHash}
          onOpenApp={clearSharedHashFragment}
          onSaveCopy={handleSaveSharedListCopy}
        />
      </Suspense>
    );
  }

  // Redirect to Welcome screen if household is missing
  if (!household) {
    return (
      <>
        <Suspense fallback={<TabLoadingFallback />}>
          <WelcomeSetup onSave={handleSaveHousehold} />
        </Suspense>
        <Toast
          message={recoveryToast}
          variant="info"
          onDismiss={() => setRecoveryToast(null)}
        />
      </>
    );
  }

  const activeRecipe = selectedRecipeId
    ? RECIPES.find((r) => r.id === selectedRecipeId) ??
      aiRecipes.find((r) => r.id === selectedRecipeId) ??
      null
    : null;

  const activePlannedMeal = activePlanId
    ? plannedMeals.find((m) => m.id === activePlanId) ?? null
    : null;

  const totalServings = calculateHouseholdServings(household);

  const navItems: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'cook',
      label: 'Cook',
      icon: <ChefHat className="w-5 h-5" aria-hidden="true" />,
    },
    {
      id: 'plan',
      label: 'Plan',
      icon: <CalendarRange className="w-5 h-5" aria-hidden="true" />,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: <CalendarDays className="w-5 h-5" aria-hidden="true" />,
    },
    {
      id: 'grocery',
      label: 'Grocery',
      icon: <ShoppingBasket className="w-5 h-5" aria-hidden="true" />,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="w-5 h-5" aria-hidden="true" />,
    },
  ];

  const handleTabSwitch = (tab: AppTab) => {
    setActiveTab(tab);
    setSelectedRecipeId(null);
    setSelectedMatch(null);
    setActivePlanId(null);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-[#2B2B2B] flex flex-col lg:flex-row">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-[#2B2B2B] focus:text-white focus:font-heading focus:font-semibold focus:text-sm focus:shadow-lg"
      >
        Skip to content
      </a>

      {/* Desktop Left Sidebar Navigation (1024px+) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-white border-r border-[#EADFD2] lg:sticky lg:top-0 lg:h-screen p-5 justify-between no-print">
        <div className="space-y-8">
          <div className="flex items-center justify-between gap-2 pl-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#C5411B] text-white flex items-center justify-center shrink-0">
                <UtensilsCrossed className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="font-heading font-bold text-base text-[#2B2B2B] truncate">
                What Can I Cook?
              </span>
            </div>
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              aria-label="How to use"
              title="How to use"
              className="min-w-[44px] min-h-[44px] rounded-xl text-[#6B6B6B] hover:text-[#2B2B2B] hover:bg-[#FFF9F2] flex items-center justify-center shrink-0 cursor-pointer"
            >
              <HelpCircle className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Main navigation" className="space-y-1.5">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => handleTabSwitch(item.id)}
                  className={`w-full min-h-[48px] px-3.5 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#FFF1EC] text-[#B83915] font-semibold'
                      : 'text-[#6B6B6B] hover:bg-[#FFF9F2] hover:text-[#2B2B2B]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3.5 rounded-xl bg-[#FFF9F2] border border-[#EADFD2] text-xs space-y-1">
          <span className="block font-semibold text-[#2B2B2B]">
            Household table
          </span>
          <span className="block text-[#6B6B6B] tabular-nums">
            {household.adults} adult{household.adults > 1 ? 's' : ''}
            {household.children.length > 0
              ? `, ${household.children.length} child${
                  household.children.length > 1 ? 'ren' : ''
                }`
              : ''}
          </span>
          <span className="block text-[#1F6E42] font-medium tabular-nums">
            Scaled to {formatServingsLabel(totalServings)} servings
          </span>
        </div>
      </aside>

      {/* Tablet Top Navigation Bar (640px - 1023px) */}
      <header className="hidden sm:flex lg:hidden items-center justify-between gap-3 px-4 md:px-6 h-16 bg-white border-b border-[#EADFD2] sticky top-0 z-30 no-print">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#C5411B] text-white flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-4 h-4" aria-hidden="true" />
          </div>
          <span className="font-heading font-bold text-sm md:text-base whitespace-nowrap">
            What Can I Cook?
          </span>
        </div>

        <nav aria-label="Tablet navigation" className="flex items-center gap-1 md:gap-1.5">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => handleTabSwitch(item.id)}
                className={`min-h-[44px] px-2.5 md:px-3.5 rounded-xl flex items-center gap-1.5 text-xs md:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#C5411B] text-white'
                    : 'text-[#6B6B6B] hover:text-[#2B2B2B]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="hidden md:inline text-xs font-medium text-[#1F6E42] tabular-nums whitespace-nowrap">
            {formatServingsLabel(totalServings)} serv.
          </span>
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            aria-label="How to use"
            title="How to use"
            className="min-w-[44px] min-h-[44px] rounded-xl text-[#6B6B6B] hover:text-[#2B2B2B] hover:bg-[#FFF9F2] flex items-center justify-center shrink-0 cursor-pointer"
          >
            <HelpCircle className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Mobile Compact Header (< 640px) */}
      <header className="sm:hidden flex items-center justify-between gap-2 px-4 pt-3 pb-1 no-print">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#C5411B] text-white flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-4 h-4" aria-hidden="true" />
          </div>
          <span className="font-heading font-bold text-base text-[#2B2B2B] truncate">
            What Can I Cook?
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs font-medium text-[#1F6E42] tabular-nums whitespace-nowrap">
            {formatServingsLabel(totalServings)} serv.
          </span>
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            aria-label="How to use"
            title="How to use"
            className="min-w-[44px] min-h-[44px] -mr-2 rounded-xl text-[#6B6B6B] hover:text-[#2B2B2B] hover:bg-white flex items-center justify-center shrink-0 cursor-pointer"
          >
            <HelpCircle className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Centered Content Area up to 1100px wide */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 min-w-0 px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8 focus:outline-none"
      >
        <div className="max-w-[1100px] mx-auto">
          {activeRecipe ? (
            <TabErrorBoundary
              key={`detail-${activeRecipe.id}`}
              tabName="Recipe detail"
              onGoToCook={() => handleTabSwitch('cook')}
            >
              <Suspense fallback={<TabLoadingFallback />}>
                <RecipeDetail
                  recipe={activeRecipe}
                  match={selectedMatch}
                  household={household}
                  defaultDiet={defaultDiet}
                  allergies={allergies}
                  aiAvailable={aiKeyAvailable && !aiSessionDisabled}
                  selectedIngredientIds={selection.selectedIngredientIds}
                  isFavorite={favoriteRecipeIds.includes(activeRecipe.id)}
                  defaultMealType={
                    activePlannedMeal ? activePlannedMeal.mealType : selection.mealType
                  }
                  showVisuals={wcicSettings.showVisuals}
                  showIngredientImages={wcicSettings.showIngredientImages}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleHaveIngredient={handleToggleHaveIngredient}
                  onAddMissingToList={handleAddRecipeToGroceryList}
                  onLogCookedMeal={handleLogCookedMeal}
                  onBack={() => {
                    setSelectedRecipeId(null);
                    setSelectedMatch(null);
                    setActivePlanId(null);
                  }}
                  onGoToCalendar={() => {
                    setSelectedRecipeId(null);
                    setSelectedMatch(null);
                    setActivePlanId(null);
                    setActiveTab('calendar');
                  }}
                />
              </Suspense>
            </TabErrorBoundary>
          ) : activeTab === 'cook' ? (
            <TabErrorBoundary
              key="tab-cook"
              tabName="Cook"
              onGoToCook={() => handleTabSwitch('cook')}
            >
              <CookFlow
                household={household}
                defaultDiet={defaultDiet}
                selection={selection}
                onUpdateSelection={handleUpdateSelection}
                onPersistDefaultDiet={handlePersistDefaultDietFromCook}
                allergies={allergies}
                aiKeyAvailable={aiKeyAvailable}
                aiSessionDisabled={aiSessionDisabled}
                savedAiRecipes={aiRecipes}
                onSaveAiRecipes={handleSaveAiRecipes}
                onDisableAiSession={() => setAiSessionDisabled(true)}
                onAddRecipeToList={handleAddRecipeToGroceryList}
                showVisuals={wcicSettings.showVisuals}
                showIngredientImages={wcicSettings.showIngredientImages}
                onSelectRecipe={(match: RecipeMatch) => {
                  setActivePlanId(null);
                  setSelectedMatch(match);
                  setSelectedRecipeId(match.id);
                }}
              />
            </TabErrorBoundary>
          ) : activeTab === 'plan' ? (
            <TabErrorBoundary
              key="tab-plan"
              tabName="Plan"
              onGoToCook={() => handleTabSwitch('cook')}
            >
              <Suspense fallback={<TabLoadingFallback />}>
                <PlanScreen
                  plannedMeals={plannedMeals}
                  household={household}
                  defaultDiet={defaultDiet}
                  allergies={allergies}
                  ownedIngredientIds={selection.selectedIngredientIds}
                  prices={effectivePrices}
                  showCost={wcicSettings.showCost}
                  showVisuals={wcicSettings.showVisuals}
                  weeklyNutritionGoal={wcicSettings.weeklyNutritionGoal ?? null}
                  onUpdateWeeklyNutritionGoal={handleUpdateWeeklyNutritionGoal}
                  aiRecipes={aiRecipes}
                  storageUnavailable={storageUnavailable}
                  onAddPlannedMeal={handleAddPlannedMeal}
                  onUpdateStatus={handleUpdatePlannedStatus}
                  onRemoveMeal={handleRemovePlannedMeal}
                  onCopyLastWeek={handleCopyLastWeek}
                  onAddWeekMissingToGrocery={handleAddWeekMissingToGrocery}
                  onCookPlannedMeal={handleCookPlannedMeal}
                  onAddRecipeToList={handleAddRecipeToGroceryList}
                  onGoToGroceryEditPrices={() => {
                    setSelectedRecipeId(null);
                    setSelectedMatch(null);
                    setActivePlanId(null);
                    setOpenPriceEditOnGrocery(true);
                    setActiveTab('grocery');
                  }}
                />
              </Suspense>
            </TabErrorBoundary>
          ) : activeTab === 'calendar' ? (
            <TabErrorBoundary
              key="tab-calendar"
              tabName="Calendar"
              onGoToCook={() => handleTabSwitch('cook')}
            >
              <Suspense fallback={<TabLoadingFallback />}>
                <CalendarScreen
                  cookedMeals={cookedMeals}
                  aiRecipes={aiRecipes}
                  ownedIngredientIds={selection.selectedIngredientIds}
                  defaultDiet={defaultDiet}
                  showVisuals={wcicSettings.showVisuals}
                  onOpenRecipeById={(id) => {
                    setActivePlanId(null);
                    setSelectedMatch(null);
                    setSelectedRecipeId(id);
                  }}
                  onLogCookedMeal={handleLogCookedMeal}
                  onUpdateMeal={handleUpdateMeal}
                  onDeleteMeal={handleDeleteMeal}
                  onAddRecipeToList={handleAddRecipeToGroceryList}
                  onGoToCook={() => handleTabSwitch('cook')}
                />
              </Suspense>
            </TabErrorBoundary>
          ) : activeTab === 'grocery' ? (
            <TabErrorBoundary
              key="tab-grocery"
              tabName="Grocery"
              onGoToCook={() => handleTabSwitch('cook')}
            >
              <Suspense fallback={<TabLoadingFallback />}>
                <GroceryScreen
                  groceryList={groceryList}
                  prices={effectivePrices}
                  priceOverrides={priceOverrides}
                  showCost={wcicSettings.showCost}
                  showIngredientImages={wcicSettings.showIngredientImages}
                  aiRecipes={aiRecipes}
                  initialOpenPriceEdit={openPriceEditOnGrocery}
                  onInitialPriceEditHandled={() => setOpenPriceEditOnGrocery(false)}
                  storageUnavailable={storageUnavailable}
                  onToggleChecked={handleToggleGroceryChecked}
                  onRemoveItem={handleRemoveGroceryItem}
                  onClearChecked={handleClearCheckedGrocery}
                  onClearAll={handleClearAllGrocery}
                  onSavePrices={handleSavePrices}
                  onResetItemPrice={handleResetItemPrice}
                  onGoToCook={() => handleTabSwitch('cook')}
                />
              </Suspense>
            </TabErrorBoundary>
          ) : (
            <TabErrorBoundary
              key="tab-profile"
              tabName="Profile"
              onGoToCook={() => handleTabSwitch('cook')}
            >
              <Suspense fallback={<TabLoadingFallback />}>
                <ProfileScreen
                  household={household}
                  defaultDiet={defaultDiet}
                  allergies={allergies}
                  favoriteRecipeIds={favoriteRecipeIds}
                  cookedMeals={cookedMeals}
                  groceryList={groceryList}
                  plannedMeals={plannedMeals}
                  aiRecipes={aiRecipes}
                  priceOverrides={priceOverrides}
                  selectedIngredientIds={selection.selectedIngredientIds}
                  showCost={wcicSettings.showCost}
                  showVisuals={wcicSettings.showVisuals}
                  showIngredientImages={wcicSettings.showIngredientImages}
                  aiKeyAvailable={aiKeyAvailable}
                  storageUnavailable={storageUnavailable}
                  onUpdateHousehold={handleSaveHousehold}
                  onUpdateDefaultDiet={handleUpdateDefaultDiet}
                  onUpdateAllergies={handleUpdateAllergies}
                  onRemoveFavorite={handleRemoveFavorite}
                  onOpenRecipeById={(id) => {
                    setActivePlanId(null);
                    setSelectedMatch(null);
                    setSelectedRecipeId(id);
                  }}
                  onUseExpiringInCook={(expiringIds) => {
                    const mergedSet = new Set([
                      ...selection.selectedIngredientIds,
                      ...expiringIds,
                    ]);
                    const filteredIds =
                      defaultDiet === 'veg'
                        ? Array.from(mergedSet).filter((id) => {
                            const ing = getIngredientById(id);
                            return !ing || ing.isVeg;
                          })
                        : Array.from(mergedSet);
                    handleUpdateSelection({
                      ...selection,
                      diet: defaultDiet,
                      selectedIngredientIds: filteredIds,
                      lastStep: 4,
                    });
                    setSelectedRecipeId(null);
                    setSelectedMatch(null);
                    setActivePlanId(null);
                    setActiveTab('cook');
                  }}
                  onAddRecipeToList={handleAddRecipeToGroceryList}
                  onImportData={handleImportData}
                  onToggleShowCost={handleToggleShowCost}
                  onToggleShowVisuals={handleToggleShowVisuals}
                  onToggleShowIngredientImages={handleToggleShowIngredientImages}
                  onResetAllPrices={handleResetAllPrices}
                  onClearAiRecipes={handleClearAiRecipes}
                  onClearAllData={handleClearAllData}
                  onOpenHowToUse={() => setGuideOpen(true)}
                />
              </Suspense>
            </TabErrorBoundary>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (< 640px) */}
      <nav
        aria-label="Mobile navigation"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-white/95 backdrop-blur-md border-t border-[#EADFD2] grid grid-cols-5 items-center no-print"
      >
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => handleTabSwitch(item.id)}
              className={`h-full px-0.5 flex flex-col items-center justify-center gap-0.5 text-[10px] sm:text-[11px] font-medium transition-colors cursor-pointer ${
                active ? 'text-[#B83915] font-semibold' : 'text-[#6B6B6B]'
              }`}
            >
              {item.icon}
              <span className="truncate max-w-full">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <HowToUseGuide open={guideOpen} onClose={() => setGuideOpen(false)} />

      <Toast
        message={recoveryToast}
        variant="info"
        onDismiss={() => setRecoveryToast(null)}
      />
    </div>
  );
}
