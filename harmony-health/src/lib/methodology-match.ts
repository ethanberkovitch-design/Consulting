// Match a user's answers against the methodology catalog. The score is the
// sum of per-question fit values (positive = good match, negative = poor).
// We return the top-3 candidates with brief reasons — the user makes the
// final call, we don't force them into one.

import { METHODOLOGIES, type Methodology, type MethodologyKey } from '../data/methodologies.ts'
import type { MethodologyCheckIn } from '../types.ts'

export type ScheduleKind = 'office' | 'travel' | 'shifts' | 'flexible'
export type CookingTime = 'less_15' | '15_30' | 'more_30'
export type SocialFrequency = 'rare' | 'weekly' | 'often'
export type TrackingTolerance = 'love_it' | 'short_term_ok' | 'never'
export type PastExperience = 'never_dieted' | 'tried_and_failed' | 'lost_but_regained' | 'currently_succeeding'
export type Priority = 'fast_results' | 'easy_routine' | 'long_term_health' | 'build_habits'

export interface MethodologyAnswers {
  schedule: ScheduleKind
  cookingTime: CookingTime
  socialEating: SocialFrequency
  tracking: TrackingTolerance
  past: PastExperience
  priority: Priority
  medicalConstraints?: string[]  // e.g. ['diabetes', 'pcos', 'ibs']
}

export interface MethodologyMatch {
  methodology: Methodology
  score: number
  reasons: string[]
}

export function matchMethodologies(a: MethodologyAnswers): MethodologyMatch[] {
  return METHODOLOGIES
    .map(m => scoreOne(m, a))
    .sort((x, y) => y.score - x.score)
}

function scoreOne(m: Methodology, a: MethodologyAnswers): MethodologyMatch {
  let score = 0
  const reasons: string[] = []

  // Schedule
  if (m.key === 'intermittent_fasting') {
    if (a.schedule === 'office' || a.schedule === 'flexible') { score += 2; reasons.push('שגרה קבועה מתאימה לחלון אכילה') }
    if (a.schedule === 'shifts') { score -= 3; reasons.push('משמרות מקשות על חלון אכילה קבוע') }
  }
  if (m.key === 'meal_replacements' && (a.schedule === 'travel' || a.schedule === 'shifts')) {
    score += 3; reasons.push('אין תלות במטבח או בזמן קבוע')
  }

  // Cooking time
  if (a.cookingTime === 'less_15') {
    if (m.kitchenTime <= 2) { score += 2; reasons.push('כמעט בלי בישול') }
    if (m.kitchenTime >= 4) { score -= 3 }
  }
  if (a.cookingTime === 'more_30') {
    if (m.kitchenTime >= 4) { score += 1; reasons.push('בישול מהבסיס מוערך') }
    if (m.key === 'meal_replacements') { score -= 2 }
  }

  // Social eating
  if (a.socialEating === 'often' && m.socialFit >= 4) { score += 2; reasons.push('ידידותי לאכילה חברתית ולמסעדות') }
  if (a.socialEating === 'often' && m.socialFit <= 2) { score -= 3 }
  if (a.socialEating === 'rare' && m.structure >= 4) { score += 1 }

  // Tracking tolerance
  if (a.tracking === 'love_it' && m.trackingLoad >= 3) { score += 2; reasons.push('אתה אוהב לעקוב — זה מתאים') }
  if (a.tracking === 'never' && m.trackingLoad <= 2) { score += 3; reasons.push('כמעט בלי מעקב') }
  if (a.tracking === 'never' && m.trackingLoad >= 4) { score -= 4 }
  if (a.tracking === 'short_term_ok' && m.trackingLoad === 3) { score += 1 }

  // Past experience
  if (a.past === 'tried_and_failed' || a.past === 'lost_but_regained') {
    if (m.key === 'habit_stacking' || m.key === 'mindful_eating') { score += 3; reasons.push('גישה אחרת ממה שכבר ניסית ונשברת ממנו') }
    if (m.key === 'meal_replacements' && a.past === 'lost_but_regained') { score -= 1 }
  }
  if (a.past === 'never_dieted') {
    if (m.key === 'plate_method' || m.key === 'mediterranean') { score += 2; reasons.push('התחלה עדינה למי שאף פעם לא היה על דיאטה') }
  }

  // Priority
  if (a.priority === 'fast_results') {
    if (m.key === 'low_carb' || m.key === 'meal_replacements') { score += 2; reasons.push('תוצאות מהירות יחסית') }
    if (m.key === 'habit_stacking' || m.key === 'mindful_eating') { score -= 2 }
  }
  if (a.priority === 'easy_routine') {
    if (m.effort <= 2) { score += 2; reasons.push('מאמץ נמוך') }
    if (m.effort >= 4) { score -= 2 }
  }
  if (a.priority === 'long_term_health') {
    if (m.key === 'mediterranean') { score += 3; reasons.push('הכי מגובה מחקרית ללב ואריכות ימים') }
    if (m.key === 'volumetrics' || m.key === 'plate_method') { score += 1 }
  }
  if (a.priority === 'build_habits') {
    if (m.key === 'habit_stacking' || m.key === 'mindful_eating') { score += 3; reasons.push('בנוי סביב שינוי הרגלים') }
    if (m.key === 'meal_replacements') { score -= 2 }
  }

  // Medical
  const medical = a.medicalConstraints ?? []
  if (medical.includes('diabetes') || medical.includes('pcos')) {
    if (m.key === 'low_carb') { score += 3; reasons.push('מגובה מחקרית לסוכרת/PCOS') }
    if (m.key === 'mediterranean') { score += 2 }
  }
  if (medical.includes('binge_eating')) {
    if (m.key === 'mindful_eating') { score += 4; reasons.push('הכלי המרכזי המחקרי נגד התקפי אכילה') }
    if (m.key === 'calorie_counting') { score -= 3; reasons.push('מעקב אינטנסיבי עלול להחריף') }
  }

  return { methodology: m, score, reasons: dedupe(reasons).slice(0, 3) }
}

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr))
}

