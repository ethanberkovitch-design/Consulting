import type { UserProfile } from '../types.ts'
import { EXERCISES } from '../data/exercises.ts'

export interface WorkoutBlock {
  title: string
  focus: string
  exercises: {
    id: string
    name: string
    sets: number
    reps: string
    rest: string
    instructions: string
  }[]
  cardio?: {
    id: string
    name: string
    minutes: number
    intensity: 'low' | 'moderate' | 'high'
  }
  totalMinutes: number
}

const EX = (id: string) => EXERCISES.find(e => e.id === id)!

// Weekly template — 3 strength days + 2 cardio days + 2 recovery/mobility.
// Kept beginner-friendly (bodyweight or dumbbells) so it works at home.
export function planWeekWorkouts(profile: UserProfile): WorkoutBlock[] {
  const beginner = profile.activity === 'sedentary' || profile.activity === 'light'
  const sets = beginner ? 3 : 4
  const strengthMinutes = beginner ? 30 : 45

  const dayA: WorkoutBlock = {
    title: 'יום 1 — כוח: גוף תחתון',
    focus: 'רגליים, ישבן, ליבה',
    exercises: [
      { id: 'squat', name: EX('squat').name, sets, reps: '10–12', rest: '60–90 שנ\'', instructions: EX('squat').instructions },
      { id: 'hip-thrust', name: EX('hip-thrust').name, sets, reps: '12', rest: '60 שנ\'', instructions: EX('hip-thrust').instructions },
      { id: 'lunge', name: EX('lunge').name, sets, reps: '10 לכל רגל', rest: '60 שנ\'', instructions: EX('lunge').instructions },
      { id: 'plank', name: EX('plank').name, sets: 3, reps: '30–45 שנ\'', rest: '30 שנ\'', instructions: EX('plank').instructions },
    ],
    totalMinutes: strengthMinutes,
  }

  const dayB: WorkoutBlock = {
    title: 'יום 2 — קרדיו מתון',
    focus: 'לב-ריאה, שריפת קלוריות',
    exercises: [],
    cardio: {
      id: 'walk-brisk',
      name: 'הליכה מהירה או ריצה קלה',
      minutes: 30,
      intensity: 'moderate',
    },
    totalMinutes: 30,
  }

  const dayC: WorkoutBlock = {
    title: 'יום 3 — כוח: גוף עליון',
    focus: 'חזה, גב, כתפיים, ליבה',
    exercises: [
      { id: 'pushup', name: EX('pushup').name, sets, reps: '8–12', rest: '60 שנ\'', instructions: EX('pushup').instructions },
      { id: 'row-db', name: EX('row-db').name, sets, reps: '10–12', rest: '60 שנ\'', instructions: EX('row-db').instructions },
      { id: 'shoulder-press', name: EX('shoulder-press').name, sets, reps: '10', rest: '60 שנ\'', instructions: EX('shoulder-press').instructions },
      { id: 'plank', name: EX('plank').name, sets: 3, reps: '30–45 שנ\'', rest: '30 שנ\'', instructions: EX('plank').instructions },
    ],
    totalMinutes: strengthMinutes,
  }

  const dayD: WorkoutBlock = {
    title: 'יום 4 — מנוחה פעילה',
    focus: 'הליכה קלה + מתיחות',
    exercises: [
      { id: 'stretch', name: EX('stretch').name, sets: 1, reps: '10 דקות', rest: '-', instructions: EX('stretch').instructions },
    ],
    cardio: {
      id: 'walk-brisk',
      name: 'הליכה קלה',
      minutes: 20,
      intensity: 'low',
    },
    totalMinutes: 30,
  }

  const dayE: WorkoutBlock = {
    title: 'יום 5 — כוח: גוף מלא',
    focus: 'שילוב תרגילים מרובי-מפרקים',
    exercises: [
      { id: 'deadlift', name: EX('deadlift').name, sets, reps: '8–10', rest: '90 שנ\'', instructions: EX('deadlift').instructions },
      { id: 'pushup', name: EX('pushup').name, sets, reps: '10', rest: '60 שנ\'', instructions: EX('pushup').instructions },
      { id: 'row-db', name: EX('row-db').name, sets, reps: '12', rest: '60 שנ\'', instructions: EX('row-db').instructions },
      { id: 'plank', name: EX('plank').name, sets: 3, reps: '45 שנ\'', rest: '30 שנ\'', instructions: EX('plank').instructions },
    ],
    totalMinutes: strengthMinutes,
  }

  const dayF: WorkoutBlock = {
    title: 'יום 6 — קרדיו + יוגה',
    focus: 'שריפה + גמישות',
    exercises: [
      { id: 'yoga', name: EX('yoga').name, sets: 1, reps: '20 דקות', rest: '-', instructions: EX('yoga').instructions },
    ],
    cardio: {
      id: 'cycling',
      name: 'אופניים או הליכה',
      minutes: 25,
      intensity: 'moderate',
    },
    totalMinutes: 45,
  }

  const dayG: WorkoutBlock = {
    title: 'יום 7 — מנוחה',
    focus: 'שינה, הידרציה, שקיטת המערכת',
    exercises: [],
    totalMinutes: 0,
  }

  return [dayA, dayB, dayC, dayD, dayE, dayF, dayG]
}
