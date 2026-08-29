import type { Budget, DatePreset, LineKind, PayHalf, PayLine } from '../types.ts'
import { newId } from './ids.ts'
import { cloneSample } from './sample.ts'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function parseKind(value: unknown): LineKind {
  return value === 'income' ? 'income' : 'allocation'
}

function parseLine(value: unknown, index: number): PayLine {
  if (!isRecord(value)) {
    throw new Error(`Line ${index + 1} is not an object`)
  }
  const kind = parseKind(value.kind)
  const amount = asNumber(value.amount, 0)
  return {
    id: asString(value.id) || newId('line'),
    kind,
    description: asString(value.description),
    account: asString(value.account),
    amount,
    note: asString(value.note),
  }
}

function parseHalf(value: unknown, index: number, fallbackTitle: string, fallbackDay: number): PayHalf {
  if (!isRecord(value)) {
    throw new Error(`Half ${index + 1} is not an object`)
  }
  const rawLines = Array.isArray(value.lines) ? value.lines : []
  const payDay = Math.min(31, Math.max(1, Math.round(asNumber(value.payDay, fallbackDay))))
  return {
    id: asString(value.id) || newId('half'),
    title: asString(value.title, fallbackTitle),
    payDay,
    lines: rawLines.map((line, i) => parseLine(line, i)),
  }
}

function parsePreset(value: unknown): DatePreset {
  if (value === '14-31' || value === '1-15' || value === 'custom') return value
  return 'custom'
}

export function budgetFromUnknown(data: unknown): Budget {
  if (!isRecord(data)) {
    throw new Error('File is not a Paygrid JSON object')
  }
  if (data.version !== 1) {
    throw new Error('Unsupported Paygrid version. This app reads version 1.')
  }

  const sample = cloneSample()
  const rawHalves = Array.isArray(data.halves) ? data.halves : []
  if (rawHalves.length < 2) {
    throw new Error('JSON must include two pay halves')
  }

  const halves: [PayHalf, PayHalf] = [
    parseHalf(rawHalves[0], 0, sample.halves[0].title, 14),
    parseHalf(rawHalves[1], 1, sample.halves[1].title, 31),
  ]

  const accounts = Array.isArray(data.accounts)
    ? data.accounts.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
    : sample.accounts

  const uniqueAccounts = [...new Set(accounts.map((name) => name.trim()))]

  return {
    version: 1,
    householdLabel: asString(data.householdLabel, sample.householdLabel),
    halves,
    accounts: uniqueAccounts.length > 0 ? uniqueAccounts : sample.accounts,
    currencySymbol: asString(data.currencySymbol, sample.currencySymbol).slice(0, 4) || '$',
    currencyLabel: asString(data.currencyLabel, sample.currencyLabel).slice(0, 8),
    datePreset: parsePreset(data.datePreset),
    introDismissed: asBoolean(data.introDismissed, true),
  }
}

export function budgetToJson(budget: Budget): string {
  return `${JSON.stringify(budget, null, 2)}\n`
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function budgetToCsv(budget: Budget): string {
  const header = ['Half', 'Pay day', 'Kind', 'Description', 'Account', 'Amount', 'Note']
  const rows = [header.join(',')]
  for (const half of budget.halves) {
    for (const line of half.lines) {
      rows.push(
        [
          csvEscape(half.title),
          String(half.payDay),
          line.kind,
          csvEscape(line.description),
          csvEscape(line.account),
          line.amount.toFixed(2),
          csvEscape(line.note),
        ].join(','),
      )
    }
  }
  return `${rows.join('\n')}\n`
}

export function stampFilename(ext: 'json' | 'csv'): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `paygrid-${y}-${m}-${d}.${ext}`
}

export function downloadText(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
