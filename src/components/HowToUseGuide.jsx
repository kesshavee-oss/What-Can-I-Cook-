import React from 'react';
import { Dialog } from './Dialog';

/**
 * Plain-language family guide content stored as a simple editable array.
 * Each section has a sentence-case title and short lines of guidance.
 */
export const GUIDE_SECTIONS = [
  {
    id: 'household',
    title: 'Start with your household',
    lines: [
      "Set how many adults and children are eating. Children's portions are smaller.",
      'Change this any time in Profile.',
    ],
  },
  {
    id: 'cook',
    title: 'Cook something',
    lines: [
      'Step 1: Pick vegetarian or non-vegetarian. Vegetarian includes eggs.',
      'Step 2: Pick the meal: breakfast, lunch, snacks, or dinner.',
      'Step 3: Tap the ingredients you have. Use the search box to find them quickly.',
      'Step 4: Pick one recipe from the list. Recipes are sorted by how many of your ingredients they use.',
      'Recipe pages show what to buy, the steps, and nutrition estimates.',
      'Tap "I cooked this" to save the meal to your calendar.',
    ],
  },
  {
    id: 'calendar',
    title: 'See what you cooked',
    lines: [
      'The Calendar shows every meal by date. Green dots are vegetarian, red dots are non-vegetarian.',
      'Tap a day to see its meals. You can edit or delete any meal.',
    ],
  },
  {
    id: 'plan',
    title: 'Plan the week',
    lines: [
      'Add recipes to meal slots for coming days. Planned meals do not appear on the calendar until you cook them.',
      'Use "Add missing for this week" to send what you need to the grocery list.',
    ],
  },
  {
    id: 'shopping',
    title: 'Shopping',
    lines: [
      'The grocery list collects missing ingredients. Check items off as you shop.',
      'Copy or print the list to take with you.',
      'Prices are rough estimates. You can change them in "Edit prices".',
    ],
  },
  {
    id: 'settings-privacy',
    title: 'Settings and privacy',
    lines: [
      'Your information stays on this device. Nothing is sent to a server.',
      'Use Export to save a backup. Use Import on another device to restore it.',
      'Allergy filters hide some recipes. They are a helpful guide, not a guarantee. Always read labels.',
    ],
  },
  {
    id: 'good-to-know',
    title: 'Good to know',
    lines: [
      'Nutrition values and prices are estimates, not medical or market advice.',
      'AI-made recipes are marked with an AI tag. Check them before cooking.',
    ],
  },
];

// Verify guide integrity: 7 sections, each with a title and at least one line of text.
console.assert(
  Array.isArray(GUIDE_SECTIONS) && GUIDE_SECTIONS.length === 7,
  `Expected 7 guide sections, got ${GUIDE_SECTIONS.length}`
);
for (const section of GUIDE_SECTIONS) {
  console.assert(
    typeof section.title === 'string' && section.title.trim().length > 0,
    'Guide section is missing a title'
  );
  console.assert(
    Array.isArray(section.lines) && section.lines.length >= 1,
    `Guide section "${section.title}" must have at least one line of text`
  );
}

/**
 * In-app family guide explaining each tab in plain language.
 * Opens as a full-screen sheet on mobile and a centered dialog on desktop,
 * reusing Dialog for focus trapping, heading focus on open, Escape handling,
 * and trigger focus restoration on close.
 */
export const HowToUseGuide = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="How to use"
      description="A quick, plain-language guide for everyone in the household."
      maxWidthClass="max-w-2xl"
      fullScreenOnMobile
      focusHeadingOnOpen
    >
      <ol className="space-y-4">
        {GUIDE_SECTIONS.map((section, idx) => (
          <li
            key={section.id}
            className="rounded-xl bg-[#FFF9F2] border border-[#EADFD2] p-4 space-y-2"
          >
            <h3 className="font-heading text-base font-semibold text-[#2B2B2B] flex items-baseline gap-2">
              <span className="text-[#B83915] tabular-nums shrink-0">
                {idx + 1}.
              </span>
              <span>{section.title}</span>
            </h3>
            <ul className="space-y-1.5 text-sm text-[#2B2B2B] leading-relaxed pl-5 list-disc marker:text-[#6B6B6B]">
              {section.lines.map((line, lineIdx) => (
                <li key={lineIdx}>{line}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto min-h-[44px] px-6 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold text-sm cursor-pointer"
        >
          Close guide
        </button>
      </div>
    </Dialog>
  );
};
