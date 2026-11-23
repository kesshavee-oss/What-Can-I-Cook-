import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Baby,
  Calendar,
  Check,
  Clock,
  Coffee,
  Edit3,
  EyeOff,
  HelpCircle,
  Moon,
  Plus,
  Search,
  ShoppingBasket,
  Shuffle,
  Sparkles,
  Sun,
  Sunrise,
  Trash2,
  Utensils,
  X,
} from 'lucide-react';
import {
  CHILD_GUIDANCE_DISCLAIMER,
} from '../nutritionTargets.js';
import {
  INGREDIENTS,
  RECIPES,
  compareRecipeMatches,
  diversifyMatchedRecipes,
  evaluateRecipeMatch,
  getIngredientById,
  getRecipesForFilters,
  shuffleEqualScoringRecipes,
} from '../recipes.js';
import { INGREDIENT_CATEGORIES } from '../data/ingredients';
import { MEAL_TYPE_META } from '../data/media';
import {
  getSeasonalHighlights,
} from '../seasonal.js';
import {
  getExpiringSoonItems,
  getShelfLifeDays,
} from '../shelfLife.js';
import {
  AllergyKey,
  CookFlowSelection,
  CookedMeal,
  DietType,
  FestivalSelection,
  Household,
  IngredientCategory,
  LeftoverItem,
  MealType,
  PantryEntry,
  Recipe,
  RecipeMatch,
} from '../types/cook';
import {
  AI_DISCLAIMER_TEXT,
  generateRecipes,
  matchSavedAiRecipes,
} from '../utils/aiRecipes.js';
import { getMissingRecipeIngredientsCount } from '../utils/groceryUtils.js';
import { sortActiveLeftovers } from '../utils/leftoverUtils.js';
import { calculateHouseholdServings, formatServingsLabel } from '../utils/nutrition';
import {
  computeRatingPreferenceMap,
  rankCookMatches,
} from '../utils/recipeRanking.js';
import {
  RECIPE_SORT_OPTIONS,
  RecipeSortOption,
  filterAvailableRecipes,
  recipeMatchesQuery,
  sortRecipes,
} from '../utils/recipeSearch.js';
import { ChipGroup } from './ChipGroup';
import { DietBadge } from './DietBadge';
import { RecipeVisual } from './RecipeVisual.jsx';
import { Toast } from './Toast';

interface CookFlowProps {
  household: Household;
  defaultDiet: DietType;
  selection: CookFlowSelection;
  onUpdateSelection: (next: CookFlowSelection) => void;
  onPersistDefaultDiet: (diet: DietType) => void;
  allergies: AllergyKey[];
  aiKeyAvailable: boolean;
  aiSessionDisabled: boolean;
  savedAiRecipes: Recipe[];
  onSaveAiRecipes: (newRecipes: Recipe[]) => void;
  onDisableAiSession: () => void;
  onAddRecipeToList: (
    recipe: RecipeMatch,
    includeOptional?: boolean,
    ownedIngredientIds?: string[]
  ) => string;
  onSelectRecipe: (match: RecipeMatch) => void;
  showVisuals?: boolean;
  showIngredientImages?: boolean;
  leftovers?: LeftoverItem[];
  onEatLeftover?: (leftoverId: string) => void;
  onMarkLeftoverUsedUp?: (leftoverId: string) => void;
  pantryEntries?: PantryEntry[];
  onUpdatePantryDate?: (ingredientId: string, boughtOn: string) => void;
  cookedMeals?: CookedMeal[];
  hiddenRecipeIds?: string[];
  onHideRecipe?: (recipeId: string) => void;
  festivalSelection?: FestivalSelection | null;
}

const STEP_LABELS: { step: 1 | 2 | 3 | 4; label: string }[] = [
  { step: 1, label: 'Diet' },
  { step: 2, label: 'Meal' },
  { step: 3, label: 'Ingredients' },
  { step: 4, label: 'Recipes' },
];

const MEAL_ICONS: Record<MealType, React.ReactNode> = {
  breakfast: <Sunrise className="w-6 h-6 text-[#E4572E]" aria-hidden="true" />,
  lunch: <Sun className="w-6 h-6 text-[#E4572E]" aria-hidden="true" />,
  snacks: <Coffee className="w-6 h-6 text-[#E4572E]" aria-hidden="true" />,
  dinner: <Moon className="w-6 h-6 text-[#E4572E]" aria-hidden="true" />,
};

const EMPTY_SELECTION_QUIPS: readonly string[] = [
  "Your fridge is empty and your stomach is hopeful — bold plan! Pick a few ingredients first, because recipes can't cook from thin air.",
  'Trying to cook with zero ingredients is a very bold kitchen strategy. Tap a few things from your shelf and we will bring the recipes.',
  'Even the best chef cannot saute pure optimism. Tell us what is in your kitchen so we can find something tasty.',
  "Nothing picked yet, unless invisible soup counts as dinner. Grab a couple of ingredients first and let's see what we can make.",
];

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function safeDisplay(value: unknown): string {
  if (value === undefined || value === null) return '-';
  if (typeof value === 'number' && Number.isNaN(value)) return '-';
  const str = String(value).trim();
  return str.length > 0 ? str : '-';
}

