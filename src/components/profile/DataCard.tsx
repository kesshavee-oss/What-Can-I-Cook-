import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Download,
  HelpCircle,
  Image as ImageIcon,
  IndianRupee,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  AllergyKey,
  CookedMeal,
  DietType,
  GroceryItem,
  Household,
  PlannedMeal,
  PriceMap,
  Recipe,
} from '../../types/cook';
import {
  BackupData,
  createBackupPayload,
  validateBackupData,
} from '../../utils/profileBackup.js';
import { Dialog } from '../Dialog';

interface DataCardProps {
  household: Household;
  defaultDiet: DietType;
  allergies: AllergyKey[];
  favoriteRecipeIds: string[];
  cookedMeals: CookedMeal[];
  groceryList: GroceryItem[];
  plannedMeals: PlannedMeal[];
  aiRecipes: Recipe[];
  priceOverrides: PriceMap;
  showCost: boolean;
  showVisuals: boolean;
  showIngredientImages: boolean;
  aiKeyAvailable: boolean;
  onImportData: (data: BackupData) => boolean;
  onToggleShowCost: (nextShowCost: boolean) => void;
  onToggleShowVisuals: (nextShowVisuals: boolean) => void;
  onToggleShowIngredientImages: (nextShowIngredientImages: boolean) => void;
  onResetAllPrices: () => void;
  onClearAiRecipes: () => void;
  onClearAllData: () => void;
  onOpenHowToUse: () => void;
  onNotify: (variant: 'success' | 'error', message: string) => void;
}

/**
 * Local data ownership card: Budget display preferences & price reset,
 * JSON export via Blob, validated JSON import, Clear AI recipes action,
 * and destructive reset confirmation dialog.
 */
