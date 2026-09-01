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

// Whether the user actually wants a workout program at all. Some users can't
// or don't want to exercise; the app should still support them (NEAT-first).
export type ExerciseParticipation = 'yes' | 'limited' | 'no'

export interface UserProfile {
  name: string
  age: number
  sex: Sex
  heightCm: number
  startWeightKg: number
  currentWeightKg: number
  goalWeightKg: number
  activity: ActivityLevel
  goal: Goal
  dietStyle: DietStyle
  fasting: FastingWindow
  exercise: ExerciseParticipation
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

export interface HabitLog {
  id: string
  date: string
  sleepHours: number
  waterMl: number
  steps: number
  mood: 1 | 2 | 3 | 4 | 5
  stress: 1 | 2 | 3 | 4 | 5
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
    times: string[] // HH:MM strings for daily reminder times
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
