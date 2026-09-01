import { useEffect, useState } from 'react'
import { loadJson, saveJson } from '../lib/storage.ts'

export function useLocalState<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => loadJson<T>(key, initial))

  useEffect(() => {
    saveJson(key, value)
  }, [key, value])

  return [value, setValue]
}
