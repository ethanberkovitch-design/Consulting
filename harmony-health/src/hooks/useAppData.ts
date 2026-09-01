import { useMemo } from 'react'
import type {
  DiaryEntry,
  HabitLog,
  UserProfile,
  WeightLog,
  WorkoutLog,
} from '../types.ts'
import { useLocalState } from './useLocalState.ts'
import { macros } from '../lib/calculations.ts'
import { uid } from '../lib/storage.ts'

export function useAppData() {
  const [profile, setProfile] = useLocalState<UserProfile | null>('profile', null)
  const [diary, setDiary] = useLocalState<DiaryEntry[]>('diary', [])
  const [weights, setWeights] = useLocalState<WeightLog[]>('weights', [])
  const [workouts, setWorkouts] = useLocalState<WorkoutLog[]>('workouts', [])
  const [habits, setHabits] = useLocalState<HabitLog[]>('habits', [])

  const targets = useMemo(() => (profile ? macros(profile) : null), [profile])

  function addDiary(entry: Omit<DiaryEntry, 'id' | 'createdAt'>) {
    setDiary(prev => [...prev, { ...entry, id: uid(), createdAt: new Date().toISOString() }])
  }

  function removeDiary(id: string) {
    setDiary(prev => prev.filter(e => e.id !== id))
  }

  function addWeight(entry: Omit<WeightLog, 'id'>) {
    setWeights(prev => [...prev.filter(w => w.date !== entry.date), { ...entry, id: uid() }])
    if (profile) {
      setProfile({ ...profile, currentWeightKg: entry.weightKg })
    }
  }

  function addWorkout(entry: Omit<WorkoutLog, 'id'>) {
    setWorkouts(prev => [...prev, { ...entry, id: uid() }])
  }

  function upsertHabit(entry: Omit<HabitLog, 'id'>) {
    setHabits(prev => {
      const existing = prev.find(h => h.date === entry.date)
      if (existing) {
        return prev.map(h => h.date === entry.date ? { ...entry, id: existing.id } : h)
      }
      return [...prev, { ...entry, id: uid() }]
    })
  }

  function resetAll() {
    setProfile(null)
    setDiary([])
    setWeights([])
    setWorkouts([])
    setHabits([])
  }

  return {
    profile,
    setProfile,
    targets,
    diary,
    addDiary,
    removeDiary,
    weights,
    addWeight,
    workouts,
    addWorkout,
    habits,
    upsertHabit,
    resetAll,
  }
}
