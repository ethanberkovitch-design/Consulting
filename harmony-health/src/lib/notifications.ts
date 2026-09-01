// Thin Web Notifications wrapper. Real cross-device push needs a server the
// app doesn't run, so this is a best-effort local reminder: while the tab is
// open (or a PWA is installed) we can pop notifications at scheduled times.

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationPermission(): NotificationPermission {
  if (!notificationsSupported()) return 'denied'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied'
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission
  }
  return await Notification.requestPermission()
}

export function fireLocalNotification(title: string, body: string) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  try {
    new Notification(title, {
      body,
      icon: '/harmony-health/favicon.svg',
      badge: '/harmony-health/favicon.svg',
      tag: 'harmony-daily',
    })
  } catch {
    // No-op — some browsers throw when called from an unexpected context.
  }
}

const MESSAGES = [
  { title: 'רגע לעצמך 🌿', body: 'איך היום שלך? קח דקה, שתה מים ותרגם רגע לעצמך' },
  { title: 'הרמוניה בהמתנה', body: 'כמה זמן מאז המים האחרונים? זמן טוב לכוס' },
  { title: 'צ׳ק-אין קצר', body: 'איך הרגשת עד עכשיו? רגע קצר להתעדכן' },
  { title: 'תזוזה קטנה מנצחת', body: 'קום, מתח את הגוף 60 שניות. הגוף יודה לך' },
  { title: 'ארוחה בקרוב?', body: 'רגע לפני האוכל — נשם עמוק, תיהנה, לעס לאט' },
]

export function dailyMessageForNow(): { title: string; body: string } {
  const hour = new Date().getHours()
  const idx = hour < 10 ? 0 : hour < 13 ? 1 : hour < 16 ? 4 : hour < 20 ? 2 : 3
  return MESSAGES[idx]
}

// Set up an in-tab reminder loop. Fires a notification at the closest reminder
// time going forward and schedules the next. Returns a cleanup fn.
export function scheduleDailyReminders(times: string[], onFire?: () => void): () => void {
  if (!times.length) return () => {}
  let timeout: ReturnType<typeof setTimeout> | undefined

  function next(): number {
    const now = new Date()
    let soonest = Infinity
    for (const t of times) {
      const [h, m] = t.split(':').map(Number)
      const when = new Date()
      when.setHours(h, m ?? 0, 0, 0)
      if (when.getTime() <= now.getTime()) when.setDate(when.getDate() + 1)
      soonest = Math.min(soonest, when.getTime() - now.getTime())
    }
    return soonest
  }

  function arm() {
    const delay = next()
    timeout = setTimeout(() => {
      const msg = dailyMessageForNow()
      fireLocalNotification(msg.title, msg.body)
      onFire?.()
      arm()
    }, delay)
  }

  arm()
  return () => { if (timeout) clearTimeout(timeout) }
}
