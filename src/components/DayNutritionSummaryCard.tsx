import React, { useMemo, useState } from 'react';
import {
  NUTRITION_MEDICAL_DISCLAIMER,
  computeDayNutritionSummary,
} from '../nutritionTargets.js';
import { CookedMeal, Recipe } from '../types/cook';

interface DayNutritionSummaryCardProps {
  dayMeals: CookedMeal[];
  recipeMap: Map<string, Recipe>;
  title?: string;
}

export const DayNutritionSummaryCard: React.FC<DayNutritionSummaryCardProps> = ({
  dayMeals,
  recipeMap,
  title = 'Today',
}) => {
  const [ironRef, setIronRef] = useState<'female' | 'male'>('female');

  const summary = useMemo(
    () => computeDayNutritionSummary(dayMeals, recipeMap, ironRef),
    [dayMeals, recipeMap, ironRef]
  );

  const metrics: {
    key: 'protein' | 'calcium' | 'iron' | 'fiber';
    label: string;
    unit: string;
    total: number | null;
    target: number;
    pct: number | null;
    barClass: string;
  }[] = [
    {
      key: 'protein',
      label: 'Protein',
      unit: 'g',
      total: summary.totals.protein,
      target: summary.targets.protein,
      pct: summary.percentages.protein,
      barClass: 'bg-[#1F6E42]',
    },
    {
      key: 'calcium',
      label: 'Calcium',
      unit: 'mg',
      total: summary.totals.calcium,
      target: summary.targets.calcium,
      pct: summary.percentages.calcium,
      barClass: 'bg-[#E9A23B]',
    },
    {
      key: 'iron',
      label: `Iron (${ironRef === 'female' ? 'female' : 'male'} target)`,
      unit: 'mg',
      total: summary.totals.iron,
      target: summary.targets.iron,
      pct: summary.percentages.iron,
      barClass: 'bg-[#C5411B]',
    },
    {
      key: 'fiber',
      label: 'Fiber',
      unit: 'g',
      total: summary.totals.fiber,
      target: summary.targets.fiber,
      pct: summary.percentages.fiber,
      barClass: 'bg-[#2E8B57]',
    },
  ];

  return (
    <section
      aria-label={`${title} adult nutrition summary`}
      className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#EADFD2] space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-base sm:text-lg font-bold text-[#2B2B2B]">
            {title}
          </h2>
          <p className="text-xs text-[#6B6B6B] tabular-nums">
            {summary.mealCount > 0
              ? `${summary.mealCount} cooked ${
                  summary.mealCount === 1 ? 'meal' : 'meals'
                } · Estimated adult targets`
              : 'No cooked meals logged · Estimated adult targets'}
          </p>
        </div>

        <div
          className="inline-flex p-1 rounded-xl bg-[#FFF9F2] border border-[#EADFD2]"
          role="group"
          aria-label="Iron daily target reference"
        >
          <button
            type="button"
            onClick={() => setIronRef('female')}
            aria-pressed={ironRef === 'female'}
            className={`min-h-[44px] px-2.5 rounded-lg text-xs font-medium cursor-pointer ${
              ironRef === 'female'
                ? 'bg-white text-[#2B2B2B] font-semibold shadow-xs'
                : 'text-[#6B6B6B]'
            }`}
          >
            Iron 18 mg (F)
          </button>
          <button
            type="button"
            onClick={() => setIronRef('male')}
            aria-pressed={ironRef === 'male'}
            className={`min-h-[44px] px-2.5 rounded-lg text-xs font-medium cursor-pointer ${
              ironRef === 'male'
                ? 'bg-white text-[#2B2B2B] font-semibold shadow-xs'
                : 'text-[#6B6B6B]'
            }`}
          >
            Iron 8 mg (M)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 tabular-nums">
        {metrics.map((m) => {
          const barWidth =
            m.pct !== null ? Math.min(100, Math.max(0, m.pct)) : 0;
          return (
            <div
              key={m.key}
              className="rounded-xl bg-[#FFF9F2] border border-[#F0E6DA] p-3 space-y-2"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-[#6B6B6B]">
                  {m.label}
                </span>
                <span className="text-[11px] text-[#6B6B6B]">
                  / {m.target} {m.unit}
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <span className="font-heading text-lg font-bold text-[#2B2B2B]">
                  {m.total !== null ? `${m.total} ${m.unit}` : '-'}
                </span>
                <span className="text-[11px] text-[#6B6B6B]">
                  {m.pct !== null ? `${m.pct}% · Estimated` : '-'}
                </span>
              </div>

              <div className="h-2 rounded-full bg-[#EADFD2]/70 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${m.barClass}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[#6B6B6B]">{NUTRITION_MEDICAL_DISCLAIMER}</p>
    </section>
  );
};
