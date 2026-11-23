import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  Bell,
  Check,
  CheckCircle2,
  ChefHat,
  Clock,
  Download,
  FileText,
  Heart,
  Image as ImageIcon,
  Lightbulb,
  Minus,
  Pause,
  Play,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Share2,
  ShoppingBasket,
  Sparkles,
  Star,
  Timer,
  Users,
  X,
} from 'lucide-react';
import {
  CHILD_GUIDANCE_DISCLAIMER,
  evaluateRecipeForChildren,
} from '../nutritionTargets.js';
import {
  getIngredientById,
  scaleServings,
  totalNutrition,
} from '../recipes.js';
import { getSubstitutesFor } from '../substitutions.js';
import {
  AllergyKey,
  CookedMeal,
  DietType,
  Household,
  LeftoverItem,
  MealType,
  NutritionInfo,
  Recipe,
  RecipeMatch,
} from '../types/cook';
import {
  AI_DISCLAIMER_TEXT,
  RecipeSubstitution,
  generateRecipeTipsAndSubstitutions,
} from '../utils/aiRecipes.js';
import { addDaysToIso, createLeftoverRecord } from '../utils/leftoverUtils.js';
import { formatServingsLabel } from '../utils/nutrition';
import {
  buildShareRecipeText,
  renderRecipeShareCanvas,
} from '../utils/shareUtils.js';
import {
  notifyTimerDone,
  playTimerChime,
  requestTimerNotificationPermission,
} from '../utils/sound';
import {
  IngredientUnitSystem,
  UNIT_SYSTEM_OPTIONS,
  convertIngredientMeasure,
} from '../utils/unitConversion';
import { useFocusTrap } from '../utils/useFocusTrap';
import { getVisualForRecipe } from '../utils/visualUtils.js';
import { CookingMode } from './CookingMode';
import { DietBadge } from './DietBadge';
import { IngredientTile } from './IngredientTile.jsx';
import { KeyNutrientsBreakdown } from './KeyNutrientsBreakdown';
import { NutritionBarChart } from './NutritionBarChart';
import { RecipeVisual } from './RecipeVisual.jsx';
import { Toast } from './Toast';

interface RecipeDetailProps {
  recipe: Recipe;
  match?: RecipeMatch | null;
  household: Household;
  defaultDiet: DietType;
  allergies?: AllergyKey[];
  aiAvailable?: boolean;
  selectedIngredientIds: string[];
  isFavorite: boolean;
  defaultMealType: MealType;
  onToggleFavorite: (recipeId: string) => void;
  onToggleHaveIngredient: (ingredientId: string) => void;
  onAddMissingToList: (
    recipe: Recipe,
    includeOptional: boolean,
    ownedIngredientIds: string[]
  ) => string;
  onLogCookedMeal: (meal: CookedMeal) => void;
  onSaveLeftover?: (leftover: LeftoverItem) => void;
  onBack: () => void;
  onGoToCalendar: () => void;
  showVisuals?: boolean;
  showIngredientImages?: boolean;
}

interface StepTimerState {
  remainingSeconds: number;
  totalSeconds: number;
  running: boolean;
  finished: boolean;
}

