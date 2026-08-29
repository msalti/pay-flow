import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  applyDatePreset,
  emptyLine,
  moveLine,
  rememberAccount,
  reorderWithinKind,
  resetToSample,
  updateHalf,
} from '../lib/budget.ts'
import { budgetFromUnknown } from '../lib/io.ts'
import { loadBudget, saveBudget } from '../lib/storage.ts'
import type { Budget, CellField, DatePreset, LineKind, PayLine, Selection } from '../types.ts'

export function useBudget() {
  const [budget, setBudget] = useState<Budget>(() => loadBudget())
  const [selection, setSelection] = useState<Selection | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    saveBudget(budget)
  }, [budget])

  useEffect(() => {
    if (!status) return
    const timer = window.setTimeout(() => setStatus(null), 4000)
    return () => window.clearTimeout(timer)
  }, [status])

  const selectedLine = useMemo(() => {
    if (!selection) return null
    const half = budget.halves.find((item) => item.id === selection.halfId)
    return half?.lines.find((line) => line.id === selection.lineId) ?? null
  }, [budget.halves, selection])

  const patch = useCallback((updater: (current: Budget) => Budget) => {
    setBudget(updater)
  }, [])

  const updateLine = useCallback((halfId: string, lineId: string, patchLine: Partial<PayLine>) => {
    patch((current) =>
      updateHalf(current, halfId, (half) => ({
        ...half,
        lines: half.lines.map((line) => (line.id === lineId ? { ...line, ...patchLine } : line)),
      })),
    )
    if (patchLine.account) {
      patch((current) => rememberAccount(current, patchLine.account ?? ''))
    }
  }, [patch])

  const addLine = useCallback(
    (halfId: string, kind: LineKind, seed?: Partial<PayLine>) => {
      const line = { ...emptyLine(kind), ...seed }
      patch((current) =>
        updateHalf(current, halfId, (half) => ({
          ...half,
          lines: [...half.lines, line],
        })),
      )
      const field: CellField = seed?.description ? 'amount' : 'description'
      setSelection({ halfId, lineId: line.id, field })
      return line.id
    },
    [patch],
  )

  const removeLine = useCallback((halfId: string, lineId: string) => {
    patch((current) =>
      updateHalf(current, halfId, (half) => ({
        ...half,
        lines: half.lines.filter((line) => line.id !== lineId),
      })),
    )
    setSelection((current) => (current?.lineId === lineId ? null : current))
  }, [patch])

  const shiftLine = useCallback((halfId: string, lineId: string, direction: -1 | 1) => {
    patch((current) =>
      updateHalf(current, halfId, (half) => ({
        ...half,
        lines: moveLine(half.lines, lineId, direction),
      })),
    )
  }, [patch])

  const dropLine = useCallback((halfId: string, sourceId: string, targetId: string) => {
    patch((current) =>
      updateHalf(current, halfId, (half) => ({
        ...half,
        lines: reorderWithinKind(half.lines, sourceId, targetId),
      })),
    )
  }, [patch])

  const setHalfMeta = useCallback(
    (halfId: string, meta: { title?: string; payDay?: number }) => {
      patch((current) => {
        const next = updateHalf(current, halfId, (half) => ({
          ...half,
          title: meta.title ?? half.title,
          payDay: meta.payDay ?? half.payDay,
        }))
        if (meta.payDay !== undefined) {
          return { ...next, datePreset: 'custom' }
        }
        return next
      })
    },
    [patch],
  )

  const setPreset = useCallback(
    (preset: Exclude<DatePreset, 'custom'>) => {
      patch((current) => applyDatePreset(current, preset))
    },
    [patch],
  )

  const setSettings = useCallback(
    (settings: Partial<Pick<Budget, 'currencySymbol' | 'currencyLabel' | 'householdLabel' | 'accounts' | 'introDismissed'>>) => {
      patch((current) => ({ ...current, ...settings }))
    },
    [patch],
  )

  const importJson = useCallback((text: string) => {
    const parsed: unknown = JSON.parse(text)
    const next = budgetFromUnknown(parsed)
    setBudget({ ...next, introDismissed: true })
    setStatus('Imported grid from JSON.')
  }, [])

  const resetSample = useCallback(() => {
    setBudget(resetToSample())
    setSelection(null)
    setStatus('Restored example household.')
  }, [])

  const dismissIntro = useCallback(() => {
    patch((current) => ({ ...current, introDismissed: true }))
  }, [patch])

  return {
    budget,
    selection,
    setSelection,
    selectedLine,
    status,
    setStatus,
    updateLine,
    addLine,
    removeLine,
    shiftLine,
    dropLine,
    setHalfMeta,
    setPreset,
    setSettings,
    importJson,
    resetSample,
    dismissIntro,
  }
}
