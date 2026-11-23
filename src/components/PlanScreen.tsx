import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarPlus,
  Check,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Copy,
  Plus,
  Printer,
  RotateCcw,
  Search,
  ShoppingBasket,
  SkipForward,
  Sparkles,
  Target,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { RECIPES, getIngredientById } from '../recipes.js';
import { recipeMatchesQuery } from '../utils/recipeSearch.js';
import {
  AllergyKey,
  CookedMeal,
  DietType,
  Household,
  MealType,
  PlannedMeal,
  PlannedMealStatus,
  PriceMap,
  Recipe,
  WeeklyNutritionGoal,
} from '../types/cook';
import { AI_DISCLAIMER_TEXT } from '../utils/aiRecipes.js';
import { estimatePlanCost, formatInr } from '../utils/budgetUtils.js';
import {
  addDays,
  formatDate,
  formatRangeHeading,
  parseLocalDate,
} from '../utils/calendarHelpers.js';
import {
  calculateHouseholdServings,
  formatServingsLabel,
} from '../utils/nutrition';
import { getMissingRecipeIngredientsCount } from '../utils/groceryUtils.js';
import {
  MAX_RECIPES_PER_SLOT,
  PLAN_MEAL_TYPES,
  addWeekMissingToGrocery,
  buildPrintableWeekSchedule,
  canAddToSlot,
  computeWeekNutritionSummary,
  computeWeekSummary,
  evaluateWeeklyNutritionGoal,
  generateAutoPlanWeek,
  getPlanWeekDays,
  getSlotMeals,
  isPastPlannedReminder,
} from '../utils/planUtils.js';
import { DayNutritionSummaryCard } from './DayNutritionSummaryCard';
import { Dialog } from './Dialog';
import { DietBadge } from './DietBadge';
import { PrintableWeekPoster, PrintWeekLayout } from './PrintableWeekPoster';
import { RecipeVisual } from './RecipeVisual.jsx';
import { Toast } from './Toast';

interface PlanScreenProps {
  plannedMeals: PlannedMeal[];
  cookedMeals?: CookedMeal[];
  household: Household;
  defaultDiet: DietType;
  allergies: AllergyKey[];
  ownedIngredientIds: string[];
  prices: PriceMap;
  showCost: boolean;
  showVisuals?: boolean;
  weeklyNutritionGoal?: WeeklyNutritionGoal | null;
  onUpdateWeeklyNutritionGoal?: (goal: WeeklyNutritionGoal | null) => void;
  aiRecipes?: Recipe[];
  storageUnavailable: boolean;
  onAddPlannedMeal: (input: {
    date: string;
    mealType: MealType;
    recipeId: string;
    servings: number;
  }) => { error: string | null };
  onApplyAutoPlan?: (nextPlannedMeals: PlannedMeal[]) => void;
  onUpdateStatus: (planId: string, status: PlannedMealStatus) => void;
  onRemoveMeal: (planId: string) => void;
  onCopyLastWeek: (targetMondayIso: string) => {
    copiedCount: number;
    skippedCount: number;
    sourceCount: number;
  };
  onAddWeekMissingToGrocery: (weekDateIsos: string[]) => number;
  onAddRecipeToList?: (
    recipe: Recipe,
    includeOptional?: boolean,
    ownedIngredientIds?: string[]
  ) => string;
  onCookPlannedMeal: (meal: PlannedMeal) => void;
  onGoToGroceryEditPrices: () => void;
}

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  dinner: 'Dinner',
};

function safeText(val: unknown): string {
  if (val === undefined || val === null) return '-';
  if (typeof val === 'number' && Number.isNaN(val)) return '-';
  const str = String(val).trim();
  return str.length > 0 ? str : '-';
}

/**
 * Weekly Meal Plan screen with Monday-Sunday 4-meal-type slots,
 * 3-recipe per slot cap, copy last week, grocery integration, and cook handoff.
 */
