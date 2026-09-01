import type { DietStyle, MacroTargets, Recipe } from '../types.ts'
import { RECIPES } from '../data/recipes.ts'

export interface DayPlan {
  breakfast: Recipe
  lunch: Recipe
  dinner: Recipe
  snacks: Recipe[]
  totalKcal: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
}

// Deterministic per-day pick — takes a day index so the week doesn't repeat
// the same recipe three days running. Picks the recipe with the closest kcal
// target per meal after style-filtering.
function pickForMeal(
  meal: Recipe['meal'],
  targetKcal: number,
  style: DietStyle,
  dayIndex: number,
  allergies: string[],
): Recipe {
  const candidates = RECIPES.filter(
    r => r.meal === meal && r.suitableFor.includes(style) &&
      !r.ingredients.some(ing => allergies.some(a => ing.includes(a))),
  )
  if (candidates.length === 0) {
    // Style filter too strict → fall back to any candidate for the meal.
    const fallback = RECIPES.filter(r => r.meal === meal)
    return fallback[dayIndex % fallback.length]
  }
  const sorted = [...candidates].sort(
    (a, b) => Math.abs(a.kcal - targetKcal) - Math.abs(b.kcal - targetKcal),
  )
  // Rotate across the top few options to keep variety through the week.
  const top = sorted.slice(0, Math.min(3, sorted.length))
  return top[dayIndex % top.length]
}

export function planDay(
  targets: MacroTargets,
  style: DietStyle,
  dayIndex: number,
  allergies: string[] = [],
  seed = 0,
): DayPlan {
  const idx = dayIndex + seed
  // Even meal distribution: breakfast 25%, lunch 35%, dinner 30%, snacks 10%.
  const breakfastKcal = Math.round(targets.calories * 0.25)
  const lunchKcal = Math.round(targets.calories * 0.35)
  const dinnerKcal = Math.round(targets.calories * 0.3)
  const snackKcal = Math.round(targets.calories * 0.1)

  const breakfast = pickForMeal('breakfast', breakfastKcal, style, idx, allergies)
  const lunch = pickForMeal('lunch', lunchKcal, style, idx + 1, allergies)
  const dinner = pickForMeal('dinner', dinnerKcal, style, idx + 2, allergies)
  const snack = pickForMeal('snack', snackKcal, style, idx, allergies)

  const snacks = [snack]
  const totalKcal = breakfast.kcal + lunch.kcal + dinner.kcal + snack.kcal
  const totalProtein = breakfast.protein + lunch.protein + dinner.protein + snack.protein
  const totalCarbs = breakfast.carbs + lunch.carbs + dinner.carbs + snack.carbs
  const totalFat = breakfast.fat + lunch.fat + dinner.fat + snack.fat

  return { breakfast, lunch, dinner, snacks, totalKcal, totalProtein, totalCarbs, totalFat }
}

export function planWeek(
  targets: MacroTargets,
  style: DietStyle,
  allergies: string[] = [],
  seed = 0,
): DayPlan[] {
  return Array.from({ length: 7 }, (_, i) => planDay(targets, style, i, allergies, seed))
}
