import type { Budget, DatePreset, LineKind, PayHalf, PayLine } from '../types.ts'
import { newId } from './ids.ts'
import { sumLines } from './money.ts'
import { cloneSample } from './sample.ts'

export function emptyLine(kind: LineKind): PayLine {
  return {
    id: newId('line'),
    kind,
    description: '',
    account: '',
    amount: 0,
    note: '',
  }
}

export function updateHalf(
  budget: Budget,
  halfId: string,
  updater: (half: PayHalf) => PayHalf,
): Budget {
  return {
    ...budget,
    halves: budget.halves.map((half) => (half.id === halfId ? updater(half) : half)) as [
      PayHalf,
      PayHalf,
    ],
  }
}

export function applyDatePreset(budget: Budget, preset: Exclude<DatePreset, 'custom'>): Budget {
  const days: [number, number] = preset === '14-31' ? [14, 31] : [1, 15]
  return {
    ...budget,
    datePreset: preset,
    halves: [
      { ...budget.halves[0], payDay: days[0] },
      { ...budget.halves[1], payDay: days[1] },
    ],
  }
}

export function halfRemainder(half: PayHalf): number {
  return sumLines(half.lines)
}

export function monthRemainder(budget: Budget): number {
  return halfRemainder(budget.halves[0]) + halfRemainder(budget.halves[1])
}

export function moveLine(lines: PayLine[], lineId: string, direction: -1 | 1): PayLine[] {
  const index = lines.findIndex((line) => line.id === lineId)
  if (index < 0) return lines
  const line = lines[index]
  const kind = line.kind
  const sameKind = lines
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => item.kind === kind)
  const pos = sameKind.findIndex(({ item }) => item.id === lineId)
  const swapWith = sameKind[pos + direction]
  if (!swapWith) return lines
  const next = lines.slice()
  next[index] = next[swapWith.i]
  next[swapWith.i] = line
  return next
}

export function reorderWithinKind(lines: PayLine[], sourceId: string, targetId: string): PayLine[] {
  if (sourceId === targetId) return lines
  const source = lines.find((line) => line.id === sourceId)
  const target = lines.find((line) => line.id === targetId)
  if (!source || !target || source.kind !== target.kind) return lines

  const without = lines.filter((line) => line.id !== sourceId)
  const targetIndex = without.findIndex((line) => line.id === targetId)
  if (targetIndex < 0) return lines
  const next = without.slice()
  next.splice(targetIndex, 0, source)
  return next
}

export function rememberAccount(budget: Budget, name: string): Budget {
  const trimmed = name.trim()
  if (!trimmed) return budget
  if (budget.accounts.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
    return budget
  }
  return { ...budget, accounts: [...budget.accounts, trimmed] }
}

export function resetToSample(): Budget {
  const sample = cloneSample()
  return { ...sample, introDismissed: true }
}