export const PlanScreen: React.FC<PlanScreenProps> = ({
  plannedMeals,
  cookedMeals = [],
  defaultDiet,
  allergies,
  ownedIngredientIds,
  prices,
  showCost,
  showVisuals = true,
  weeklyNutritionGoal = null,
  onUpdateWeeklyNutritionGoal,
  aiRecipes = [],
  storageUnavailable,
  onAddPlannedMeal,
  onApplyAutoPlan,
  onUpdateStatus,
  onRemoveMeal,
  onCopyLastWeek,
  onAddWeekMissingToGrocery,
  onCookPlannedMeal,
  onAddRecipeToList,
  onGoToGroceryEditPrices,
  household,
}) => {
  const todayIso = useMemo(() => formatDate(new Date()), []);
  const [weekAnchorIso, setWeekAnchorIso] = useState<string>(() => todayIso);

  const [pickerSlot, setPickerSlot] = useState<{
    date: string;
    mealType: MealType;
    dayLabel: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [planSearchQuery, setPlanSearchQuery] = useState('');
  const [quickPlanTargets, setQuickPlanTargets] = useState<
    Record<string, { date?: string; mealType?: MealType }>
  >({});
  const [showAllMealTypes, setShowAllMealTypes] = useState(false);
  const [nutritionScope, setNutritionScope] = useState<'household' | 'perServing'>('household');
  const [slotError, setSlotError] = useState<string | null>(null);
  const [autoFillOpen, setAutoFillOpen] = useState(false);
  const [autoEmptyOnly, setAutoEmptyOnly] = useState(true);
  const [autoDietMix, setAutoDietMix] = useState<'balanced' | 'veg_only'>('balanced');
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printLayout, setPrintLayout] = useState<PrintWeekLayout>('landscape_grid');
  const [printShowTimes, setPrintShowTimes] = useState(true);
  const [printIncludeGroceries, setPrintIncludeGroceries] = useState(true);
  const [printIncludeNotes, setPrintIncludeNotes] = useState(true);
  const [printIncludeSkipped, setPrintIncludeSkipped] = useState(false);
  const [localGoal, setLocalGoal] = useState<WeeklyNutritionGoal | null>(null);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [goalMinInput, setGoalMinInput] = useState('12600');
  const [goalMaxInput, setGoalMaxInput] = useState('15400');
  const [goalProteinInput, setGoalProteinInput] = useState('350');
  const [goalScopeInput, setGoalScopeInput] = useState<'perServing' | 'household'>('perServing');
  const [goalFormError, setGoalFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    variant: 'success' | 'error';
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);

  const recipeMap = useMemo(() => {
    const map = new Map<string, Recipe>();
    for (const r of RECIPES) {
      map.set(r.id, r);
    }
    for (const r of aiRecipes) {
      map.set(r.id, r);
    }
    return map;
  }, [aiRecipes]);

  const todayCookedMeals = useMemo(
    () => cookedMeals.filter((m) => m.date === todayIso),
    [cookedMeals, todayIso]
  );

  const weekDays = useMemo(() => getPlanWeekDays(weekAnchorIso), [weekAnchorIso]);
  const weekDateIsos = useMemo(() => weekDays.map((d) => d.iso), [weekDays]);
  const weekMondayIso = weekDays[0]?.iso ?? todayIso;

  const weekHeading = useMemo(() => {
    const anchor = weekDays[0]?.date ?? parseLocalDate(weekAnchorIso);
    return formatRangeHeading('week', anchor, weekMondayIso);
  }, [weekDays, weekAnchorIso, weekMondayIso]);

  const summary = useMemo(
    () => computeWeekSummary(plannedMeals, weekDateIsos, recipeMap),
    [plannedMeals, weekDateIsos, recipeMap]
  );

  const weekNutrition = useMemo(
    () => computeWeekNutritionSummary(plannedMeals, weekDateIsos, recipeMap),
    [plannedMeals, weekDateIsos, recipeMap]
  );

  const weekMissingItems = useMemo(
    () =>
      addWeekMissingToGrocery(
        [],
        plannedMeals,
        weekDateIsos,
        recipeMap,
        household,
        ownedIngredientIds
      ).nextGroceryList,
    [plannedMeals, weekDateIsos, recipeMap, household, ownedIngredientIds]
  );

  const weekCost = useMemo(
    () => estimatePlanCost(weekMissingItems, prices),
    [weekMissingItems, prices]
  );

  // Compute household servings multiplier consistently via recipes.js scaleServings
  const estimatedServings = useMemo(
    () => calculateHouseholdServings(household),
    [household]
  );

  const activeNutritionGoal = onUpdateWeeklyNutritionGoal
    ? weeklyNutritionGoal
    : localGoal ?? weeklyNutritionGoal;

  const goalScope = activeNutritionGoal?.scope === 'household' ? 'household' : 'perServing';
  const goalTotalsSource =
    goalScope === 'household' ? weekNutrition.household : weekNutrition.perServing;

  const goalEvaluation = useMemo(
    () =>
      evaluateWeeklyNutritionGoal(
        weekNutrition.countedNutritionMeals > 0 ? goalTotalsSource.calories : 0,
        activeNutritionGoal,
        weekNutrition.countedNutritionMeals > 0 ? goalTotalsSource.protein : null
      ),
    [weekNutrition.countedNutritionMeals, goalTotalsSource, activeNutritionGoal]
  );

  const handleOpenGoalDialog = () => {
    const existing = activeNutritionGoal;
    const defaultScale = goalScope === 'household' ? Math.max(1, Math.round(estimatedServings)) : 1;
    setGoalMinInput(
      existing ? String(existing.minCalories) : String(12600 * defaultScale)
    );
    setGoalMaxInput(
      existing ? String(existing.maxCalories) : String(15400 * defaultScale)
    );
    setGoalProteinInput(
      existing?.proteinGrams ? String(existing.proteinGrams) : ''
    );
    setGoalScopeInput(existing?.scope === 'household' ? 'household' : 'perServing');
    setGoalFormError(null);
    setGoalDialogOpen(true);
  };

  const handleSaveNutritionGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const minVal = Number(goalMinInput.trim());
    const maxVal = Number(goalMaxInput.trim());
    const proteinRaw = goalProteinInput.trim();
    const proteinVal = proteinRaw.length > 0 ? Number(proteinRaw) : null;

    if (!Number.isFinite(minVal) || minVal <= 0 || minVal > 200000) {
      setGoalFormError('Enter a valid minimum weekly calorie target above 0.');
      return;
    }
    if (!Number.isFinite(maxVal) || maxVal < minVal || maxVal > 200000) {
      setGoalFormError('Maximum calories must be greater than or equal to minimum calories.');
      return;
    }
    if (proteinVal !== null && (!Number.isFinite(proteinVal) || proteinVal <= 0 || proteinVal > 5000)) {
      setGoalFormError('Weekly protein goal must be a positive number (or leave blank).');
      return;
    }

    const nextGoal: WeeklyNutritionGoal = {
      minCalories: Math.round(minVal),
      maxCalories: Math.round(maxVal),
      proteinGrams: proteinVal !== null ? Math.round(proteinVal) : null,
      scope: goalScopeInput,
    };

    if (onUpdateWeeklyNutritionGoal) {
      onUpdateWeeklyNutritionGoal(nextGoal);
    } else {
      setLocalGoal(nextGoal);
    }
    setGoalDialogOpen(false);
    setGoalFormError(null);
    setToast({
      variant: 'success',
      message: 'Weekly nutrition goal saved.',
    });
  };

  const handleClearNutritionGoal = () => {
    if (onUpdateWeeklyNutritionGoal) {
      onUpdateWeeklyNutritionGoal(null);
    } else {
      setLocalGoal(null);
    }
    setGoalDialogOpen(false);
    setToast({
      variant: 'success',
      message: 'Weekly nutrition goal cleared.',
    });
  };

  const printableSchedule = useMemo(
    () =>
      buildPrintableWeekSchedule({
        plannedMeals,
        weekDays,
        recipeMap,
        includeSkipped: printIncludeSkipped,
      }),
    [plannedMeals, weekDays, recipeMap, printIncludeSkipped]
  );

  // All recipes respecting defaultDiet & allergies (including saved/generated AI recipes)
  const eligibleRecipes = useMemo(() => {
    const combined: Recipe[] = [...RECIPES];
    const seenIds = new Set(combined.map((r) => r.id));
    for (const r of aiRecipes) {
      if (r && !seenIds.has(r.id)) {
        seenIds.add(r.id);
        combined.push(r);
      }
    }

    return combined.filter((r) => {
      if (defaultDiet === 'veg' && r.diet === 'nonveg') return false;
      if (
        Array.isArray(allergies) &&
        allergies.length > 0 &&
        r.allergens.some((a) => allergies.includes(a))
      ) {
        return false;
      }
      return true;
    });
  }, [aiRecipes, defaultDiet, allergies]);

  // Quick search results directly on the Plan tab (by recipe name or ingredient name/alias)
  const planSearchResults = useMemo(() => {
    const trimmed = planSearchQuery.trim();
    if (!trimmed) return [];
    return eligibleRecipes.filter((r) => recipeMatchesQuery(r, trimmed));
  }, [eligibleRecipes, planSearchQuery]);

  const defaultQuickPlanDayIso = useMemo(
    () =>
      weekDateIsos.includes(todayIso)
        ? todayIso
        : weekDays[0]?.iso ?? todayIso,
    [weekDateIsos, todayIso, weekDays]
  );

  // Eligible recipes inside picker modal respecting defaultDiet, allergies, and ingredient search
  const pickerRecipes = useMemo(() => {
    if (!pickerSlot) return [];
    return eligibleRecipes.filter((r) => {
      if (!showAllMealTypes && !r.mealTypes.includes(pickerSlot.mealType)) {
        return false;
      }
      return recipeMatchesQuery(r, searchQuery);
    });
  }, [pickerSlot, eligibleRecipes, showAllMealTypes, searchQuery]);

  // Feature 7: Live auto-fill preview when modal is open
  const autoPlanPreview = useMemo(() => {
    if (!autoFillOpen) {
      return { proposals: [], nextList: plannedMeals, addedCount: 0 };
    }
    return generateAutoPlanWeek({
      weekDateIsos,
      existingPlannedMeals: plannedMeals,
      recipes: eligibleRecipes,
      diet: defaultDiet,
      allergies,
      ownedIngredientIds,
      emptySlotsOnly: autoEmptyOnly,
      dietMix: defaultDiet === 'nonveg' ? autoDietMix : 'veg_only',
      servings: estimatedServings,
    });
  }, [
    autoFillOpen,
    weekDateIsos,
    plannedMeals,
    eligibleRecipes,
    defaultDiet,
    allergies,
    ownedIngredientIds,
    autoEmptyOnly,
    autoDietMix,
    estimatedServings,
  ]);

  const handleApplyAutoFill = () => {
    if (!onApplyAutoPlan || autoPlanPreview.addedCount === 0) {
      setAutoFillOpen(false);
      return;
    }
    const previousSnapshot = plannedMeals;
    onApplyAutoPlan(autoPlanPreview.nextList);
    setAutoFillOpen(false);
    setToast({
      variant: 'success',
      message: `Added ${autoPlanPreview.addedCount} meal${
        autoPlanPreview.addedCount === 1 ? '' : 's'
      } to your week.`,
      actionLabel: 'Undo',
      onAction: () => {
        onApplyAutoPlan(previousSnapshot);
        setToast(null);
      },
    });
  };

  const handleShiftWeek = (deltaDays: number) => {
    const nextDate = addDays(parseLocalDate(weekMondayIso), deltaDays);
    setWeekAnchorIso(formatDate(nextDate));
  };

  const handleOpenPicker = (date: string, mealType: MealType, dayLabel: string) => {
    if (!canAddToSlot(plannedMeals, date, mealType)) {
      const msg = `This slot is full (max ${MAX_RECIPES_PER_SLOT} recipes).`;
      setSlotError(msg);
      setToast({ variant: 'error', message: msg });
      return;
    }
    setSlotError(null);
    setSearchQuery('');
    setShowAllMealTypes(false);
    setPickerSlot({ date, mealType, dayLabel });
  };

  const handleSelectRecipeForSlot = (recipe: Recipe) => {
    if (!pickerSlot) return;
    const res = onAddPlannedMeal({
      date: pickerSlot.date,
      mealType: pickerSlot.mealType,
      recipeId: recipe.id,
      servings: estimatedServings,
    });
    if (res.error) {
      setSlotError(res.error);
      setToast({ variant: 'error', message: res.error });
      return;
    }
    setPickerSlot(null);
    setSlotError(null);
    setToast({
      variant: 'success',
      message: `Added ${safeText(recipe.name)} to ${pickerSlot.dayLabel} ${MEAL_TYPE_LABELS[pickerSlot.mealType]}.`,
    });
  };

  const handleQuickPlanRecipe = (recipe: Recipe) => {
    const selected = quickPlanTargets[recipe.id];
    const targetDate =
      selected?.date && weekDateIsos.includes(selected.date)
        ? selected.date
        : defaultQuickPlanDayIso;
    const targetMealType: MealType =
      selected?.mealType ?? recipe.mealTypes[0] ?? 'lunch';

    const res = onAddPlannedMeal({
      date: targetDate,
      mealType: targetMealType,
      recipeId: recipe.id,
      servings: estimatedServings,
    });

    if (res.error) {
      setSlotError(res.error);
      setToast({ variant: 'error', message: res.error });
      return;
    }

    const dayObj = weekDays.find((d) => d.iso === targetDate);
    const dayLabel = dayObj
      ? `${dayObj.shortDay} ${dayObj.dayNumber}`
      : targetDate;
    setSlotError(null);
    setToast({
      variant: 'success',
      message: `Added ${safeText(recipe.name)} to ${dayLabel} ${MEAL_TYPE_LABELS[targetMealType]}.`,
    });
  };

  const getRecipeIngredientPreview = (recipe: Recipe): string => {
    if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
      return '';
    }
    const names = recipe.ingredients
      .map(
        (item) =>
          getIngredientById(item.ingredientId)?.name ?? item.ingredientId
      )
      .filter(Boolean);
    if (names.length <= 5) return names.join(', ');
    return `${names.slice(0, 5).join(', ')} +${names.length - 5} more`;
  };

  const handleCopyLastWeekClick = () => {
    const result = onCopyLastWeek(weekMondayIso);
    if (result.sourceCount === 0) {
      setToast({
        variant: 'error',
        message: 'No meals were planned in the previous week to copy.',
      });
      return;
    }
    if (result.copiedCount === 0) {
      setToast({
        variant: 'error',
        message: `All ${result.skippedCount} target slots are already full (max ${MAX_RECIPES_PER_SLOT} recipes).`,
      });
      return;
    }
    const skipNote =
      result.skippedCount > 0
        ? ` (${result.skippedCount} skipped because slot was full)`
        : '';
    setToast({
      variant: 'success',
      message: `Copied ${result.copiedCount} ${
        result.copiedCount === 1 ? 'meal' : 'meals'
      } from last week${skipNote}.`,
    });
  };

  const handleAddWeekMissingClick = () => {
    const pendingCount = summary.pendingCount;
    if (pendingCount === 0) {
      setToast({
        variant: 'error',
        message: 'No upcoming planned meals this week to add.',
      });
      return;
    }
    const addedCount = onAddWeekMissingToGrocery(weekDateIsos);
    if (addedCount > 0) {
      setToast({
        variant: 'success',
        message: `Added ${addedCount} missing ${
          addedCount === 1 ? 'item' : 'items'
        } for this week to your grocery list.`,
      });
    } else {
      setToast({
        variant: 'success',
        message: 'All ingredients for this week are already in your pantry or list.',
      });
    }
  };

  const renderSlotCard = (meal: PlannedMeal) => {
    const recipe = recipeMap.get(meal.recipeId) ?? null;
    const recipeTitle = recipe ? safeText(recipe.name) : 'Recipe unavailable';
    const isAi = Boolean(recipe && (recipe.isAiGenerated || recipe.source === 'ai'));
    const isSkipped = meal.status === 'skipped';
    const isCooked = meal.status === 'cooked';
    const showPastPrompt = isPastPlannedReminder(meal, todayIso);
    const missingRequiredCount =
      recipe && !isSkipped && !(defaultDiet === 'veg' && recipe.diet === 'nonveg')
        ? getMissingRecipeIngredientsCount(recipe, ownedIngredientIds, false)
        : 0;

    return (
      <div
        key={meal.id}
        className={`rounded-xl border p-2.5 space-y-2 transition-colors ${
          isSkipped
            ? 'bg-[#FFF9F2]/60 border-[#EADFD2] opacity-75'
            : isCooked
            ? 'bg-[#1F6E42]/6 border-[#1F6E42]/30'
            : 'bg-[#FFF9F2] border-[#EADFD2]'
        }`}
      >
        <div className="flex items-start gap-2.5">
          <RecipeVisual
            recipe={
              recipe ?? {
                id: meal.recipeId,
                name: recipeTitle,
                mealTypes: [meal.mealType],
                diet: defaultDiet,
              }
            }
            variant="square"
            showVisual={showVisuals}
          />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <span
                className={`text-xs sm:text-sm font-heading font-semibold leading-snug break-words ${
                  isSkipped ? 'line-through text-[#6B6B6B]' : 'text-[#2B2B2B]'
                }`}
              >
                {recipeTitle}
              </span>
              {recipe && <DietBadge diet={recipe.diet} size="sm" />}
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#6B6B6B] tabular-nums">
              <span>{formatServingsLabel(meal.servings)} serv.</span>
              <span aria-hidden="true">·</span>
              <span
                className={
                  isCooked
                    ? 'text-[#1F6E42] font-semibold'
                    : isSkipped
                    ? 'text-[#6B6B6B]'
                    : 'text-[#B83915] font-medium'
                }
              >
                {isCooked ? 'Cooked' : isSkipped ? 'Skipped' : 'Planned'}
              </span>
              {isAi && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#6B3FA0]/10 text-[#5B2E91] font-semibold">
                  <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                  <span>AI</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {isAi && (
          <p
            role="note"
            className="text-[11px] text-[#5B2E91] bg-[#6B3FA0]/8 rounded-lg px-2 py-1 leading-snug"
          >
            {AI_DISCLAIMER_TEXT}
          </p>
        )}

        {showPastPrompt && (
          <div className="rounded-lg bg-white border border-[#C5411B]/30 p-2 space-y-1.5">
            <p className="text-[11px] font-medium text-[#2B2B2B]">
              Did you cook this?
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onUpdateStatus(meal.id, 'cooked')}
                className="min-h-[44px] px-2.5 rounded-lg bg-[#1F6E42] hover:bg-[#185734] text-white text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Mark cooked</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateStatus(meal.id, 'skipped')}
                className="min-h-[44px] px-2.5 rounded-lg border border-[#DFD3C5] bg-[#FFF9F2] text-xs font-medium text-[#2B2B2B] hover:border-[#2B2B2B] cursor-pointer"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {recipe && !isSkipped && (
            <button
              type="button"
              onClick={() => onCookPlannedMeal(meal)}
              className="min-h-[44px] px-2.5 rounded-lg bg-[#C5411B] hover:bg-[#AE3715] text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChefHat className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Cook now</span>
            </button>
          )}

          {recipe && missingRequiredCount > 0 && onAddRecipeToList && (
            <button
              type="button"
              onClick={() => {
                const msg = onAddRecipeToList(
                  recipe,
                  false,
                  ownedIngredientIds
                );
                setToast({ variant: 'success', message: msg });
              }}
              aria-label={`Add missing ingredients for ${recipeTitle} to grocery list`}
              className="min-h-[44px] px-2.5 rounded-lg border border-[#EADFD2] bg-white hover:border-[#2E8B57] hover:bg-[#2E8B57]/10 text-xs font-semibold text-[#1F623D] inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ShoppingBasket className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add missing to list</span>
            </button>
          )}

          {meal.status === 'planned' ? (
            <button
              type="button"
              onClick={() => onUpdateStatus(meal.id, 'skipped')}
              aria-label={`Skip ${recipeTitle}`}
              className="min-h-[44px] px-2.5 rounded-lg border border-[#DFD3C5] bg-white hover:border-[#2B2B2B] text-xs font-medium text-[#2B2B2B] inline-flex items-center gap-1 cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Skip</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onUpdateStatus(meal.id, 'planned')}
              aria-label={`Restore ${recipeTitle} to planned`}
              className="min-h-[44px] px-2.5 rounded-lg border border-[#DFD3C5] bg-white hover:border-[#2B2B2B] text-xs font-medium text-[#2B2B2B] inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Restore</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onRemoveMeal(meal.id)}
            aria-label={`Remove ${recipeTitle} from plan`}
            className="min-w-[44px] min-h-[44px] px-2 rounded-lg border border-transparent hover:border-[#A63429]/30 hover:bg-[#A63429]/8 text-[#6B6B6B] hover:text-[#A63429] inline-flex items-center justify-center transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-36 sm:pb-10 print:space-y-0 print:pb-0">
      {/* Page Header & Week Controls */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 no-print">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2B2B2B]">
            Meal plan
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1 tabular-nums">{weekHeading}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPrintModalOpen(true)}
            aria-label="Print week schedule for kitchen wall"
            className="min-h-[44px] px-3.5 rounded-xl bg-white border border-[#EADFD2] hover:border-[#2B2B2B] text-sm font-medium text-[#2B2B2B] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span>Print Week</span>
          </button>

          <button
            type="button"
            onClick={() => handleShiftWeek(-7)}
            aria-label="Previous week"
            className="min-w-[44px] min-h-[44px] px-3 rounded-xl bg-white border border-[#EADFD2] hover:border-[#2B2B2B] text-[#2B2B2B] inline-flex items-center justify-center cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setWeekAnchorIso(todayIso)}
            className="min-h-[44px] px-4 rounded-xl bg-white border border-[#EADFD2] hover:border-[#E4572E] text-sm font-medium text-[#2B2B2B] cursor-pointer"
          >
            This week
          </button>

          <button
            type="button"
            onClick={() => handleShiftWeek(7)}
            aria-label="Next week"
            className="min-w-[44px] min-h-[44px] px-3 rounded-xl bg-white border border-[#EADFD2] hover:border-[#2B2B2B] text-[#2B2B2B] inline-flex items-center justify-center cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      {storageUnavailable && (
        <div
          role="alert"
          className="bg-[#E4572E]/10 border border-[#E4572E]/40 text-[#2B2B2B] rounded-2xl px-4 py-3 text-sm flex items-center gap-2.5 no-print"
        >
          <AlertTriangle
            className="w-4 h-4 text-[#E4572E] shrink-0"
            aria-hidden="true"
          />
          <span>Your changes may not be saved on this browser.</span>
        </div>
      )}

      {slotError && (
        <div
          role="alert"
          className="bg-[#A63429]/8 border border-[#A63429]/30 text-[#A63429] rounded-2xl px-4 py-3 text-sm flex items-center justify-between gap-2 no-print"
        >
          <span>{slotError}</span>
          <button
            type="button"
            onClick={() => setSlotError(null)}
            className="min-h-[44px] px-2 text-xs font-semibold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Find Recipes to Plan Search Bar */}
      <section
        aria-label="Search recipes to plan"
        className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#EADFD2] space-y-3 no-print"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-heading text-sm sm:text-base font-semibold text-[#2B2B2B]">
              Find a recipe to plan
            </h2>
            <p className="text-xs text-[#6B6B6B]">
              Filter {eligibleRecipes.length} diet-compatible dishes by name or ingredients and add straight to your week.
            </p>
          </div>
          {planSearchQuery.trim().length > 0 && (
            <span className="text-xs font-semibold text-[#1F6E42] tabular-nums">
              {planSearchResults.length}{' '}
              {planSearchResults.length === 1 ? 'match' : 'matches'}
            </span>
          )}
        </div>

        <div className="relative">
          <label htmlFor="plan-main-recipe-search" className="sr-only">
            Search recipes by name or ingredients
          </label>
          <Search
            className="w-4 h-4 text-[#6B6B6B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="plan-main-recipe-search"
            type="search"
            value={planSearchQuery}
            onChange={(e) => setPlanSearchQuery(e.target.value)}
            placeholder="Search recipes by name or ingredients (e.g. paneer, palak, tomato)..."
            className="w-full h-11 pl-10 pr-11 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm text-[#2B2B2B] placeholder:text-[#6B6B6B]"
          />
          {planSearchQuery.length > 0 && (
            <button
              type="button"
              onClick={() => setPlanSearchQuery('')}
              aria-label="Clear recipe search"
              className="min-w-[44px] min-h-[44px] absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-xl text-[#6B6B6B] hover:text-[#2B2B2B] cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {planSearchQuery.trim().length > 0 && (
          <div className="pt-1">
            {planSearchResults.length === 0 ? (
              <div className="rounded-xl bg-[#FFF9F2] border border-[#EADFD2] px-4 py-5 text-center space-y-2">
                <p className="text-sm text-[#6B6B6B]">
                  No recipes match &ldquo;{planSearchQuery.trim()}&rdquo; under your current diet and allergy filters.
                </p>
                <button
                  type="button"
                  onClick={() => setPlanSearchQuery('')}
                  className="min-h-[44px] px-4 rounded-xl bg-white border border-[#DFD3C5] hover:border-[#2B2B2B] text-xs font-semibold text-[#2B2B2B] cursor-pointer"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {planSearchResults.map((recipe) => {
                  const selectedTarget = quickPlanTargets[recipe.id];
                  const selectedDate =
                    selectedTarget?.date && weekDateIsos.includes(selectedTarget.date)
                      ? selectedTarget.date
                      : defaultQuickPlanDayIso;
                  const selectedMealType: MealType =
                    selectedTarget?.mealType ?? recipe.mealTypes[0] ?? 'lunch';
                  const isAi = Boolean(
                    recipe.isAiGenerated || recipe.source === 'ai'
                  );
                  const ingredientPreview = getRecipeIngredientPreview(recipe);

                  return (
                    <div
                      key={recipe.id}
                      className="rounded-xl border border-[#EADFD2] bg-[#FFF9F2] p-3 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <RecipeVisual
                          recipe={recipe}
                          variant="square"
                          showVisual={showVisuals}
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-heading text-sm font-semibold text-[#2B2B2B] leading-snug break-words">
                              {safeText(recipe.name)}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {isAi && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#6B3FA0]/10 text-[#5B2E91] text-[11px] font-semibold">
                                  <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                                  <span>AI</span>
                                </span>
                              )}
                              <DietBadge diet={recipe.diet} size="sm" />
                            </div>
                          </div>

                          <p className="text-xs text-[#6B6B6B] tabular-nums">
                            {recipe.prepMinutes + recipe.cookMinutes}m ·{' '}
                            {typeof recipe.nutritionPerServing?.protein === 'number'
                              ? `${recipe.nutritionPerServing.protein}g protein`
                              : '-'}{' '}
                            · {safeText(recipe.cuisine)}
                          </p>

                          {ingredientPreview && (
                            <p className="text-xs text-[#6B6B6B] line-clamp-2">
                              <span className="font-medium text-[#2B2B2B]">
                                Ingredients:
                              </span>{' '}
                              {ingredientPreview}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#EADFD2]/70">
                        <select
                          aria-label={`Select day for ${safeText(recipe.name)}`}
                          value={selectedDate}
                          onChange={(e) =>
                            setQuickPlanTargets((prev) => ({
                              ...prev,
                              [recipe.id]: {
                                ...prev[recipe.id],
                                date: e.target.value,
                              },
                            }))
                          }
                          className="h-11 px-2.5 rounded-xl border border-[#DFD3C5] bg-white text-xs font-medium text-[#2B2B2B] cursor-pointer"
                        >
                          {weekDays.map((d) => (
                            <option key={d.iso} value={d.iso}>
                              {d.shortDay} {d.dayNumber}
                            </option>
                          ))}
                        </select>

                        <select
                          aria-label={`Select meal slot for ${safeText(recipe.name)}`}
                          value={selectedMealType}
                          onChange={(e) =>
                            setQuickPlanTargets((prev) => ({
                              ...prev,
                              [recipe.id]: {
                                ...prev[recipe.id],
                                mealType: e.target.value as MealType,
                              },
                            }))
                          }
                          className="h-11 px-2.5 rounded-xl border border-[#DFD3C5] bg-white text-xs font-medium text-[#2B2B2B] cursor-pointer"
                        >
                          {PLAN_MEAL_TYPES.map((mt) => (
                            <option key={mt} value={mt}>
                              {MEAL_TYPE_LABELS[mt]}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => handleQuickPlanRecipe(recipe)}
                          className="min-h-[44px] px-3 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white text-xs font-heading font-semibold inline-flex items-center justify-center gap-1.5 ml-auto transition-colors cursor-pointer"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Add to plan</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Bulk Actions & Planned Week Summary Section */}
      <section
        aria-label="Planned week summary"
        className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#EADFD2] space-y-4 no-print"
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {onApplyAutoPlan && (
              <button
                type="button"
                onClick={() => setAutoFillOpen(true)}
                className="min-h-[44px] px-4 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Wand2 className="w-4 h-4" aria-hidden="true" />
                <span>Auto-fill week</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyLastWeekClick}
              className="min-h-[44px] px-4 rounded-xl bg-[#FFF9F2] border border-[#DFD3C5] hover:border-[#2B2B2B] text-sm font-medium text-[#2B2B2B] inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4" aria-hidden="true" />
              <span>Copy last week</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddWeekMissingClick}
            className="min-h-[44px] px-4 rounded-xl bg-[#1F6E42] hover:bg-[#185734] text-white font-heading font-semibold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ShoppingBasket className="w-4 h-4" aria-hidden="true" />
            <span>Add missing for this week to grocery list</span>
          </button>
        </div>

        <div
          aria-label="Week plan summary"
          className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-[#F3EAE0]"
        >
          <div>
            <span className="block text-xs text-[#6B6B6B]">Total slots</span>
            <span className="font-heading text-lg font-bold text-[#2B2B2B] tabular-nums">
              {summary.totalCount}
            </span>
          </div>
          <div>
            <span className="block text-xs text-[#6B6B6B]">Planned</span>
            <span className="font-heading text-lg font-bold text-[#B83915] tabular-nums">
              {summary.pendingCount}
            </span>
          </div>
          <div>
            <span className="block text-xs text-[#6B6B6B]">Cooked</span>
            <span className="font-heading text-lg font-bold text-[#1F6E42] tabular-nums">
              {summary.cookedCount}
            </span>
          </div>
          <div>
            <span className="block text-xs text-[#6B6B6B]">Skipped</span>
            <span className="font-heading text-lg font-bold text-[#6B6B6B] tabular-nums">
              {summary.skippedCount}
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="block text-xs text-[#6B6B6B]">Veg / Non-veg</span>
            <span className="font-heading text-lg font-bold text-[#2B2B2B] tabular-nums">
              {summary.vegCount} / {summary.nonVegCount}
            </span>
          </div>
        </div>

        {/* Weekly Cost & Nutrition Summary */}
        {(() => {
          const activeTotals =
            nutritionScope === 'household'
              ? weekNutrition.household
              : weekNutrition.perServing;
          const totalMacroGrams =
            activeTotals.protein + activeTotals.carbs + activeTotals.fat;
          const proteinPct =
            totalMacroGrams > 0
              ? Math.round((activeTotals.protein / totalMacroGrams) * 100)
              : 0;
          const carbsPct =
            totalMacroGrams > 0
              ? Math.round((activeTotals.carbs / totalMacroGrams) * 100)
              : 0;
          const fatPct =
            totalMacroGrams > 0 ? Math.max(0, 100 - proteinPct - carbsPct) : 0;

          const formatMacro = (value: number) =>
            Number.isInteger(value) ? String(value) : value.toFixed(1);

          const weeklyCostDisplay =
            weekMissingItems.length === 0
              ? formatInr(0)
              : weekCost.knownCount > 0
              ? formatInr(weekCost.totalPaise)
              : '-';

          return (
            <div
              aria-label="Weekly cost and nutrition summary"
              className="pt-3 border-t border-[#F3EAE0] space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-heading text-sm sm:text-base font-semibold text-[#2B2B2B]">
                    Weekly cost &amp; nutrition summary (Estimated)
                  </h2>
                  <p className="text-xs text-[#6B6B6B] tabular-nums">
                    {weekNutrition.activeMealCount > 0
                      ? `Across ${weekNutrition.activeMealCount} active planned ${
                          weekNutrition.activeMealCount === 1 ? 'meal' : 'meals'
                        } · excludes skipped`
                      : 'Plan meals below to see weekly cost, calories, and protein totals'}
                  </p>
                </div>

                <div
                  className="inline-flex p-1 rounded-xl bg-[#FFF9F2] border border-[#EADFD2]"
                  role="group"
                  aria-label="Weekly nutrition scope"
                >
                  <button
                    type="button"
                    onClick={() => setNutritionScope('household')}
                    aria-pressed={nutritionScope === 'household'}
                    className={`min-h-[44px] px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      nutritionScope === 'household'
                        ? 'bg-white text-[#2B2B2B] font-semibold shadow-xs'
                        : 'text-[#6B6B6B] hover:text-[#2B2B2B]'
                    }`}
                  >
                    Household total
                  </button>
                  <button
                    type="button"
                    onClick={() => setNutritionScope('perServing')}
                    aria-pressed={nutritionScope === 'perServing'}
                    className={`min-h-[44px] px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      nutritionScope === 'perServing'
                        ? 'bg-white text-[#2B2B2B] font-semibold shadow-xs'
                        : 'text-[#6B6B6B] hover:text-[#2B2B2B]'
                    }`}
                  >
                    Per adult serving
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 tabular-nums">
                {showCost && (
                  <div className="rounded-xl bg-[#FFF9F2] px-3.5 py-3 flex flex-col justify-between">
                    <div>
                      <span className="block text-xs text-[#6B6B6B]">
                        Estimated cost (Missing)
                      </span>
                      <span className="block font-heading text-xl font-bold text-[#1F6E42] mt-0.5">
                        {weeklyCostDisplay}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-xs text-[#6B6B6B]">
                      <span>
                        {weekMissingItems.length}{' '}
                        {weekMissingItems.length === 1 ? 'item' : 'items'} to buy
                      </span>
                      {weekCost.unknownCount > 0 && (
                        <button
                          type="button"
                          onClick={onGoToGroceryEditPrices}
                          className="font-semibold text-[#B83915] hover:text-[#AE3715] underline cursor-pointer"
                        >
                          Edit prices
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="rounded-xl bg-[#FFF9F2] px-3.5 py-3">
                  <span className="block text-xs text-[#6B6B6B]">
                    Calories (Estimated)
                  </span>
                  <span className="block font-heading text-xl font-bold text-[#2B2B2B] mt-0.5">
                    {weekNutrition.countedNutritionMeals > 0
                      ? `${activeTotals.calories.toLocaleString()} kcal`
                      : '-'}
                  </span>
                  <span className="block text-xs text-[#6B6B6B] mt-0.5">
                    {weekNutrition.countedNutritionMeals > 0
                      ? `${Math.round(activeTotals.calories / 7).toLocaleString()} kcal/day avg`
                      : 'No calories logged yet'}
                  </span>
                </div>

                <div className="rounded-xl bg-[#FFF9F2] px-3.5 py-3">
                  <span className="block text-xs text-[#6B6B6B]">
                    Protein (Estimated)
                  </span>
                  <span className="block font-heading text-xl font-bold text-[#1F6E42] mt-0.5">
                    {weekNutrition.countedNutritionMeals > 0
                      ? `${formatMacro(activeTotals.protein)} g`
                      : '-'}
                  </span>
                  <span className="block text-xs text-[#6B6B6B] mt-0.5">
                    {weekNutrition.countedNutritionMeals > 0
                      ? `${formatMacro(Math.round((activeTotals.protein / 7) * 10) / 10)} g/day avg`
                      : 'No protein logged yet'}
                  </span>
                </div>

                <div
                  className={`rounded-xl bg-[#FFF9F2] px-3.5 py-3 ${
                    showCost ? '' : 'sm:col-span-2 lg:col-span-2'
                  }`}
                >
                  <span className="block text-xs text-[#6B6B6B]">
                    Carbohydrates (Estimated)
                  </span>
                  <span className="block font-heading text-xl font-bold text-[#C5411B] mt-0.5">
                    {weekNutrition.countedNutritionMeals > 0
                      ? `${formatMacro(activeTotals.carbs)} g`
                      : '-'}
                  </span>
                  <span className="block text-xs text-[#6B6B6B] mt-0.5">
                    {weekNutrition.countedNutritionMeals > 0
                      ? `${formatMacro(Math.round((activeTotals.carbs / 7) * 10) / 10)} g/day avg`
                      : 'No carbs logged yet'}
                  </span>
                </div>
              </div>

              {weekNutrition.countedNutritionMeals > 0 && totalMacroGrams > 0 && (
                <div className="space-y-1.5">
                  <div
                    className="h-2 w-full rounded-full bg-[#F3EAE0] overflow-hidden flex"
                    role="img"
                    aria-label={`Macro mix by weight: Protein ${proteinPct}%, Carbs ${carbsPct}%, Fats ${fatPct}%`}
                  >
                    <div
                      className="h-full bg-[#1F6E42]"
                      style={{ width: `${proteinPct}%` }}
                    />
                    <div
                      className="h-full bg-[#C5411B]"
                      style={{ width: `${carbsPct}%` }}
                    />
                    <div
                      className="h-full bg-[#B45309]"
                      style={{ width: `${fatPct}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B6B6B] tabular-nums">
                    <span className="text-[#1F6E42] font-medium">
                      Protein {proteinPct}%
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#C5411B] font-medium">
                      Carbs {carbsPct}%
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#8A4B08] font-medium">
                      Fats {formatMacro(activeTotals.fat)} g ({fatPct}%)
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Fiber {formatMacro(activeTotals.fiber)} g</span>
                  </div>
                </div>
              )}

              {weekNutrition.missingNutritionMeals > 0 && (
                <p className="text-xs text-[#6B6B6B] tabular-nums">
                  Note: {weekNutrition.missingNutritionMeals} planned{' '}
                  {weekNutrition.missingNutritionMeals === 1 ? 'meal' : 'meals'} did
                  not include nutrition data.
                </p>
              )}

              {/* Weekly Nutrition Goal & Progress Bar */}
              <div
                aria-label="Weekly nutrition goal"
                className="pt-3 border-t border-[#F3EAE0] space-y-2.5"
              >
                {!goalEvaluation ? (
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div>
                      <h3 className="font-heading text-sm font-semibold text-[#2B2B2B]">
                        Weekly nutrition goal
                      </h3>
                      <p className="text-xs text-[#6B6B6B]">
                        Set a weekly calorie target range to track how close this week&apos;s plan is to your goal.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenGoalDialog}
                      className="min-h-[44px] px-3.5 rounded-xl bg-[#FFF9F2] border border-[#DFD3C5] hover:border-[#2B2B2B] text-xs font-semibold text-[#2B2B2B] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Target className="w-4 h-4 text-[#C5411B]" aria-hidden="true" />
                      <span>Set goal</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-heading text-sm font-semibold text-[#2B2B2B]">
                          Weekly nutrition goal
                        </h3>
                        <p className="text-xs text-[#6B6B6B] tabular-nums">
                          Target: {goalEvaluation.minCalories.toLocaleString()} –{' '}
                          {goalEvaluation.maxCalories.toLocaleString()} kcal / week ·{' '}
                          {goalScope === 'household'
                            ? 'Household total'
                            : 'Per adult serving'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleOpenGoalDialog}
                          className="min-h-[44px] px-3 rounded-xl bg-[#FFF9F2] border border-[#DFD3C5] hover:border-[#2B2B2B] text-xs font-medium text-[#2B2B2B] whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Edit goal
                        </button>
                        <button
                          type="button"
                          onClick={handleClearNutritionGoal}
                          aria-label="Clear weekly nutrition goal"
                          className="min-h-[44px] px-2.5 rounded-xl text-xs font-medium text-[#6B6B6B] hover:text-[#A63429] hover:bg-[#A63429]/8 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Calorie Goal Progress Readout & Bar */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums">
                        <span className="font-semibold text-[#2B2B2B]">
                          {weekNutrition.countedNutritionMeals > 0
                            ? `${goalEvaluation.actualCalories.toLocaleString()} kcal planned`
                            : '-'}
                        </span>
                        <span
                          className={`font-semibold ${
                            goalEvaluation.status === 'in_range'
                              ? 'text-[#1F6E42]'
                              : goalEvaluation.status === 'above'
                              ? 'text-[#B83915]'
                              : goalEvaluation.status === 'below'
                              ? 'text-[#8A4B08]'
                              : 'text-[#6B6B6B]'
                          }`}
                        >
                          {goalEvaluation.status === 'in_range'
                            ? 'On target · Within weekly range'
                            : goalEvaluation.status === 'above'
                            ? `Above target · +${goalEvaluation.overMax.toLocaleString()} kcal over max`
                            : goalEvaluation.status === 'below'
                            ? `Below target · ${goalEvaluation.remainingToMin.toLocaleString()} kcal to minimum`
                            : 'No planned meals counted yet'}
                        </span>
                      </div>

                      <div
                        role="progressbar"
                        aria-label="Weekly calorie goal progress"
                        aria-valuemin={0}
                        aria-valuemax={goalEvaluation.maxCalories}
                        aria-valuenow={goalEvaluation.actualCalories}
                        className="relative h-3 w-full rounded-full bg-[#F3EAE0] overflow-hidden"
                      >
                        {/* Subtle target range band from minCalories to maxCalories */}
                        <div
                          aria-hidden="true"
                          className="absolute inset-y-0 right-0 bg-[#1F6E42]/12 border-l border-[#1F6E42]/50"
                          style={{
                            left: `${goalEvaluation.targetMinPct}%`,
                          }}
                        />
                        <div
                          className={`relative h-full rounded-full transition-all duration-200 ${
                            goalEvaluation.status === 'in_range'
                              ? 'bg-[#1F6E42]'
                              : goalEvaluation.status === 'above'
                              ? 'bg-[#C5411B]'
                              : goalEvaluation.status === 'below'
                              ? 'bg-[#D97706]'
                              : 'bg-[#CFC6BB]'
                          }`}
                          style={{ width: `${goalEvaluation.calorieBarPct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#6B6B6B] tabular-nums">
                        <span>0 kcal</span>
                        <span>
                          Min {goalEvaluation.minCalories.toLocaleString()} – Max{' '}
                          {goalEvaluation.maxCalories.toLocaleString()} kcal
                        </span>
                      </div>
                    </div>

                    {/* Optional Weekly Protein Target Bar */}
                    {goalEvaluation.proteinGoalGrams !== null && (
                      <div className="space-y-1 pt-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums">
                          <span className="font-medium text-[#2B2B2B]">
                            Weekly protein goal
                          </span>
                          <span className="font-semibold text-[#1F6E42]">
                            {goalEvaluation.actualProtein !== null
                              ? `${formatMacro(goalEvaluation.actualProtein)} / ${goalEvaluation.proteinGoalGrams} g (${goalEvaluation.proteinRawPct}%)`
                              : `- / ${goalEvaluation.proteinGoalGrams} g`}
                          </span>
                        </div>
                        <div
                          role="progressbar"
                          aria-label="Weekly protein goal progress"
                          aria-valuemin={0}
                          aria-valuemax={goalEvaluation.proteinGoalGrams}
                          aria-valuenow={goalEvaluation.actualProtein ?? 0}
                          className="h-2 w-full rounded-full bg-[#F3EAE0] overflow-hidden"
                        >
                          <div
                            className="h-full rounded-full bg-[#1F6E42] transition-all duration-200"
                            style={{ width: `${goalEvaluation.proteinBarPct ?? 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p className="text-xs text-[#6B6B6B]">
                Estimated values. Not medical advice.
                {showCost ? ' Estimate. Prices may differ in your market.' : ''}
              </p>
            </div>
          );
        })()}
      </section>

      {/* Feature 2: Today Adult Nutrition Summary */}
      <div className="no-print">
        <DayNutritionSummaryCard
          dayMeals={todayCookedMeals}
          recipeMap={recipeMap}
          title="Today"
        />
      </div>

      {/* Desktop 7-day x 4-meal-type grid inside self-scrolling container */}
      <section
        aria-label="Weekly meal grid"
        className="hidden lg:block overflow-x-auto max-w-full rounded-2xl border border-[#EADFD2] bg-white shadow-sm no-print"
      >
        <div role="grid" aria-label="Weekly meal plan" className="min-w-[1220px]">
          <div role="rowgroup">
            <div
              role="row"
              className="grid grid-cols-[100px_repeat(7,minmax(160px,1fr))] border-b border-[#EADFD2] bg-[#FFF9F2]"
            >
              <div
                role="columnheader"
                className="p-3 text-xs font-semibold uppercase tracking-wide text-[#6B6B6B] flex items-center"
              >
                Meal
              </div>
              {weekDays.map((day) => {
                const isToday = day.iso === todayIso;
                return (
                  <div
                    key={day.iso}
                    role="columnheader"
                    className={`p-3 border-l border-[#EADFD2] text-center ${
                      isToday ? 'bg-[#C5411B]/8' : ''
                    }`}
                  >
                    <span
                      className={`block text-xs font-medium ${
                        isToday ? 'text-[#B83915]' : 'text-[#6B6B6B]'
                      }`}
                    >
                      {day.shortDay}
                    </span>
                    <span
                      className={`block font-heading text-base font-bold tabular-nums ${
                        isToday ? 'text-[#B83915]' : 'text-[#2B2B2B]'
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div role="rowgroup">
            {PLAN_MEAL_TYPES.map((mealType) => (
              <div
                key={mealType}
                role="row"
                className="grid grid-cols-[100px_repeat(7,minmax(160px,1fr))] border-b last:border-b-0 border-[#EADFD2]"
              >
                <div
                  role="rowheader"
                  className="p-3 bg-[#FFF9F2]/60 font-heading text-sm font-semibold text-[#2B2B2B] flex items-start"
                >
                  {MEAL_TYPE_LABELS[mealType]}
                </div>
                {weekDays.map((day) => {
                  const slotMeals = getSlotMeals(plannedMeals, day.iso, mealType);
                  const full = slotMeals.length >= MAX_RECIPES_PER_SLOT;
                  return (
                    <div
                      key={`${day.iso}-${mealType}`}
                      role="gridcell"
                      className="p-2 border-l border-[#EADFD2] flex flex-col justify-between gap-2 min-h-[116px]"
                    >
                      <div className="space-y-2">
                        {slotMeals.map((m) => renderSlotCard(m))}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleOpenPicker(
                            day.iso,
                            mealType,
                            `${day.shortDay} ${day.dayNumber}`
                          )
                        }
                        aria-label={`Add recipe to ${day.shortDay} ${day.dayNumber} ${MEAL_TYPE_LABELS[mealType]}`}
                        className={`w-full min-h-[44px] px-2 rounded-xl border border-dashed text-xs font-medium inline-flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                          full
                            ? 'border-[#DFD3C5] text-[#6B6B6B] bg-[#FFF9F2]/40'
                            : 'border-[#DFD3C5] text-[#6B6B6B] hover:border-[#C5411B] hover:text-[#B83915]'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{full ? 'Full (3/3)' : 'Add'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile & Tablet Vertical Day List (<1024px) */}
      <section
        aria-label="Daily meal plan list"
        className="lg:hidden space-y-4 no-print"
      >
        {weekDays.map((day) => {
          const isToday = day.iso === todayIso;
          return (
            <article
              key={day.iso}
              className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border space-y-3 ${
                isToday ? 'border-[#E4572E]' : 'border-[#EADFD2]'
              }`}
            >
              <header className="flex items-center justify-between gap-2 pb-2 border-b border-[#F3EAE0]">
                <h2 className="font-heading text-base sm:text-lg font-bold text-[#2B2B2B]">
                  {day.fullLabel}
                </h2>
                {isToday && (
                  <span className="text-xs font-semibold text-[#B83915]">
                    Today
                  </span>
                )}
              </header>

              <div className="space-y-3">
                {PLAN_MEAL_TYPES.map((mealType) => {
                  const slotMeals = getSlotMeals(plannedMeals, day.iso, mealType);
                  const full = slotMeals.length >= MAX_RECIPES_PER_SLOT;

                  return (
                    <div key={mealType} className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[#6B6B6B]">
                          {MEAL_TYPE_LABELS[mealType]}{' '}
                          <span className="tabular-nums">
                            ({slotMeals.length}/{MAX_RECIPES_PER_SLOT})
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenPicker(
                              day.iso,
                              mealType,
                              `${day.shortDay} ${day.dayNumber}`
                            )
                          }
                          aria-label={`Add recipe to ${day.fullLabel} ${MEAL_TYPE_LABELS[mealType]}`}
                          className="min-h-[44px] px-3 rounded-xl border border-[#DFD3C5] hover:border-[#E4572E] text-xs font-semibold text-[#2B2B2B] hover:text-[#E4572E] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{full ? 'Slot full' : 'Add'}</span>
                        </button>
                      </div>

                      {slotMeals.length > 0 && (
                        <div className="space-y-2">
                          {slotMeals.map((m) => renderSlotCard(m))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </section>

      {/* Recipe Picker Dialog */}
      <Dialog
        open={Boolean(pickerSlot)}
        title={
          pickerSlot
            ? `Plan ${MEAL_TYPE_LABELS[pickerSlot.mealType]} (${pickerSlot.dayLabel})`
            : 'Plan meal'
        }
        description={
          defaultDiet === 'veg'
            ? 'Showing vegetarian recipes matching your allergy settings.'
            : 'Choose a recipe matching your household allergy settings.'
        }
        maxWidthClass="max-w-lg"
        onClose={() => setPickerSlot(null)}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="plan-recipe-search" className="sr-only">
              Search recipes
            </label>
            <div className="relative">
              <Search
                className="w-4 h-4 text-[#6B6B6B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="plan-recipe-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipes by name or ingredients..."
                className="w-full h-11 pl-10 pr-3 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm text-[#2B2B2B] placeholder:text-[#6B6B6B]"
              />
            </div>

            <label className="inline-flex items-center gap-2 min-h-[44px] cursor-pointer text-xs text-[#6B6B6B]">
              <input
                type="checkbox"
                checked={showAllMealTypes}
                onChange={(e) => setShowAllMealTypes(e.target.checked)}
                className="w-4 h-4 accent-[#E4572E] rounded"
              />
              <span>Show recipes from all meal types</span>
            </label>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {pickerRecipes.length === 0 ? (
              <p className="text-sm text-[#6B6B6B] py-6 text-center">
                No recipes match this search and your current diet/allergy filters.
              </p>
            ) : (
              pickerRecipes.map((recipe) => (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => handleSelectRecipeForSlot(recipe)}
                  className="w-full min-h-[56px] p-2.5 rounded-xl border border-[#EADFD2] bg-[#FFF9F2] hover:border-[#E4572E] text-left flex items-center justify-between gap-3 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <RecipeVisual
                      recipe={recipe}
                      variant="square"
                      showVisual={showVisuals}
                    />
                    <div className="min-w-0 space-y-0.5">
                      <span className="block font-heading text-sm font-semibold text-[#2B2B2B] truncate">
                        {safeText(recipe.name)}
                      </span>
                      <span className="block text-xs text-[#6B6B6B] tabular-nums">
                        {recipe.prepMinutes + recipe.cookMinutes}m ·{' '}
                        {typeof recipe.nutritionPerServing?.protein === 'number'
                          ? `${recipe.nutritionPerServing.protein}g protein`
                          : '-'}{' '}
                        · {recipe.cuisine}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <DietBadge diet={recipe.diet} size="sm" />
                    <CalendarPlus
                      className="w-4 h-4 text-[#E4572E]"
                      aria-hidden="true"
                    />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </Dialog>

      {/* Feature 7: Auto-fill Week Preview Dialog */}
      <Dialog
        open={autoFillOpen}
        title="Auto-fill week"
        description="Suggests allergy-safe meals using your saved ingredients without overwriting existing slots."
        maxWidthClass="max-w-lg"
        onClose={() => setAutoFillOpen(false)}
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-[#FFF9F2] border border-[#EADFD2] p-3.5 space-y-3">
            <label className="min-h-[44px] flex items-center gap-2.5 text-sm text-[#2B2B2B] cursor-pointer">
              <input
                type="checkbox"
                checked={autoEmptyOnly}
                onChange={(e) => setAutoEmptyOnly(e.target.checked)}
                className="w-4 h-4 accent-[#C5411B] rounded"
              />
              <span>Empty slots only (never overwrite filled slots)</span>
            </label>

            {defaultDiet === 'nonveg' && (
              <div className="space-y-1">
                <label
                  htmlFor="auto-plan-diet-mix"
                  className="block text-xs font-medium text-[#6B6B6B]"
                >
                  Diet mix
                </label>
                <select
                  id="auto-plan-diet-mix"
                  value={autoDietMix}
                  onChange={(e) =>
                    setAutoDietMix(e.target.value as 'balanced' | 'veg_only')
                  }
                  className="w-full h-11 px-3 rounded-xl border border-[#DFD3C5] bg-white text-sm text-[#2B2B2B]"
                >
                  <option value="balanced">Balanced (alternates Veg &amp; Non-veg)</option>
                  <option value="veg_only">Vegetarian only this week</option>
                </select>
              </div>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {autoPlanPreview.proposals.length === 0 ? (
              <p className="text-sm text-[#6B6B6B] py-5 text-center">
                No open slots available to fill with current filters.
              </p>
            ) : (
              autoPlanPreview.proposals.map((item) => {
                const dayMeta = weekDays.find((d) => d.iso === item.date);
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-[#EADFD2] bg-[#FFF9F2] px-3 py-2.5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="block text-[11px] font-medium text-[#6B6B6B]">
                        {dayMeta ? `${dayMeta.shortDay} ${dayMeta.dayNumber}` : item.date} ·{' '}
                        {MEAL_TYPE_LABELS[item.mealType]}
                      </span>
                      <span className="block font-heading font-semibold text-sm text-[#2B2B2B] truncate">
                        {safeText(item.recipeName)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-[#1F6E42] font-semibold tabular-nums">
                        {item.protein}g protein
                      </span>
                      <DietBadge diet={item.diet} size="sm" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setAutoFillOpen(false)}
              className="flex-1 min-h-[44px] px-4 rounded-xl border border-[#DFD3C5] text-sm font-medium text-[#2B2B2B] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={autoPlanPreview.addedCount === 0}
              onClick={handleApplyAutoFill}
              className="flex-1 min-h-[44px] px-4 rounded-xl bg-[#1F6E42] hover:bg-[#185734] disabled:opacity-40 text-white font-heading font-semibold text-sm cursor-pointer"
            >
              Apply ({autoPlanPreview.addedCount})
            </button>
          </div>
        </div>
      </Dialog>

      {/* Dedicated Print-Only Kitchen Wall Schedule */}
      <div
        className={`hidden print:block kitchen-wall-print-root ${
          printLayout === 'landscape_grid'
            ? 'kitchen-wall-landscape'
            : 'kitchen-wall-portrait'
        }`}
      >
        <PrintableWeekPoster
          weekHeading={weekHeading}
          days={printableSchedule.days}
          totalMealCount={printableSchedule.totalMealCount}
          servingsLabel={formatServingsLabel(estimatedServings)}
          layout={printLayout}
          showTimesAndServings={printShowTimes}
          includeGroceries={printIncludeGroceries}
          includeNotes={printIncludeNotes}
          missingItems={weekMissingItems}
          todayIso={todayIso}
        />
      </div>

      {/* Print Week Preview & Kitchen Wall Layout Dialog */}
      <Dialog
        open={printModalOpen}
        title="Print Week — Kitchen Wall Schedule"
        description="Preview and customize a clean, printer-friendly weekly menu for your fridge or kitchen wall."
        maxWidthClass="max-w-5xl"
        fullScreenOnMobile
        onClose={() => setPrintModalOpen(false)}
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-[#FFF9F2] border border-[#EADFD2] p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div
                role="group"
                aria-label="Print layout style"
                className="inline-flex p-1 rounded-xl bg-white border border-[#EADFD2]"
              >
                <button
                  type="button"
                  onClick={() => setPrintLayout('landscape_grid')}
                  aria-pressed={printLayout === 'landscape_grid'}
                  className={`min-h-[44px] px-3 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    printLayout === 'landscape_grid'
                      ? 'bg-[#2B2B2B] text-white font-semibold'
                      : 'text-[#6B6B6B] hover:text-[#2B2B2B]'
                  }`}
                >
                  Wall Grid (Landscape)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintLayout('portrait_agenda')}
                  aria-pressed={printLayout === 'portrait_agenda'}
                  className={`min-h-[44px] px-3 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    printLayout === 'portrait_agenda'
                      ? 'bg-[#2B2B2B] text-white font-semibold'
                      : 'text-[#6B6B6B] hover:text-[#2B2B2B]'
                  }`}
                >
                  Daily Agenda (Portrait)
                </button>
              </div>

              <span className="text-xs text-[#6B6B6B]">
                {printLayout === 'landscape_grid'
                  ? 'Best on Landscape paper (fits all 7 days across one page).'
                  : 'Best on Portrait paper (2-column daily list).'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <label className="min-h-[44px] inline-flex items-center gap-2 text-xs font-medium text-[#2B2B2B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={printShowTimes}
                  onChange={(e) => setPrintShowTimes(e.target.checked)}
                  className="w-4 h-4 accent-[#C5411B] rounded"
                />
                <span>Show cook times &amp; servings</span>
              </label>

              <label className="min-h-[44px] inline-flex items-center gap-2 text-xs font-medium text-[#2B2B2B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={printIncludeGroceries}
                  onChange={(e) => setPrintIncludeGroceries(e.target.checked)}
                  className="w-4 h-4 accent-[#C5411B] rounded"
                />
                <span>Include items to buy ({weekMissingItems.length})</span>
              </label>

              <label className="min-h-[44px] inline-flex items-center gap-2 text-xs font-medium text-[#2B2B2B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={printIncludeNotes}
                  onChange={(e) => setPrintIncludeNotes(e.target.checked)}
                  className="w-4 h-4 accent-[#C5411B] rounded"
                />
                <span>Include prep notes box</span>
              </label>

              <label className="min-h-[44px] inline-flex items-center gap-2 text-xs font-medium text-[#2B2B2B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={printIncludeSkipped}
                  onChange={(e) => setPrintIncludeSkipped(e.target.checked)}
                  className="w-4 h-4 accent-[#C5411B] rounded"
                />
                <span>Include skipped meals</span>
              </label>
            </div>
          </div>

          {/* Paper Preview Frame */}
          <div className="rounded-xl border border-[#DFD3C5] bg-white p-4 sm:p-6 shadow-xs overflow-x-auto">
            <PrintableWeekPoster
              weekHeading={weekHeading}
              days={printableSchedule.days}
              totalMealCount={printableSchedule.totalMealCount}
              servingsLabel={formatServingsLabel(estimatedServings)}
              layout={printLayout}
              showTimesAndServings={printShowTimes}
              includeGroceries={printIncludeGroceries}
              includeNotes={printIncludeNotes}
              missingItems={weekMissingItems}
              todayIso={todayIso}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setPrintModalOpen(false)}
              className="min-h-[44px] px-5 rounded-xl border border-[#DFD3C5] hover:border-[#2B2B2B] text-sm font-medium text-[#2B2B2B] cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[44px] px-5 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" aria-hidden="true" />
              <span>Print schedule</span>
            </button>
          </div>
        </div>
      </Dialog>

      {/* Weekly Nutrition Goal Editor Dialog */}
      <Dialog
        open={goalDialogOpen}
        title="Set weekly nutrition goal"
        description="Choose a target weekly calorie range (and optional protein goal) to track against your meal plan."
        maxWidthClass="max-w-md"
        onClose={() => setGoalDialogOpen(false)}
      >
        <form onSubmit={handleSaveNutritionGoal} className="space-y-4">
          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-[#6B6B6B]">
              Compare goal against
            </span>
            <div
              role="group"
              aria-label="Weekly goal measurement scope"
              className="inline-flex w-full p-1 rounded-xl bg-[#FFF9F2] border border-[#EADFD2]"
            >
              <button
                type="button"
                onClick={() => setGoalScopeInput('perServing')}
                aria-pressed={goalScopeInput === 'perServing'}
                className={`flex-1 min-h-[44px] px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  goalScopeInput === 'perServing'
                    ? 'bg-white text-[#2B2B2B] font-semibold shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#2B2B2B]'
                }`}
              >
                Per adult serving
              </button>
              <button
                type="button"
                onClick={() => setGoalScopeInput('household')}
                aria-pressed={goalScopeInput === 'household'}
                className={`flex-1 min-h-[44px] px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  goalScopeInput === 'household'
                    ? 'bg-white text-[#2B2B2B] font-semibold shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#2B2B2B]'
                }`}
              >
                Household total
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-[#6B6B6B]">
              Quick weekly presets
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Light (10.5k–12.6k)', min: 10500, max: 12600, protein: 300 },
                { label: 'Balanced (12.6k–15.4k)', min: 12600, max: 15400, protein: 350 },
                { label: 'Active (15.4k–18.2k)', min: 15400, max: 18200, protein: 420 },
              ].map((preset) => {
                const factor =
                  goalScopeInput === 'household'
                    ? Math.max(1, Math.round(estimatedServings))
                    : 1;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setGoalMinInput(String(preset.min * factor));
                      setGoalMaxInput(String(preset.max * factor));
                      setGoalProteinInput(String(preset.protein * factor));
                      setGoalFormError(null);
                    }}
                    className="min-h-[44px] px-3 rounded-xl bg-[#FFF9F2] border border-[#DFD3C5] hover:border-[#C5411B] text-xs font-medium text-[#2B2B2B] cursor-pointer"
                  >
                    {preset.label}
                    {factor > 1 ? ` ×${factor}` : ''}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="goal-min-calories"
                className="block text-xs font-medium text-[#2B2B2B]"
              >
                Min calories (kcal / week)
              </label>
              <input
                id="goal-min-calories"
                type="number"
                min={500}
                max={200000}
                step={100}
                required
                value={goalMinInput}
                onChange={(e) => {
                  setGoalMinInput(e.target.value);
                  setGoalFormError(null);
                }}
                className="w-full h-11 px-3 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm text-[#2B2B2B] tabular-nums"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="goal-max-calories"
                className="block text-xs font-medium text-[#2B2B2B]"
              >
                Max calories (kcal / week)
              </label>
              <input
                id="goal-max-calories"
                type="number"
                min={500}
                max={200000}
                step={100}
                required
                value={goalMaxInput}
                onChange={(e) => {
                  setGoalMaxInput(e.target.value);
                  setGoalFormError(null);
                }}
                className="w-full h-11 px-3 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm text-[#2B2B2B] tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="goal-protein-grams"
              className="block text-xs font-medium text-[#2B2B2B]"
            >
              Optional weekly protein target (g / week)
            </label>
            <input
              id="goal-protein-grams"
              type="number"
              min={10}
              max={5000}
              step={5}
              placeholder="e.g. 350"
              value={goalProteinInput}
              onChange={(e) => {
                setGoalProteinInput(e.target.value);
                setGoalFormError(null);
              }}
              className="w-full h-11 px-3 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm text-[#2B2B2B] tabular-nums"
            />
          </div>

          {goalFormError && (
            <p role="alert" className="text-xs font-medium text-[#A63429]">
              {goalFormError}
            </p>
          )}

          <p className="text-xs text-[#6B6B6B]">
            Estimated values. Not medical advice.
          </p>

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setGoalDialogOpen(false)}
              className="flex-1 min-h-[44px] px-4 rounded-xl border border-[#DFD3C5] text-sm font-medium text-[#2B2B2B] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[44px] px-4 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold text-sm cursor-pointer"
            >
              Save goal
            </button>
          </div>
        </form>
      </Dialog>

      <Toast
        message={toast?.message ?? null}
        variant={toast?.variant ?? 'success'}
        actionLabel={toast?.actionLabel}
        onAction={toast?.onAction}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
};
