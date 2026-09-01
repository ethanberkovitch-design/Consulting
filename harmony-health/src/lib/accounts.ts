// Local account store. Password is hashed with SubtleCrypto (SHA-256 + a
// per-account random salt) so we never persist a plaintext password. This is
// browser-local storage, not cloud auth — the whole point is that the profile
// is gated so multiple people on the same device get separate journeys, and
// the schema is already the right shape to sync to Supabase later.

import type { Account } from '../types.ts'
import { loadJson, saveJson, uid } from './storage.ts'

const ACCOUNTS_KEY = 'accounts'
const SESSION_KEY = 'session'

interface Session {
  accountId: string
  startedAt: string
}

async function sha256(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', enc)
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function randomSalt(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  return `${salt}$${await sha256(salt + password)}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split('$')
  if (!salt || !hash) return false
  const check = await sha256(salt + password)
  return check === hash
}

export function listAccounts(): Account[] {
  return loadJson<Account[]>(ACCOUNTS_KEY, [])
}

export function findAccountByEmail(email: string): Account | undefined {
  return listAccounts().find(a => a.email.toLowerCase() === email.toLowerCase())
}

export async function createAccount(name: string, email: string, password: string): Promise<Account> {
  const existing = findAccountByEmail(email)
  if (existing) throw new Error('כתובת המייל כבר רשומה')
  const salt = randomSalt()
  const passwordHash = await hashPassword(password, salt)
  const account: Account = {
    id: uid(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  }
  saveJson(ACCOUNTS_KEY, [...listAccounts(), account])
  setSession(account.id)
  return account
}

export async function loginAccount(email: string, password: string): Promise<Account> {
  const account = findAccountByEmail(email)
  if (!account) throw new Error('לא נמצא חשבון עם המייל הזה')
  const ok = await verifyPassword(password, account.passwordHash)
  if (!ok) throw new Error('סיסמה שגויה')
  const updated = { ...account, lastLoginAt: new Date().toISOString() }
  saveJson(ACCOUNTS_KEY, listAccounts().map(a => a.id === account.id ? updated : a))
  setSession(account.id)
  return updated
}

export function currentSession(): Session | null {
  return loadJson<Session | null>(SESSION_KEY, null)
}

export function currentAccount(): Account | null {
  const s = currentSession()
  if (!s) return null
  return listAccounts().find(a => a.id === s.accountId) ?? null
}

export function setSession(accountId: string) {
  saveJson<Session>(SESSION_KEY, { accountId, startedAt: new Date().toISOString() })
}

export function logout() {
  saveJson<Session | null>(SESSION_KEY, null)
}
