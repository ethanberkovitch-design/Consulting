import { useEffect, useState } from 'react'
import { Bell, BellOff, Check, X, ChevronLeft } from 'lucide-react'
import type { ScreenKey } from '../types.ts'
import type { useAppData } from '../hooks/useAppData.ts'
import { todayIso } from '../lib/storage.ts'
import {
  notificationPermission,
  requestNotificationPermission,
  scheduleDailyReminders,
} from '../lib/notifications.ts'

interface Props {
  data: ReturnType<typeof useAppData>
  onNavigate: (s: ScreenKey) => void
}

// Two things at once:
//   1. If the user hasn't checked in today, prompt them right on the dashboard
//      with a warm banner (not a modal, so the day's other cards stay visible).
//   2. If browser notifications are enabled, keep the local reminder loop
//      alive while the tab is open — best-effort in-tab "push".
export function DailyCheckIn({ data, onNavigate }: Props) {
  const today = todayIso()
  const checkedIn = data.settings.lastCheckInDate === today
  const habitToday = data.habits.find(h => h.date === today)
  const alreadyLogged = !!habitToday
  const [dismissed, setDismissed] = useState(false)
  const notifs = data.settings.notifications
  const [permission, setPermission] = useState(notificationPermission())

  useEffect(() => {
    if (!notifs.enabled || permission !== 'granted') return
    const cleanup = scheduleDailyReminders(notifs.times)
    return cleanup
  }, [notifs.enabled, notifs.times, permission])

  async function enableNotifications() {
    const p = await requestNotificationPermission()
    setPermission(p)
    if (p === 'granted') {
      data.setSettings({
        ...data.settings,
        notifications: { ...notifs, enabled: true },
      })
    }
  }

  function disableNotifications() {
    data.setSettings({
      ...data.settings,
      notifications: { ...notifs, enabled: false },
    })
  }

  function completeCheckIn() {
    data.markCheckedInToday(today)
    onNavigate('habits')
  }

  if (dismissed || (checkedIn && alreadyLogged)) return null

  return (
    <div
      className="card mb-6 fade-up"
      style={{
        background: 'linear-gradient(135deg, var(--gold-soft) 0%, var(--cream) 100%)',
        border: '1px solid var(--gold)',
        position: 'relative',
      }}
    >
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="סגור"
        className="absolute top-3 left-3 p-1 rounded-lg"
        style={{ color: 'var(--navy)', opacity: 0.6 }}
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-4 pr-6">
        <div className="p-3 rounded-2xl flex-shrink-0" style={{ background: 'var(--navy)', color: 'var(--gold)' }}>
          <Bell size={22} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl mb-1">איך היום שלך עד עכשיו?</h3>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            רגע קצר לצ׳ק-אין — שינה, מים, מצב רוח. שתי דקות שיעזרו לזהות דפוסים לאורך זמן.
          </p>
          <div className="flex gap-2 flex-wrap">
            <button className="btn btn-primary btn-sm" onClick={completeCheckIn}>
              <Check size={14} /> {alreadyLogged ? 'עדכן את היום' : 'התחל צ׳ק-אין'} <ChevronLeft size={14} />
            </button>
            {permission !== 'granted' && (
              <button className="btn btn-ghost btn-sm" onClick={enableNotifications}>
                <Bell size={14} /> אפשר תזכורות
              </button>
            )}
            {permission === 'granted' && notifs.enabled && (
              <button className="btn btn-ghost btn-sm" onClick={disableNotifications}>
                <BellOff size={14} /> כבה תזכורות
              </button>
            )}
            {permission === 'denied' && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                הדפדפן חסם התראות. שנה בהגדרות האתר כדי לקבל תזכורות.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
