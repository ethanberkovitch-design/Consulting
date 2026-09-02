import type {
  ActivityLevel,
  DietStyle,
  Goal,
  MacroTargets,
  UserProfile,
} from '../types.ts'

// Mifflin-St Jeor equation — the current clinical gold standard for BMR.
export function bmr(profile: Pick<UserProfile, 'sex' | 'age' | 'heightCm' | 'currentWeightKg'>): number {
  const base = 10 * profile.currentWeightKg + 6.25 * profile.heightCm - 5 * profile.age
  return Math.round(base + (profile.sex === 'male' ? 5 : -161))
}

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

export function tdee(profile: UserProfile): number {
  return Math.round(bmr(profile) * ACTIVITY_MULTIPLIER[profile.activity])
}

// Adaptive deficit: never below the safe floor (BMR * 1.05 for women, BMR * 1.1
// for men). If the user set a deadline, we compute the deficit that deadline
// implies and take the deeper of that and the goal pace — but still bounded
// by the safe floor.
export function targetCalories(profile: UserProfile): number {
  const totalExpenditure = tdee(profile)
  const goalDelta: Record<Goal, number> = {
    lose_slow: -0.15,
    lose_moderate: -0.2,
    lose_fast: -0.25,
    maintain: 0,
    recomposition: -0.1,
  }
  const paceKcal = Math.round(totalExpenditure * (1 + goalDelta[profile.goal]))

  let deadlineKcal = paceKcal
  const toLose = profile.currentWeightKg - profile.goalWeightKg
  if (profile.deadlineMonths && profile.deadlineMonths > 0 && toLose > 0) {
    const kcalPerKg = 7700
    const totalDeficit = toLose * kcalPerKg
    const days = profile.deadlineMonths * 30
    const perDay = totalDeficit / days
    deadlineKcal = Math.round(totalExpenditure - perDay)
  }

  const raw = Math.min(paceKcal, deadlineKcal)
  const floor = Math.round(bmr(profile) * (profile.sex === 'male' ? 1.1 : 1.05))
  return Math.max(raw, floor)
}

// Whether the user's deadline is realistic given the safe floor. Used by the
// onboarding summary to warn — never to block.
export function deadlineFeasibility(profile: UserProfile):
  | { feasible: true; requiredWeeklyKg: number }
  | { feasible: false; requiredWeeklyKg: number; maxWeeklyKg: number }
  | null
{
  if (!profile.deadlineMonths || profile.deadlineMonths <= 0) return null
  const toLose = profile.currentWeightKg - profile.goalWeightKg
  if (toLose <= 0) return null

  const weeks = profile.deadlineMonths * 4.33
  const required = toLose / weeks

  const floor = Math.round(bmr(profile) * (profile.sex === 'male' ? 1.1 : 1.05))
  const maxDeficit = tdee(profile) - floor
  const maxWeekly = (maxDeficit * 7) / 7700

  if (required <= maxWeekly && required <= 1) {
    return { feasible: true, requiredWeeklyKg: Math.round(required * 100) / 100 }
  }
  return {
    feasible: false,
    requiredWeeklyKg: Math.round(required * 100) / 100,
    maxWeeklyKg: Math.round(Math.min(maxWeekly, 1) * 100) / 100,
  }
}

// Protein prescription per kg body weight — clinical range for fat-loss with muscle preservation.
export function proteinTargetG(profile: UserProfile): number {
  const perKg: Record<Goal, number> = {
    lose_slow: 1.8,
    lose_moderate: 2.0,
    lose_fast: 2.2,
    maintain: 1.6,
    recomposition: 2.2,
  }
  return Math.round(profile.currentWeightKg * perKg[profile.goal])
}

// Fat: minimum ~0.6 g/kg for hormonal health; the rest of calories go to carbs.
export function macros(profile: UserProfile): MacroTargets {
  const kcal = targetCalories(profile)
  const protein = proteinTargetG(profile)
  const fatMinG = Math.round(profile.currentWeightKg * 0.8)

  const styleFatShare: Record<DietStyle, number> = {
    balanced: 0.3,
    mediterranean: 0.35,
    low_carb: 0.5,
    high_protein: 0.28,
    vegetarian: 0.32,
    vegan: 0.3,
  }
  const fatFromShare = Math.round((kcal * styleFatShare[profile.dietStyle]) / 9)
  const fat = Math.max(fatMinG, fatFromShare)

  const proteinKcal = protein * 4
  const fatKcal = fat * 9
  const carbs = Math.max(50, Math.round((kcal - proteinKcal - fatKcal) / 4))

  const fiberG = Math.max(25, Math.round(kcal / 1000 * 14))
  const waterMl = Math.round(profile.currentWeightKg * 33)
  const stepsGoal = profile.activity === 'sedentary' ? 6000
    : profile.activity === 'light' ? 8000
    : profile.activity === 'moderate' ? 10000
    : 12000

  return { calories: kcal, proteinG: protein, carbsG: carbs, fatG: fat, fiberG, waterMl, stepsGoal }
}

// Simple BMI (informational — not the primary metric).
export function bmi(profile: Pick<UserProfile, 'heightCm' | 'currentWeightKg'>): number {
  const m = profile.heightCm / 100
  return Math.round((profile.currentWeightKg / (m * m)) * 10) / 10
}

export function bmiCategory(bmiValue: number): { label: string; color: string } {
  if (bmiValue < 18.5) return { label: 'תת-משקל', color: 'var(--accent-cool)' }
  if (bmiValue < 25) return { label: 'תקין', color: 'var(--status-good)' }
  if (bmiValue < 30) return { label: 'עודף משקל', color: 'var(--status-warn)' }
  if (bmiValue < 35) return { label: 'השמנה קלה', color: 'var(--status-warn)' }
  if (bmiValue < 40) return { label: 'השמנה בינונית', color: 'var(--status-critical)' }
  return { label: 'השמנה חמורה', color: 'var(--status-critical)' }
}

// Realistic weekly loss projection based on the deficit.
export function projectedWeeklyLossKg(profile: UserProfile): number {
  const deficit = tdee(profile) - targetCalories(profile)
  // ~7700 kcal per kg of body fat
  return Math.round((deficit * 7 / 7700) * 100) / 100
}

// Estimate a realistic date to reach the goal weight (in weeks).
// When the user has set a feasible deadline, we honor it — otherwise we
// compute the ceiling based on the actual safe weekly loss.
export function projectedWeeksToGoal(profile: UserProfile): number | null {
  const toLose = profile.currentWeightKg - profile.goalWeightKg
  if (toLose <= 0) return 0

  if (profile.deadlineMonths && profile.deadlineMonths > 0) {
    const f = deadlineFeasibility(profile)
    if (f?.feasible) return Math.round(profile.deadlineMonths * 4.33)
  }

  const weeklyLoss = projectedWeeklyLossKg(profile)
  if (weeklyLoss <= 0) return null
  return Math.ceil(toLose / weeklyLoss)
}

// MET-based calories burned.
export function caloriesFromExercise(
  metValue: number,
  minutes: number,
  weightKg: number,
): number {
  return Math.round((metValue * 3.5 * weightKg) / 200 * minutes)
}
