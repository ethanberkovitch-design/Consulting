export type Sex = 'female' | 'male'

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active'

export type Goal = 'lose_slow' | 'lose_moderate' | 'lose_fast' | 'maintain' | 'recomposition'

export type DietStyle =
  | 'balanced'
  | 'mediterranean'
  | 'low_carb'
  | 'high_protein'
  | 'vegetarian'
  | 'vegan'

export type FastingWindow = 'none' | '12_12' | '14_10' | '16_8'

export type ExerciseParticipation = 'yes' | 'limited' | 'no'
export type MeditationParticipation = 'yes' | 'curious' | 'no'

// Which of the well-known weight-loss methods best fits this user. Assigned
// via the onboarding quiz and re-evaluated periodically. See src/data/
// methodologies.ts and src/lib/methodology.ts.
export type MethodologyKey =
  | 'intermittent_fasting'
  | 'calorie_counting'
  | 'volumetrics'
  | 'mediterranean'
  | 'low_carb'
  | 'high_protein'
  | 'plate_method'
  | 'mindful_eating'
  | 'meal_replacements'
  | 'habit_stacking'

// A single lightweight local account. Password is stored in a browser-only
// hash (not for production security) — the point is to gate the profile and
// let one browser hold multiple people. Cloud sync (real Supabase Auth) can
// be layered on top later without changing this shape.
export interface Account {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: string
  lastLoginAt: string
}

export interface UserProfile {
  accountId?: string
  name: string
  age: number
  sex: Sex
  heightCm: number
  startWeightKg: number
  currentWeightKg: number
  goalWeightKg: number
  // How many months the user wants to give the journey. Optional — when set
  // the app compares the required deficit against the safe floor and warns
  // if it's unrealistic.
  deadlineMonths?: number
  // Free-text reason motivating the change (wedding, medical, birthday…).
  motivationEvent?: string
  // Optional target date for that event (yyyy-mm-dd).
  motivationEventDate?: string
  activity: ActivityLevel
  goal: Goal
  dietStyle: DietStyle
  fasting: FastingWindow
  exercise: ExerciseParticipation
  meditation: MeditationParticipation
  // The methodology chosen from the onboarding matcher. Optional so the
  // pre-methodology flow still validates.
  methodology?: MethodologyKey
  // Free-text reasons the matcher gave when the user picked this one — we
  // surface them back on the Method page as a reminder of "why this fits me".
  methodologyReasons?: string[]
  waterTracking: boolean
  allergies: string[]
  dislikes: string[]
  medicalNotes?: string
  createdAt: string
}

export interface MacroTargets {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  waterMl: number
  stepsGoal: number
}

export interface FoodItem {
  id: string
  name: string
  category: string
  servingLabel: string
  servingG: number
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  tags?: string[]
}

export interface DiaryEntry {
  id: string
  date: string
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  foodId: string
  servings: number
  createdAt: string
}

export interface WeightLog {
  id: string
  date: string
  weightKg: number
  waistCm?: number
  hipCm?: number
  note?: string
}

export interface WorkoutLog {
  id: string
  date: string
  type: 'strength' | 'cardio' | 'walk' | 'mobility' | 'other'
  minutes: number
  intensity: 'low' | 'moderate' | 'high'
  note?: string
  caloriesBurned?: number
}

// Expanded HabitLog — collects the daily signals that most predict weight-loss
// success in behavioral literature (sleep, energy, hunger, cravings, mood,
// stress, alcohol, screen/outdoor exposure). Every field is optional-in-practice
// — the daily form only asks for what the user opts into.
export interface HabitLog {
  id: string
  date: string
  sleepHours: number
  sleepQuality?: 1 | 2 | 3 | 4 | 5
  waterMl: number
  steps: number
  mood: 1 | 2 | 3 | 4 | 5
  stress: 1 | 2 | 3 | 4 | 5
  energyLevel?: 1 | 2 | 3 | 4 | 5
  hungerLevel?: 1 | 2 | 3 | 4 | 5
  sweetCravings?: 1 | 2 | 3 | 4 | 5
  bowelMovements?: number
  alcoholUnits?: number
  screenTimeHours?: number
  outdoorMinutes?: number
  socialContact?: 1 | 2 | 3 | 4 | 5
  mindfulnessMinutes: number
  note?: string
}

export interface MindfulnessSession {
  id: string
  date: string
  type: 'meditation' | 'breathing' | 'gratitude' | 'body_scan' | 'sounds'
  minutes: number
  note?: string
}

export interface GratitudeEntry {
  id: string
  date: string
  items: string[]
}

export interface Exercise {
  id: string
  name: string
  category: 'strength' | 'cardio' | 'mobility'
  primaryMuscles: string[]
  equipment: string
  instructions: string
  metValue: number
}

export interface Recipe {
  id: string
  name: string
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  kcal: number
  protein: number
  carbs: number
  fat: number
  timeMin: number
  tags: string[]
  ingredients: string[]
  steps: string[]
  suitableFor: DietStyle[]
}

export interface DailyTargets extends MacroTargets {
  date: string
}

export interface AppSettings {
  notifications: {
    enabled: boolean
    times: string[]
  }
  lastCheckInDate?: string
}

export type ScreenKey =
  | 'dashboard'
  | 'diary'
  | 'plan'
  | 'weight'
  | 'workouts'
  | 'habits'
  | 'mindfulness'
  | 'tips'
  | 'method'
  | 'profile'
