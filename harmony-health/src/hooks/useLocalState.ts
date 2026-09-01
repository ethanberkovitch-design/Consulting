import { useEffect, useState, useRef } from 'react'
import { loadJson, saveJson } from '../lib/storage.ts'

// A useState mirror to localStorage. When `key` changes (e.g. because the
// active account changed), the state is reloaded from the new key rather than
// carrying values across accounts.
export function useLocalState<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => loadJson<T>(key, initial))
  const lastKey = useRef(key)

  useEffect(() => {
    if (lastKey.current !== key) {
      lastKey.current = key
      setValue(loadJson<T>(key, initial))
      return
    }
    saveJson(key, value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value])

  return [value, setValue]
}