const NUTRITION_ROWS: {
  key: keyof NutritionInfo;
  label: string;
  unit: string;
  dailyTarget?: number;
}[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g', dailyTarget: 50 },
  { key: 'calcium', label: 'Calcium', unit: 'mg', dailyTarget: 1000 },
  { key: 'iron', label: 'Iron', unit: 'mg' },
  { key: 'vitaminC', label: 'Vitamin C', unit: 'mg' },
  { key: 'fiber', label: 'Fiber', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
];

function formatTimer(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function safeVal(val: unknown): string {
  if (val === undefined || val === null) return '-';
  if (typeof val === 'number' && Number.isNaN(val)) return '-';
  const s = String(val).trim();
  return s.length > 0 ? s : '-';
}

function formatQuantity(amount: number): string {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '-';
  if (amount <= 0) return '-';
  if (Number.isInteger(amount)) return String(amount);
  return String(Math.round(amount * 100) / 100);
}

function getCurrentDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getCurrentTimeString(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;
}

function generateMealId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `meal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipe,
  match,
  household,
  defaultDiet,
  allergies = [],
  aiAvailable = true,
  selectedIngredientIds,
  isFavorite,
  defaultMealType,
  onToggleFavorite,
  onToggleHaveIngredient,
  onAddMissingToList,
  onLogCookedMeal,
  onSaveLeftover,
  onBack,
  onGoToCalendar,
  showVisuals = true,
  showIngredientImages = true,
}) => {
  const [timersByStep, setTimersByStep] = useState<Record<number, StepTimerState>>({});
  const [finishedStepBanner, setFinishedStepBanner] = useState<{
    stepIndex: number;
    message: string;
  } | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [timerToast, setTimerToast] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [includeOptional, setIncludeOptional] = useState<boolean>(false);
  const [unitSystem, setUnitSystem] = useState<IngredientUnitSystem>('household');
  const [groceryToast, setGroceryToast] = useState<string | null>(null);

  // Feature 1: Substitutions open row tracking
  const [openSwapIngredientId, setOpenSwapIngredientId] = useState<string | null>(null);

  // Feature 3: Cooking mode state
  const [cookingModeOpen, setCookingModeOpen] = useState(false);
  const startCookingBtnRef = useRef<HTMLButtonElement | null>(null);

  // Feature 12: Share recipe sheet state
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const shareSheetRef = useRef<HTMLDivElement | null>(null);

  // AI Pro Tips & Substitutions state
  const [tipsLoading, setTipsLoading] = useState<boolean>(false);
  const [tipsError, setTipsError] = useState<string | null>(null);
  const [tipsData, setTipsData] = useState<{
    proTips: string[];
    substitutions: RecipeSubstitution[];
  } | null>(null);
  const tipsCacheRef = useRef<
    Map<string, { proTips: string[]; substitutions: RecipeSubstitution[] }>
  >(new Map());
  const tipsAbortRef = useRef<AbortController | null>(null);

  // "I cooked this" confirmation sheet state + Feature 4 Leftovers
  const [showLogSheet, setShowLogSheet] = useState(false);
  const [logDate, setLogDate] = useState(getCurrentDateString);
  const [logTime, setLogTime] = useState(getCurrentTimeString);
  const [logMealType, setLogMealType] = useState<MealType>(
    recipe.mealTypes.includes(defaultMealType)
      ? defaultMealType
      : recipe.mealTypes[0] ?? 'lunch'
  );
  const [logRating, setLogRating] = useState<number>(0);
  const [logNote, setLogNote] = useState('');
  const [leftoverPortions, setLeftoverPortions] = useState<number>(0);
  const [leftoverKeepUntil, setLeftoverKeepUntil] = useState<string>(() =>
    addDaysToIso(getCurrentDateString(), 2)
  );
  const [loggedSuccess, setLoggedSuccess] = useState(false);

  const logSheetRef = useRef<HTMLDivElement | null>(null);
  const notifiedStepTimersRef = useRef<Set<number>>(new Set());

  useFocusTrap(showLogSheet, logSheetRef, () => setShowLogSheet(false));
  useFocusTrap(shareSheetOpen, shareSheetRef, () => setShareSheetOpen(false));

  const scaled = useMemo(
    () => scaleServings(recipe, household),
    [recipe, household]
  );
  const nutrition = useMemo(
    () => totalNutrition(recipe, household),
    [recipe, household]
  );

  // Determine owned ingredient IDs from haveIngredients (when passed) and current selection
  const haveIdsSet = useMemo(() => {
    const ids = new Set<string>(selectedIngredientIds);
    if (match?.haveIngredients) {
      for (const h of match.haveIngredients) {
        ids.add(h.ingredientId);
      }
    }
    for (const item of recipe.ingredients) {
      const ing = getIngredientById(item.ingredientId);
      if (ing?.assumedAvailable) {
        ids.add(item.ingredientId);
      }
    }
    return ids;
  }, [match, selectedIngredientIds, recipe.ingredients]);

  const householdSummaryText = useMemo(() => {
    const adultsCount = Math.max(1, household.adults);
    const childCount = household.children.length;
    const parts = [`${adultsCount} adult${adultsCount === 1 ? '' : 's'}`];
    if (childCount > 0) {
      parts.push(`${childCount} child${childCount === 1 ? '' : 'ren'}`);
    }
    return `Cooks for ${formatServingsLabel(
      scaled.householdMultiplier
    )} servings (${parts.join(', ')})`;
  }, [household, scaled.householdMultiplier]);

  const childEvaluation = useMemo(
    () => evaluateRecipeForChildren(recipe, household),
    [recipe, household]
  );

  const maxLeftoverPortions = Math.max(
    1,
    Math.round(scaled.householdMultiplier || recipe.baseServings || 2)
  );

  const openLogMealSheet = () => {
    const today = getCurrentDateString();
    setLogDate(today);
    setLogTime(getCurrentTimeString());
    setLeftoverPortions(0);
    setLeftoverKeepUntil(addDaysToIso(today, 2));
    setLoggedSuccess(false);
    setShowLogSheet(true);
  };

  const tipsCacheKey = `${recipe.id}::${[...allergies].sort().join(',')}`;

  useEffect(() => {
    setTimersByStep({});
    setFinishedStepBanner(null);
    setCompletedSteps({});
    setTimerToast(null);
    notifiedStepTimersRef.current.clear();

    tipsAbortRef.current?.abort();
    tipsAbortRef.current = null;
    setTipsLoading(false);
    setTipsError(null);
    setTipsData(tipsCacheRef.current.get(tipsCacheKey) ?? null);

    return () => {
      tipsAbortRef.current?.abort();
      tipsAbortRef.current = null;
    };
  }, [recipe.id, tipsCacheKey]);

  const hasRunningTimer = useMemo(
    () => Object.values(timersByStep).some((t) => t.running),
    [timersByStep]
  );

  useEffect(() => {
    if (!hasRunningTimer) return;
    const interval = window.setInterval(() => {
      setTimersByStep((prev) => {
        let changed = false;
        const next: Record<number, StepTimerState> = { ...prev };
        for (const [keyStr, timer] of Object.entries(prev)) {
          const stepIdx = Number(keyStr);
          if (!timer.running) continue;
          changed = true;
          if (timer.remainingSeconds <= 1) {
            next[stepIdx] = {
              ...timer,
              remainingSeconds: 0,
              running: false,
              finished: true,
            };
          } else {
            next[stepIdx] = {
              ...timer,
              remainingSeconds: timer.remainingSeconds - 1,
            };
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [hasRunningTimer]);

  useEffect(() => {
    for (const [keyStr, timer] of Object.entries(timersByStep)) {
      const stepIdx = Number(keyStr);
      if (
        timer.finished &&
        !timer.running &&
        timer.remainingSeconds === 0 &&
        !notifiedStepTimersRef.current.has(stepIdx)
      ) {
        notifiedStepTimersRef.current.add(stepIdx);
        playTimerChime();
        const msg = `Step ${stepIdx + 1} timer finished for ${recipe.name}.`;
        setCompletedSteps((prev) => ({ ...prev, [stepIdx]: true }));
        setFinishedStepBanner({ stepIndex: stepIdx, message: msg });
        setTimerToast(msg);
        notifyTimerDone(msg);
      }
    }
  }, [timersByStep, recipe.name]);

  const startStepTimer = (stepIndex: number, seconds: number) => {
    requestTimerNotificationPermission();
    notifiedStepTimersRef.current.delete(stepIndex);
    setFinishedStepBanner((prev) =>
      prev?.stepIndex === stepIndex ? null : prev
    );
    setCompletedSteps((prev) => {
      if (!prev[stepIndex]) return prev;
      const copy = { ...prev };
      delete copy[stepIndex];
      return copy;
    });
    setTimerToast(null);
    setTimersByStep((prev) => ({
      ...prev,
      [stepIndex]: {
        remainingSeconds: seconds,
        totalSeconds: seconds,
        running: true,
        finished: false,
      },
    }));
  };

  const handleStepTap = (stepIndex: number, defaultSeconds: number) => {
    const existing = timersByStep[stepIndex];
    if (existing) {
      if (existing.finished || existing.remainingSeconds === 0) {
        startStepTimer(stepIndex, existing.totalSeconds || defaultSeconds);
        return;
      }
      setTimersByStep((prev) => {
        const current = prev[stepIndex];
        if (!current) return prev;
        return {
          ...prev,
          [stepIndex]: { ...current, running: !current.running },
        };
      });
      return;
    }
    startStepTimer(stepIndex, defaultSeconds);
  };

  const adjustStepTimer = (
    stepIndex: number,
    deltaSeconds: number,
    defaultSeconds: number
  ) => {
    notifiedStepTimersRef.current.delete(stepIndex);
    setFinishedStepBanner((prev) =>
      prev?.stepIndex === stepIndex ? null : prev
    );
    setTimersByStep((prev) => {
      const current = prev[stepIndex] ?? {
        remainingSeconds: defaultSeconds,
        totalSeconds: defaultSeconds,
        running: false,
        finished: false,
      };
      const nextRemaining = Math.max(10, current.remainingSeconds + deltaSeconds);
      const nextTotal = Math.max(current.totalSeconds, nextRemaining);
      return {
        ...prev,
        [stepIndex]: {
          ...current,
          remainingSeconds: nextRemaining,
          totalSeconds: nextTotal,
          finished: false,
        },
      };
    });
  };

  const resetStepTimer = (stepIndex: number, defaultSeconds: number) => {
    notifiedStepTimersRef.current.delete(stepIndex);
    setFinishedStepBanner((prev) =>
      prev?.stepIndex === stepIndex ? null : prev
    );
    setCompletedSteps((prev) => {
      if (!prev[stepIndex]) return prev;
      const copy = { ...prev };
      delete copy[stepIndex];
      return copy;
    });
    setTimersByStep((prev) => {
      const existing = prev[stepIndex];
      const baseSeconds = existing?.totalSeconds || defaultSeconds;
      return {
        ...prev,
        [stepIndex]: {
          remainingSeconds: baseSeconds,
          totalSeconds: baseSeconds,
          running: false,
          finished: false,
        },
      };
    });
  };

  const clearStepTimer = (stepIndex: number) => {
    notifiedStepTimersRef.current.delete(stepIndex);
    setFinishedStepBanner((prev) =>
      prev?.stepIndex === stepIndex ? null : prev
    );
    setCompletedSteps((prev) => {
      if (!prev[stepIndex]) return prev;
      const copy = { ...prev };
      delete copy[stepIndex];
      return copy;
    });
    setTimersByStep((prev) => {
      const copy = { ...prev };
      delete copy[stepIndex];
      return copy;
    });
  };

  const handleFetchAiTips = async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = tipsCacheRef.current.get(tipsCacheKey);
      if (cached) {
        setTipsData(cached);
        setTipsError(null);
        return;
      }
    }

    tipsAbortRef.current?.abort();
    const controller = new AbortController();
    tipsAbortRef.current = controller;

    setTipsLoading(true);
    setTipsError(null);

    const ingredientNames = recipe.ingredients.map((item) => {
      const catalog = getIngredientById(item.ingredientId);
      return catalog?.name ?? item.ingredientId;
    });

    const result = await generateRecipeTipsAndSubstitutions(
      {
        recipeName: recipe.name,
        diet: recipe.diet,
        cuisine: recipe.cuisine,
        ingredientNames,
        stepTexts: recipe.steps.map((s) => s.text),
        allergies,
      },
      controller.signal
    );

    if (tipsAbortRef.current !== controller) return;
    setTipsLoading(false);

    if (!result.ok) {
      if (result.code === 'ABORTED') return;
      setTipsError(result.message);
      return;
    }

    const nextTips = {
      proTips: result.proTips,
      substitutions: result.substitutions,
    };
    tipsCacheRef.current.set(tipsCacheKey, nextTips);
    setTipsData(nextTips);
  };

  const handleCancelAiTips = () => {
    tipsAbortRef.current?.abort();
    tipsAbortRef.current = null;
    setTipsLoading(false);
  };

  const showTimedShareToast = (msg: string) => {
    setShareToast(msg);
    window.setTimeout(() => setShareToast(null), 3500);
  };

  const getConvertedScaledIngredients = () =>
    scaled.ingredients.map((item) => {
      const converted = convertIngredientMeasure(
        item.scaledAmount,
        item.unit,
        item.ingredientId,
        unitSystem
      );
      return {
        ...item,
        displayAmountText: `${formatQuantity(converted.amount)} ${safeVal(
          converted.unit
        )}`.trim(),
      };
    });

  const handleShareAsText = async () => {
    const shareText = buildShareRecipeText(
      recipe,
      getConvertedScaledIngredients(),
      formatServingsLabel(scaled.householdMultiplier)
    );
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: recipe.name, text: shareText });
        setShareSheetOpen(false);
        showTimedShareToast('Recipe shared.');
        return;
      }
    } catch {
      // User dismissed or Web Share unsupported for text; fall back to clipboard.
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setShareSheetOpen(false);
      showTimedShareToast('Recipe text copied to clipboard.');
    } catch {
      setShareSheetOpen(false);
      showTimedShareToast('Clipboard unavailable here. Use Print to copy.');
    }
  };

  const handleShareAsCard = async () => {
    setShareBusy(true);
    try {
      const visual = getVisualForRecipe(recipe);
      const blob = await renderRecipeShareCanvas(
        recipe,
        getConvertedScaledIngredients(),
        visual
      );
      const safeFileName = `${recipe.id || 'recipe'}-card.png`;
      const file =
        typeof File !== 'undefined'
          ? new File([blob], safeFileName, { type: 'image/png' })
          : null;

      if (
        file &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            title: recipe.name,
            text: `${recipe.name} — Made with What Can I Cook?`,
            files: [file],
          });
          setShareSheetOpen(false);
          showTimedShareToast('Recipe card shared.');
          return;
        } catch {
          // Fall back to direct PNG download
        }
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = safeFileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setShareSheetOpen(false);
      showTimedShareToast('Recipe card PNG downloaded.');
    } catch {
      showTimedShareToast('Could not create share card right now.');
    } finally {
      setShareBusy(false);
    }
  };

  const handleConfirmCooked = (e: React.FormEvent) => {
    e.preventDefault();
    const meal: CookedMeal = {
      id: generateMealId(),
      recipeId: recipe.id,
      recipeName: recipe.name,
      date: logDate,
      time: logTime,
      mealType: logMealType,
      diet: recipe.diet,
      servings: scaled.householdMultiplier,
      proteinPerServing: recipe.nutritionPerServing.protein,
      rating: logRating > 0 ? logRating : undefined,
      note: logNote.trim() || undefined,
    };
    onLogCookedMeal(meal);

    if (leftoverPortions > 0 && onSaveLeftover) {
      const record = createLeftoverRecord({
        recipeId: recipe.id,
        portions: leftoverPortions,
        maxServings: maxLeftoverPortions,
        cookedDate: logDate,
        keepUntil: leftoverKeepUntil,
      });
      if (record) {
        onSaveLeftover(record);
      }
    }

    setLoggedSuccess(true);
  };

  return (
    <div className="space-y-6 pb-36 sm:pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-3.5 rounded-xl bg-white border border-[#EADFD2] hover:border-[#E4572E] text-sm font-medium text-[#2B2B2B] inline-flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleFavorite(recipe.id)}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
            className={`min-h-[44px] px-3.5 rounded-xl border text-sm font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              isFavorite
                ? 'bg-[#E4572E]/10 border-[#C5411B] text-[#B83915]'
                : 'bg-white border-[#EADFD2] text-[#2B2B2B] hover:border-[#C5411B]'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${isFavorite ? 'fill-[#C5411B] text-[#C5411B]' : ''}`}
              aria-hidden="true"
            />
            <span>{isFavorite ? 'Saved' : 'Favorite'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShareSheetOpen(true)}
            className="min-h-[44px] px-3.5 rounded-xl bg-white border border-[#EADFD2] hover:border-[#2B2B2B] text-sm font-medium text-[#2B2B2B] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[44px] px-3.5 rounded-xl bg-white border border-[#EADFD2] hover:border-[#2B2B2B] text-sm font-medium text-[#2B2B2B] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            type="button"
            onClick={openLogMealSheet}
            className="hidden sm:inline-flex min-h-[44px] px-5 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold text-sm items-center gap-2 transition-colors cursor-pointer"
          >
            <ChefHat className="w-4 h-4" aria-hidden="true" />
            <span>I cooked this</span>
          </button>
        </div>
      </div>

      {shareToast && (
        <div
          role="status"
          aria-live="polite"
          className="bg-[#1F6E42] text-white text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2"
        >
          <Check className="w-4 h-4" aria-hidden="true" />
          <span>{shareToast}</span>
        </div>
      )}

      {(recipe.isAiGenerated || recipe.source === 'ai') && (
        <div
          role="note"
          aria-label="AI-generated recipe notice"
          className="bg-[#6B3FA0]/8 border border-[#6B3FA0]/25 rounded-2xl p-4 flex items-start gap-3"
        >
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#6B3FA0] text-white text-xs font-semibold shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>AI-generated</span>
          </span>
          <p className="text-xs sm:text-sm text-[#2B2B2B] leading-relaxed">
            {AI_DISCLAIMER_TEXT}
          </p>
        </div>
      )}

      {/* Recipe Hero Card */}
      <header className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#EADFD2] flex flex-col">
        <RecipeVisual
          recipe={recipe}
          variant="detail"
          showVisual={showVisuals}
        />

        <div className="p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <DietBadge diet={recipe.diet} />
              <span className="text-[#6B6B6B]" aria-hidden="true">
                ·
              </span>
              <span className="text-xs font-medium text-[#6B6B6B]">
                {safeVal(recipe.cuisine)}
              </span>
              <span className="text-[#6B6B6B]" aria-hidden="true">
                ·
              </span>
              <span className="text-xs font-medium text-[#6B6B6B] capitalize">
                {recipe.mealTypes.join(' / ') || '-'}
              </span>
              <span className="text-[#6B6B6B]" aria-hidden="true">
                ·
              </span>
              <span className="text-xs font-medium text-[#6B6B6B] capitalize">
                {safeVal(recipe.difficulty)}
              </span>
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2B2B2B] mt-2">
              {safeVal(recipe.name)}
            </h1>
            <p className="text-sm text-[#1F6E42] font-medium mt-2 inline-flex items-center gap-1.5">
              <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="tabular-nums">{householdSummaryText}</span>
            </p>

            {childEvaluation.hasChildren && (
              <div className="mt-3 rounded-xl bg-[#FFF9F2] border border-[#EADFD2] px-3.5 py-2.5 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[#2B2B2B] inline-flex items-center gap-1.5">
                    <Baby className="w-4 h-4 text-[#C5411B]" aria-hidden="true" />
                    <span>For children ({childEvaluation.youngestLabel})</span>
                  </span>
                  {childEvaluation.flags.length > 0 ? (
                    childEvaluation.flags.map((flag) => (
                      <span
                        key={flag}
                        className="px-2 py-0.5 rounded-md bg-[#E4572E]/12 text-[#A63429] text-[11px] font-semibold"
                      >
                        {flag}
                      </span>
                    ))
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-[#1F6E42]/12 text-[#1F6E42] text-[11px] font-semibold">
                      Good calcium &amp; iron match
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#6B6B6B]">
                  {CHILD_GUIDANCE_DISCLAIMER}
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#F0E6DA] flex flex-wrap items-center justify-between gap-4">
            <div className="grid grid-cols-3 gap-4 sm:gap-6 text-sm tabular-nums flex-1">
              <div>
                <span className="block text-xs text-[#6B6B6B]">Prep time</span>
                <span className="font-semibold text-[#2B2B2B] inline-flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-[#E4572E]" aria-hidden="true" />
                  {safeVal(recipe.prepMinutes)} min
                </span>
              </div>
              <div>
                <span className="block text-xs text-[#6B6B6B]">Cook time</span>
                <span className="font-semibold text-[#2B2B2B] inline-flex items-center gap-1 mt-0.5">
                  <Timer className="w-3.5 h-3.5 text-[#E4572E]" aria-hidden="true" />
                  {safeVal(recipe.cookMinutes)} min
                </span>
              </div>
              <div>
                <span className="block text-xs text-[#6B6B6B]">Base yield</span>
                <span className="font-semibold text-[#2B2B2B] inline-flex items-center gap-1 mt-0.5">
                  {safeVal(recipe.baseServings)} servings
                </span>
              </div>
            </div>

            {recipe.steps.length > 0 && (
              <button
                ref={startCookingBtnRef}
                type="button"
                onClick={() => setCookingModeOpen(true)}
                className="min-h-[44px] px-4 rounded-xl bg-[#2B2B2B] hover:bg-[#1A1A1A] text-white font-heading font-semibold text-sm inline-flex items-center gap-2 shrink-0 no-print cursor-pointer"
              >
                <Play className="w-4 h-4" aria-hidden="true" />
                <span>Start cooking</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Two-Column Layout: Ingredients Left, Steps & Nutrition Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Scaled Ingredients */}
        <section className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#EADFD2] space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-heading text-xl font-semibold text-[#2B2B2B]">
                Ingredients
              </h2>
              <span className="text-xs text-[#6B6B6B] tabular-nums">
                Scaled ×{formatServingsLabel(scaled.scaleFactor)}
              </span>
            </div>

            <div
              className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#FFF9F2] border border-[#EADFD2] no-print"
              role="group"
              aria-label="Ingredient unit system"
            >
              {UNIT_SYSTEM_OPTIONS.map((opt) => {
                const active = unitSystem === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setUnitSystem(opt.id)}
                    aria-pressed={active}
                    className={`min-h-[44px] px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-white text-[#2B2B2B] shadow-xs font-semibold'
                        : 'text-[#6B6B6B] hover:text-[#2B2B2B]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <ul className="divide-y divide-[#F3EAE0]">
            {scaled.ingredients.map((item, idx) => {
              const catalog = getIngredientById(item.ingredientId);
              const name = safeVal(catalog?.name ?? item.ingredientId);
              const have = haveIdsSet.has(item.ingredientId);
              const converted = convertIngredientMeasure(
                item.scaledAmount,
                item.unit,
                item.ingredientId,
                unitSystem
              );

              const swaps =
                !have && catalog && !catalog.assumedAvailable
                  ? getSubstitutesFor(
                      item.ingredientId,
                      household,
                      Array.from(haveIdsSet),
                      {
                        diet: defaultDiet,
                        recipeDiet: recipe.diet,
                        allergies,
                      }
                    )
                  : [];
              const swapOpen = openSwapIngredientId === item.ingredientId;

              return (
                <li
                  key={`${item.ingredientId}-${idx}`}
                  className="py-3 first:pt-1 last:pb-1 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <IngredientTile
                        ingredient={
                          catalog ?? {
                            id: item.ingredientId,
                            name,
                          }
                        }
                        size="sm"
                        showImage={showIngredientImages}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#2B2B2B]">
                          <span className="tabular-nums font-semibold">
                            {formatQuantity(converted.amount)} {safeVal(converted.unit)}
                          </span>{' '}
                          {name}
                        </p>
                        {(converted.converted || item.optional) && (
                          <p className="text-xs text-[#6B6B6B] tabular-nums">
                            {converted.converted
                              ? `Orig: ${formatQuantity(item.scaledAmount)} ${safeVal(item.unit)}`
                              : ''}
                            {converted.converted && item.optional ? ' · ' : ''}
                            {item.optional ? 'Optional' : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {have ? (
                        <span className="text-xs font-medium text-[#1F6E42] inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>You have this</span>
                        </span>
                      ) : (
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-xs font-medium text-[#A63429]">
                            Missing
                          </span>
                          <div className="flex items-center gap-2 no-print">
                            {catalog && !catalog.assumedAvailable && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenSwapIngredientId((prev) =>
                                      prev === item.ingredientId
                                        ? null
                                        : item.ingredientId
                                    )
                                  }
                                  aria-expanded={swapOpen}
                                  className="text-xs text-[#5B2E91] hover:underline font-medium cursor-pointer"
                                >
                                  Swap{swaps.length > 0 ? ` (${swaps.length})` : ''}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onToggleHaveIngredient(catalog.id)}
                                  className="text-xs text-[#1F6E42] hover:underline font-medium cursor-pointer"
                                >
                                  Mark as have
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {swapOpen && !have && (
                    <div className="ml-12 rounded-xl bg-[#FFF9F2] border border-[#EADFD2] p-3 text-xs space-y-1.5 no-print">
                      {swaps.length > 0 ? (
                        <>
                          <p className="font-semibold text-[#2B2B2B]">
                            Swaps from what you have:
                          </p>
                          <ul className="space-y-1.5">
                            {swaps.map((sw) => (
                              <li
                                key={sw.ingredientId}
                                className="flex flex-col gap-0.5"
                              >
                                <span className="font-semibold text-[#1F6E42]">
                                  {sw.name}{' '}
                                  <span className="font-normal text-[#6B6B6B]">
                                    ({sw.ratioText})
                                  </span>
                                </span>
                                <span className="text-[#6B6B6B]">{sw.note}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <p className="text-[#6B6B6B]">
                          No matching swaps selected in your kitchen yet.
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {!(defaultDiet === 'veg' && recipe.diet === 'nonveg') && (() => {
            const missingRequiredCount = scaled.ingredients.filter((item) => {
              if (item.optional) return false;
              const catalog = getIngredientById(item.ingredientId);
              return !(
                Boolean(catalog?.assumedAvailable) ||
                haveIdsSet.has(item.ingredientId)
              );
            }).length;
            const missingOptionalCount = scaled.ingredients.filter((item) => {
              if (!item.optional) return false;
              const catalog = getIngredientById(item.ingredientId);
              return !(
                Boolean(catalog?.assumedAvailable) ||
                haveIdsSet.has(item.ingredientId)
              );
            }).length;
            const needsGroceryButton =
              missingRequiredCount > 0 ||
              (includeOptional && missingOptionalCount > 0);

            return (
              <div className="pt-3 border-t border-[#F3EAE0] space-y-3 no-print">
                {missingOptionalCount > 0 && (
                  <label className="min-h-[44px] flex items-center gap-2.5 text-sm text-[#2B2B2B] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeOptional}
                      onChange={(e) => setIncludeOptional(e.target.checked)}
                      className="w-5 h-5 rounded accent-[#1F6E42] cursor-pointer"
                    />
                    <span>Include optional</span>
                  </label>
                )}

                {needsGroceryButton ? (
                  <button
                    type="button"
                    onClick={() => {
                      const msg = onAddMissingToList(
                        recipe,
                        includeOptional,
                        Array.from(haveIdsSet)
                      );
                      setGroceryToast(msg);
                    }}
                    className="w-full min-h-[44px] px-4 rounded-xl bg-[#1F6E42] hover:bg-[#185734] text-white font-heading font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <ShoppingBasket className="w-4 h-4" aria-hidden="true" />
                    <span>Add missing to list</span>
                  </button>
                ) : (
                  <p className="text-xs font-medium text-[#1F6E42] flex items-center gap-1.5">
                    <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>
                      {missingOptionalCount > 0
                        ? 'All required ingredients are in your kitchen. Check "Include optional" to add optional items.'
                        : 'All ingredients are already in your kitchen.'}
                    </span>
                  </p>
                )}
              </div>
            );
          })()}
        </section>

        {/* Right Column: Steps & Nutrition */}
        <div className="lg:col-span-7 space-y-6">
          {/* Numbered Steps with Tap-to-Start Kitchen Timer on Every Step */}
          <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#EADFD2] space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-heading text-xl font-semibold text-[#2B2B2B]">
                Cooking steps
              </h2>
              <span className="text-xs text-[#6B6B6B] no-print">
                Tap any step to start or pause its timer
              </span>
            </div>

            {Object.keys(timersByStep).length > 0 && (
              <div
                aria-label="Active step timers"
                className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-[#FFF9F2] border border-[#EADFD2] no-print"
              >
                <span className="text-xs font-semibold text-[#2B2B2B] px-1">
                  Timers:
                </span>
                {Object.entries(timersByStep)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([keyStr, timer]) => {
                    const stepIdx = Number(keyStr);
                    return (
                      <div
                        key={stepIdx}
                        className={`inline-flex items-center gap-1.5 pl-2.5 pr-1 py-0.5 rounded-lg border text-xs font-semibold tabular-nums ${
                          timer.finished
                            ? 'bg-[#EEF7F1] border-[#1F6E42]/40 text-[#1F6E42]'
                            : timer.running
                            ? 'bg-[#FFF5EF] border-[#C5411B]/50 text-[#B83915]'
                            : 'bg-white border-[#DFD3C5] text-[#2B2B2B]'
                        }`}
                      >
                        <span>
                          Step {stepIdx + 1}:{' '}
                          {timer.finished
                            ? 'Done'
                            : formatTimer(timer.remainingSeconds)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleStepTap(stepIdx, timer.totalSeconds || 120)
                          }
                          aria-label={
                            timer.running
                              ? `Pause Step ${stepIdx + 1} timer`
                              : timer.finished
                              ? `Restart Step ${stepIdx + 1} timer`
                              : `Resume Step ${stepIdx + 1} timer`
                          }
                          className="min-w-[36px] min-h-[36px] rounded-md hover:bg-black/5 flex items-center justify-center cursor-pointer"
                        >
                          {timer.running ? (
                            <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : timer.finished ? (
                            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : (
                            <Play className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}

            {finishedStepBanner && (
              <div
                role="status"
                aria-live="polite"
                className="rounded-xl bg-[#EEF7F1] border border-[#1F6E42]/30 text-[#1F6E42] px-4 py-3 flex items-center justify-between gap-3 text-sm font-medium no-print"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Bell className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{finishedStepBanner.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFinishedStepBanner(null)}
                  aria-label="Dismiss timer notification"
                  className="min-w-[44px] min-h-[44px] -my-2 -mr-2 flex items-center justify-center rounded-xl hover:bg-[#1F6E42]/10 shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}

            <ol className="space-y-3">
              {recipe.steps.map((stepItem, idx) => {
                const stepTimer = timersByStep[idx] ?? null;
                const isDone = Boolean(completedSteps[idx] || stepTimer?.finished);
                const defaultStepSeconds =
                  typeof stepItem.timerSeconds === 'number' &&
                  stepItem.timerSeconds > 0
                    ? stepItem.timerSeconds
                    : 120;
                const displaySeconds = stepTimer
                  ? stepTimer.remainingSeconds
                  : defaultStepSeconds;
                const progressPct =
                  stepTimer && stepTimer.totalSeconds > 0
                    ? Math.min(
                        100,
                        Math.max(
                          0,
                          Math.round(
                            ((stepTimer.totalSeconds - stepTimer.remainingSeconds) /
                              stepTimer.totalSeconds) *
                              100
                          )
                        )
                      )
                    : 0;

                return (
                  <li
                    key={idx}
                    className={`p-3.5 sm:p-4 rounded-xl border space-y-3 transition-colors ${
                      stepTimer && !stepTimer.finished
                        ? 'bg-[#FFF5EF] border-[#C5411B]'
                        : isDone
                        ? 'bg-[#EEF7F1]/70 border-[#1F6E42]/40'
                        : 'bg-[#FFF9F2] border-[#F0E6DA] hover:border-[#DFD3C5]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleStepTap(idx, defaultStepSeconds)}
                      aria-label={`Step ${idx + 1}: ${safeVal(stepItem.text)}. ${
                        stepTimer
                          ? stepTimer.running
                            ? `Timer running, ${formatTimer(displaySeconds)} remaining. Tap to pause.`
                            : stepTimer.finished || stepTimer.remainingSeconds === 0
                            ? 'Timer finished. Tap to restart.'
                            : `Timer paused at ${formatTimer(displaySeconds)}. Tap to resume.`
                          : `Tap to start ${formatTimer(defaultStepSeconds)} timer.`
                      }`}
                      className="w-full min-h-[44px] text-left flex items-start justify-between gap-3 rounded-lg cursor-pointer"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-full text-white text-xs font-heading font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums ${
                            isDone ? 'bg-[#1F6E42]' : 'bg-[#C5411B]'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <p className="text-sm sm:text-base text-[#2B2B2B] leading-relaxed">
                          {safeVal(stepItem.text)}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold tabular-nums shrink-0 mt-0.5 no-print whitespace-nowrap ${
                          stepTimer
                            ? stepTimer.finished || stepTimer.remainingSeconds === 0
                              ? 'bg-[#1F6E42] text-white'
                              : stepTimer.running
                              ? 'bg-[#C5411B] text-white'
                              : 'bg-white border border-[#C5411B] text-[#B83915]'
                            : isDone
                            ? 'bg-[#1F6E42]/15 text-[#1F6E42]'
                            : 'bg-white border border-[#DFD3C5] text-[#2B2B2B]'
                        }`}
                      >
                        <Timer className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>
                          {stepTimer
                            ? stepTimer.finished || stepTimer.remainingSeconds === 0
                              ? 'Done'
                              : stepTimer.running
                              ? formatTimer(displaySeconds)
                              : `Paused · ${formatTimer(displaySeconds)}`
                            : `Start · ${formatTimer(displaySeconds)}`}
                        </span>
                      </span>
                    </button>

                    {stepTimer && (
                      <div className="pl-10 space-y-2 no-print">
                        <div className="h-1.5 w-full rounded-full bg-[#F3EAE0] overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              stepTimer.finished ? 'bg-[#1F6E42]' : 'bg-[#C5411B]'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 bg-white px-3 py-1 rounded-xl border border-[#C5411B]/40 w-fit">
                          <span className="font-heading font-bold text-base text-[#B83915] tabular-nums min-w-[54px]">
                            {formatTimer(stepTimer.remainingSeconds)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStepTap(idx, defaultStepSeconds)}
                            aria-label={
                              stepTimer.running
                                ? `Pause Step ${idx + 1} timer`
                                : stepTimer.finished ||
                                  stepTimer.remainingSeconds === 0
                                ? `Restart Step ${idx + 1} timer`
                                : `Resume Step ${idx + 1} timer`
                            }
                            className="min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FFF9F2] flex items-center justify-center text-[#2B2B2B] cursor-pointer"
                          >
                            {stepTimer.running ? (
                              <Pause className="w-4 h-4" aria-hidden="true" />
                            ) : (
                              <Play className="w-4 h-4" aria-hidden="true" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              adjustStepTimer(idx, -30, defaultStepSeconds)
                            }
                            aria-label={`Subtract 30 seconds from Step ${idx + 1} timer`}
                            className="min-w-[44px] min-h-[44px] px-2 rounded-lg hover:bg-[#FFF9F2] text-xs font-semibold text-[#2B2B2B] tabular-nums cursor-pointer"
                          >
                            -30s
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              adjustStepTimer(idx, 60, defaultStepSeconds)
                            }
                            aria-label={`Add 1 minute to Step ${idx + 1} timer`}
                            className="min-w-[44px] min-h-[44px] px-2 rounded-lg hover:bg-[#FFF9F2] text-xs font-semibold text-[#2B2B2B] tabular-nums cursor-pointer"
                          >
                            +1m
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              resetStepTimer(idx, defaultStepSeconds)
                            }
                            aria-label={`Reset Step ${idx + 1} timer`}
                            className="min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FFF9F2] flex items-center justify-center text-[#6B6B6B] cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => clearStepTimer(idx)}
                            aria-label={`Close Step ${idx + 1} timer`}
                            className="min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#FFF9F2] flex items-center justify-center text-[#6B6B6B] cursor-pointer"
                          >
                            <X className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>

          {/* AI Chef Pro Tips & Common Substitutions */}
          <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#EADFD2] space-y-4 no-print">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <h2 className="font-heading text-xl font-semibold text-[#2B2B2B] inline-flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-[#6B3FA0] shrink-0" aria-hidden="true" />
                  <span>Chef pro tips &amp; substitutions</span>
                </h2>
                <p className="text-xs sm:text-sm text-[#6B6B6B]">
                  Get practical cooking tips and easy ingredient swaps tailored to this dish.
                  {allergies.length > 0 && ' Excludes your household allergies.'}
                </p>
              </div>

              {aiAvailable && (
                <div className="flex items-center gap-2 shrink-0">
                  {tipsLoading ? (
                    <button
                      type="button"
                      onClick={handleCancelAiTips}
                      className="min-h-[44px] px-4 rounded-xl border border-[#DFD3C5] bg-white hover:bg-[#FFF9F2] text-sm font-medium text-[#2B2B2B] whitespace-nowrap cursor-pointer"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleFetchAiTips(Boolean(tipsData))}
                      className={`min-h-[44px] px-4 rounded-xl text-sm font-heading font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
                        tipsData
                          ? 'border border-[#6B3FA0]/35 bg-[#6B3FA0]/8 hover:bg-[#6B3FA0]/14 text-[#5B2E91]'
                          : 'bg-[#6B3FA0] hover:bg-[#583285] text-white'
                      }`}
                    >
                      {tipsData ? (
                        <>
                          <RefreshCw className="w-4 h-4" aria-hidden="true" />
                          <span>Refresh tips</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" aria-hidden="true" />
                          <span>Get AI pro tips &amp; swaps</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

            {!aiAvailable && !tipsData && (
              <p className="text-xs text-[#6B6B6B]">
                AI tips are off
              </p>
            )}

            {tipsLoading && (
              <div
                aria-live="polite"
                className="rounded-xl bg-[#FFF9F2] border border-[#EADFD2] p-4 flex items-center gap-3 text-sm text-[#2B2B2B]"
              >
                <Sparkles className="w-4 h-4 text-[#6B3FA0] animate-pulse shrink-0" aria-hidden="true" />
                <span>Finding pro tips and ingredient substitutions for {safeVal(recipe.name)}...</span>
              </div>
            )}

            {tipsError && !tipsLoading && (
              <div
                role="alert"
                className="rounded-xl bg-[#A63429]/8 border border-[#A63429]/30 p-3.5 flex flex-wrap items-center justify-between gap-3"
              >
                <p className="text-xs sm:text-sm font-medium text-[#8C261D]">
                  {tipsError}
                </p>
                {aiAvailable && (
                  <button
                    type="button"
                    onClick={() => handleFetchAiTips(true)}
                    className="min-h-[44px] px-3.5 rounded-xl bg-white border border-[#A63429]/40 text-xs font-semibold text-[#8C261D] hover:bg-[#FFF9F2] whitespace-nowrap cursor-pointer"
                  >
                    Try again
                  </button>
                )}
              </div>
            )}

            {tipsData && !tipsLoading && (
              <div className="space-y-4">
                {tipsData.proTips.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-[#5B2E91]">
                      Pro tips
                    </h3>
                    <ul className="space-y-2">
                      {tipsData.proTips.map((tip, i) => (
                        <li
                          key={i}
                          className="rounded-xl bg-[#FFF9F2] border border-[#EADFD2] px-3.5 py-2.5 text-sm text-[#2B2B2B] leading-relaxed flex items-start gap-2.5"
                        >
                          <span
                            className="w-5 h-5 rounded-full bg-[#6B3FA0]/12 text-[#5B2E91] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums"
                            aria-hidden="true"
                          >
                            {i + 1}
                          </span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {tipsData.substitutions.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-[#5B2E91]">
                      Common substitutions
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {tipsData.substitutions.map((sub, i) => (
                        <li
                          key={i}
                          className="rounded-xl bg-[#FFF9F2] border border-[#EADFD2] p-3 space-y-1"
                        >
                          <p className="text-sm font-semibold text-[#2B2B2B] flex flex-wrap items-center gap-1.5">
                            <span>{sub.ingredient}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#6B3FA0] shrink-0" aria-hidden="true" />
                            <span className="text-[#1F6E42]">{sub.substitute}</span>
                          </p>
                          <p className="text-xs text-[#6B6B6B] leading-relaxed">
                            {sub.reason}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p
                  role="note"
                  className="text-[11px] text-[#5B2E91] bg-[#6B3FA0]/8 rounded-lg px-3 py-2 leading-snug"
                >
                  AI-generated tips. Always check ingredients and labels against household allergies.
                </p>
              </div>
            )}
          </section>

          {/* Detailed Nutritional Breakdown Bar Chart */}
          <NutritionBarChart
            perPerson={nutrition.perPerson}
            householdTotal={nutrition.householdTotal}
            householdMultiplier={nutrition.householdMultiplier}
          />

          {/* Ingredient-Based Key Nutrients & Health Insights */}
          <KeyNutrientsBreakdown
            scaledIngredients={scaled.ingredients}
            householdMultiplier={scaled.householdMultiplier}
          />

          {/* Nutrition Panel (Per-person & Household Totals side by side) */}
          <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#EADFD2] space-y-4">
            <div>
              <h2 className="font-heading text-xl font-semibold text-[#2B2B2B]">
                Nutrition breakdown
              </h2>
              <p className="text-xs font-medium text-[#6B6B6B] mt-0.5">
                Estimated values. Not medical advice.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#EADFD2] text-xs text-[#6B6B6B]">
                    <th scope="col" className="text-left font-medium py-2 pr-3">Nutrient</th>
                    <th scope="col" className="text-right font-medium py-2 px-3 whitespace-nowrap">
                      Per adult serving
                    </th>
                    <th scope="col" className="text-right font-medium py-2 pl-3 whitespace-nowrap tabular-nums">
                      Household total ({formatServingsLabel(nutrition.householdMultiplier)})
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EAE0]">
                  {NUTRITION_ROWS.map((row) => {
                    const perVal = nutrition.perPerson?.[row.key];
                    const isPerValid =
                      typeof perVal === 'number' && !Number.isNaN(perVal);
                    // totalNutrition uses Number(null)===0 inside recipes.js, so treat household total as missing whenever perPerson is missing
                    const rawTotVal = nutrition.householdTotal?.[row.key];
                    const isTotValid =
                      isPerValid &&
                      typeof rawTotVal === 'number' &&
                      !Number.isNaN(rawTotVal);

                    const hasBar = typeof row.dailyTarget === 'number';
                    const pct =
                      hasBar && isPerValid
                        ? Math.min(100, Math.round((perVal! / row.dailyTarget!) * 100))
                        : 0;

                    return (
                      <tr key={row.key}>
                        <td className="py-3 pr-3 align-top">
                          <span className="font-medium text-[#2B2B2B]">
                            {row.label}
                          </span>
                          {hasBar && (
                            <div className="mt-1.5 space-y-1 max-w-[200px]">
                              <div className="h-2 rounded-full bg-[#F3EAE0] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[#2E8B57]"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="block text-[11px] text-[#6B6B6B] tabular-nums">
                                {isPerValid
                                  ? `${pct}% of ${row.dailyTarget} ${row.unit} daily target`
                                  : '-'}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right align-top tabular-nums whitespace-nowrap">
                          {isPerValid ? (
                            <>
                              <span className="font-semibold text-[#2B2B2B]">
                                {safeVal(perVal)} {row.unit}
                              </span>{' '}
                              <span className="text-xs text-[#6B6B6B]">Estimated</span>
                            </>
                          ) : (
                            <span className="font-semibold text-[#6B6B6B]">-</span>
                          )}
                        </td>
                        <td className="py-3 pl-3 text-right align-top tabular-nums whitespace-nowrap">
                          {isTotValid ? (
                            <>
                              <span className="font-semibold text-[#2B2B2B]">
                                {safeVal(rawTotVal)} {row.unit}
                              </span>{' '}
                              <span className="text-xs text-[#6B6B6B]">Estimated</span>
                            </>
                          ) : (
                            <span className="font-semibold text-[#6B6B6B]">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {/* Mobile Sticky Bottom "I cooked this" CTA */}
      <div className="sm:hidden fixed bottom-16 left-0 right-0 z-20 px-4 py-2.5 bg-gradient-to-t from-[#FFF9F2] via-[#FFF9F2] to-[#FFF9F2]/80 no-print">
        <button
          type="button"
          onClick={openLogMealSheet}
          className="w-full h-12 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold text-base shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <ChefHat className="w-5 h-5" aria-hidden="true" />
          <span>I cooked this</span>
        </button>
      </div>

      {/* Log Meal Confirmation Sheet / Modal */}
      {showLogSheet && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 no-print"
          role="dialog"
          aria-modal="true"
          aria-labelledby="log-meal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLogSheet(false);
          }}
        >
          <div
            ref={logSheetRef}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto"
          >
            {!loggedSuccess ? (
              <form onSubmit={handleConfirmCooked} className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2
                      id="log-meal-title"
                      className="font-heading text-xl font-bold text-[#2B2B2B]"
                    >
                      Log cooked meal
                    </h2>
                    <p className="text-sm text-[#6B6B6B] mt-0.5">
                      {safeVal(recipe.name)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLogSheet(false)}
                    aria-label="Close dialog"
                    className="min-w-[44px] min-h-[44px] -mt-2 -mr-2 rounded-xl hover:bg-[#FFF9F2] flex items-center justify-center text-[#6B6B6B] cursor-pointer"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="log-date"
                      className="block text-xs font-medium text-[#6B6B6B] mb-1"
                    >
                      Date
                    </label>
                    <input
                      id="log-date"
                      type="date"
                      required
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm text-[#2B2B2B]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="log-time"
                      className="block text-xs font-medium text-[#6B6B6B] mb-1"
                    >
                      Time
                    </label>
                    <input
                      id="log-time"
                      type="time"
                      required
                      value={logTime}
                      onChange={(e) => setLogTime(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm text-[#2B2B2B]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="log-meal-type"
                    className="block text-xs font-medium text-[#6B6B6B] mb-1"
                  >
                    Meal type
                  </label>
                  <select
                    id="log-meal-type"
                    value={logMealType}
                    onChange={(e) => setLogMealType(e.target.value as MealType)}
                    className="w-full h-11 px-3 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm text-[#2B2B2B]"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="snacks">Snacks</option>
                    <option value="dinner">Dinner</option>
                  </select>
                </div>

                <div>
                  <span className="block text-xs font-medium text-[#6B6B6B] mb-1.5">
                    Rating (optional)
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setLogRating((prev) => (prev === star ? 0 : star))
                        }
                        aria-label={`Rate ${star} out of 5 stars`}
                        aria-pressed={star <= logRating}
                        className="min-w-[44px] min-h-[44px] rounded-xl hover:bg-[#FFF9F2] flex items-center justify-center cursor-pointer"
                      >
                        <Star
                          aria-hidden="true"
                          className={`w-6 h-6 ${
                            star <= logRating
                              ? 'fill-[#E4572E] text-[#E4572E]'
                              : 'text-[#DFD3C5]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="log-note"
                    className="block text-xs font-medium text-[#6B6B6B] mb-1"
                  >
                    Note (optional)
                  </label>
                  <textarea
                    id="log-note"
                    rows={2}
                    value={logNote}
                    onChange={(e) => setLogNote(e.target.value)}
                    placeholder="e.g. Added extra coriander, kids loved it..."
                    className="w-full p-3 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm text-[#2B2B2B] placeholder:text-[#6B6B6B]"
                  />
                </div>

                {/* Feature 4: Save leftover portions */}
                {onSaveLeftover && (
                  <div className="rounded-xl bg-[#FFF9F2] border border-[#EADFD2] p-3.5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="block text-xs font-semibold text-[#2B2B2B]">
                          Leftover portions
                        </span>
                        <span className="block text-[11px] text-[#6B6B6B]">
                          Save extra portions to finish later
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setLeftoverPortions((p) => Math.max(0, p - 1))
                          }
                          disabled={leftoverPortions <= 0}
                          aria-label="Decrease leftover portions"
                          className="min-w-[44px] min-h-[44px] rounded-xl bg-white border border-[#DFD3C5] disabled:opacity-40 flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <span className="w-8 text-center font-heading font-bold text-base tabular-nums">
                          {leftoverPortions}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setLeftoverPortions((p) =>
                              Math.min(maxLeftoverPortions, p + 1)
                            )
                          }
                          disabled={leftoverPortions >= maxLeftoverPortions}
                          aria-label="Increase leftover portions"
                          className="min-w-[44px] min-h-[44px] rounded-xl bg-white border border-[#DFD3C5] disabled:opacity-40 flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    {leftoverPortions > 0 && (
                      <div>
                        <label
                          htmlFor="leftover-keep-until"
                          className="block text-xs font-medium text-[#6B6B6B] mb-1"
                        >
                          Keep until
                        </label>
                        <input
                          id="leftover-keep-until"
                          type="date"
                          value={leftoverKeepUntil}
                          onChange={(e) => setLeftoverKeepUntil(e.target.value)}
                          className="w-full h-11 px-3 rounded-xl border border-[#DFD3C5] bg-white text-sm text-[#2B2B2B]"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLogSheet(false)}
                    className="flex-1 h-12 rounded-xl border border-[#DFD3C5] text-sm font-medium text-[#2B2B2B] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-12 rounded-xl bg-[#1F6E42] hover:bg-[#185734] text-white font-heading font-semibold text-sm cursor-pointer"
                  >
                    Save to calendar
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center space-y-4 py-2">
                <div className="w-12 h-12 rounded-full bg-[#1F6E42]/12 text-[#1F6E42] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-heading text-xl font-bold text-[#2B2B2B]">
                    Meal logged!
                  </h2>
                  <p className="text-sm text-[#6B6B6B] mt-1">
                    {safeVal(recipe.name)} was added to {logDate} at {logTime}.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLogSheet(false)}
                    className="flex-1 h-11 rounded-xl border border-[#DFD3C5] text-sm font-medium text-[#2B2B2B] cursor-pointer"
                  >
                    Keep viewing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLogSheet(false);
                      onGoToCalendar();
                    }}
                    className="flex-1 h-11 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold text-sm cursor-pointer"
                  >
                    View calendar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Recipe Modal Sheet */}
      {shareSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 no-print"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-recipe-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShareSheetOpen(false);
          }}
        >
          <div
            ref={shareSheetRef}
            className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-xl space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="share-recipe-title"
                  className="font-heading text-xl font-bold text-[#2B2B2B]"
                >
                  Share recipe
                </h2>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  Shares only this dish, timing, ingredients, and steps.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShareSheetOpen(false)}
                aria-label="Close share dialog"
                className="min-w-[44px] min-h-[44px] -mt-2 -mr-2 rounded-xl hover:bg-[#FFF9F2] flex items-center justify-center text-[#6B6B6B] cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                disabled={shareBusy}
                onClick={handleShareAsText}
                className="w-full min-h-[48px] px-4 rounded-xl border border-[#DFD3C5] hover:border-[#2B2B2B] bg-[#FFF9F2] text-left flex items-center gap-3 cursor-pointer"
              >
                <FileText className="w-5 h-5 text-[#C5411B] shrink-0" aria-hidden="true" />
                <div>
                  <span className="block text-sm font-semibold text-[#2B2B2B]">
                    Share as text
                  </span>
                  <span className="block text-xs text-[#6B6B6B]">
                    Clean ingredient list and steps
                  </span>
                </div>
              </button>

              <button
                type="button"
                disabled={shareBusy}
                onClick={handleShareAsCard}
                className="w-full min-h-[48px] px-4 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white text-left flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <div>
                    <span className="block text-sm font-heading font-semibold">
                      Share as card
                    </span>
                    <span className="block text-xs text-white/85">
                      1080×1350 PNG image card
                    </span>
                  </div>
                </div>
                <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Cooking Mode */}
      <CookingMode
        open={cookingModeOpen}
        recipe={recipe}
        timersByStep={timersByStep}
        onToggleStepTimer={handleStepTap}
        onAdjustStepTimer={adjustStepTimer}
        onResetStepTimer={resetStepTimer}
        onDoneCooking={openLogMealSheet}
        onClose={() => setCookingModeOpen(false)}
        returnFocusRef={startCookingBtnRef}
      />

      <Toast
        message={groceryToast ?? timerToast}
        variant={groceryToast ? 'success' : 'info'}
        onDismiss={() => {
          setGroceryToast(null);
          setTimerToast(null);
        }}
      />
    </div>
  );
};
