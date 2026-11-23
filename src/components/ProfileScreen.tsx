import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  AllergyKey,
  CookedMeal,
  DietType,
  GroceryItem,
  Household,
  PlannedMeal,
  PriceMap,
  Recipe,
} from '../types/cook';
import { BackupData } from '../utils/profileBackup.js';
import { DietBadge } from './DietBadge';
import { Toast } from './Toast';
import { AllergyCard } from './profile/AllergyCard';
import { DataCard } from './profile/DataCard';
import { DietCard } from './profile/DietCard';
import { FavoritesCard } from './profile/FavoritesCard';
import { HouseholdCard } from './profile/HouseholdCard';
import { PantryInventoryNotice } from './profile/PantryInventoryNotice';

interface ProfileScreenProps {
  household: Household;
  defaultDiet: DietType;
  allergies: AllergyKey[];
  favoriteRecipeIds: string[];
  cookedMeals: CookedMeal[];
  groceryList: GroceryItem[];
  plannedMeals: PlannedMeal[];
  aiRecipes: Recipe[];
  priceOverrides: PriceMap;
  selectedIngredientIds: string[];
  showCost: boolean;
  showVisuals: boolean;
  showIngredientImages: boolean;
  aiKeyAvailable: boolean;
  storageUnavailable: boolean;
  onUpdateHousehold: (next: Household) => boolean;
  onUpdateDefaultDiet: (diet: DietType) => boolean;
  onUpdateAllergies: (allergies: AllergyKey[]) => boolean;
  onRemoveFavorite: (recipeId: string) => boolean;
  onOpenRecipeById: (recipeId: string) => void;
  onUseExpiringInCook: (ingredientIds: string[]) => void;
  onAddRecipeToList?: (
    recipe: Recipe,
    includeOptional?: boolean,
    ownedIngredientIds?: string[]
  ) => string;
  onImportData: (data: BackupData) => boolean;
  onToggleShowCost: (nextShowCost: boolean) => void;
  onToggleShowVisuals: (nextShowVisuals: boolean) => void;
  onToggleShowIngredientImages: (nextShowIngredientImages: boolean) => void;
  onResetAllPrices: () => void;
  onClearAiRecipes: () => void;
  onClearAllData: () => void;
  onOpenHowToUse: () => void;
}

function formatHouseholdSummary(household: Household): string {
  const adults = Number(household?.adults);
  const safeAdults = !Number.isNaN(adults) && adults > 0 ? adults : 1;
  const childrenCount = Array.isArray(household?.children)
    ? household.children.length
    : 0;

  const adultLabel = `${safeAdults} ${safeAdults === 1 ? 'adult' : 'adults'}`;
  if (childrenCount === 0) return adultLabel;
  const childLabel = `${childrenCount} ${
    childrenCount === 1 ? 'child' : 'children'
  }`;
  return `${adultLabel}, ${childLabel}`;
}

/**
 * Profile & Settings screen composed of Account Summary, Household,
 * Diet preferences, Allergies, Favorites, and Data and privacy cards.
 */
