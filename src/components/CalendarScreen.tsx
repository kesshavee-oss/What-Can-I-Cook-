import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  ExternalLink,
  Minus,
  Plus,
  Search,
  ShoppingBasket,
  Sparkles,
  Star,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { RECIPES } from '../recipes.js';
import { CookedMeal, DietType, MealType, Recipe } from '../types/cook';
import { AI_DISCLAIMER_TEXT } from '../utils/aiRecipes.js';
import {
  PastMealPreset,
  addDays,
  buildPastMealPresets,
  computePeriodSummary,
  createQuickAddedMeal,
  formatDate,
  formatDayPanelTitle,
  formatRangeHeading,
  getMonthGrid,
  getWeekDays,
  groupMealsByDate,
  parseLocalDate,
  startOfMonth,
} from '../utils/calendarHelpers.js';
import { getMissingRecipeIngredientsCount } from '../utils/groceryUtils.js';
import { useFocusTrap } from '../utils/useFocusTrap';
import { DayNutritionSummaryCard } from './DayNutritionSummaryCard';
import { DietBadge } from './DietBadge';
import { RecipeVisual } from './RecipeVisual.jsx';

interface CalendarScreenProps {
  cookedMeals: CookedMeal[];
  aiRecipes?: Recipe[];
  ownedIngredientIds?: string[];
  defaultDiet?: DietType;
  showVisuals?: boolean;
  onOpenRecipeById: (recipeId: string) => void;
  onLogCookedMeal?: (meal: CookedMeal) => boolean | void;
  onUpdateMeal: (meal: CookedMeal) => boolean;
  onDeleteMeal: (mealId: string) => boolean;
  onAddRecipeToList?: (
    recipe: Recipe,
    includeOptional?: boolean,
    ownedIngredientIds?: string[]
  ) => string;
  onGoToCook: () => void;
}

type CalendarMode = 'month' | 'week' | 'day';

const MONDAY_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEAL_TYPE_OPTIONS: { id: MealType; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'snacks', label: 'Snacks' },
  { id: 'dinner', label: 'Dinner' },
];

function getRecipeById(recipeId: string): Recipe | null {
  return RECIPES.find((r) => r.id === recipeId) ?? null;
}