export const CookFlow: React.FC<CookFlowProps> = ({
  household,
  defaultDiet,
  selection,
  onUpdateSelection,
  onPersistDefaultDiet,
  allergies,
  aiKeyAvailable,
  aiSessionDisabled,
  savedAiRecipes,
  onSaveAiRecipes,
  onDisableAiSession,
  onAddRecipeToList,
  onSelectRecipe,
  showVisuals = true,
  showIngredientImages = true,
  leftovers = [],
  onEatLeftover,
  onMarkLeftoverUsedUp,
  pantryEntries = [],
  onUpdatePantryDate,
  cookedMeals = [],
  hiddenRecipeIds = [],
  onHideRecipe,
  festivalSelection = null,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(selection.lastStep ?? 1);
  const [activeCategory, setActiveCategory] =
    useState<IngredientCategory>('vegetables');
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<RecipeSortOption>('best_match');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [dietToast, setDietToast] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<{
    message: string;
    variant: 'success' | 'error';
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);
  const [showAllMatches, setShowAllMatches] = useState(false);
  const [shuffledOrderIds, setShuffledOrderIds] = useState<string[] | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [childFriendlyOnly, setChildFriendlyOnly] = useState(false);
  const [showPantryDates, setShowPantryDates] = useState(false);
  const [openWhyRecipeId, setOpenWhyRecipeId] = useState<string | null>(null);
  const [emptyQuipIndex, setEmptyQuipIndex] = useState<number>(() =>
    Math.floor(Math.random() * EMPTY_SELECTION_QUIPS.length)
  );

  const aiAbortRef = useRef<AbortController | null>(null);
  const lastAiTapRef = useRef<number>(0);
  const ingredientSearchRef = useRef<HTMLInputElement | null>(null);
  const pendingFocusSearchRef = useRef<boolean>(false);
  const wasEmptyVisitRef = useRef<boolean>(false);

  const totalServings = calculateHouseholdServings(household);
  const hasChildren = household.children.length > 0;
  const todayIso = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setDebouncedSearchQuery('');
      return;
    }
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      aiAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (step === 3 && pendingFocusSearchRef.current) {
      pendingFocusSearchRef.current = false;
      window.requestAnimationFrame(() => {
        ingredientSearchRef.current?.focus();
      });
    }
  }, [step]);

  const goToStep = (nextStep: 1 | 2 | 3 | 4) => {
    setStep(nextStep);
    onUpdateSelection({ ...selection, lastStep: nextStep });
  };

  const handleGoToIngredients = () => {
    pendingFocusSearchRef.current = true;
    goToStep(3);
  };

  // Step 1: Diet switch & veg safety cleanup
  const handleDietSelect = (nextDiet: DietType) => {
    onPersistDefaultDiet(nextDiet);

    if (nextDiet === 'veg') {
      let removedNonVeg = false;
      const filteredIds = selection.selectedIngredientIds.filter((id) => {
        const ing = getIngredientById(id);
        if (ing && !ing.isVeg) {
          removedNonVeg = true;
          return false;
        }
        return true;
      });

      if (removedNonVeg) {
        setDietToast('Meat and fish were removed to match vegetarian mode.');
      } else {
        setDietToast(null);
      }

      if (activeCategory === 'meat_fish') {
        setActiveCategory('vegetables');
      }

      onUpdateSelection({
        ...selection,
        diet: nextDiet,
        selectedIngredientIds: filteredIds,
      });
    } else {
      setDietToast(null);
      onUpdateSelection({
        ...selection,
        diet: nextDiet,
      });
    }
  };

  // Step 2: Meal type
  const handleMealSelect = (mealType: MealType) => {
    onUpdateSelection({ ...selection, mealType });
  };

  // Step 3: Ingredient toggles & presets
  const toggleIngredient = (id: string) => {
    const exists = selection.selectedIngredientIds.includes(id);
    const nextIds = exists
      ? selection.selectedIngredientIds.filter((x) => x !== id)
      : [...selection.selectedIngredientIds, id];
    onUpdateSelection({ ...selection, selectedIngredientIds: nextIds });
  };

  const applyPantryBasics = () => {
    const pantryIds = INGREDIENTS.filter((i) => i.assumedAvailable).map(
      (i) => i.id
    );
    const merged = Array.from(
      new Set([...selection.selectedIngredientIds, ...pantryIds])
    );
    onUpdateSelection({ ...selection, selectedIngredientIds: merged });
  };

  const clearIngredients = () => {
    onUpdateSelection({
      ...selection,
      selectedIngredientIds: [],
      customIngredients: [],
    });
  };

  const handleAddCustomIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeSearch(customInput);
    if (!normalized) return;

    // Match against name or aliases in INGREDIENTS (compatible with current diet)
    const matched = INGREDIENTS.find((ing) => {
      if (selection.diet === 'veg' && !ing.isVeg) return false;
      const nameMatch = normalizeSearch(ing.name) === normalized;
      const aliasMatch = ing.aliases.some(
        (alias) => normalizeSearch(alias) === normalized
      );
      return nameMatch || aliasMatch;
    });

    if (matched) {
      if (!selection.selectedIngredientIds.includes(matched.id)) {
        onUpdateSelection({
          ...selection,
          selectedIngredientIds: [...selection.selectedIngredientIds, matched.id],
        });
      }
      setCustomInput('');
      return;
    }

    const trimmed = customInput.trim().replace(/\s+/g, ' ');
    if (
      !selection.customIngredients.some(
        (c) => normalizeSearch(c) === normalized
      )
    ) {
      onUpdateSelection({
        ...selection,
        customIngredients: [...selection.customIngredients, trimmed],
      });
    }
    setCustomInput('');
  };

  const removeCustomIngredient = (item: string) => {
    onUpdateSelection({
      ...selection,
      customIngredients: selection.customIngredients.filter((c) => c !== item),
    });
  };

  const visibleCategories = useMemo(() => {
    return INGREDIENT_CATEGORIES.filter((cat) =>
      selection.diet === 'veg' ? cat.id !== 'meat_fish' : true
    );
  }, [selection.diet]);

  const normalizedSearch = normalizeSearch(debouncedSearchQuery);

  const filteredIngredients = useMemo(() => {
    return INGREDIENTS.filter((ing) => {
      if (selection.diet === 'veg' && !ing.isVeg) return false;
      if (normalizedSearch) {
        return (
          normalizeSearch(ing.name).includes(normalizedSearch) ||
          ing.aliases.some((alias) =>
            normalizeSearch(alias).includes(normalizedSearch)
          )
        );
      }
      return ing.category === activeCategory;
    });
  }, [selection.diet, normalizedSearch, activeCategory]);

  // Step 1/Diagnostic: log every change to selectedIngredientIds
  useEffect(() => {
    console.log(
      '[CookFlow] selectedIngredientIds changed:',
      selection.selectedIngredientIds
    );
  }, [selection.selectedIngredientIds]);

  // Reset manual shuffle ordering whenever filters or search change
  useEffect(() => {
    setShuffledOrderIds(null);
  }, [
    selection.diet,
    selection.mealType,
    selection.selectedIngredientIds,
    allergies,
    household,
    sortBy,
    recipeSearchQuery,
    savedAiRecipes,
  ]);

  // Step 4: Built-in results from recipes.js getRecipesForFilters (recalculates immediately on every filter/household change)
  const builtInMatches = useMemo(() => {
    console.log(
      '[CookFlow] getRecipesForFilters called with ingredient IDs:',
      selection.selectedIngredientIds
    );
    return getRecipesForFilters({
      diet: selection.diet,
      mealType: selection.mealType,
      allergies,
      availableIngredientIds: selection.selectedIngredientIds,
    });
  }, [
    selection.diet,
    selection.mealType,
    allergies,
    selection.selectedIngredientIds,
    household,
  ]);

  // Saved AI recipes matching current diet, meal type, allergy rules, and >=50% threshold
  // Hidden when AI key is missing or session disabled so built-in results only are shown.
  const aiMatches = useMemo(() => {
    if (!aiKeyAvailable || aiSessionDisabled) return [];
    return matchSavedAiRecipes(savedAiRecipes, {
      diet: selection.diet,
      mealType: selection.mealType,
      allergies,
      availableIngredientIds: selection.selectedIngredientIds,
    });
  }, [
    aiKeyAvailable,
    aiSessionDisabled,
    savedAiRecipes,
    selection.diet,
    selection.mealType,
    allergies,
    selection.selectedIngredientIds,
    household,
  ]);

  const matches = useMemo(() => {
    if (aiMatches.length === 0) {
      return builtInMatches;
    }

    const passingBuiltIn = builtInMatches.filter(
      (r) => !r.isClosestMatch || r.matchScore >= 50
    );
    const totalPassing = passingBuiltIn.length + aiMatches.length;

    if (totalPassing >= 3) {
      return diversifyMatchedRecipes(
        [...passingBuiltIn, ...aiMatches].sort(compareRecipeMatches),
        2
      ).map((r) => ({ ...r, isClosestMatch: false }));
    }

    const byId = new Map<string, RecipeMatch>();
    for (const r of [...builtInMatches, ...aiMatches]) {
      byId.set(r.id, r);
    }
    return diversifyMatchedRecipes(
      Array.from(byId.values()).sort(compareRecipeMatches),
      2
    )
      .slice(0, 5)
      .map((r) => ({ ...r, isClosestMatch: true }));
  }, [builtInMatches, aiMatches]);

  const isClosestMatchesMode = useMemo(
    () => matches.length > 0 && matches.every((r) => Boolean(r.isClosestMatch)),
    [matches]
  );

  const normalizedRecipeSearch = normalizeSearch(recipeSearchQuery);

  // Feature 4, 5, 6, 8, 13 derived helpers
  const activeLeftovers = useMemo(
    () => sortActiveLeftovers(leftovers, todayIso),
    [leftovers, todayIso]
  );

  const recipeNameLookup = useMemo(() => {
    const map = new Map<string, Recipe>();
    for (const r of RECIPES) map.set(r.id, r);
    for (const r of savedAiRecipes) map.set(r.id, r);
    return map;
  }, [savedAiRecipes]);

  const pantryBoughtMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of pantryEntries) {
      if (entry?.ingredientId && entry?.boughtOn) {
        map.set(entry.ingredientId, entry.boughtOn);
      }
    }
    return map;
  }, [pantryEntries]);

  const selectedPerishables = useMemo(() => {
    return selection.selectedIngredientIds
      .filter((id) => getShelfLifeDays(id) !== null)
      .map((id) => ({
        id,
        name: getIngredientById(id)?.name ?? id,
        shelfLifeDays: getShelfLifeDays(id)!,
        boughtOn: pantryBoughtMap.get(id) ?? '',
      }));
  }, [selection.selectedIngredientIds, pantryBoughtMap]);

  const expiringSoonItems = useMemo(
    () =>
      getExpiringSoonItems(
        pantryEntries,
        selection.selectedIngredientIds,
        2,
        todayIso
      ),
    [pantryEntries, selection.selectedIngredientIds, todayIso]
  );

  const expiringIds = useMemo(
    () => expiringSoonItems.map((i) => i.ingredientId),
    [expiringSoonItems]
  );

  const ratingPrefs = useMemo(
    () => computeRatingPreferenceMap(cookedMeals),
    [cookedMeals]
  );

  const sortedStep4Matches = useMemo(() => {
    const filtered = normalizedRecipeSearch
      ? matches.filter((m) => recipeMatchesQuery(m, normalizedRecipeSearch))
      : matches;
    const baseSorted =
      sortBy === 'best_match'
        ? normalizedRecipeSearch
          ? diversifyMatchedRecipes([...filtered].sort(compareRecipeMatches), 2)
          : filtered
        : sortRecipes(filtered, sortBy);

    return rankCookMatches({
      matches: baseSorted,
      expiringIds,
      ratingPrefs,
      hiddenRecipeIds,
      childFriendlyOnly: hasChildren && childFriendlyOnly,
      household,
      festivalSelection,
      preserveCustomSort: sortBy !== 'best_match',
    });
  }, [
    matches,
    normalizedRecipeSearch,
    sortBy,
    expiringIds,
    ratingPrefs,
    hiddenRecipeIds,
    hasChildren,
    childFriendlyOnly,
    household,
    festivalSelection,
  ]);

  const seasonSummary = useMemo(
    () => getSeasonalHighlights(sortedStep4Matches, festivalSelection),
    [sortedStep4Matches, festivalSelection]
  );

  const activeStep4Matches = useMemo(() => {
    if (!shuffledOrderIds || shuffledOrderIds.length === 0) {
      return sortedStep4Matches;
    }
    const rank = new Map(shuffledOrderIds.map((id, idx) => [id, idx]));
    return [...sortedStep4Matches].sort((a, b) => {
      const idxA = rank.has(a.id) ? rank.get(a.id)! : Number.MAX_SAFE_INTEGER;
      const idxB = rank.has(b.id) ? rank.get(b.id)! : Number.MAX_SAFE_INTEGER;
      return idxA - idxB;
    });
  }, [sortedStep4Matches, shuffledOrderIds]);

  const handleShuffleSuggestions = () => {
    if (activeStep4Matches.length <= 1) return;
    const shuffled = shuffleEqualScoringRecipes(activeStep4Matches);
    setShuffledOrderIds(shuffled.map((r) => r.id));
  };

  const allAvailableSearchMatches = useMemo(() => {
    if (!normalizedRecipeSearch) return [];
    const searchableRecipes =
      aiKeyAvailable && !aiSessionDisabled
        ? [...RECIPES, ...savedAiRecipes]
        : RECIPES;
    return filterAvailableRecipes({
      recipes: searchableRecipes,
      diet: selection.diet,
      allergies,
      availableIngredientIds: selection.selectedIngredientIds,
      query: normalizedRecipeSearch,
      sortBy,
    });
  }, [
    normalizedRecipeSearch,
    aiKeyAvailable,
    aiSessionDisabled,
    savedAiRecipes,
    selection.diet,
    allergies,
    selection.selectedIngredientIds,
    sortBy,
  ]);

  const extraAvailableMatches = useMemo(() => {
    if (!normalizedRecipeSearch) return [];
    const step4Ids = new Set(activeStep4Matches.map((m) => m.id));
    return allAvailableSearchMatches.filter((m) => !step4Ids.has(m.id));
  }, [normalizedRecipeSearch, activeStep4Matches, allAvailableSearchMatches]);

  // Explicit tap-only AI recipe generator with debounce, abort signal, retry & safe validation
  const handleGenerateAi = async () => {
    if (!aiKeyAvailable || aiSessionDisabled || isGeneratingAi) return;

    const now = Date.now();
    if (now - lastAiTapRef.current < 500) return;
    lastAiTapRef.current = now;

    aiAbortRef.current?.abort();
    const controller = new AbortController();
    aiAbortRef.current = controller;

    setIsGeneratingAi(true);
    setActionToast(null);

    const res = await generateRecipes(
      {
        selectedIngredientIds: selection.selectedIngredientIds,
        diet: selection.diet,
        mealType: selection.mealType,
        allergies,
        adultsCount: household.adults,
        childrenCount: household.children.length,
      },
      controller.signal
    );

    if (aiAbortRef.current === controller) {
      aiAbortRef.current = null;
    }
    setIsGeneratingAi(false);

    if (res.ok) {
      onSaveAiRecipes(res.recipes);
      setActionToast({
        variant: 'success',
        message: `Added ${res.recipes.length} AI recipe ${
          res.recipes.length === 1 ? 'idea' : 'ideas'
        }.`,
      });
      return;
    }

    if (res.code === 'ABORTED') return;

    if (res.code === 'KEY_ERROR') {
      onDisableAiSession();
      setActionToast({
        variant: 'error',
        message: 'AI suggestions are not available right now',
      });
      return;
    }

    if (res.code === 'RATE_LIMIT') {
      setActionToast({
        variant: 'error',
        message: 'AI suggestions are busy right now. Try again in a minute.',
        actionLabel: 'Retry',
        onAction: () => {
          void handleGenerateAi();
        },
      });
      return;
    }

    if (res.code === 'NO_SAFE_RECIPES') {
      setActionToast({
        variant: 'error',
        message: 'No safe recipes were created. Try different ingredients.',
      });
      return;
    }

    setActionToast({
      variant: 'error',
      message: res.message,
      actionLabel: 'Retry',
      onAction: () => {
        void handleGenerateAi();
      },
    });
  };

  const handleCancelAi = () => {
    aiAbortRef.current?.abort();
    aiAbortRef.current = null;
    setIsGeneratingAi(false);
  };

  // Top 3 missing main ingredients from compatible recipes when matches is empty
  const topMissingForEmptyState = useMemo(() => {
    if (matches.length > 0) return [];

    const allergySet = new Set(allergies);
    const ownedMainSet = new Set(
      selection.selectedIngredientIds.filter(
        (id) => !getIngredientById(id)?.assumedAvailable
      )
    );
    const candidates: { score: number; missingIds: string[] }[] = [];

    for (const recipe of RECIPES) {
      if (!recipe.mealTypes.includes(selection.mealType)) continue;
      const evaluated = evaluateRecipeMatch(recipe, ownedMainSet, {
        diet: selection.diet,
        allergySet,
      });
      if (!evaluated) continue;
      candidates.push({
        score: evaluated.matchScore,
        missingIds: evaluated.missingIngredients.map((i) => i.ingredientId),
      });
    }

    candidates.sort((a, b) => b.score - a.score);
    const closestPool = candidates.slice(0, 6);
    const counts = new Map<string, number>();

    for (const entry of closestPool) {
      for (const id of entry.missingIds) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, count]) => ({
        id,
        name: getIngredientById(id)?.name ?? id,
        count,
      }));
  }, [
    matches.length,
    allergies,
    selection.selectedIngredientIds,
    selection.mealType,
    selection.diet,
  ]);

  const totalSelectedCount =
    selection.selectedIngredientIds.length + selection.customIngredients.length;
  const hasNoIngredientsSelected = totalSelectedCount === 0;
  const selectedMainCount = selection.selectedIngredientIds.filter(
    (id) => !getIngredientById(id)?.assumedAvailable
  ).length;

  useEffect(() => {
    const isEmptyStep4Visit = step === 4 && hasNoIngredientsSelected;
    if (isEmptyStep4Visit && !wasEmptyVisitRef.current) {
      setEmptyQuipIndex((prev) => {
        if (EMPTY_SELECTION_QUIPS.length <= 1) return 0;
        let next = Math.floor(Math.random() * EMPTY_SELECTION_QUIPS.length);
        if (next === prev) {
          next = (prev + 1) % EMPTY_SELECTION_QUIPS.length;
        }
        return next;
      });
    }
    wasEmptyVisitRef.current = isEmptyStep4Visit;
  }, [step, hasNoIngredientsSelected]);

  const displayedMatches = showAllMatches
    ? activeStep4Matches
    : activeStep4Matches.slice(0, 8);

  const renderRecipeCard = (match: RecipeMatch, showMealTags = false) => {
    const prep = Number(match.prepMinutes) || 0;
    const cook = Number(match.cookMinutes) || 0;
    const totalTime = prep + cook;
    const missingItems = Array.isArray(match.missingIngredients)
      ? match.missingIngredients
      : [];
    const missingCount = missingItems.length;
    const missingRequiredCount = getMissingRecipeIngredientsCount(
      match,
      selection.selectedIngredientIds,
      false
    );
    const ownedMainSet = new Set(
      selection.selectedIngredientIds.filter(
        (id) => !getIngredientById(id)?.assumedAvailable
      )
    );
    const usedItems = Array.isArray(match.usedSelectedIngredients)
      ? match.usedSelectedIngredients
      : match.ingredients.filter(
          (i) =>
            ownedMainSet.has(i.ingredientId) &&
            !getIngredientById(i.ingredientId)?.assumedAvailable
        );
    const usedNames = Array.from(
      new Set(
        usedItems.map(
          (item) =>
            getIngredientById(item.ingredientId)?.name ?? item.ingredientId
        )
      )
    );
    const missingNames = Array.from(
      new Set(
        missingItems.map(
          (item) =>
            getIngredientById(item.ingredientId)?.name ?? item.ingredientId
        )
      )
    );
    const proteinVal = match.nutritionPerServing?.protein;
    const hideAddButton = defaultDiet === 'veg' && match.diet === 'nonveg';
    const whyOpen = openWhyRecipeId === match.id;

    return (
      <div
        key={match.id}
        className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#EADFD2] hover:border-[#E4572E] transition-all flex flex-col group"
      >
        <button
          type="button"
          onClick={() => onSelectRecipe(match)}
          className="text-left flex-1 flex flex-col cursor-pointer"
        >
          <div className="relative overflow-hidden w-full">
            <RecipeVisual
              recipe={match}
              variant="card"
              showVisual={showVisuals}
              className="group-hover:scale-[1.02] transition-transform duration-200 motion-reduce:transform-none"
            />
          </div>

          <div className="p-4 pb-3 flex-1 flex flex-col justify-between gap-3 w-full">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(match.isAiGenerated || match.source === 'ai') && (
                      <span
                        aria-label="AI-generated recipe"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#6B3FA0] text-white text-[11px] font-semibold"
                      >
                        <Sparkles className="w-3 h-3" aria-hidden="true" />
                        <span>AI</span>
                      </span>
                    )}
                    {match.usesExpiringSoon && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FFF3D9] border border-[#E9A23B]/40 text-[#8F5300] text-[11px] font-semibold">
                        Use soon
                      </span>
                    )}
                    {match.festivalTag && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#C5411B]/10 text-[#B83915] text-[11px] font-semibold">
                        {match.festivalTag} pick
                      </span>
                    )}
                    {!match.festivalTag && match.seasonTag && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#1F6E42]/10 text-[#1F6E42] text-[11px] font-semibold">
                        In season · {match.seasonTag}
                      </span>
                    )}
                  </div>
                  <h2 className="font-heading text-lg font-semibold text-[#2B2B2B] leading-snug">
                    {safeDisplay(match.name)}
                  </h2>
                </div>
                <DietBadge diet={match.diet} showLabel={false} />
              </div>

              <p className="text-xs text-[#6B6B6B] mt-1">
                {safeDisplay(match.cuisine)}
                {showMealTags && Array.isArray(match.mealTypes) && match.mealTypes.length > 0 && (
                  <span className="capitalize"> · {match.mealTypes.join(' / ')}</span>
                )}
              </p>

              <div className="mt-2.5 space-y-1 text-xs leading-snug">
                <p className="text-[#1F6E42]">
                  <span className="font-semibold">Uses:</span>{' '}
                  <span className="text-[#2B2B2B]">
                    {usedNames.length > 0 ? usedNames.join(', ') : 'None selected'}
                  </span>
                </p>
                <p className="text-[#6B6B6B]">
                  <span className="font-semibold text-[#2B2B2B]">Missing:</span>{' '}
                  {missingNames.length > 0 ? missingNames.join(', ') : 'None'}
                </p>
              </div>

              {(match.isAiGenerated || match.source === 'ai') && (
                <p
                  role="note"
                  className="text-[11px] text-[#5B2E91] mt-2 leading-snug"
                >
                  {AI_DISCLAIMER_TEXT}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-[#F3EAE0] flex flex-wrap items-center justify-between gap-2 text-xs w-full">
              <div className="flex items-center gap-2 text-[#6B6B6B] tabular-nums">
                <span className="inline-flex items-center gap-1 text-[#2B2B2B] font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#E4572E]" aria-hidden="true" />
                  {totalTime > 0 ? `${totalTime} min` : '-'}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {typeof proteinVal === 'number' && !Number.isNaN(proteinVal)
                    ? `${proteinVal}g protein (Est.)`
                    : '-'}
                </span>
              </div>

              <div className="flex items-center gap-2 tabular-nums">
                <span className="font-semibold text-[#1F6E42]">
                  {safeDisplay(match.matchScore)}% match
                </span>
                <span className="text-[#6B6B6B]" aria-hidden="true">
                  ·
                </span>
                <span
                  className={
                    missingCount === 0
                      ? 'text-[#1F6E42] font-medium'
                      : 'text-[#6B6B6B]'
                  }
                >
                  {missingCount === 0 ? 'All ready' : `${missingCount} missing`}
                </span>
              </div>
            </div>
          </div>
        </button>

        {whyOpen && match.ratingBoostReason && (
          <div className="mx-4 mb-2 rounded-xl bg-[#FFF9F2] border border-[#EADFD2] px-3 py-2 text-xs text-[#2B2B2B]">
            <span className="font-semibold text-[#1F6E42]">Why boosted: </span>
            {match.ratingBoostReason}
          </div>
        )}

        {(Boolean(match.ratingBoostReason) ||
          Boolean(onHideRecipe) ||
          (!hideAddButton && missingRequiredCount > 0)) && (
          <div className="px-4 pb-3 pt-0 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {match.ratingBoostReason && (
                <button
                  type="button"
                  onClick={() =>
                    setOpenWhyRecipeId((prev) =>
                      prev === match.id ? null : match.id
                    )
                  }
                  aria-expanded={whyOpen}
                  className="min-h-[44px] px-2.5 rounded-xl text-xs font-medium text-[#1F6E42] hover:bg-[#1F6E42]/8 inline-flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Why this?</span>
                </button>
              )}
              {onHideRecipe && !(match.isAiGenerated || match.source === 'ai') && (
                <button
                  type="button"
                  onClick={() => {
                    onHideRecipe(match.id);
                    setActionToast({
                      variant: 'success',
                      message: `Hid "${safeDisplay(match.name)}". You can unhide it in Profile.`,
                    });
                  }}
                  className="min-h-[44px] px-2.5 rounded-xl text-xs font-medium text-[#6B6B6B] hover:text-[#A63429] hover:bg-[#A63429]/8 inline-flex items-center gap-1 cursor-pointer"
                >
                  <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Don&apos;t suggest again</span>
                </button>
              )}
            </div>

            {!hideAddButton && missingRequiredCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  const msg = onAddRecipeToList(
                    match,
                    false,
                    selection.selectedIngredientIds
                  );
                  setActionToast({ variant: 'success', message: msg });
                }}
                aria-label={`Add missing ingredients for ${safeDisplay(
                  match.name
                )} to grocery list`}
                className="min-h-[44px] px-3.5 rounded-xl bg-[#FFF9F2] border border-[#EADFD2] hover:border-[#2E8B57] hover:bg-[#2E8B57]/10 text-xs font-semibold text-[#1F623D] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ml-auto"
              >
                <ShoppingBasket className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add missing to list</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-36 sm:pb-8">
      {/* Top Real-Time Recipe Filter & Sort Bar */}
      <div
        role="search"
        aria-label="Filter and sort available recipes"
        className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-[#EADFD2] flex flex-col sm:flex-row sm:items-center gap-3"
      >
        <div className="relative flex-1 flex items-center">
          <label htmlFor="cook-recipe-search" className="sr-only">
            Filter recipes by title or ingredient names
          </label>
          <Search
            className="w-4 h-4 text-[#6B6B6B] absolute left-3.5 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="cook-recipe-search"
            type="search"
            value={recipeSearchQuery}
            onChange={(e) => setRecipeSearchQuery(e.target.value)}
            placeholder="Filter recipes by title or ingredients (e.g. poha, paneer, pyaz)..."
            className="w-full h-11 pl-10 pr-11 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm text-[#2B2B2B] placeholder:text-[#6B6B6B]"
          />
          {recipeSearchQuery.length > 0 && (
            <button
              type="button"
              onClick={() => setRecipeSearchQuery('')}
              aria-label="Clear recipe search"
              className="min-w-[44px] min-h-[44px] -mr-1 absolute right-0 flex items-center justify-center rounded-xl text-[#6B6B6B] hover:text-[#2B2B2B] cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="relative flex items-center sm:w-64 shrink-0">
          <label htmlFor="cook-recipe-sort" className="sr-only">
            Sort search results
          </label>
          <ArrowUpDown
            className="w-4 h-4 text-[#6B6B6B] absolute left-3.5 pointer-events-none"
            aria-hidden="true"
          />
          <select
            id="cook-recipe-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as RecipeSortOption)}
            className="w-full h-11 pl-10 pr-8 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm font-medium text-[#2B2B2B] cursor-pointer"
          >
            {RECIPE_SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top 4-Step Stepper */}
      <nav
        aria-label="Cooking steps"
        className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-[#EADFD2]"
      >
        <ol className="grid grid-cols-4 gap-2">
          {STEP_LABELS.map((item) => {
            const isActive = step === item.step;
            const isDone = step > item.step;
            return (
              <li key={item.step}>
                <button
                  type="button"
                  onClick={() => goToStep(item.step)}
                  className={`w-full min-h-[44px] px-2 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#C5411B] text-white'
                      : isDone
                      ? 'bg-[#1F6E42]/12 text-[#1F6E42] hover:bg-[#1F6E42]/20'
                      : 'bg-[#FFF9F2] text-[#6B6B6B] hover:text-[#2B2B2B]'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full text-xs flex items-center justify-center shrink-0 tabular-nums ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : isDone
                        ? 'bg-[#1F6E42] text-white'
                        : 'bg-[#EADFD2] text-[#2B2B2B]'
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-3 h-3" aria-hidden="true" />
                    ) : (
                      item.step
                    )}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Diet switch toast */}
      {dietToast && (
        <div
          role="status"
          className="bg-[#2E8B57]/10 border border-[#2E8B57]/30 text-[#1F623D] rounded-2xl p-4 flex items-start justify-between gap-3 text-sm"
        >
          <p>{dietToast}</p>
          <button
            type="button"
            onClick={() => setDietToast(null)}
            aria-label="Dismiss notice"
            className="min-w-[44px] min-h-[44px] -my-2 -mr-2 flex items-center justify-center rounded-xl hover:bg-[#2E8B57]/10 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Quick Search Results Panel when searching during Steps 1-3 */}
      {step < 4 && normalizedRecipeSearch && (
        <section
          aria-label="Recipe search results"
          className="space-y-4 bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#EADFD2]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-heading text-lg sm:text-xl font-bold text-[#2B2B2B]">
                {allAvailableSearchMatches.length} available{' '}
                {allAvailableSearchMatches.length === 1 ? 'recipe' : 'recipes'} for &ldquo;
                {recipeSearchQuery.trim()}&rdquo;
              </p>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Filtered by your {selection.diet === 'veg' ? 'vegetarian' : 'non-vegetarian'}{' '}
                diet and allergy settings.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRecipeSearchQuery('')}
              className="min-h-[44px] px-3.5 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] hover:border-[#2B2B2B] text-xs font-semibold text-[#2B2B2B] cursor-pointer"
            >
              Clear search
            </button>
          </div>

          {allAvailableSearchMatches.length === 0 ? (
            <p className="text-sm text-[#6B6B6B] py-4">
              No available recipes match &ldquo;{recipeSearchQuery.trim()}&rdquo; under
              your current diet and allergy filters.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allAvailableSearchMatches.slice(0, 8).map((match) =>
                renderRecipeCard(match, true)
              )}
            </div>
          )}
        </section>
      )}

      {/* STEP 1: DIET TYPE */}
      {step === 1 && (
        <section className="space-y-6">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2B2B2B]">
              Choose your diet preference
            </h1>
            <p className="text-sm sm:text-base text-[#6B6B6B] mt-1">
              Vegetarian excludes meat, poultry, fish, and meat-based stocks while
              keeping eggs available.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleDietSelect('veg')}
              className={`text-left p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-4 min-h-[168px] ${
                selection.diet === 'veg'
                  ? 'bg-white border-[#2E8B57] shadow-sm ring-2 ring-[#2E8B57]/20'
                  : 'bg-white border-[#EADFD2] hover:border-[#2E8B57]/50'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <DietBadge diet="veg" size="md" />
                {selection.diet === 'veg' && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F6E42]">
                    <Check className="w-4 h-4" aria-hidden="true" /> Selected
                  </span>
                )}
              </div>
              <div>
                <h2 className="font-heading text-xl font-semibold text-[#2B2B2B]">
                  Vegetarian (includes eggs)
                </h2>
                <p className="text-sm text-[#6B6B6B] mt-1">
                  Fresh vegetables, lentils, paneer, grains, dairy, and egg dishes.
                  Hides meat and fish ingredients.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleDietSelect('nonveg')}
              className={`text-left p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-4 min-h-[168px] ${
                selection.diet === 'nonveg'
                  ? 'bg-white border-[#E4572E] shadow-sm ring-2 ring-[#E4572E]/20'
                  : 'bg-white border-[#EADFD2] hover:border-[#E4572E]/50'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <DietBadge diet="nonveg" size="md" />
                {selection.diet === 'nonveg' && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#B83915]">
                    <Check className="w-4 h-4" aria-hidden="true" /> Selected
                  </span>
                )}
              </div>
              <div>
                <h2 className="font-heading text-xl font-semibold text-[#2B2B2B]">
                  Non-vegetarian
                </h2>
                <p className="text-sm text-[#6B6B6B] mt-1">
                  Includes chicken, fish, prawns, and mutton alongside all vegetarian
                  options.
                </p>
              </div>
            </button>
          </div>

          <div className="hidden sm:flex justify-end">
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="h-12 px-6 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Continue to meal type</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </section>
      )}

      {/* STEP 2: MEAL TYPE */}
      {step === 2 && (
        <section className="space-y-6">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2B2B2B]">
              Which meal are you making?
            </h1>
            <p className="text-sm sm:text-base text-[#6B6B6B] mt-1">
              Pick a meal slot to tailor portion sizes and recipe timing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]).map(
              (mealKey) => {
                const meta = MEAL_TYPE_META[mealKey];
                const isSelected = selection.mealType === mealKey;
                return (
                  <button
                    key={mealKey}
                    type="button"
                    onClick={() => handleMealSelect(mealKey)}
                    className={`text-left p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 min-h-[124px] ${
                      isSelected
                        ? 'bg-white border-[#E4572E] shadow-sm ring-2 ring-[#E4572E]/20'
                        : 'bg-white border-[#EADFD2] hover:border-[#E4572E]/50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#FFF9F2] border border-[#F0E6DA] flex items-center justify-center shrink-0">
                      {MEAL_ICONS[mealKey]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="font-heading text-lg font-semibold text-[#2B2B2B]">
                          {meta.label}
                        </h2>
                        {isSelected && (
                          <span className="text-xs font-semibold text-[#B83915] inline-flex items-center gap-1">
                            <Check className="w-4 h-4" aria-hidden="true" /> Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-[#B83915] mt-0.5">
                        {meta.hint}
                      </p>
                      <p className="text-sm text-[#6B6B6B] mt-1.5">
                        {meta.description}
                      </p>
                    </div>
                  </button>
                );
              }
            )}
          </div>

          <div className="hidden sm:flex items-center justify-between">
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="h-12 px-5 rounded-xl border border-[#DFD3C5] bg-white hover:bg-[#FFF9F2] text-[#2B2B2B] font-medium inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => goToStep(3)}
              className="h-12 px-6 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Select ingredients</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </section>
      )}

      {/* STEP 3: INGREDIENTS */}
      {step === 3 && (
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2B2B2B]">
                What&apos;s in your kitchen?
              </h1>
              <p className="text-sm text-[#6B6B6B] mt-1">
                Tap what you have on hand. Pantry basics (salt, oil, water, common
                spices) are assumed available unless unchecked.
              </p>
            </div>
            <div className="text-sm font-semibold text-[#1F6E42] tabular-nums whitespace-nowrap shrink-0">
              {totalSelectedCount} ingredient{totalSelectedCount === 1 ? '' : 's'}{' '}
              selected
            </div>
          </div>

          {/* Feature 5: Expiring-soon Use soon strip at top of Step 3 */}
          {expiringSoonItems.length > 0 && (
            <div className="bg-[#FFF8EC] border border-[#E9A23B]/45 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-heading text-sm font-bold text-[#8F5300]">
                  Use soon ({expiringSoonItems.length})
                </span>
                <span className="text-xs text-[#6B6B6B]">
                  Selected items with 2 days or less left
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {expiringSoonItems.map((item) => (
                  <span
                    key={item.ingredientId}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-[#E9A23B]/40 text-xs font-medium text-[#2B2B2B]"
                  >
                    <span className="font-semibold">{safeDisplay(item.name)}</span>
                    <span className="text-[#8F5300]">· {item.label}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#EADFD2] space-y-4">
            {/* Search & Presets */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  className="w-4 h-4 text-[#6B6B6B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <label htmlFor="ingredient-search" className="sr-only">
                  Search ingredients
                </label>
                <input
                  ref={ingredientSearchRef}
                  id="ingredient-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ingredients or aliases (e.g. pyaz, aloo, palak)..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm text-[#2B2B2B] placeholder:text-[#6B6B6B]"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={applyPantryBasics}
                  className="h-11 px-4 rounded-xl bg-[#2E8B57]/12 hover:bg-[#2E8B57]/20 text-[#1F623D] text-sm font-medium whitespace-nowrap transition-colors cursor-pointer"
                >
                  Pantry basics
                </button>
                <button
                  type="button"
                  onClick={clearIngredients}
                  className="h-11 px-3.5 rounded-xl border border-[#DFD3C5] hover:bg-[#FFF9F2] text-[#6B6B6B] hover:text-[#2B2B2B] text-sm font-medium inline-flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Category Tabs */}
            {!normalizedSearch && (
              <div
                className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
                role="tablist"
                aria-label="Ingredient categories"
              >
                {visibleCategories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  const countInCat = INGREDIENTS.filter(
                    (i) =>
                      i.category === cat.id &&
                      (selection.diet === 'nonveg' || i.isVeg) &&
                      selection.selectedIngredientIds.includes(i.id)
                  ).length;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`min-h-[44px] px-3.5 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#2B2B2B] text-white'
                          : 'bg-[#FFF9F2] text-[#6B6B6B] hover:text-[#2B2B2B] border border-[#EADFD2]'
                      }`}
                    >
                      <span>{cat.label}</span>
                      {countInCat > 0 && (
                        <span
                          className={`text-xs tabular-nums ${
                            isActive ? 'text-white/90' : 'text-[#1F6E42]'
                          }`}
                        >
                          ({countInCat})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Reusable ChipGroup */}
            <ChipGroup
              ingredients={filteredIngredients}
              selectedIds={selection.selectedIngredientIds}
              onToggle={toggleIngredient}
              emptyMessage={`No ingredients match "${debouncedSearchQuery.trim()}". Add it below as a custom item.`}
              showIngredientImages={showIngredientImages}
            />

            {/* Feature 5: Optional Bought-on tracker for selected perishables */}
            {onUpdatePantryDate && selectedPerishables.length > 0 && (
              <div className="pt-3 border-t border-[#F0E6DA] space-y-2.5">
                <button
                  type="button"
                  onClick={() => setShowPantryDates((v) => !v)}
                  aria-expanded={showPantryDates}
                  className="min-h-[44px] w-full flex items-center justify-between gap-2 px-3 rounded-xl bg-[#FFF9F2] border border-[#EADFD2] text-left text-xs sm:text-sm font-medium text-[#2B2B2B] cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#C5411B]" aria-hidden="true" />
                    <span>
                      Optional: Set &ldquo;Bought on&rdquo; dates for fresh items (
                      {selectedPerishables.length})
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-[#C5411B]">
                    {showPantryDates ? 'Hide' : 'Edit dates'}
                  </span>
                </button>

                {showPantryDates && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {selectedPerishables.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-[#EADFD2] bg-[#FFF9F2]"
                      >
                        <div className="min-w-0">
                          <span className="block text-xs font-semibold text-[#2B2B2B] truncate">
                            {item.name}
                          </span>
                          <span className="block text-[11px] text-[#6B6B6B]">
                            Typical life: {item.shelfLifeDays} days
                          </span>
                        </div>
                        <input
                          type="date"
                          aria-label={`Bought on date for ${item.name}`}
                          value={item.boughtOn}
                          onChange={(e) =>
                            onUpdatePantryDate(item.id, e.target.value)
                          }
                          className="h-10 px-2 rounded-lg border border-[#DFD3C5] bg-white text-xs text-[#2B2B2B] shrink-0"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Add your own ingredient */}
            <form
              onSubmit={handleAddCustomIngredient}
              className="pt-3 border-t border-[#F0E6DA] flex flex-col sm:flex-row gap-2.5"
            >
              <label htmlFor="custom-ingredient-input" className="sr-only">
                Add your own ingredient
              </label>
              <input
                id="custom-ingredient-input"
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Add your own ingredient (matches catalog aliases or adds custom item)..."
                className="flex-1 h-11 px-3.5 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm text-[#2B2B2B] placeholder:text-[#6B6B6B]"
              />
              <button
                type="submit"
                className="h-11 px-4 rounded-xl bg-[#2B2B2B] hover:bg-[#1A1A1A] text-white text-sm font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add your own</span>
              </button>
            </form>

            {/* Custom Items Selection Bar */}
            {selection.customIngredients.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex flex-wrap gap-2">
                  {selection.customIngredients.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => removeCustomIngredient(item)}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#1F6E42] text-white text-sm font-medium inline-flex items-center gap-2 cursor-pointer"
                      aria-label={`Remove ${item}`}
                    >
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{item}</span>
                      <X className="w-3.5 h-3.5 opacity-90" aria-hidden="true" />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[#6B6B6B]">
                  Custom items are not used in matching yet.
                </p>
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center justify-between">
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="h-12 px-5 rounded-xl border border-[#DFD3C5] bg-white hover:bg-[#FFF9F2] text-[#2B2B2B] font-medium inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => goToStep(4)}
              className="h-12 px-6 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>See matching recipes ({matches.length})</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </section>
      )}

      {/* STEP 4: RESULTS */}
      {step === 4 && (
        <section className="space-y-5">
          {/* Sticky Summary Bar */}
          <div className="sticky top-2 z-20 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-sm border border-[#EADFD2] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-[#2B2B2B]">
              <DietBadge diet={selection.diet} />
              <span className="text-[#6B6B6B]" aria-hidden="true">
                ·
              </span>
              <span className="font-medium capitalize">{selection.mealType}</span>
              <span className="text-[#6B6B6B]" aria-hidden="true">
                ·
              </span>
              <span className="text-[#6B6B6B] tabular-nums">
                {formatServingsLabel(totalServings)} servings
              </span>
              <span className="text-[#6B6B6B]" aria-hidden="true">
                ·
              </span>
              <span className="text-[#6B6B6B] tabular-nums">
                {totalSelectedCount} ingredients
              </span>
            </div>

            <button
              type="button"
              onClick={() => goToStep(3)}
              className="min-h-[44px] px-3 rounded-xl text-sm font-medium text-[#B83915] hover:bg-[#E4572E]/8 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" aria-hidden="true" />
              <span>Edit</span>
            </button>
          </div>

          {/* Feature 4: Active Leftovers card */}
          {activeLeftovers.length > 0 && (
            <section
              aria-label="Leftovers in your fridge"
              className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#EADFD2] space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-heading text-base sm:text-lg font-bold text-[#2B2B2B] inline-flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-[#C5411B]" aria-hidden="true" />
                  <span>Leftovers on hand ({activeLeftovers.length})</span>
                </h2>
                <span className="text-xs text-[#6B6B6B]">
                  Expiring soonest shown first
                </span>
              </div>
              <ul className="divide-y divide-[#F3EAE0]">
                {activeLeftovers.map((lo) => {
                  const recName =
                    recipeNameLookup.get(lo.recipeId)?.name || lo.recipeId;
                  return (
                    <li
                      key={lo.id}
                      className="py-2.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-heading font-semibold text-sm text-[#2B2B2B]">
                            {safeDisplay(recName)}
                          </span>
                          {lo.isPastKeepUntil ? (
                            <span className="px-2 py-0.5 rounded-md bg-[#E4572E]/12 text-[#A63429] text-[11px] font-semibold">
                              Check before eating
                            </span>
                          ) : (
                            lo.isExpiringWithinOneDay && (
                              <span className="px-2 py-0.5 rounded-md bg-[#FFF3D9] text-[#8F5300] text-[11px] font-semibold">
                                Finish soon
                              </span>
                            )
                          )}
                        </div>
                        <p className="text-xs text-[#6B6B6B] tabular-nums">
                          {lo.portions}{' '}
                          {lo.portions === 1 ? 'portion' : 'portions'} left · Keep
                          until {lo.keepUntil}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {onEatLeftover && (
                          <button
                            type="button"
                            onClick={() => onEatLeftover(lo.id)}
                            className="min-h-[44px] px-3.5 rounded-xl bg-[#1F6E42] hover:bg-[#185734] text-white text-xs font-heading font-semibold cursor-pointer"
                          >
                            Eat this
                          </button>
                        )}
                        {onMarkLeftoverUsedUp && (
                          <button
                            type="button"
                            onClick={() => onMarkLeftoverUsedUp(lo.id)}
                            className="min-h-[44px] px-3 rounded-xl border border-[#DFD3C5] hover:border-[#2B2B2B] text-xs font-medium text-[#2B2B2B] cursor-pointer"
                          >
                            Used up
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {hasNoIngredientsSelected ? (
            <div
              role="region"
              aria-label="No ingredients selected"
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#EADFD2] text-center max-w-xl mx-auto space-y-5"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#FFF3D9] border border-[#EADFD2] text-[#C5411B] flex items-center justify-center mx-auto">
                <ShoppingBasket className="w-7 h-7" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h1 className="font-heading text-2xl font-bold text-[#2B2B2B]">
                  No ingredients picked yet
                </h1>
                <p className="text-sm sm:text-base text-[#6B6B6B] leading-relaxed">
                  {EMPTY_SELECTION_QUIPS[emptyQuipIndex] ?? EMPTY_SELECTION_QUIPS[0]}
                </p>
              </div>
              <button
                type="button"
                onClick={handleGoToIngredients}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Go to Ingredients</span>
              </button>
            </div>
          ) : (
            <>
              {/* Feature 13: In season / Festival highlights banner (never hides dishes) */}
              <div className="bg-[#EEF7F1] border border-[#1F6E42]/25 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <p className="font-heading font-semibold text-[#1F6E42] text-sm">
                    In season now: {seasonSummary.season.label} (
                    {seasonSummary.season.monthsHint})
                    {seasonSummary.festival.active &&
                      ` · ${seasonSummary.festival.label} picks active (${seasonSummary.festival.daysLeft}d left)`}
                  </p>
                  <p className="text-[#2B2B2B]">
                    {seasonSummary.matchingSeasonal.length} seasonal and{' '}
                    {seasonSummary.matchingFestival.length} festival-tagged dishes
                    highlighted below.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2B2B2B]">
                    {normalizedRecipeSearch
                      ? `${activeStep4Matches.length} of ${matches.length} matching ${
                          matches.length === 1 ? 'recipe' : 'recipes'
                        } for "${recipeSearchQuery.trim()}"`
                      : isClosestMatchesMode
                      ? 'Closest matches'
                      : activeStep4Matches.length > 0
                      ? `${activeStep4Matches.length} matching recipe${
                          activeStep4Matches.length === 1 ? '' : 's'
                        }`
                      : 'No matching recipes'}
                  </h1>
                  <p className="text-sm text-[#6B6B6B] mt-0.5">
                    {isClosestMatchesMode && !normalizedRecipeSearch
                      ? `Fewer than 3 ${selection.mealType} recipes reached a 50% match, so here are the top ${activeStep4Matches.length} closest matches for your selected ingredients.`
                      : 'Tap one recipe to inspect scaled ingredients, timers, and estimated nutrition.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {hasChildren && (
                    <button
                      type="button"
                      onClick={() => setChildFriendlyOnly((v) => !v)}
                      aria-pressed={childFriendlyOnly}
                      className={`min-h-[44px] px-3.5 rounded-xl border text-sm font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                        childFriendlyOnly
                          ? 'bg-[#1F6E42] border-[#1F6E42] text-white font-semibold'
                          : 'bg-white border-[#DFD3C5] text-[#2B2B2B] hover:border-[#1F6E42]'
                      }`}
                    >
                      <Baby className="w-4 h-4" aria-hidden="true" />
                      <span>Child-friendly</span>
                    </button>
                  )}

                  {activeStep4Matches.length > 1 && (
                    <button
                      type="button"
                      onClick={handleShuffleSuggestions}
                      className="min-h-[44px] px-4 rounded-xl border border-[#DFD3C5] bg-white hover:bg-[#FFF9F2] hover:border-[#2B2B2B] text-sm font-semibold text-[#2B2B2B] inline-flex items-center gap-2 transition-colors cursor-pointer shrink-0"
                    >
                      <Shuffle className="w-4 h-4 text-[#E4572E]" aria-hidden="true" />
                      <span>Shuffle suggestions</span>
                    </button>
                  )}
                </div>
              </div>

              {hasChildren && (
                <p className="text-xs text-[#6B6B6B]">
                  {CHILD_GUIDANCE_DISCLAIMER}
                </p>
              )}

              {activeStep4Matches.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {displayedMatches.map((match) => renderRecipeCard(match, false))}
                  </div>

                  {activeStep4Matches.length > 8 && (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => setShowAllMatches((s) => !s)}
                        className="h-11 px-5 rounded-xl border border-[#DFD3C5] bg-white hover:bg-[#FFF9F2] text-sm font-medium text-[#2B2B2B] cursor-pointer"
                      >
                        {showAllMatches
                          ? 'Show top 8 matches'
                          : `Show all ${activeStep4Matches.length} matches`}
                      </button>
                    </div>
                  )}

                  {normalizedRecipeSearch && extraAvailableMatches.length > 0 && (
                    <div className="pt-2 space-y-3">
                      <h2 className="font-heading text-base font-semibold text-[#2B2B2B]">
                        Also matches in other meal types or partial pantry ({extraAvailableMatches.length})
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {extraAvailableMatches.slice(0, 6).map((match) =>
                          renderRecipeCard(match, true)
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : normalizedRecipeSearch ? (
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#EADFD2] space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-heading text-xl font-semibold text-[#2B2B2B]">
                        No {selection.mealType} matches for &ldquo;{recipeSearchQuery.trim()}&rdquo;
                      </h2>
                      <p className="text-sm text-[#6B6B6B] mt-1">
                        {extraAvailableMatches.length > 0
                          ? `Found ${extraAvailableMatches.length} available ${
                              extraAvailableMatches.length === 1 ? 'recipe' : 'recipes'
                            } in other meal types or under 50% pantry match.`
                          : 'Try another recipe name, ingredient, or clear the search filter.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRecipeSearchQuery('')}
                      className="min-h-[44px] px-4 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] hover:border-[#2B2B2B] text-sm font-medium text-[#2B2B2B] cursor-pointer"
                    >
                      Clear search
                    </button>
                  </div>

                  {extraAvailableMatches.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {extraAvailableMatches.slice(0, 6).map((match) =>
                        renderRecipeCard(match, true)
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#EADFD2] space-y-5">
                  <div>
                    <h2 className="font-heading text-xl font-semibold text-[#2B2B2B]">
                      {selectedMainCount === 0
                        ? 'Pick at least one main ingredient'
                        : `No ${selection.mealType} recipes use your selected ingredients`}
                    </h2>
                    <p className="text-sm text-[#6B6B6B] mt-1">
                      {selectedMainCount === 0
                        ? 'Pantry staples like salt, oil, water, and common spices are already assumed available. Pick at least one vegetable, grain, dairy, egg, or protein to match recipes.'
                        : 'None of our recipes in this meal type use what you currently selected. Try adding one of these popular ingredients or switching meal types:'}
                    </p>
                  </div>

                  {topMissingForEmptyState.length > 0 ? (
                    <div className="flex flex-wrap gap-2.5">
                      {topMissingForEmptyState.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleIngredient(item.id)}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#FFF9F2] hover:bg-[#2E8B57] hover:text-white border border-[#DFD3C5] hover:border-[#2E8B57] text-sm font-medium text-[#2B2B2B] inline-flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" aria-hidden="true" />
                          <span>{safeDisplay(item.name)}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleGoToIngredients}
                        className="min-h-[44px] px-5 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold text-sm inline-flex items-center gap-2 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                        <span>Pick ingredients</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* AI Generation Loading Skeleton */}
              {isGeneratingAi && (
                <div
                  role="status"
                  aria-live="polite"
                  aria-busy="true"
                  className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#6B3FA0]/30 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-sm font-medium text-[#5B2E91]">
                      <Sparkles className="w-4 h-4 animate-pulse shrink-0" aria-hidden="true" />
                      <span>Creating recipes for your ingredients...</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelAi}
                      className="min-h-[44px] px-4 rounded-xl border border-[#DFD3C5] hover:border-[#2B2B2B] text-sm font-medium text-[#2B2B2B] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-pulse">
                    {[1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-[#FFF9F2] border border-[#EADFD2] space-y-2.5"
                      >
                        <div className="h-4 bg-[#E9DDD0] rounded w-3/4" />
                        <div className="h-3 bg-[#E9DDD0] rounded w-1/2" />
                        <div className="h-3 bg-[#E9DDD0] rounded w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Automatic AI Suggestion Prompt when < 3 built-in recipes match */}
              {aiKeyAvailable &&
                !aiSessionDisabled &&
                !isGeneratingAi &&
                builtInMatches.length < 3 && (
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#6B3FA0]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-heading text-base font-semibold text-[#2B2B2B]">
                        Want more ideas? Generate recipes from your ingredients.
                      </p>
                      <p className="text-xs text-[#6B6B6B]">
                        Uses only your selected ingredients, diet, meal type, and allergy settings.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateAi}
                      aria-label="Generate AI recipes from your ingredients"
                      aria-busy={isGeneratingAi}
                      className="min-h-[44px] px-4 rounded-xl bg-[#6B3FA0] hover:bg-[#5B2E91] text-white font-heading font-semibold text-sm inline-flex items-center justify-center gap-2 shrink-0 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" aria-hidden="true" />
                      <span>Generate recipes</span>
                    </button>
                  </div>
                )}

              {/* Manual "Need more ideas" button always visible at the bottom when key is available */}
              {aiKeyAvailable && !aiSessionDisabled && (
                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    onClick={handleGenerateAi}
                    disabled={isGeneratingAi}
                    aria-label="Need more ideas: generate recipes with AI"
                    aria-busy={isGeneratingAi}
                    className="min-h-[44px] px-5 rounded-xl border border-[#6B3FA0]/40 bg-white hover:bg-[#6B3FA0]/8 disabled:opacity-50 disabled:cursor-not-allowed text-[#5B2E91] font-heading font-semibold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                    <span>Need more ideas</span>
                  </button>
                </div>
              )}

              <div className="hidden sm:flex justify-start">
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="h-12 px-5 rounded-xl border border-[#DFD3C5] bg-white hover:bg-[#FFF9F2] text-[#2B2B2B] font-medium inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  <span>Adjust ingredients</span>
                </button>
              </div>
            </>
          )}
        </section>
      )}

          {/* Mobile Sticky Bottom Continue Bar for Steps 1–3 */}
      {step < 4 && (
        <div className="sm:hidden fixed bottom-16 left-0 right-0 z-20 px-4 py-2.5 bg-gradient-to-t from-[#FFF9F2] via-[#FFF9F2] to-[#FFF9F2]/80">
          <button
            type="button"
            onClick={() => goToStep((step + 1) as 2 | 3 | 4)}
            className="w-full h-12 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] active:scale-[0.99] text-white font-heading font-semibold text-base shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>
              {step === 1
                ? 'Continue to meal'
                : step === 2
                ? 'Continue to ingredients'
                : `See recipes (${matches.length})`}
            </span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}
      <Toast
        message={actionToast?.message ?? null}
        variant={actionToast?.variant ?? 'success'}
        actionLabel={actionToast?.actionLabel}
        onAction={actionToast?.onAction}
        onDismiss={() => setActionToast(null)}
      />
    </div>
  );
};
