import welcomeKitchenImg from '../assets/images/kitchen_welcome_1794920622586.jpg';
import { MealType } from '../types/cook';

export const WELCOME_KITCHEN_IMAGE = welcomeKitchenImg;

export const MEAL_TYPE_META: Record<
  MealType,
  { label: string; hint: string; description: string }
> = {
  breakfast: {
    label: 'Breakfast',
    hint: 'Breakfast, usually 7–10 AM',
    description: 'Quick, energizing mornings with eggs, oats, poha, or warm toast.',
  },
  lunch: {
    label: 'Lunch',
    hint: 'Lunch, usually 12–3 PM',
    description: 'Balanced midday meals with dals, curries, rice bowls, and rotis.',
  },
  snacks: {
    label: 'Snacks',
    hint: 'Snacks, usually 4–6 PM',
    description: 'Crispy bites, chaats, skewers, and savory tea-time plates.',
  },
  dinner: {
    label: 'Dinner',
    hint: 'Dinner, usually 7–10 PM',
    description: 'Comforting evening curries, stir-fries, and hearty family plates.',
  },
};