function chunkIntoRows<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  cookedMeals,
  aiRecipes = [],
  ownedIngredientIds = [],
  defaultDiet = 'veg',
  showVisuals = true,
  onOpenRecipeById,
  onLogCookedMeal,
  onUpdateMeal,
  onDeleteMeal,
  onAddRecipeToList,
  onGoToCook,
}) => {
  const todayIso = formatDate(new Date());

  const [viewMode, setViewMode] = useState<CalendarMode>('month');
  const [cursorDate, setCursorDate] = useState<Date>(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [isDayPanelOpen, setIsDayPanelOpen] = useState<boolean>(true);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState<boolean>(false);

  // Filters: Diet and Meal Type can be combined
  const [dietFilter, setDietFilter] = useState<DietType | null>(null);
  const [mealFilter, setMealFilter] = useState<MealType | null>(null);

  // Month grid skeleton (< 300ms)
  const [gridLoading, setGridLoading] = useState<boolean>(false);

  // Edit / Delete / Quick Add / Toast states
  const [editingMeal, setEditingMeal] = useState<CookedMeal | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState<boolean>(false);
  const [quickSearch, setQuickSearch] = useState<string>('');
  const [quickDate, setQuickDate] = useState<string>(todayIso);
  const [quickTime, setQuickTime] = useState<string>('12:00');
  const [customizingPreset, setCustomizingPreset] = useState<PastMealPreset | null>(null);
  const [customMealType, setCustomMealType] = useState<MealType>('lunch');
  const [customServings, setCustomServings] = useState<number>(1);
  const [customNote, setCustomNote] = useState<string>('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Swipe tracking for mobile period navigation & sheet drag-down
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const sheetDragStartY = useRef<number | null>(null);
  const cellButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const pendingFocusIsoRef = useRef<string | null>(null);
  const mobileSheetRef = useRef<HTMLDivElement | null>(null);
  const editDialogRef = useRef<HTMLFormElement | null>(null);
  const deleteDialogRef = useRef<HTMLDivElement | null>(null);
  const quickAddDialogRef = useRef<HTMLDivElement | null>(null);
  const quickAddTriggerRef = useRef<HTMLButtonElement | null>(null);
  const quickSearchInputRef = useRef<HTMLInputElement | null>(null);

  const closeQuickAdd = () => {
    setQuickAddOpen(false);
    setCustomizingPreset(null);
    window.requestAnimationFrame(() => {
      quickAddTriggerRef.current?.focus();
    });
  };

  useFocusTrap(
    isMobileSheetOpen && viewMode !== 'day' && !editingMeal && !deleteTargetId && !quickAddOpen,
    mobileSheetRef,
    () => setIsMobileSheetOpen(false)
  );
  useFocusTrap(Boolean(editingMeal), editDialogRef, () => setEditingMeal(null));
  useFocusTrap(Boolean(deleteTargetId), deleteDialogRef, () => setDeleteTargetId(null));
  useFocusTrap(quickAddOpen, quickAddDialogRef, closeQuickAdd);

  const recipeMap = useMemo(() => {
    const map = new Map<string, Recipe>(RECIPES.map((r) => [r.id, r]));
    for (const r of aiRecipes) {
      map.set(r.id, r);
    }
    return map;
  }, [aiRecipes]);

  const allPastPresets = useMemo(
    () => buildPastMealPresets(cookedMeals, recipeMap, ''),
    [cookedMeals, recipeMap]
  );

  const filteredPastPresets = useMemo(
    () => buildPastMealPresets(cookedMeals, recipeMap, quickSearch),
    [cookedMeals, recipeMap, quickSearch]
  );

  const openQuickAdd = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    setQuickDate(selectedDate || formatDate(now));
    setQuickTime(`${hh}:${mm}`);
    setQuickSearch('');
    setCustomizingPreset(null);
    setQuickAddOpen(true);
    window.requestAnimationFrame(() => {
      quickSearchInputRef.current?.focus();
    });
  };

  const resolveRecipeById = (recipeId: string): Recipe | null =>
    recipeMap.get(recipeId) ?? getRecipeById(recipeId);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 3200);
  };

  // Filtered meals
  const filteredMeals = useMemo(() => {
    return cookedMeals.filter((m) => {
      if (dietFilter && m.diet !== dietFilter) return false;
      if (mealFilter && m.mealType !== mealFilter) return false;
      return true;
    });
  }, [cookedMeals, dietFilter, mealFilter]);

  const mealsByDate = useMemo(
    () => groupMealsByDate(filteredMeals),
    [filteredMeals]
  );

  // Month grid (42 cells starting Monday)
  const monthCells = useMemo(
    () => getMonthGrid(cursorDate.getFullYear(), cursorDate.getMonth()),
    [cursorDate]
  );
  const monthRows = useMemo(() => chunkIntoRows(monthCells, 7), [monthCells]);

  // Brief skeleton (< 300ms) when month or filters recalculate
  useEffect(() => {
    if (viewMode !== 'month') return;
    setGridLoading(true);
    const t = window.setTimeout(() => setGridLoading(false), 120);
    return () => window.clearTimeout(t);
  }, [viewMode, cursorDate, dietFilter, mealFilter]);

  // Restore focus to target date cell after arrow-key month grid updates or finishes loading
  useEffect(() => {
    if (viewMode !== 'month' || gridLoading) return;
    const targetIso = pendingFocusIsoRef.current;
    if (!targetIso) return;
    pendingFocusIsoRef.current = null;
    window.requestAnimationFrame(() => {
      cellButtonRefs.current[targetIso]?.focus();
    });
  }, [viewMode, gridLoading, monthCells]);

  // Escape key closes modals or day panel on desktop/mobile
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteTargetId) {
          setDeleteTargetId(null);
          return;
        }
        if (editingMeal) {
          setEditingMeal(null);
          return;
        }
        if (quickAddOpen) {
          if (customizingPreset) {
            setCustomizingPreset(null);
            return;
          }
          closeQuickAdd();
          return;
        }
        if (isMobileSheetOpen) {
          setIsMobileSheetOpen(false);
          return;
        }
        if (isDayPanelOpen) {
          setIsDayPanelOpen(false);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteTargetId, editingMeal, quickAddOpen, customizingPreset, isMobileSheetOpen, isDayPanelOpen]);

  // Week days (Mon - Sun)
  const weekDays = useMemo(
    () => getWeekDays(parseLocalDate(selectedDate)),
    [selectedDate]
  );

  // Meals in active visible range for Summary Card
  const visibleRangeMeals = useMemo(() => {
    if (viewMode === 'month') {
      const monthPrefix = `${cursorDate.getFullYear()}-${String(
        cursorDate.getMonth() + 1
      ).padStart(2, '0')}`;
      return filteredMeals.filter((m) => m.date.startsWith(monthPrefix));
    }
    if (viewMode === 'week') {
      const weekSet = new Set(weekDays.map((w) => w.iso));
      return filteredMeals.filter((m) => weekSet.has(m.date));
    }
    return mealsByDate[selectedDate] ?? [];
  }, [viewMode, cursorDate, weekDays, selectedDate, filteredMeals, mealsByDate]);

  const summary = useMemo(
    () => computePeriodSummary(visibleRangeMeals, recipeMap),
    [visibleRangeMeals, recipeMap]
  );

  const selectedDayMeals = mealsByDate[selectedDate] ?? [];
  const hasActiveFilters = dietFilter !== null || mealFilter !== null;

  const clearFilters = () => {
    setDietFilter(null);
    setMealFilter(null);
  };

  const navigatePeriod = (dir: -1 | 1) => {
    if (viewMode === 'month') {
      setCursorDate(
        (d) => new Date(d.getFullYear(), d.getMonth() + dir, 1)
      );
    } else if (viewMode === 'week') {
      const next = addDays(parseLocalDate(selectedDate), dir * 7);
      setSelectedDate(formatDate(next));
      setCursorDate(startOfMonth(next));
    } else {
      const next = addDays(parseLocalDate(selectedDate), dir);
      setSelectedDate(formatDate(next));
      setCursorDate(startOfMonth(next));
    }
  };

  const jumpToToday = () => {
    const now = new Date();
    const iso = formatDate(now);
    setCursorDate(startOfMonth(now));
    setSelectedDate(iso);
    setIsDayPanelOpen(true);
  };

  const openDay = (iso: string, openSheet = true) => {
    setSelectedDate(iso);
    setCursorDate(startOfMonth(parseLocalDate(iso)));
    setIsDayPanelOpen(true);
    if (openSheet) {
      setIsMobileSheetOpen(true);
    }
  };

  // Keyboard arrow navigation in Month grid
  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    iso: string
  ) => {
    let delta = 0;
    if (e.key === 'ArrowLeft') delta = -1;
    else if (e.key === 'ArrowRight') delta = 1;
    else if (e.key === 'ArrowUp') delta = -7;
    else if (e.key === 'ArrowDown') delta = 7;
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openDay(iso, true);
      return;
    } else {
      return;
    }

    e.preventDefault();
    const nextDate = addDays(parseLocalDate(iso), delta);
    const nextIso = formatDate(nextDate);
    setSelectedDate(nextIso);
    if (
      nextDate.getMonth() !== cursorDate.getMonth() ||
      nextDate.getFullYear() !== cursorDate.getFullYear()
    ) {
      pendingFocusIsoRef.current = nextIso;
      setCursorDate(startOfMonth(nextDate));
      return;
    }
    window.requestAnimationFrame(() => {
      cellButtonRefs.current[nextIso]?.focus();
    });
  };

  // Swipe handlers on calendar container
  const handleCalendarTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    swipeStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleCalendarTouchEnd = (e: React.TouchEvent) => {
    if (!swipeStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - swipeStartRef.current.x;
    const dy = t.clientY - swipeStartRef.current.y;
    swipeStartRef.current = null;
    if (Math.abs(dx) >= 56 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      navigatePeriod(dx < 0 ? 1 : -1);
    }
  };

  // Edit save & Delete confirm wrapped in try/catch
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeal) return;
    try {
      const cleaned: CookedMeal = {
        ...editingMeal,
        servings: Math.max(1, Number(editingMeal.servings) || 1),
        note: editingMeal.note ? editingMeal.note.slice(0, 200) : undefined,
      };
      const ok = onUpdateMeal(cleaned);
      if (!ok) {
        showToast('error', 'Could not save. Please try again.');
        return;
      }
      setSelectedDate(cleaned.date);
      setCursorDate(startOfMonth(parseLocalDate(cleaned.date)));
      setEditingMeal(null);
      showToast('success', 'Meal updated.');
    } catch {
      showToast('error', 'Could not save. Please try again.');
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetId) return;
    try {
      const ok = onDeleteMeal(deleteTargetId);
      if (!ok) {
        showToast('error', 'Could not save. Please try again.');
        return;
      }
      setDeleteTargetId(null);
      showToast('success', 'Meal deleted from calendar.');
    } catch {
      showToast('error', 'Could not save. Please try again.');
    }
  };

  const handleQuickLogPreset = (
    preset: PastMealPreset,
    overrides?: { mealType?: MealType; servings?: number; note?: string }
  ) => {
    if (!onLogCookedMeal) return;
    try {
      const meal = createQuickAddedMeal({
        preset,
        date: quickDate,
        time: quickTime,
        mealType: overrides?.mealType ?? preset.mealType,
        servings: overrides?.servings ?? preset.servings,
        note: overrides?.note,
      });
      const result = onLogCookedMeal(meal);
      if (result === false) {
        showToast('error', 'Could not save meal. Please try again.');
        return;
      }
      setSelectedDate(meal.date);
      setCursorDate(startOfMonth(parseLocalDate(meal.date)));
      setIsDayPanelOpen(true);
      setQuickAddOpen(false);
      setCustomizingPreset(null);
      setQuickSearch('');
      showToast('success', `Added "${preset.recipeName}" to ${meal.date}.`);
      window.requestAnimationFrame(() => {
        quickAddTriggerRef.current?.focus();
      });
    } catch {
      showToast('error', 'Could not save meal. Please try again.');
    }
  };

  const renderQuickAddModalAndFab = () => (
    <>
      <button
        ref={quickAddTriggerRef}
        type="button"
        onClick={openQuickAdd}
        aria-label="Quick Add meal from past cooked meals"
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 no-print min-h-[48px] px-4 sm:px-5 rounded-2xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold text-sm shadow-lg inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition-transform duration-150 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2B2B2B]"
      >
        <Plus className="w-5 h-5" aria-hidden="true" />
        <span>Quick Add</span>
      </button>

      {quickAddOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 no-print"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-add-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeQuickAdd();
          }}
        >
          <div
            ref={quickAddDialogRef}
            className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 max-h-[88vh] flex flex-col"
          >
            <div className="flex items-start justify-between gap-3 shrink-0">
              <div>
                <h2
                  id="quick-add-title"
                  className="font-heading text-lg sm:text-xl font-bold text-[#2B2B2B]"
                >
                  Quick Add meal
                </h2>
                <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5">
                  Search your past cooked meals to log one in a tap.
                </p>
              </div>
              <button
                type="button"
                onClick={closeQuickAdd}
                aria-label="Close Quick Add"
                className="min-w-[44px] min-h-[44px] -mt-1 -mr-2 rounded-xl hover:bg-[#FFF9F2] flex items-center justify-center text-[#6B6B6B] cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {allPastPresets.length === 0 ? (
              <div className="py-6 text-center space-y-4">
                <p className="text-sm text-[#6B6B6B]">
                  No past cooked meals yet. Cook and log your first dish to repeat it here anytime.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuickAddOpen(false);
                    onGoToCook();
                  }}
                  className="min-h-[44px] px-5 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold text-sm inline-flex items-center gap-2 cursor-pointer"
                >
                  <UtensilsCrossed className="w-4 h-4" aria-hidden="true" />
                  <span>Go to Cook</span>
                </button>
              </div>
            ) : customizingPreset ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleQuickLogPreset(customizingPreset, {
                    mealType: customMealType,
                    servings: customServings,
                    note: customNote,
                  });
                }}
                className="space-y-4 overflow-y-auto pr-0.5"
              >
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#F0E6DA]">
                  <button
                    type="button"
                    onClick={() => setCustomizingPreset(null)}
                    className="min-h-[44px] px-2.5 -ml-2 rounded-xl text-xs sm:text-sm font-medium text-[#2B2B2B] hover:bg-[#FFF9F2] cursor-pointer"
                  >
                    &larr; Back to search
                  </button>
                  <DietBadge diet={customizingPreset.diet} />
                </div>

                <div className="flex items-center gap-3">
                  <RecipeVisual
                    recipe={
                      customizingPreset.recipe ?? {
                        id: customizingPreset.recipeId,
                        name: customizingPreset.recipeName,
                        mealTypes: [customizingPreset.mealType],
                        diet: customizingPreset.diet,
                      }
                    }
                    variant="square"
                    showVisual={showVisuals}
                  />
                  <div className="min-w-0">
                    <h3 className="font-heading text-base font-bold text-[#2B2B2B] truncate">
                      {customizingPreset.recipeName}
                    </h3>
                    <p className="text-xs text-[#6B6B6B] tabular-nums">
                      Cooked {customizingPreset.timesCooked} time
                      {customizingPreset.timesCooked === 1 ? '' : 's'} · Last{' '}
                      {customizingPreset.lastCookedDate || '-'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="quick-custom-date"
                      className="block text-xs font-medium text-[#6B6B6B] mb-1"
                    >
                      Date
                    </label>
                    <input
                      id="quick-custom-date"
                      type="date"
                      required
                      value={quickDate}
                      onChange={(e) => setQuickDate(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="quick-custom-time"
                      className="block text-xs font-medium text-[#6B6B6B] mb-1"
                    >
                      Time
                    </label>
                    <input
                      id="quick-custom-time"
                      type="time"
                      required
                      value={quickTime}
                      onChange={(e) => setQuickTime(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="quick-custom-meal-type"
                      className="block text-xs font-medium text-[#6B6B6B] mb-1"
                    >
                      Meal type
                    </label>
                    <select
                      id="quick-custom-meal-type"
                      value={customMealType}
                      onChange={(e) => setCustomMealType(e.target.value as MealType)}
                      className="w-full h-11 px-3 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="snacks">Snacks</option>
                      <option value="dinner">Dinner</option>
                    </select>
                  </div>

                  <div>
                    <span className="block text-xs font-medium text-[#6B6B6B] mb-1">
                      Servings
                    </span>
                    <div className="flex items-center justify-between h-11 px-1.5 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2]">
                      <button
                        type="button"
                        onClick={() =>
                          setCustomServings((s) =>
                            Math.max(0.5, Math.round((s - 0.5) * 100) / 100)
                          )
                        }
                        disabled={customServings <= 0.5}
                        aria-label="Decrease servings"
                        className="w-9 h-9 rounded-lg hover:bg-white flex items-center justify-center disabled:opacity-40 cursor-pointer"
                      >
                        <Minus className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <span className="text-sm font-semibold tabular-nums">
                        {customServings}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCustomServings((s) => Math.round((s + 0.5) * 100) / 100)
                        }
                        aria-label="Increase servings"
                        className="w-9 h-9 rounded-lg hover:bg-white flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="quick-custom-note"
                      className="text-xs font-medium text-[#6B6B6B]"
                    >
                      Note (optional)
                    </label>
                    <span className="text-[11px] text-[#6B6B6B] tabular-nums">
                      {customNote.length}/200
                    </span>
                  </div>
                  <input
                    id="quick-custom-note"
                    type="text"
                    maxLength={200}
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="e.g., Less spicy, with raita"
                    className="w-full h-11 px-3 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setCustomizingPreset(null)}
                    className="flex-1 min-h-[44px] rounded-xl border border-[#DFD3C5] text-sm font-medium text-[#2B2B2B] cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 min-h-[44px] rounded-xl bg-[#1F6E42] hover:bg-[#185734] text-white font-heading font-semibold text-sm cursor-pointer"
                  >
                    Log to calendar
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="space-y-3 shrink-0">
                  <div className="relative">
                    <Search
                      className="w-4 h-4 text-[#6B6B6B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      ref={quickSearchInputRef}
                      type="search"
                      value={quickSearch}
                      onChange={(e) => setQuickSearch(e.target.value)}
                      placeholder="Search past cooked meals..."
                      aria-label="Search past cooked meals"
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm text-[#2B2B2B] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#C5411B]"
                    />
                    {quickSearch && (
                      <button
                        type="button"
                        onClick={() => setQuickSearch('')}
                        aria-label="Clear search"
                        className="min-w-[36px] min-h-[36px] rounded-lg text-[#6B6B6B] hover:text-[#2B2B2B] flex items-center justify-center absolute right-1 top-1/2 -translate-y-1/2 cursor-pointer"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label
                        htmlFor="quick-add-date"
                        className="block text-xs font-medium text-[#6B6B6B] mb-1"
                      >
                        Log for date
                      </label>
                      <input
                        id="quick-add-date"
                        type="date"
                        value={quickDate}
                        onChange={(e) => setQuickDate(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm text-[#2B2B2B]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="quick-add-time"
                        className="block text-xs font-medium text-[#6B6B6B] mb-1"
                      >
                        Time
                      </label>
                      <input
                        id="quick-add-time"
                        type="time"
                        value={quickTime}
                        onChange={(e) => setQuickTime(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm text-[#2B2B2B]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-0.5">
                  {filteredPastPresets.length === 0 ? (
                    <div className="py-8 text-center space-y-3">
                      <p className="text-sm text-[#6B6B6B]">
                        No past cooked meals match &ldquo;{quickSearch.trim()}&rdquo;.
                      </p>
                      <button
                        type="button"
                        onClick={() => setQuickSearch('')}
                        className="min-h-[44px] px-4 rounded-xl border border-[#DFD3C5] text-xs font-semibold text-[#2B2B2B] hover:bg-[#FFF9F2] cursor-pointer"
                      >
                        Clear search
                      </button>
                    </div>
                  ) : (
                    filteredPastPresets.map((preset) => (
                      <div
                        key={preset.key}
                        className="p-3 rounded-2xl bg-[#FFF9F2] border border-[#EADFD2] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <RecipeVisual
                            recipe={
                              preset.recipe ?? {
                                id: preset.recipeId,
                                name: preset.recipeName,
                                mealTypes: [preset.mealType],
                                diet: preset.diet,
                              }
                            }
                            variant="square"
                            showVisual={showVisuals}
                          />
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-heading text-sm sm:text-base font-semibold text-[#2B2B2B] leading-snug">
                                {preset.recipeName}
                              </h3>
                              <DietBadge diet={preset.diet} showLabel={false} />
                            </div>
                            <p className="text-xs text-[#6B6B6B] tabular-nums">
                              <span className="capitalize">{preset.mealType}</span>
                              <span aria-hidden="true"> · </span>
                              <span>
                                {preset.servings} serving{preset.servings === 1 ? '' : 's'}
                              </span>
                              <span aria-hidden="true"> · </span>
                              <span>Cooked {preset.timesCooked}x</span>
                              {preset.lastCookedDate && (
                                <>
                                  <span aria-hidden="true"> · </span>
                                  <span>Last {preset.lastCookedDate}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => {
                              setCustomizingPreset(preset);
                              setCustomMealType(preset.mealType);
                              setCustomServings(preset.servings);
                              setCustomNote(preset.note || '');
                            }}
                            aria-label={`Customize ${preset.recipeName} before logging`}
                            className="min-h-[44px] px-3 rounded-xl bg-white border border-[#DFD3C5] hover:border-[#2B2B2B] text-xs font-medium text-[#2B2B2B] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Adjust</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickLogPreset(preset)}
                            aria-label={`Quick add ${preset.recipeName} to calendar`}
                            className="min-h-[44px] px-3.5 rounded-xl bg-[#1F6E42] hover:bg-[#185734] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                          >
                            <Plus className="w-4 h-4" aria-hidden="true" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );

  // Empty state: No meals logged at all
  if (cookedMeals.length === 0) {
    return (
      <>
        <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-sm border border-[#EADFD2] text-center space-y-5">
          <div className="w-20 h-20 rounded-2xl bg-[#FFF9F2] border border-[#EADFD2] flex items-center justify-center mx-auto">
            <svg
              viewBox="0 0 64 64"
              className="w-12 h-12"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="10"
                y="14"
                width="44"
                height="40"
                rx="8"
                stroke="#E4572E"
                strokeWidth="3"
                fill="#FFFFFF"
              />
              <path d="M10 25H54" stroke="#EADFD2" strokeWidth="3" />
              <path
                d="M22 10V18M42 10V18"
                stroke="#E4572E"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="24" cy="36" r="4" fill="#2E8B57" />
              <circle cx="40" cy="36" r="4" fill="#E4572E" />
              <rect x="20" y="44" width="24" height="3" rx="1.5" fill="#DFD3C5" />
            </svg>
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h1 className="font-heading text-2xl font-bold text-[#2B2B2B]">
              No meals logged yet
            </h1>
            <p className="text-sm sm:text-base text-[#6B6B6B]">
              Cook something to start your calendar.
            </p>
          </div>

          <button
            type="button"
            onClick={onGoToCook}
            className="h-12 px-6 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold text-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <UtensilsCrossed className="w-4 h-4" aria-hidden="true" />
            <span>Go to Cook</span>
          </button>
        </div>
        {renderQuickAddModalAndFab()}
      </>
    );
  }

  // Reusable Full Meal Card for Day View & Day Panel
  const renderFullMealCard = (meal: CookedMeal) => {
    const recipe = resolveRecipeById(meal.recipeId);
    const title = recipe?.name ?? meal.recipeName ?? 'Recipe unavailable';
    const isAi = Boolean(recipe && (recipe.isAiGenerated || recipe.source === 'ai'));
    const proteinVal =
      meal.proteinPerServing ?? recipe?.nutritionPerServing?.protein;
    const servingsVal = meal.servings ?? 1;
    const hideAddButton =
      recipe && defaultDiet === 'veg' && recipe.diet === 'nonveg';
    const missingRequiredCount =
      recipe && !hideAddButton
        ? getMissingRecipeIngredientsCount(recipe, ownedIngredientIds, false)
        : 0;

    return (
      <article
        key={meal.id}
        className="p-4 rounded-2xl bg-[#FFF9F2] border border-[#EADFD2] space-y-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <RecipeVisual
              recipe={
                recipe ?? {
                  id: meal.recipeId,
                  name: title,
                  mealTypes: [meal.mealType],
                  diet: meal.diet,
                }
              }
              variant="square"
              showVisual={showVisuals}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="font-heading text-base font-semibold text-[#2B2B2B] leading-snug">
                  {title}
                </h3>
                {isAi && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#6B3FA0]/10 text-[#5B2E91] text-[11px] font-semibold">
                    <Sparkles className="w-3 h-3" aria-hidden="true" />
                    <span>AI</span>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#6B6B6B] mt-1 tabular-nums">
                <span className="inline-flex items-center gap-1 font-medium text-[#2B2B2B]">
                  <Clock className="w-3.5 h-3.5 text-[#B83915]" aria-hidden="true" />
                  {meal.time || '-'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{meal.mealType || '-'}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {servingsVal} serving{servingsVal === 1 ? '' : 's'}
                </span>
                {typeof proteinVal === 'number' && !Number.isNaN(proteinVal) && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{proteinVal}g protein (Estimated)</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <DietBadge diet={meal.diet} />
        </div>

        {isAi && (
          <p
            role="note"
            className="text-xs text-[#5B2E91] bg-[#6B3FA0]/8 rounded-xl px-3 py-2 leading-relaxed"
          >
            {AI_DISCLAIMER_TEXT}
          </p>
        )}

        {typeof meal.rating === 'number' && meal.rating > 0 && (
          <div
            className="flex items-center gap-0.5"
            aria-label={`Rated ${meal.rating} out of 5 stars`}
          >
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                aria-hidden="true"
                className={`w-4 h-4 ${
                  s <= meal.rating!
                    ? 'fill-[#C5411B] text-[#C5411B]'
                    : 'text-[#DFD3C5]'
                }`}
              />
            ))}
          </div>
        )}

        {meal.note && (
          <p className="text-xs sm:text-sm text-[#6B6B6B] italic">
            &ldquo;{meal.note}&rdquo;
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EADFD2]/70">
          <div className="flex flex-wrap items-center gap-2">
            {recipe ? (
              <button
                type="button"
                onClick={() => onOpenRecipeById(recipe.id)}
                className="min-h-[44px] px-3 rounded-xl bg-white border border-[#DFD3C5] hover:border-[#E4572E] text-xs font-semibold text-[#2B2B2B] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#E4572E]" aria-hidden="true" />
                <span>View recipe</span>
              </button>
            ) : (
              <span className="text-xs text-[#6B6B6B]">Recipe unavailable</span>
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
                  setToast({ type: 'success', text: msg });
                }}
                aria-label={`Add missing ingredients for ${title} to grocery list`}
                className="min-h-[44px] px-3 rounded-xl bg-white border border-[#EADFD2] hover:border-[#2E8B57] hover:bg-[#2E8B57]/10 text-xs font-semibold text-[#1F623D] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShoppingBasket className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add missing to list</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditingMeal({ ...meal })}
              className="min-h-[44px] px-3 rounded-xl hover:bg-white text-xs font-medium text-[#2B2B2B] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={() => setDeleteTargetId(meal.id)}
              className="min-h-[44px] px-3 rounded-xl hover:bg-white text-xs font-medium text-[#A63429] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </article>
    );
  };

  const renderDayPanelBody = (isMobile = false) => (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg sm:text-xl font-bold text-[#2B2B2B]">
            {formatDayPanelTitle(selectedDate)}
          </h2>
          <p className="text-xs text-[#6B6B6B] tabular-nums mt-0.5">
            {selectedDayMeals.length} meal{selectedDayMeals.length === 1 ? '' : 's'}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            isMobile ? setIsMobileSheetOpen(false) : setIsDayPanelOpen(false)
          }
          aria-label="Close day panel"
          className="min-w-[44px] min-h-[44px] -mt-1 -mr-1 rounded-xl hover:bg-[#FFF9F2] flex items-center justify-center text-[#6B6B6B] cursor-pointer"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {selectedDayMeals.length === 0 ? (
        <p className="text-sm text-[#6B6B6B] py-4">
          Nothing cooked on this day. Cook something from the Cook tab.
        </p>
      ) : (
        <div className="space-y-3">
          {selectedDayMeals.map((meal) => renderFullMealCard(meal))}
        </div>
      )}

      <div className="pt-2 border-t border-[#F0E6DA]">
        <button
          type="button"
          onClick={() => {
            setIsMobileSheetOpen(false);
            onGoToCook();
          }}
          className="w-full h-12 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <UtensilsCrossed className="w-4 h-4" aria-hidden="true" />
          <span>Cook something for this day</span>
        </button>
      </div>
    </div>
  );

  const vegPct =
    summary.totalMeals > 0
      ? Math.round((summary.vegCount / summary.totalMeals) * 100)
      : 0;

  return (
    <div className="space-y-5 pb-36 sm:pb-24">
      {/* Toast Notification */}
      {toast && (
        <div
          role={toast.type === 'error' ? 'alert' : 'status'}
          aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
          className={`rounded-xl px-4 py-3 text-sm font-medium text-white flex items-center justify-between gap-2 ${
            toast.type === 'error' ? 'bg-[#A63429]' : 'bg-[#1F6E42]'
          }`}
        >
          <span>{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss message"
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-white/15 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Header + Segmented View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2B2B2B]">
          Kitchen Calendar
        </h1>

        <div
          className="inline-flex p-1 bg-white rounded-xl border border-[#EADFD2] self-start"
          role="group"
          aria-label="Calendar view mode"
        >
          {(['month', 'week', 'day'] as CalendarMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`min-h-[44px] px-4 rounded-lg text-sm font-medium capitalize transition-colors cursor-pointer ${
                viewMode === mode
                  ? 'bg-[#C5411B] text-white'
                  : 'text-[#6B6B6B] hover:text-[#2B2B2B]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Card for Visible Period */}
      <section
        aria-label="Period summary"
        className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#EADFD2] space-y-3 tabular-nums"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <span className="block text-xs text-[#6B6B6B]">
              Total meals ({viewMode})
            </span>
            <span className="font-heading text-2xl font-bold text-[#2B2B2B]">
              {summary.totalMeals}
            </span>
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs text-[#6B6B6B]">Veg vs Non-veg</span>
            <div className="text-sm font-semibold">
              <span className="text-[#1F6E42]">{summary.vegCount} Veg</span>
              <span className="text-[#6B6B6B]"> · </span>
              <span className="text-[#A63429]">{summary.nonVegCount} Non-veg</span>
            </div>
            <div
              className="h-2 rounded-full bg-[#F3EAE0] overflow-hidden flex"
              aria-hidden="true"
            >
              {summary.totalMeals > 0 && (
                <>
                  <div
                    className="bg-[#1F6E42] h-full"
                    style={{ width: `${vegPct}%` }}
                  />
                  <div
                    className="bg-[#A63429] h-full"
                    style={{ width: `${100 - vegPct}%` }}
                  />
                </>
              )}
            </div>
          </div>

          <div>
            <span className="block text-xs text-[#6B6B6B]">
              Avg protein / day (Estimated)
            </span>
            <span className="font-heading text-2xl font-bold text-[#2B2B2B]">
              {summary.avgProteinPerDay !== null
                ? `${summary.avgProteinPerDay}g`
                : '-'}
            </span>
          </div>

          <div>
            <span className="block text-xs text-[#6B6B6B]">Most-cooked recipe</span>
            <span className="font-heading text-sm sm:text-base font-semibold text-[#2B2B2B] line-clamp-2 mt-0.5">
              {summary.mostCookedLabel}
            </span>
          </div>
        </div>
        <p className="text-xs text-[#6B6B6B]">
          Estimated values. Not medical advice.
        </p>
      </section>

      {/* Combinable Filter Chip Row */}
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filter calendar meals"
      >
        <button
          type="button"
          onClick={clearFilters}
          aria-pressed={!hasActiveFilters}
          className={`min-h-[44px] px-3.5 rounded-xl text-xs sm:text-sm font-medium border transition-colors cursor-pointer whitespace-nowrap ${
            !hasActiveFilters
              ? 'bg-[#2B2B2B] border-[#2B2B2B] text-white'
              : 'bg-white border-[#EADFD2] text-[#6B6B6B] hover:text-[#2B2B2B]'
          }`}
        >
          All
        </button>

        <button
          type="button"
          onClick={() => setDietFilter((d) => (d === 'veg' ? null : 'veg'))}
          aria-pressed={dietFilter === 'veg'}
          className={`min-h-[44px] px-3.5 rounded-xl text-xs sm:text-sm font-medium border transition-colors cursor-pointer whitespace-nowrap ${
            dietFilter === 'veg'
              ? 'bg-[#1F6E42] border-[#1F6E42] text-white'
              : 'bg-white border-[#EADFD2] text-[#2B2B2B] hover:border-[#1F6E42]'
          }`}
        >
          Veg
        </button>

        <button
          type="button"
          onClick={() => setDietFilter((d) => (d === 'nonveg' ? null : 'nonveg'))}
          aria-pressed={dietFilter === 'nonveg'}
          className={`min-h-[44px] px-3.5 rounded-xl text-xs sm:text-sm font-medium border transition-colors cursor-pointer whitespace-nowrap ${
            dietFilter === 'nonveg'
              ? 'bg-[#A63429] border-[#A63429] text-white'
              : 'bg-white border-[#EADFD2] text-[#2B2B2B] hover:border-[#A63429]'
          }`}
        >
          Non-veg
        </button>

        {MEAL_TYPE_OPTIONS.map((opt) => {
          const active = mealFilter === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() =>
                setMealFilter((m) => (m === opt.id ? null : opt.id))
              }
              aria-pressed={active}
              className={`min-h-[44px] px-3.5 rounded-xl text-xs sm:text-sm font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-[#C5411B] border-[#C5411B] text-white'
                  : 'bg-white border-[#EADFD2] text-[#2B2B2B] hover:border-[#C5411B]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="min-h-[44px] px-3 rounded-xl text-xs sm:text-sm font-medium text-[#B83915] hover:underline cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filters Remove All Meals Empty State */}
      {hasActiveFilters && filteredMeals.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#EADFD2] text-center space-y-3">
          <CalendarIcon
            className="w-8 h-8 text-[#C5411B] mx-auto"
            aria-hidden="true"
          />
          <h2 className="font-heading text-lg font-semibold text-[#2B2B2B]">
            No meals match these filters
          </h2>
          <button
            type="button"
            onClick={clearFilters}
            className="h-11 px-5 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white text-sm font-semibold cursor-pointer"
          >
            Clear
          </button>
        </div>
      ) : (
        /* Main Calendar Area + Desktop Right-Side Day Panel */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div
            className={`${
              isDayPanelOpen && viewMode !== 'day'
                ? 'lg:col-span-8'
                : 'lg:col-span-12'
            } bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#EADFD2] space-y-4`}
            onTouchStart={handleCalendarTouchStart}
            onTouchEnd={handleCalendarTouchEnd}
          >
            {/* Period Range Header & Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-heading text-lg sm:text-xl font-semibold text-[#2B2B2B]">
                {formatRangeHeading(viewMode, cursorDate, selectedDate)}
              </h2>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => navigatePeriod(-1)}
                  aria-label="Previous period"
                  className="min-w-[44px] min-h-[44px] rounded-xl border border-[#EADFD2] hover:bg-[#FFF9F2] flex items-center justify-center cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={jumpToToday}
                  className="min-h-[44px] px-3.5 rounded-xl border border-[#EADFD2] hover:bg-[#FFF9F2] text-xs sm:text-sm font-medium cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => navigatePeriod(1)}
                  aria-label="Next period"
                  className="min-w-[44px] min-h-[44px] rounded-xl border border-[#EADFD2] hover:bg-[#FFF9F2] flex items-center justify-center cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* MONTH VIEW */}
            {viewMode === 'month' && (
              <>
                {gridLoading ? (
                  <div
                    className="grid grid-cols-7 gap-1 animate-pulse"
                    aria-busy="true"
                    aria-label="Loading month grid"
                  >
                    {Array.from({ length: 42 }).map((_, i) => (
                      <div
                        key={i}
                        className="min-h-[48px] sm:min-h-[64px] rounded-xl bg-[#F3EAE0]"
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    role="grid"
                    aria-label={formatRangeHeading('month', cursorDate, selectedDate)}
                    className="space-y-1"
                  >
                    <div role="row" className="grid grid-cols-7 gap-1">
                      {MONDAY_WEEKDAYS.map((wd) => (
                        <div
                          key={wd}
                          role="columnheader"
                          className="text-center text-xs font-medium text-[#6B6B6B] py-1.5"
                        >
                          {wd}
                        </div>
                      ))}
                    </div>

                    {monthRows.map((row, rowIdx) => (
                      <div
                        key={rowIdx}
                        role="row"
                        className="grid grid-cols-7 gap-1"
                      >
                        {row.map((cell) => {
                          const dayMeals = mealsByDate[cell.iso] ?? [];
                          const isSelected = selectedDate === cell.iso;
                          const isToday = todayIso === cell.iso;
                          const hasMeals = dayMeals.length > 0;
                          const vegCount = dayMeals.filter(
                            (m) => m.diet === 'veg'
                          ).length;
                          const nonVegCount = dayMeals.filter(
                            (m) => m.diet === 'nonveg'
                          ).length;

                          const visibleDots = dayMeals.slice(0, 3);
                          const overflow = dayMeals.length - 3;

                          const spokenLabel = `${cell.date.toLocaleDateString(
                            undefined,
                            { weekday: 'long', day: 'numeric', month: 'long' }
                          )}, ${dayMeals.length} meal${
                            dayMeals.length === 1 ? '' : 's'
                          } cooked${
                            hasMeals ? ` (${vegCount} veg, ${nonVegCount} non-veg)` : ''
                          }`;

                          return (
                            <button
                              key={cell.iso}
                              ref={(el) => {
                                cellButtonRefs.current[cell.iso] = el;
                              }}
                              role="gridcell"
                              type="button"
                              aria-selected={isSelected}
                              aria-label={spokenLabel}
                              onClick={() => openDay(cell.iso, true)}
                              onKeyDown={(e) => handleCellKeyDown(e, cell.iso)}
                              className={`min-h-[48px] sm:min-h-[66px] p-1.5 rounded-xl border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                                isToday ? 'ring-2 ring-[#E4572E] ring-offset-1' : ''
                              } ${
                                isSelected
                                  ? 'bg-[#E4572E]/10 border-[#E4572E]'
                                  : hasMeals
                                  ? 'bg-[#FFF9F2] border-[#EADFD2] hover:border-[#E4572E]/60'
                                  : 'bg-white border-[#F3EAE0] hover:border-[#DFD3C5]'
                              } ${!cell.inCurrentMonth ? 'opacity-45' : ''}`}
                            >
                              <span
                                className={`text-xs font-medium tabular-nums ${
                                  isSelected || isToday
                                    ? 'text-[#B83915] font-bold'
                                    : 'text-[#2B2B2B]'
                                }`}
                              >
                                {cell.dayNumber}
                              </span>

                              {hasMeals && (
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                  {visibleDots.map((m) => (
                                    <span
                                      key={m.id}
                                      aria-hidden="true"
                                      className={`w-2 h-2 rounded-full ${
                                        m.diet === 'veg'
                                          ? 'bg-[#1F6E42]'
                                          : 'bg-[#A63429]'
                                      }`}
                                    />
                                  ))}
                                  {overflow > 0 && (
                                    <span
                                      aria-hidden="true"
                                      className="text-[10px] font-semibold text-[#6B6B6B] tabular-nums leading-none"
                                    >
                                      +{overflow}
                                    </span>
                                  )}
                                  <span className="sr-only">
                                    {vegCount} veg, {nonVegCount} non-veg
                                  </span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* WEEK VIEW: 7 columns on desktop, vertical list on mobile */}
            {viewMode === 'week' && (
              <div className="grid grid-cols-1 lg:grid-cols-7 gap-2.5">
                {weekDays.map((wd) => {
                  const dayMeals = mealsByDate[wd.iso] ?? [];
                  const isToday = wd.iso === todayIso;
                  const isSelected = wd.iso === selectedDate;

                  return (
                    <div
                      key={wd.iso}
                      className={`p-3 rounded-xl border space-y-2 ${
                        isSelected
                          ? 'bg-[#C5411B]/6 border-[#C5411B]'
                          : 'bg-[#FFF9F2] border-[#EADFD2]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => openDay(wd.iso, true)}
                        className="w-full min-h-[44px] text-left flex lg:flex-col items-center lg:items-start justify-between gap-1 cursor-pointer"
                      >
                        <span className="text-xs font-medium text-[#6B6B6B]">
                          {wd.shortDay}
                        </span>
                        <span
                          className={`font-heading font-bold text-base tabular-nums ${
                            isToday ? 'text-[#B83915]' : 'text-[#2B2B2B]'
                          }`}
                        >
                          {wd.dayNumber}
                        </span>
                      </button>

                      {dayMeals.length === 0 ? (
                        <p className="text-xs text-[#6B6B6B]">Nothing cooked</p>
                      ) : (
                        <div className="space-y-1.5">
                          {dayMeals.map((m) => {
                            const rec = resolveRecipeById(m.recipeId);
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => openDay(wd.iso, true)}
                                className="w-full min-h-[44px] text-left p-2 rounded-lg bg-white border border-[#EADFD2] hover:border-[#C5411B] space-y-1 cursor-pointer transition-colors"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[11px] font-medium text-[#6B6B6B] tabular-nums">
                                    {m.time || '-'}
                                  </span>
                                  <DietBadge diet={m.diet} showLabel={false} />
                                </div>
                                <p className="text-xs font-semibold text-[#2B2B2B] line-clamp-2">
                                  {rec?.name ?? m.recipeName ?? 'Recipe unavailable'}
                                </p>
                                <span className="block text-[11px] text-[#6B6B6B] capitalize">
                                  {m.mealType}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* DAY VIEW: Today nutrition summary + Timeline ordered by time */}
            {viewMode === 'day' && (
              <div className="space-y-4">
                <DayNutritionSummaryCard
                  dayMeals={selectedDayMeals}
                  recipeMap={recipeMap}
                  title={
                    selectedDate === todayIso
                      ? 'Today'
                      : `Today · ${formatDayPanelTitle(selectedDate)}`
                  }
                />

                {selectedDayMeals.length === 0 ? (
                  <div className="py-8 text-center space-y-3">
                    <p className="text-sm text-[#6B6B6B]">
                      Nothing cooked on this day. Cook something from the Cook tab.
                    </p>
                    <button
                      type="button"
                      onClick={onGoToCook}
                      className="h-11 px-5 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white text-sm font-semibold cursor-pointer"
                    >
                      Go to Cook
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDayMeals.map((meal) => renderFullMealCard(meal))}
                    <p className="text-xs text-[#6B6B6B] pt-1">
                      Estimated values. Not medical advice.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Right-Side Day Panel (1024px+) */}
          {isDayPanelOpen && viewMode !== 'day' && (
            <aside
              aria-label="Selected day details"
              className="hidden lg:block lg:col-span-4 bg-white rounded-2xl p-5 shadow-sm border border-[#EADFD2]"
            >
              {renderDayPanelBody(false)}
            </aside>
          )}
        </div>
      )}

      {/* Mobile & Tablet Bottom Sheet for Day Panel (< 1024px) */}
      {isMobileSheetOpen && viewMode !== 'day' && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-end justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={formatDayPanelTitle(selectedDate)}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMobileSheetOpen(false);
          }}
        >
          <div
            ref={mobileSheetRef}
            className="w-full max-w-lg bg-white rounded-t-3xl p-5 shadow-xl max-h-[85vh] overflow-y-auto space-y-4"
            onTouchStart={(e) => {
              sheetDragStartY.current = e.touches[0].clientY;
            }}
            onTouchEnd={(e) => {
              if (sheetDragStartY.current === null) return;
              const dy = e.changedTouches[0].clientY - sheetDragStartY.current;
              sheetDragStartY.current = null;
              if (dy > 75) setIsMobileSheetOpen(false);
            }}
          >
            <div className="w-10 h-1.5 bg-[#DFD3C5] rounded-full mx-auto" />
            {renderDayPanelBody(true)}
          </div>
        </div>
      )}

      {/* Edit Meal Modal / Sheet */}
      {editingMeal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-meal-title"
        >
          <form
            ref={editDialogRef}
            onSubmit={handleSaveEdit}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2
                id="edit-meal-title"
                className="font-heading text-lg font-bold text-[#2B2B2B]"
              >
                Edit logged meal
              </h2>
              <button
                type="button"
                onClick={() => setEditingMeal(null)}
                aria-label="Close edit dialog"
                className="min-w-[44px] min-h-[44px] -mr-2 rounded-xl hover:bg-[#FFF9F2] flex items-center justify-center text-[#6B6B6B] cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="edit-date"
                  className="block text-xs font-medium text-[#6B6B6B] mb-1"
                >
                  Date
                </label>
                <input
                  id="edit-date"
                  type="date"
                  required
                  value={editingMeal.date}
                  onChange={(e) =>
                    setEditingMeal({ ...editingMeal, date: e.target.value })
                  }
                  className="w-full h-11 px-3 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-time"
                  className="block text-xs font-medium text-[#6B6B6B] mb-1"
                >
                  Time
                </label>
                <input
                  id="edit-time"
                  type="time"
                  required
                  value={editingMeal.time}
                  onChange={(e) =>
                    setEditingMeal({ ...editingMeal, time: e.target.value })
                  }
                  className="w-full h-11 px-3 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="edit-meal-type"
                  className="block text-xs font-medium text-[#6B6B6B] mb-1"
                >
                  Meal type
                </label>
                <select
                  id="edit-meal-type"
                  value={editingMeal.mealType}
                  onChange={(e) =>
                    setEditingMeal({
                      ...editingMeal,
                      mealType: e.target.value as MealType,
                    })
                  }
                  className="w-full h-11 px-3 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="snacks">Snacks</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>

              <div>
                <span className="block text-xs font-medium text-[#6B6B6B] mb-1">
                  Servings
                </span>
                <div className="flex items-center justify-between h-11 px-1.5 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2]">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingMeal({
                        ...editingMeal,
                        servings: Math.max(
                          1,
                          Math.round((editingMeal.servings - 0.5) * 100) / 100
                        ),
                      })
                    }
                    disabled={editingMeal.servings <= 1}
                    aria-label="Decrease servings"
                    className="w-9 h-9 rounded-lg hover:bg-white flex items-center justify-center disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <span className="text-sm font-semibold tabular-nums">
                    {editingMeal.servings}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingMeal({
                        ...editingMeal,
                        servings:
                          Math.round((editingMeal.servings + 0.5) * 100) / 100,
                      })
                    }
                    aria-label="Increase servings"
                    className="w-9 h-9 rounded-lg hover:bg-white flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-[#6B6B6B] mb-1">
                Rating (optional)
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setEditingMeal({
                        ...editingMeal,
                        rating: editingMeal.rating === s ? undefined : s,
                      })
                    }
                    aria-label={`Rate ${s} stars`}
                    aria-pressed={editingMeal.rating === s}
                    className="min-w-[44px] min-h-[44px] rounded-xl hover:bg-[#FFF9F2] flex items-center justify-center cursor-pointer"
                  >
                    <Star
                      aria-hidden="true"
                      className={`w-5 h-5 ${
                        s <= (editingMeal.rating ?? 0)
                          ? 'fill-[#C5411B] text-[#C5411B]'
                          : 'text-[#DFD3C5]'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="edit-note"
                  className="text-xs font-medium text-[#6B6B6B]"
                >
                  Note (optional)
                </label>
                <span className="text-[11px] text-[#6B6B6B] tabular-nums">
                  {(editingMeal.note ?? '').length}/200
                </span>
              </div>
              <textarea
                id="edit-note"
                rows={2}
                maxLength={200}
                value={editingMeal.note ?? ''}
                onChange={(e) =>
                  setEditingMeal({ ...editingMeal, note: e.target.value })
                }
                className="w-full p-3 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] text-sm"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setEditingMeal(null)}
                className="flex-1 h-12 rounded-xl border border-[#DFD3C5] text-sm font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 h-12 rounded-xl bg-[#1F6E42] hover:bg-[#185734] text-white font-heading font-semibold text-sm cursor-pointer"
              >
                Save changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTargetId && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
        >
          <div
            ref={deleteDialogRef}
            className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl space-y-5"
          >
            <div className="space-y-1.5">
              <h2
                id="delete-confirm-title"
                className="font-heading text-lg font-bold text-[#2B2B2B]"
              >
                Delete this meal from your calendar?
              </h2>
              <p className="text-sm text-[#6B6B6B]">
                This logged meal will be permanently removed from your history.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 h-11 rounded-xl border border-[#DFD3C5] text-sm font-medium text-[#2B2B2B] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 h-11 rounded-xl bg-[#A63429] hover:bg-[#8E2A20] text-white font-heading font-semibold text-sm cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {renderQuickAddModalAndFab()}
    </div>
  );
};
