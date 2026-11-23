import React, { useEffect, useRef, useState } from 'react';
import { Check, Minus, Plus, Users } from 'lucide-react';
import { RECIPES, scaleServings } from '../../recipes.js';
import { AgeGroup, Household } from '../../types/cook';
import { AGE_GROUP_LABELS, formatServingsLabel } from '../../utils/nutrition';
import { Dialog } from '../Dialog';

interface HouseholdCardProps {
  household: Household;
  onUpdateHousehold: (next: Household) => boolean | void;
}

/**
 * Household composition card with adults/children steppers, child age selectors,
 * live scaleServings multiplier from recipes.js, and removal confirmation dialog.
 */
export const HouseholdCard: React.FC<HouseholdCardProps> = ({
  household,
  onUpdateHousehold,
}) => {
  const [savedVisible, setSavedVisible] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const savedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current !== null) {
        window.clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  const flashSaved = () => {
    setSavedVisible(true);
    if (savedTimerRef.current !== null) {
      window.clearTimeout(savedTimerRef.current);
    }
    savedTimerRef.current = window.setTimeout(() => {
      setSavedVisible(false);
    }, 1500);
  };

  const commitHousehold = (next: Household) => {
    onUpdateHousehold(next);
    flashSaved();
  };

  const handleAdultsChange = (nextAdults: number) => {
    const clamped = Math.max(1, Math.min(20, nextAdults));
    if (clamped === household.adults) return;
    commitHousehold({ ...household, adults: clamped });
  };

  const handleIncreaseChildren = () => {
    if (household.children.length >= 20) return;
    commitHousehold({
      ...household,
      children: [...household.children, { ageGroup: 'child' }],
    });
  };

  const handleDecreaseChildren = () => {
    if (household.children.length <= 0) return;
    const lastChild = household.children[household.children.length - 1];
    if (lastChild?.ageGroup === 'teen' || lastChild?.ageGroup === 'child') {
      setConfirmRemoveOpen(true);
      return;
    }
    commitHousehold({
      ...household,
      children: household.children.slice(0, -1),
    });
  };

  const handleConfirmRemoveChild = () => {
    setConfirmRemoveOpen(false);
    if (household.children.length <= 0) return;
    commitHousehold({
      ...household,
      children: household.children.slice(0, -1),
    });
  };

  const handleChildAgeChange = (idx: number, ageGroup: AgeGroup) => {
    const nextChildren = household.children.map((c, i) =>
      i === idx ? { ageGroup } : c
    );
    commitHousehold({ ...household, children: nextChildren });
  };

  // Compute multiplier using scaleServings from recipes.js directly
  const referenceRecipe = RECIPES[0] ?? { baseServings: 2, ingredients: [] };
  const multiplier = scaleServings(referenceRecipe, household).householdMultiplier;
  const safeMultiplierText =
    typeof multiplier === 'number' && !Number.isNaN(multiplier)
      ? formatServingsLabel(multiplier)
      : '-';

  return (
    <section
      aria-labelledby="household-card-heading"
      className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#EADFD2] space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#E4572E]" aria-hidden="true" />
          <h2
            id="household-card-heading"
            className="font-heading text-lg font-semibold text-[#2B2B2B]"
          >
            Household
          </h2>
        </div>

        <span
          role="status"
          aria-live="polite"
          className="inline-flex items-center gap-1 text-xs font-medium text-[#1F6E42] min-h-[18px]"
        >
          {savedVisible ? (
            <>
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Saved</span>
            </>
          ) : null}
        </span>
      </div>

      <p className="text-xs text-[#6B6B6B] leading-relaxed">
        Used to scale recipe portions. Toddlers 0.5, children 0.75, teens 1,
        adults 1.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Adults Stepper */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FFF9F2] border border-[#EADFD2]">
          <div>
            <span
              id="adults-stepper-label"
              className="block text-sm font-medium text-[#2B2B2B]"
            >
              Adults
            </span>
            <span className="text-xs text-[#6B6B6B]">1.0 each</span>
          </div>
          <div
            className="flex items-center gap-2"
            role="group"
            aria-labelledby="adults-stepper-label"
          >
            <button
              type="button"
              onClick={() => handleAdultsChange(household.adults - 1)}
              disabled={household.adults <= 1}
              aria-label="Decrease adults"
              className="min-w-[44px] min-h-[44px] rounded-xl bg-white border border-[#DFD3C5] hover:border-[#E4572E] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" aria-hidden="true" />
            </button>
            <span
              className="w-7 text-center font-heading font-semibold text-base tabular-nums text-[#2B2B2B]"
              aria-live="polite"
            >
              {household.adults}
            </span>
            <button
              type="button"
              onClick={() => handleAdultsChange(household.adults + 1)}
              disabled={household.adults >= 20}
              aria-label="Increase adults"
              className="min-w-[44px] min-h-[44px] rounded-xl bg-white border border-[#DFD3C5] hover:border-[#E4572E] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Children Stepper */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FFF9F2] border border-[#EADFD2]">
          <div>
            <span
              id="children-stepper-label"
              className="block text-sm font-medium text-[#2B2B2B]"
            >
              Children
            </span>
            <span className="text-xs text-[#6B6B6B]">By age group</span>
          </div>
          <div
            className="flex items-center gap-2"
            role="group"
            aria-labelledby="children-stepper-label"
          >
            <button
              type="button"
              onClick={handleDecreaseChildren}
              disabled={household.children.length <= 0}
              aria-label="Decrease children"
              className="min-w-[44px] min-h-[44px] rounded-xl bg-white border border-[#DFD3C5] hover:border-[#E4572E] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" aria-hidden="true" />
            </button>
            <span
              className="w-7 text-center font-heading font-semibold text-base tabular-nums text-[#2B2B2B]"
              aria-live="polite"
            >
              {household.children.length}
            </span>
            <button
              type="button"
              onClick={handleIncreaseChildren}
              disabled={household.children.length >= 20}
              aria-label="Increase children"
              className="min-w-[44px] min-h-[44px] rounded-xl bg-white border border-[#DFD3C5] hover:border-[#E4572E] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Child Age Group Rows */}
      {household.children.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {household.children.map((child, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#FFF9F2] border border-[#EADFD2] space-y-1.5"
            >
              <label
                htmlFor={`profile-child-age-${idx}`}
                className="block text-xs font-medium text-[#6B6B6B]"
              >
                Child {idx + 1} age group
              </label>
              <select
                id={`profile-child-age-${idx}`}
                value={child.ageGroup}
                onChange={(e) =>
                  handleChildAgeChange(idx, e.target.value as AgeGroup)
                }
                className="w-full min-h-[44px] px-3 rounded-lg bg-white border border-[#DFD3C5] text-sm text-[#2B2B2B]"
              >
                {(Object.keys(AGE_GROUP_LABELS) as AgeGroup[]).map((ag) => (
                  <option key={ag} value={ag}>
                    {AGE_GROUP_LABELS[ag]}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Live Multiplier Readout */}
      <div className="pt-3 border-t border-[#F3EAE0] flex items-center justify-between text-sm">
        <span className="text-[#6B6B6B]">Live portion multiplier</span>
        <span className="font-semibold text-[#1F6E42] tabular-nums">
          Recipes cook for {safeMultiplierText}{' '}
          {multiplier === 1 ? 'serving' : 'servings'}
        </span>
      </div>

      {/* Confirmation Dialog when removing Child or Teen */}
      <Dialog
        open={confirmRemoveOpen}
        title="Remove the last child?"
        description="This updates your household serving multiplier for future recipes."
        onClose={() => setConfirmRemoveOpen(false)}
      >
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setConfirmRemoveOpen(false)}
            className="flex-1 min-h-[44px] px-4 rounded-xl border border-[#DFD3C5] text-sm font-medium text-[#2B2B2B] hover:bg-[#FFF9F2] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmRemoveChild}
            className="flex-1 min-h-[44px] px-4 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold text-sm cursor-pointer"
          >
            Remove
          </button>
        </div>
      </Dialog>
    </section>
  );
};