export function suggestFor(a: MethodologyAnswers): { top: MethodologyMatch; alternatives: MethodologyMatch[] } {
  const ranked = matchMethodologies(a)
  return { top: ranked[0], alternatives: ranked.slice(1, 3) }
}

export type { Methodology, MethodologyKey }

// Fit averaged from the last 4 recorded weekly check-ins for the CURRENT method.
export function recentMethodologyFit(
  checkIns: MethodologyCheckIn[],
  currentKey: MethodologyKey | undefined,
): { count: number; avg: number | null; lowStreak: number } {
  if (!currentKey) return { count: 0, avg: null, lowStreak: 0 }
  const forMethod = checkIns
    .filter(c => c.methodology === currentKey)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4)
  if (forMethod.length === 0) return { count: 0, avg: null, lowStreak: 0 }
  const avg = forMethod.reduce((s, c) => s + c.fit, 0) / forMethod.length
  let lowStreak = 0
  for (const c of forMethod) {
    if (c.fit <= 2) lowStreak++
    else break
  }
  return { count: forMethod.length, avg: Math.round(avg * 10) / 10, lowStreak }
}

// Was the last check-in more than 7 days ago (or none yet)?
export function needsWeeklyCheckIn(
  checkIns: MethodologyCheckIn[],
  currentKey: MethodologyKey | undefined,
): boolean {
  if (!currentKey) return false
  const forMethod = checkIns.filter(c => c.methodology === currentKey)
  if (forMethod.length === 0) return true
  const latest = forMethod.reduce((a, b) => a.date > b.date ? a : b)
  const days = (Date.now() - new Date(latest.date).getTime()) / 86_400_000
  return days >= 7
}