export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  household,
  defaultDiet,
  allergies,
  favoriteRecipeIds,
  cookedMeals,
  groceryList,
  plannedMeals,
  aiRecipes,
  priceOverrides,
  selectedIngredientIds,
  showCost,
  showVisuals,
  showIngredientImages,
  aiKeyAvailable,
  storageUnavailable,
  onUpdateHousehold,
  onUpdateDefaultDiet,
  onUpdateAllergies,
  onRemoveFavorite,
  onOpenRecipeById,
  onUseExpiringInCook,
  onAddRecipeToList,
  onImportData,
  onToggleShowCost,
  onToggleShowVisuals,
  onToggleShowIngredientImages,
  onResetAllPrices,
  onClearAiRecipes,
  onClearAllData,
  onOpenHowToUse,
}) => {
  const [toast, setToast] = useState<{
    variant: 'success' | 'error';
    message: string;
  } | null>(null);

  const validFavoritesCount = favoriteRecipeIds.length;

  const totalMealsCooked = Array.isArray(cookedMeals) ? cookedMeals.length : 0;

  const handleToggleAllergy = (allergy: AllergyKey) => {
    const exists = allergies.includes(allergy);
    const next = exists
      ? allergies.filter((a) => a !== allergy)
      : [...allergies, allergy];
    onUpdateAllergies(next);
    setToast({
      variant: 'success',
      message: 'Recipes updated for your allergies',
    });
  };

  return (
    <div className="space-y-6 pb-36 sm:pb-10">
      <header>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2B2B2B]">
          Profile
        </h1>
      </header>

      {storageUnavailable && (
        <div
          role="alert"
          className="bg-[#C5411B]/10 border border-[#C5411B]/40 text-[#2B2B2B] rounded-2xl px-4 py-3 text-sm flex items-center gap-2.5"
        >
          <AlertTriangle
            className="w-4 h-4 text-[#B83915] shrink-0"
            aria-hidden="true"
          />
          <span>Your changes may not be saved on this browser.</span>
        </div>
      )}

      {/* 1. Account Summary Card */}
      <section
        aria-label="Account summary"
        className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#EADFD2] grid grid-cols-2 lg:grid-cols-4 gap-4 items-center"
      >
        <div>
          <span className="block text-xs text-[#6B6B6B]">Household</span>
          <span className="font-heading text-base sm:text-lg font-semibold text-[#2B2B2B] tabular-nums mt-0.5 block">
            {formatHouseholdSummary(household)}
          </span>
        </div>

        <div>
          <span className="block text-xs text-[#6B6B6B]">Total meals cooked</span>
          <span className="font-heading text-2xl font-bold text-[#2B2B2B] tabular-nums mt-0.5 block">
            {totalMealsCooked}
          </span>
        </div>

        <div>
          <span className="block text-xs text-[#6B6B6B]">Favorites</span>
          <span className="font-heading text-2xl font-bold text-[#2B2B2B] tabular-nums mt-0.5 block">
            {validFavoritesCount}
          </span>
        </div>

        <div>
          <span className="block text-xs text-[#6B6B6B] mb-1">Default diet</span>
          <DietBadge diet={defaultDiet} size="md" />
        </div>
      </section>

      {/* Pantry Inventory Expiry Notification */}
      <PantryInventoryNotice
        selectedIngredientIds={selectedIngredientIds}
        defaultDiet={defaultDiet}
        allergies={allergies}
        aiRecipes={aiRecipes}
        showVisuals={showVisuals}
        onOpenRecipeById={onOpenRecipeById}
        onUseExpiringInCook={onUseExpiringInCook}
        onAddRecipeToList={onAddRecipeToList}
        onNotify={(message) => setToast({ variant: 'success', message })}
      />

      {/* Sections 2-5: Single column on mobile/tablet, 2-column grid on desktop (1024px+) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* 2. Household */}
        <HouseholdCard
          household={household}
          onUpdateHousehold={onUpdateHousehold}
        />

        {/* 3. Diet preferences */}
        <DietCard
          defaultDiet={defaultDiet}
          onSelectDefaultDiet={onUpdateDefaultDiet}
        />

        {/* 4. Allergies */}
        <AllergyCard
          allergies={allergies}
          onToggleAllergy={handleToggleAllergy}
        />

        {/* 5. Favorites */}
        <FavoritesCard
          favoriteRecipeIds={favoriteRecipeIds}
          aiRecipes={aiRecipes}
          selectedIngredientIds={selectedIngredientIds}
          defaultDiet={defaultDiet}
          showVisuals={showVisuals}
          onOpenRecipeById={onOpenRecipeById}
          onRemoveFavorite={onRemoveFavorite}
          onAddRecipeToList={onAddRecipeToList}
          onNotify={(message) => setToast({ variant: 'success', message })}
        />
      </div>

      {/* 6. Data and privacy */}
      <DataCard
        household={household}
        defaultDiet={defaultDiet}
        allergies={allergies}
        favoriteRecipeIds={favoriteRecipeIds}
        cookedMeals={cookedMeals}
        groceryList={groceryList}
        plannedMeals={plannedMeals}
        aiRecipes={aiRecipes}
        priceOverrides={priceOverrides}
        showCost={showCost}
        showVisuals={showVisuals}
        showIngredientImages={showIngredientImages}
        aiKeyAvailable={aiKeyAvailable}
        onImportData={onImportData}
        onToggleShowCost={onToggleShowCost}
        onToggleShowVisuals={onToggleShowVisuals}
        onToggleShowIngredientImages={onToggleShowIngredientImages}
        onResetAllPrices={onResetAllPrices}
        onClearAiRecipes={onClearAiRecipes}
        onClearAllData={onClearAllData}
        onOpenHowToUse={onOpenHowToUse}
        onNotify={(variant, message) => setToast({ variant, message })}
      />

      <p className="text-xs text-[#6B6B6B] text-center sm:text-left px-1">
        About: What Can I Cook? helps your household plan meals from what you
        already have.
      </p>

      <Toast
        message={toast?.message ?? null}
        variant={toast?.variant ?? 'success'}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
};
