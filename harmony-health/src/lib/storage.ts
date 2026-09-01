// Thin localStorage wrapper — namespaced under "harmony:" so the app stays clean
// alongside anything else served from the same origin.

const NS = 'harmony:'

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(NS + key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value))
  } catch {
    // storage may be disabled (private mode); silently degrade
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(NS + key)
  } catch {
    // no-op
  }
}

export function todayIso(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function isoDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

// ISO 8601 week number — used to auto-rotate the weekly meal plan without any
// user action. Menu changes every Monday.
export function isoWeekNumber(date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
