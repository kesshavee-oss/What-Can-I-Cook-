import React, { useState } from 'react';
import { Minus, Plus, Users, ChefHat } from 'lucide-react';
import { WELCOME_KITCHEN_IMAGE } from '../data/media';
import { AgeGroup, ChildMember, Household } from '../types/cook';
import {
  AGE_GROUP_LABELS,
  calculateHouseholdServings,
  formatServingsLabel,
} from '../utils/nutrition';

interface WelcomeSetupProps {
  initialHousehold?: Household;
  onSave: (household: Household) => void;
}

export const WelcomeSetup: React.FC<WelcomeSetupProps> = ({
  initialHousehold,
  onSave,
}) => {
  const [adults, setAdults] = useState<number>(initialHousehold?.adults ?? 2);
  const [children, setChildren] = useState<ChildMember[]>(
    initialHousehold?.children ?? []
  );
  const [imgFailed, setImgFailed] = useState(false);

  const handleChildrenCountChange = (nextCount: number) => {
    const clamped = Math.max(0, Math.min(20, nextCount));
    setChildren((prev) => {
      if (clamped > prev.length) {
        const added = Array.from({ length: clamped - prev.length }, () => ({
          ageGroup: 'child' as AgeGroup,
        }));
        return [...prev, ...added];
      }
      return prev.slice(0, clamped);
    });
  };

  const updateChildAgeGroup = (index: number, ageGroup: AgeGroup) => {
    setChildren((prev) =>
      prev.map((child, idx) => (idx === index ? { ageGroup } : child))
    );
  };

  const currentHousehold: Household = { adults, children };
  const totalServings = calculateHouseholdServings(currentHousehold);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(currentHousehold);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-[#2B2B2B] focus:text-white focus:font-semibold focus:text-sm focus:shadow-lg"
      >
        Skip to content
      </a>

      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-[#EADFD2] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Visual Kitchen Hero */}
        <div className="lg:col-span-5 relative bg-[#F4ECE1] min-h-[220px] lg:min-h-full">
          {!imgFailed ? (
            <img
              src={WELCOME_KITCHEN_IMAGE}
              alt="Fresh tomatoes, herbs, spices, and farm eggs arranged on a sunlit wooden kitchen counter"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-56 sm:h-64 lg:h-full object-cover"
            />
          ) : (
            <div className="w-full h-56 lg:h-full flex flex-col items-center justify-center p-6 text-[#6B6B6B]">
              <ChefHat className="w-12 h-12 text-[#E4572E] mb-2" aria-hidden="true" />
              <span className="font-heading font-semibold text-[#2B2B2B]">
                What Can I Cook?
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/15 flex flex-col justify-end p-6 text-white">
            <p className="text-xs font-medium tracking-wide text-white">
              What Can I Cook?
            </p>
            <p className="font-heading text-xl sm:text-2xl font-semibold leading-snug mt-1">
              Cook from what is already in your kitchen.
            </p>
          </div>
        </div>

        {/* Household Setup Form */}
        <main
          id="main-content"
          tabIndex={-1}
          className="lg:col-span-7 focus:outline-none"
        >
          <form
            onSubmit={handleSubmit}
            className="h-full p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6"
          >
            <div className="space-y-6">
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2B2B2B]">
                  Who&apos;s eating today?
                </h1>
                <p className="text-sm sm:text-base text-[#6B6B6B] mt-1.5 leading-relaxed">
                  Set your household size so recipe quantities and estimated nutrition
                  automatically scale to your table. You can change this anytime in Profile.
                </p>
              </div>

              {/* Adults Stepper */}
              <div className="flex items-center justify-between gap-4 py-4 border-y border-[#F0E6DA]">
                <div>
                  <span className="block font-medium text-[#2B2B2B]">Adults</span>
                  <span className="text-xs text-[#6B6B6B]">1.0 serving each</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAdults((a) => Math.max(1, a - 1))}
                    disabled={adults <= 1}
                    aria-label="Decrease adults"
                    className="w-11 h-11 rounded-xl border border-[#DFD3C5] flex items-center justify-center text-[#2B2B2B] hover:bg-[#FFF9F2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <span
                    className="w-8 text-center font-heading font-semibold text-lg tabular-nums"
                    aria-live="polite"
                  >
                    {adults}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAdults((a) => Math.min(20, a + 1))}
                    disabled={adults >= 20}
                    aria-label="Increase adults"
                    className="w-11 h-11 rounded-xl border border-[#DFD3C5] flex items-center justify-center text-[#2B2B2B] hover:bg-[#FFF9F2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Children Stepper */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#F0E6DA]">
                <div>
                  <span className="block font-medium text-[#2B2B2B]">Children</span>
                  <span className="text-xs text-[#6B6B6B]">
                    Adjusts portion sizes by age group
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleChildrenCountChange(children.length - 1)}
                    disabled={children.length <= 0}
                    aria-label="Decrease children"
                    className="w-11 h-11 rounded-xl border border-[#DFD3C5] flex items-center justify-center text-[#2B2B2B] hover:bg-[#FFF9F2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <span
                    className="w-8 text-center font-heading font-semibold text-lg tabular-nums"
                    aria-live="polite"
                  >
                    {children.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleChildrenCountChange(children.length + 1)}
                    disabled={children.length >= 20}
                    aria-label="Increase children"
                    className="w-11 h-11 rounded-xl border border-[#DFD3C5] flex items-center justify-center text-[#2B2B2B] hover:bg-[#FFF9F2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Optional Child Age Groups */}
              {children.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-[#2B2B2B]">
                    Child age groups (optional, refines portion scaling)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                    {children.map((child, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#FFF9F2] border border-[#EADFD2]"
                      >
                        <label
                          htmlFor={`welcome-child-${idx}`}
                          className="text-xs font-medium text-[#6B6B6B]"
                        >
                          Child {idx + 1}
                        </label>
                        <select
                          id={`welcome-child-${idx}`}
                          value={child.ageGroup}
                          onChange={(e) =>
                            updateChildAgeGroup(idx, e.target.value as AgeGroup)
                          }
                          className="h-11 px-3 rounded-lg bg-white border border-[#DFD3C5] text-sm text-[#2B2B2B]"
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
                </div>
              )}
            </div>

            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between text-sm text-[#6B6B6B]">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#C5411B]" aria-hidden="true" />
                  <span>Household portion scale</span>
                </span>
                <span className="font-semibold text-[#2B2B2B] tabular-nums">
                  {formatServingsLabel(totalServings)} adult servings
                </span>
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] active:scale-[0.99] text-white font-heading font-semibold text-base transition-all cursor-pointer"
              >
                Let&apos;s cook
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};
