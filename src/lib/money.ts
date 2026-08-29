import type { LineKind, PayLine } from '../types.ts'

const AMOUNT_PATTERN =
  /^[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?$|^\((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?\)$/

export function ordinal(n: number): string {
  const clamped = Math.min(31, Math.max(1, Math.round(n)))
  const v = clamped % 100
  if (v >= 11 && v <= 13) return `${clamped}th`
  switch (clamped % 10) {
    case 1:
      return `${clamped}st`
    case 2:
      return `${clamped}nd`
    case 3:
      return `${clamped}rd`
    default:
      return `${clamped}th`
  }
}

export function parseAmount(raw: string, kind: LineKind): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return 0

  const paren = /^\(.*\)$/.test(trimmed)
  let inner = trimmed
  if (paren) {
    inner = trimmed.slice(1, -1)
  }

  const compact = inner.replace(/[\s$]/g, '')
  if (compact === '' || compact === '-' || compact === '+' || compact === '.') {
    return 0
  }

  const signed = /^[+-]/.test(compact)
  const numeric = compact.replace(/,/g, '')
  if (!AMOUNT_PATTERN.test(compact) && !/^[+-]?\d*\.?\d+$/.test(numeric)) {
    return null
  }

  const value = Number(numeric)
  if (!Number.isFinite(value)) return null

  if (paren || compact.startsWith('-')) return -Math.abs(value)
  if (compact.startsWith('+') || signed) return Math.abs(value)
  if (kind === 'allocation') return -Math.abs(value)
  return Math.abs(value)
}

export function formatAmount(amount: number, symbol: string): string {
  const abs = Math.abs(amount)
  const body = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  if (amount < 0) return `(${symbol}${body})`
  return `${symbol}${body}`
}

export function sumLines(lines: readonly PayLine[]): number {
  return lines.reduce((total, line) => total + line.amount, 0)
}

export function amountTone(amount: number): 'plus' | 'minus' | 'zero' {
  if (amount > 0) return 'plus'
  if (amount < 0) return 'minus'
  return 'zero'
}

export function roundCents(n: number): number {
  return Math.round(n * 100) / 100
}
