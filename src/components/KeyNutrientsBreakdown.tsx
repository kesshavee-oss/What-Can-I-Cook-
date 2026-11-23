import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Sprout } from 'lucide-react';
import { ScaledIngredient } from '../types/cook';
import {
  KeyNutrientGroup,
  KeyNutrientKey,
  computeRecipeKeyNutrients,
  formatNutrientValue,
} from '../utils/ingredientNutrition';
import { formatServingsLabel } from '../utils/nutrition';

interface KeyNutrientsBreakdownProps {
  scaledIngredients: ScaledIngredient[];
  householdMultiplier: number;
}

type NutrientFilterGroup = 'all' | KeyNutrientGroup;

const GROUP_FILTERS: { id: NutrientFilterGroup; label: string }[] = [
  { id: 'all', label: 'All (8)' },
  { id: 'fiber', label: 'Fiber' },
  { id: 'vitamins', label: 'Vitamins' },
  { id: 'minerals', label: 'Minerals' },
];

export const KeyNutrientsBreakdown: React.FC<KeyNutrientsBreakdownProps> = ({
  scaledIngredients,
  householdMultiplier,
}) => {
  const [scope, setScope] = useState<'perServing' | 'household'>('perServing');
  const [groupFilter, setGroupFilter] = useState<NutrientFilterGroup>('all');
  const [includeOptional, setIncludeOptional] = useState<boolean>(true);
  const [expandedKey, setExpandedKey] = useState<KeyNutrientKey | null>(null);

  const hasOptionalIngredients = useMemo(
    () => scaledIngredients.some((item) => Boolean(item.optional)),
    [scaledIngredients]
  );

  const summary = useMemo(
    () =>
      computeRecipeKeyNutrients(scaledIngredients, householdMultiplier, {
        scope,
        includeOptional,
      }),
    [scaledIngredients, householdMultiplier, scope, includeOptional]
  );

  const visibleNutrients = useMemo(() => {
    if (groupFilter === 'all') return summary.nutrients;
    return summary.nutrients.filter((n) => n.group === groupFilter);
  }, [summary.nutrients, groupFilter]);

  return (
    <section
      aria-labelledby="key-nutrients-heading"
      className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#EADFD2] space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-[#1F6E42] shrink-0" aria-hidden="true" />
            <h2
              id="key-nutrients-heading"
              className="font-heading text-xl font-semibold text-[#2B2B2B]"
            >
              Key nutrients &amp; health insights
            </h2>
          </div>
          <p className="text-xs font-medium text-[#6B6B6B] mt-0.5">
            Estimated fiber, vitamins, and minerals calculated from recipe ingredients.
          </p>
        </div>

        <div
          className="inline-flex items-center p-1 rounded-xl bg-[#FFF9F2] border border-[#EADFD2] no-print"
          role="group"
          aria-label="Key nutrients serving scope"
        >
          <button
            type="button"
            onClick={() => setScope('perServing')}
            aria-pressed={scope === 'perServing'}
            className={`min-h-[44px] px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              scope === 'perServing'
                ? 'bg-white text-[#2B2B2B] shadow-xs font-semibold'
                : 'text-[#6B6B6B] hover:text-[#2B2B2B]'
            }`}
          >
            Per serving
          </button>
          <button
            type="button"
            onClick={() => setScope('household')}
            aria-pressed={scope === 'household'}
            className={`min-h-[44px] px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
              scope === 'household'
                ? 'bg-white text-[#2B2B2B] shadow-xs font-semibold'
                : 'text-[#6B6B6B] hover:text-[#2B2B2B]'
            }`}
          >
            Household ({formatServingsLabel(householdMultiplier)})
          </button>
        </div>
      </div>

      {/* Top Health Insights */}
      {summary.highlights.length > 0 && (
        <div className="rounded-xl bg-[#EEF7F1]/75 border border-[#1F6E42]/20 p-3.5 space-y-2">
          <p className="text-xs font-semibold text-[#1F6E42] inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>
              Top nutrient highlights ({scope === 'perServing' ? 'per serving' : 'household total'})
            </span>
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {summary.highlights.map((item) => (
              <li
                key={item.key}
                className="rounded-lg bg-white border border-[#EADFD2] px-3 py-2 space-y-0.5"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-[#2B2B2B]">
                    {item.label}
                  </span>
                  <span className="text-xs font-bold text-[#1F6E42] tabular-nums shrink-0">
                    {item.pctDaily}% DV
                  </span>
                </div>
                <p className="text-[11px] text-[#6B6B6B] tabular-nums">
                  {item.valueText}
                  {item.topSources.length > 0
                    ? ` · from ${item.topSources.join(', ')}`
                    : ''}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Group Filter & Optional Ingredients Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 no-print">
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Filter nutrients by type"
        >
          {GROUP_FILTERS.map((tab) => {
            const active = groupFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setGroupFilter(tab.id)}
                aria-pressed={active}
                className={`min-h-[44px] px-3 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#2B2B2B] text-white font-semibold'
                    : 'bg-[#FFF9F2] border border-[#EADFD2] text-[#2B2B2B] hover:border-[#2B2B2B]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {hasOptionalIngredients && (
          <label className="min-h-[44px] inline-flex items-center gap-2 text-xs font-medium text-[#2B2B2B] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeOptional}
              onChange={(e) => setIncludeOptional(e.target.checked)}
              className="w-4 h-4 rounded accent-[#1F6E42] cursor-pointer"
            />
            <span>Include optional ingredients</span>
          </label>
        )}
      </div>

      {/* Nutrient Breakdown Rows with Expandable Ingredient Sources */}
      <ul className="space-y-2.5">
        {visibleNutrients.map((row) => {
          const isExpanded = expandedKey === row.key;
          const barPct = Math.min(100, Math.max(0, row.pctDaily));
          const topSummary = row.contributors
            .slice(0, 2)
            .map((c) => `${c.ingredientName} (${c.sharePct}%)`)
            .join(', ');

          return (
            <li
              key={row.key}
              className="rounded-xl border border-[#EADFD2] bg-[#FFF9F2] overflow-hidden"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedKey((prev) => (prev === row.key ? null : row.key))
                }
                aria-expanded={isExpanded}
                className="w-full min-h-[44px] p-3.5 text-left space-y-2 hover:bg-[#FAF2E8]/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-sm font-heading font-semibold text-[#2B2B2B]">
                      {row.label}
                    </span>
                    <span className="block text-xs text-[#6B6B6B]">
                      {row.benefit}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right tabular-nums">
                      <span className="block text-sm font-bold text-[#2B2B2B]">
                        {formatNutrientValue(row.totalAmount, row.unit)}
                      </span>
                      <span className="block text-[11px] font-medium text-[#1F6E42]">
                        {row.pctDaily}% daily ref
                      </span>
                    </div>
                    {row.contributors.length > 0 && (
                      <span className="text-[#6B6B6B] no-print" aria-hidden="true">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-2 w-full rounded-full bg-[#EADFD2]/70 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${row.totalAmount > 0 ? Math.max(3, barPct) : 0}%`,
                      backgroundColor: row.color,
                    }}
                  />
                </div>

                {topSummary && (
                  <p className="text-xs text-[#6B6B6B] tabular-nums">
                    <span className="font-medium text-[#2B2B2B]">Top sources:</span>{' '}
                    {topSummary}
                  </p>
                )}
              </button>

              {isExpanded && row.contributors.length > 0 && (
                <div className="px-3.5 pb-3.5 pt-2 border-t border-[#EADFD2] bg-white space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B6B6B]">
                    Ingredient contribution breakdown
                  </p>
                  <ul className="divide-y divide-[#F3EAE0]">
                    {row.contributors.map((c) => (
                      <li
                        key={c.ingredientId}
                        className="py-1.5 flex items-center justify-between gap-2 text-xs tabular-nums"
                      >
                        <span className="text-[#2B2B2B] truncate">
                          {c.ingredientName}
                          {c.optional && (
                            <span className="text-[#6B6B6B] ml-1">(optional)</span>
                          )}
                        </span>
                        <span className="font-medium text-[#2B2B2B] shrink-0">
                          {formatNutrientValue(c.amount, row.unit)}{' '}
                          <span className="text-[#6B6B6B]">({c.sharePct}%)</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-[#6B6B6B]">
        Estimated values based on scaled recipe ingredients. Not medical advice.
      </p>
    </section>
  );
};
