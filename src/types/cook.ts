export type AgeGroup = 'toddler' | 'child' | 'teen';

export interface ChildMember {
  ageGroup: AgeGroup;
}

export interface Household {
  adults: number;
  children: ChildMember[];
}

export type DietType = 'veg' | 'nonveg';

export type MealType = 'breakfast' | 'lunch' | 'snacks' | 'dinner';

export type IngredientCategory =
  | 'vegetables'
  | 'fruits'
  | 'meat_fish'
  | 'eggs_dairy'
  | 'grains_pulses'
  | 'spices_herbs'
  | 'pantry';

export type AllergyKey = 'nut' | 'dairy' | 'gluten' | 'soy' | 'egg';

export type IngredientVisualIcon =
  | 'leaf'
  | 'root'
  | 'fruit'
  | 'drop'
  | 'grain'
  | 'bean'
  | 'egg'
  | 'meat'
  | 'fish'
  | 'dairy'
  | 'spice'
  | 'bottle'
  | 'bowl'
  | 'pepper'
  | 'nut'
  | 'mushroom';

export interface IngredientVisual {
  color: string;
  icon: IngredientVisualIcon;
  imageUrl?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  isVeg: boolean;
  isEgg: boolean;
  allergens: AllergyKey[];
  aliases: string[];
  assumedAvailable: boolean;
  expiryDate?: string | null;
  visual?: IngredientVisual;
}

export interface RecipeIngredient {
  ingredientId: string;
  amount: number;
  unit: string;
  optional: boolean;
}

export interface RecipeStep {
  text: string;
  timerSeconds: number | null;
}

export interface NutritionInfo {
  calories: number | null;
  protein: number | null;
  calcium: number | null;
  iron: number | null;
  vitaminC: number | null;
  fiber: number | null;
  fat: number | null;
  carbs: number | null;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Recipe {
  id: string;
  name: string;
  mealTypes: MealType[];
  diet: DietType;
  allergens: AllergyKey[];
  cuisine: string;
  difficulty: Difficulty;
  prepMinutes: number;
  cookMinutes: number;
  baseServings: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  nutritionPerServing: NutritionInfo;
  tags: string[];
  source?: 'ai' | 'builtin';
  isAiGenerated?: boolean;
  imageUrl?: string;
  photoPath?: string;
}

export interface RecipeMatch extends Recipe {
  matchScore: number;
  coverage?: number;
  missingRequiredCount?: number;
  usedSelectedCount?: number;
  usedSelectedIngredients?: RecipeIngredient[];
  mainIngredientSetKey?: string;
  isClosestMatch?: boolean;
  missingIngredients: RecipeIngredient[];
  haveIngredients: RecipeIngredient[];
  usesExpiringSoon?: boolean;
  expiringIngredientIds?: string[];
  ratingBoostScore?: number;
  ratingBoostReason?: string | null;
  seasonTag?: string | null;
  festivalTag?: string | null;
}

export interface ScaledIngredient extends RecipeIngredient {
  scaledAmount: number;
}

export interface ScaledServingsResult {
  householdMultiplier: number;
  scaleFactor: number;
  ingredients: ScaledIngredient[];
}

export interface TotalNutritionResult {
  householdMultiplier: number;
  perPerson: NutritionInfo;
  householdTotal: NutritionInfo;
}

export interface CookedMeal {
  id: string;
  recipeId: string;
  recipeName?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  mealType: MealType;
  diet: DietType;
  servings: number;
  proteinPerServing?: number | null;
  rating?: number;
  note?: string;
}

export interface CookFlowSelection {
  diet: DietType;
  mealType: MealType;
  selectedIngredientIds: string[];
  customIngredients: string[];
  lastStep?: 1 | 2 | 3 | 4;
}

export interface UserSettings {
  defaultDiet: DietType;
  allergies: AllergyKey[];
  favorites: string[];
}

export interface GroceryItem {
  id: string;
  name: string;
  ingredientId: string;
  category: IngredientCategory;
  quantityText: string;
  checked: boolean;
  fromRecipeIds: string[];
}

export type PlannedMealStatus = 'planned' | 'cooked' | 'skipped';

export interface PlannedMeal {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  recipeId: string;
  status: PlannedMealStatus;
  servings: number;
  note?: string;
}

export interface PriceEntry {
  perUnitPaise: number;
  unit: string;
}

export type PriceMap = Record<string, PriceEntry>;

export type RecipeVisualIcon =
  | 'bowl'
  | 'plate'
  | 'pan'
  | 'pot'
  | 'wrap'
  | 'cup'
  | 'skewer'
  | 'leaf';

export interface RecipeVisual {
  color: string;
  accent: string;
  icon: RecipeVisualIcon;
  photoPath?: string;
}

export interface LeftoverItem {
  id: string;
  recipeId: string;
  portions: number;
  cookedDate: string; // YYYY-MM-DD
  keepUntil: string; // YYYY-MM-DD
  usedUp: boolean;
}

export interface PantryEntry {
  ingredientId: string;
  boughtOn: string; // YYYY-MM-DD
}

export interface PurchaseRecord {
  id: string;
  date: string; // YYYY-MM-DD
  totalPaise: number;
  itemCount: number;
}

export interface ReminderSettings {
  breakfast: { enabled: boolean; time: string };
  lunch: { enabled: boolean; time: string };
  dinner: { enabled: boolean; time: string };
  water: { enabled: boolean };
}

export interface FestivalSelection {
  id: 'diwali' | 'eid' | 'pongal';
  selectedAt: string; // YYYY-MM-DD
}

export interface HouseholdMeta {
  id: string;
  name: string;
}

export interface WcicHouseholdsRegistry {
  activeId: string;
  households: HouseholdMeta[];
}

export interface WeeklyNutritionGoal {
  minCalories: number;
  maxCalories: number;
  proteinGrams?: number | null;
  scope?: 'perServing' | 'household';
}

export interface WcicSettings {
  showCost: boolean;
  showVisuals: boolean;
  showIngredientImages: boolean;
  hiddenRecipeIds?: string[];
  reminders?: ReminderSettings;
  storeOrder?: IngredientCategory[];
  festival?: FestivalSelection | null;
  weeklyNutritionGoal?: WeeklyNutritionGoal | null;
}

export type AppTab = 'cook' | 'plan' | 'calendar' | 'grocery' | 'profile';