export const DataCard: React.FC<DataCardProps> = ({
  household,
  defaultDiet,
  allergies,
  favoriteRecipeIds,
  cookedMeals,
  groceryList,
  plannedMeals,
  aiRecipes,
  priceOverrides,
  showCost,
  showVisuals,
  showIngredientImages,
  aiKeyAvailable,
  onImportData,
  onToggleShowCost,
  onToggleShowVisuals,
  onToggleShowIngredientImages,
  onResetAllPrices,
  onClearAiRecipes,
  onClearAllData,
  onOpenHowToUse,
  onNotify,
}) => {
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmResetPricesOpen, setConfirmResetPricesOpen] = useState(false);
  const [confirmClearAiOpen, setConfirmClearAiOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const customPriceCount = Object.keys(priceOverrides || {}).length;

  const handleExport = () => {
    try {
      const payload = createBackupPayload({
        household,
        defaultDiet,
        allergies,
        favoriteRecipeIds,
        cookedMeals,
        groceryList,
        plannedMeals,
        wcic_ai_recipes: aiRecipes,
        wcic_prices: priceOverrides,
        wcic_settings: { showCost, showVisuals, showIngredientImages },
      });
      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
        2,
        '0'
      )}-${String(now.getDate()).padStart(2, '0')}`;

      const link = document.createElement('a');
      link.href = url;
      link.download = `what-can-i-cook-backup-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onNotify('success', 'Backup exported as JSON.');
    } catch (err) {
      console.error('Export failed:', err);
      onNotify('error', 'Could not export backup file.');
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImportError(null);

    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        const msg = 'The selected file is not valid JSON.';
        setImportError(msg);
        onNotify('error', msg);
        return;
      }

      const result = validateBackupData(parsed);
      if (!result.ok) {
        setImportError(result.error);
        onNotify('error', result.error);
        return;
      }

      const saved = onImportData(result.data);
      if (saved) {
        onNotify('success', 'Backup imported and saved.');
      } else {
        onNotify('error', 'Imported in memory, but browser storage could not save.');
      }
    } catch (err) {
      console.error('Import failed:', err);
      const msg = 'Could not read the selected backup file.';
      setImportError(msg);
      onNotify('error', msg);
    }
  };

  return (
    <section
      aria-labelledby="data-card-heading"
      className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#EADFD2] space-y-4"
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-[#2E8B57]" aria-hidden="true" />
        <h2
          id="data-card-heading"
          className="font-heading text-lg font-semibold text-[#2B2B2B]"
        >
          Data and privacy
        </h2>
      </div>

      <div className="space-y-1">
        <p className="text-sm text-[#6B6B6B] leading-relaxed">
          Your data is stored only on this device. Nothing is sent to a server.
        </p>
        <p className="text-xs font-medium text-[#6B6B6B]">
          {aiKeyAvailable ? 'AI recipes: on' : 'AI recipes: off (no key found)'}
        </p>
      </div>

      {importError && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-[#A63429]/8 border border-[#A63429]/30 text-xs sm:text-sm text-[#A63429] flex items-start gap-2"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{importError}</span>
        </div>
      )}

      <div className="rounded-xl border border-[#EADFD2] bg-[#FFF9F2]/60 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#E4572E]" aria-hidden="true" />
          <h3 className="font-heading text-sm font-semibold text-[#2B2B2B]">
            Display
          </h3>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <span
              id="show-visuals-label"
              className="block text-sm font-medium text-[#2B2B2B]"
            >
              Show recipe illustrations
            </span>
            <span className="block text-xs text-[#6B6B6B]">
              Display SVG dish illustrations on recipe cards, plans, and calendar.
            </span>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={showVisuals}
            aria-labelledby="show-visuals-label"
            onClick={() => {
              const next = !showVisuals;
              onToggleShowVisuals(next);
              onNotify(
                'success',
                next ? 'Recipe illustrations shown.' : 'Recipe illustrations hidden.'
              );
            }}
            className={`min-w-[52px] min-h-[44px] px-1.5 rounded-xl flex items-center transition-colors cursor-pointer shrink-0 ${
              showVisuals ? 'justify-end' : 'justify-start'
            }`}
          >
            <span
              aria-hidden="true"
              className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors ${
                showVisuals ? 'bg-[#1F6E42]' : 'bg-[#DFD3C5]'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  showVisuals ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </span>
          </button>
        </div>

        <div className="pt-2 border-t border-[#EADFD2]/80 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <span
              id="show-ingredient-images-label"
              className="block text-sm font-medium text-[#2B2B2B]"
            >
              Show ingredient images
            </span>
            <span className="block text-xs text-[#6B6B6B]">
              Display illustrated ingredient tiles on Cook, Grocery, and recipe rows.
            </span>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={showIngredientImages}
            aria-labelledby="show-ingredient-images-label"
            onClick={() => {
              const next = !showIngredientImages;
              onToggleShowIngredientImages(next);
              onNotify(
                'success',
                next ? 'Ingredient images shown.' : 'Ingredient images hidden.'
              );
            }}
            className={`min-w-[52px] min-h-[44px] px-1.5 rounded-xl flex items-center transition-colors cursor-pointer shrink-0 ${
              showIngredientImages ? 'justify-end' : 'justify-start'
            }`}
          >
            <span
              aria-hidden="true"
              className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors ${
                showIngredientImages ? 'bg-[#1F6E42]' : 'bg-[#DFD3C5]'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  showIngredientImages ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#EADFD2] bg-[#FFF9F2]/60 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-[#2E8B57]" aria-hidden="true" />
          <h3 className="font-heading text-sm font-semibold text-[#2B2B2B]">
            Budget
          </h3>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <span
              id="show-cost-label"
              className="block text-sm font-medium text-[#2B2B2B]"
            >
              Show cost estimates
            </span>
            <span className="block text-xs text-[#6B6B6B]">
              Display rough INR price totals on Grocery and Plan tabs.
            </span>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={showCost}
            aria-labelledby="show-cost-label"
            onClick={() => {
              const next = !showCost;
              onToggleShowCost(next);
              onNotify(
                'success',
                next ? 'Cost estimates shown.' : 'Cost estimates hidden.'
              );
            }}
            className={`min-w-[52px] min-h-[44px] px-1.5 rounded-xl flex items-center transition-colors cursor-pointer shrink-0 ${
              showCost ? 'justify-end' : 'justify-start'
            }`}
          >
            <span
              aria-hidden="true"
              className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors ${
                showCost ? 'bg-[#1F6E42]' : 'bg-[#DFD3C5]'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  showCost ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </span>
          </button>
        </div>

        <div className="pt-2 border-t border-[#EADFD2]/80 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-[#6B6B6B] tabular-nums">
            {customPriceCount > 0
              ? `${customPriceCount} custom ingredient ${
                  customPriceCount === 1 ? 'price' : 'prices'
                } saved`
              : 'Using default market price estimates'}
          </span>
          <button
            type="button"
            onClick={() => setConfirmResetPricesOpen(true)}
            className="min-h-[44px] px-3.5 rounded-xl border border-[#DFD3C5] bg-white hover:border-[#2B2B2B] text-xs sm:text-sm font-medium text-[#2B2B2B] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Reset all prices</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExport}
            className="min-h-[44px] px-4 rounded-xl bg-[#FFF9F2] border border-[#DFD3C5] hover:border-[#2B2B2B] text-sm font-medium text-[#2B2B2B] inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Export JSON</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelected}
            className="sr-only"
            aria-label="Import JSON backup file"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] px-4 rounded-xl bg-[#FFF9F2] border border-[#DFD3C5] hover:border-[#2B2B2B] text-sm font-medium text-[#2B2B2B] inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            <span>Import JSON</span>
          </button>
        </div>

        <button
          type="button"
          disabled={aiRecipes.length === 0}
          onClick={() => setConfirmClearAiOpen(true)}
          className="min-h-[44px] px-4 rounded-xl border border-[#6B3FA0]/35 bg-[#6B3FA0]/6 hover:bg-[#6B3FA0] text-[#5B2E91] hover:text-white disabled:opacity-45 disabled:pointer-events-none text-sm font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer tabular-nums"
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          <span>
            Clear AI recipes{aiRecipes.length > 0 ? ` (${aiRecipes.length})` : ''}
          </span>
        </button>
      </div>

      {/* How to use entry above Clear all data */}
      <div className="pt-3 border-t border-[#F3EAE0] flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="block text-sm font-medium text-[#2B2B2B]">
            Need a quick walkthrough?
          </span>
          <span className="block text-xs text-[#6B6B6B]">
            Plain-language guide for Cook, Calendar, Plan, Grocery, and Profile.
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenHowToUse}
          className="min-h-[44px] px-4 rounded-xl bg-[#FFF9F2] border border-[#DFD3C5] hover:border-[#2B2B2B] text-sm font-medium text-[#2B2B2B] inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer shrink-0"
        >
          <HelpCircle className="w-4 h-4 text-[#B83915]" aria-hidden="true" />
          <span>How to use</span>
        </button>
      </div>

      <div className="pt-2 border-t border-[#F3EAE0] flex justify-end">
        <button
          type="button"
          onClick={() => setConfirmClearOpen(true)}
          className="min-h-[44px] px-4 rounded-xl border border-[#A63429]/40 bg-[#A63429]/6 hover:bg-[#A63429] text-[#A63429] hover:text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
        >
          <AlertTriangle className="w-4 h-4" aria-hidden="true" />
          <span>Clear all data</span>
        </button>
      </div>

      {/* Confirmation Dialog for Resetting All Prices */}
      <Dialog
        open={confirmResetPricesOpen}
        title="Reset all prices?"
        description="Restore default Indian market planning estimates for every ingredient? Any custom prices you edited will be removed."
        onClose={() => setConfirmResetPricesOpen(false)}
      >
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setConfirmResetPricesOpen(false)}
            className="flex-1 min-h-[44px] px-4 rounded-xl border border-[#DFD3C5] text-sm font-medium text-[#2B2B2B] hover:bg-[#FFF9F2] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmResetPricesOpen(false);
              onResetAllPrices();
              onNotify('success', 'All ingredient prices reset to defaults.');
            }}
            className="flex-1 min-h-[44px] px-4 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold text-sm cursor-pointer"
          >
            Reset all prices
          </button>
        </div>
      </Dialog>

      {/* Confirmation Dialog for Clearing Saved AI Recipes */}
      <Dialog
        open={confirmClearAiOpen}
        title="Clear AI recipes?"
        description="This removes all AI-generated recipe suggestions saved on this device. Your built-in recipes, calendar, and settings stay intact."
        onClose={() => setConfirmClearAiOpen(false)}
      >
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setConfirmClearAiOpen(false)}
            className="flex-1 min-h-[44px] px-4 rounded-xl border border-[#DFD3C5] text-sm font-medium text-[#2B2B2B] hover:bg-[#FFF9F2] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmClearAiOpen(false);
              onClearAiRecipes();
              onNotify('success', 'Saved AI recipes cleared.');
            }}
            className="flex-1 min-h-[44px] px-4 rounded-xl bg-[#6B3FA0] hover:bg-[#5B2E91] text-white font-heading font-semibold text-sm cursor-pointer"
          >
            Clear AI recipes
          </button>
        </div>
      </Dialog>

      {/* Confirmation Dialog for Destructive Reset */}
      <Dialog
        open={confirmClearOpen}
        title="Clear all data?"
        description="This deletes your household, meal plan, calendar meals, grocery list, AI recipes, favorites, and settings from this device. This cannot be undone."
        onClose={() => setConfirmClearOpen(false)}
      >
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setConfirmClearOpen(false)}
            className="flex-1 min-h-[44px] px-4 rounded-xl border border-[#DFD3C5] text-sm font-medium text-[#2B2B2B] hover:bg-[#FFF9F2] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmClearOpen(false);
              onClearAllData();
            }}
            className="flex-1 min-h-[44px] px-4 rounded-xl bg-[#A63429] hover:bg-[#8E2A20] text-white font-heading font-semibold text-sm cursor-pointer"
          >
            Delete everything
          </button>
        </div>
      </Dialog>
    </section>
  );
};
