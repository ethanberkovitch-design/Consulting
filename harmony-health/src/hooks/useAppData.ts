import { useMemo } from 'react'
import type {
  AppSettings,
  DiaryEntry,
  GratitudeEntry,
  HabitLog,
  MindfulnessSession,
  UserProfile,
  WeightLog,
  WorkoutLog,
} from '../types.ts'
import { useLocalState } from './useLocalState.ts'
import { macros } from '../lib/calculations.ts'
import { uid } from '../lib/storage.ts'

const DEFAULT_SETTINGS: AppSettings = {
  notifications: { enabled: false, times: ['08:30', '13:00', '20:00'] },
}

export function useAppData() {
  const [profile, setProfile] = useLocalState<UserProfile | null>('profile', null)
  const [diary, setDiary] = useLocalState<DiaryEntry[]>('diary', [])
  const [weights, setWeights] = useLocalState<WeightLog[]>('weights', [])
  const [workouts, setWorkouts] = useLocalState<WorkoutLog[]>('workouts', [])
  const [habits, setHabits] = useLocalState<HabitLog[]>('habits', [])
  const [mindful, setMindful] = useLocalState<MindfulnessSession[]>('mindful', [])
  const [gratitude, setGratitude] = useLocalState<GratitudeEntry[]>('gratitude', [])
  const [settings, setSettings] = useLocalState<AppSettings>('settings', DEFAULT_SETTINGS)

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

  function addMindfulness(entry: Omit<MindfulnessSession, 'id'>) {
    setMindful(prev => [...prev, { ...entry, id: uid() }])
    // Also increment today's habit mindfulnessMinutes
    setHabits(prev => {
      const existing = prev.find(h => h.date === entry.date)
      if (existing) {
        return prev.map(h => h.date === entry.date
          ? { ...h, mindfulnessMinutes: h.mindfulnessMinutes + entry.minutes }
          : h)
      }
      return [...prev, {
        id: uid(),
        date: entry.date,
        sleepHours: 0,
        waterMl: 0,
        steps: 0,
        mood: 3,
        stress: 3,
        mindfulnessMinutes: entry.minutes,
      }]
    })
  }

  function upsertGratitude(entry: Omit<GratitudeEntry, 'id'>) {
    setGratitude(prev => {
      const existing = prev.find(g => g.date === entry.date)
      if (existing) {
        return prev.map(g => g.date === entry.date ? { ...entry, id: existing.id } : g)
      }
      return [...prev, { ...entry, id: uid() }]
    })
  }

  function markCheckedInToday(date: string) {
    setSettings(prev => ({ ...prev, lastCheckInDate: date }))
  }

  function resetAll() {
    setProfile(null)
    setDiary([])
    setWeights([])
    setWorkouts([])
    setHabits([])
    setMindful([])
    setGratitude([])
    setSettings(DEFAULT_SETTINGS)
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
    mindful,
    addMindfulness,
    gratitude,
    upsertGratitude,
    settings,
    setSettings,
    markCheckedInToday,
    resetAll,
  }
}
