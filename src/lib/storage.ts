import type { Budget } from '../types.ts'
import { budgetFromUnknown } from './io.ts'
import { cloneSample } from './sample.ts'

export const STORAGE_KEY = 'paygrid.budget.v1'

export function loadBudget(): Budget {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return cloneSample()
    return budgetFromUnknown(JSON.parse(raw))
  } catch {
    return cloneSample()
  }
}

export function saveBudget(budget: Budget): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(budget))
  } catch {
    // Quota or private-mode failures should not break editing.
  }
}

export function clearBudget(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
