export type LineKind = 'income' | 'allocation'

export type PayLine = {
  id: string
  kind: LineKind
  description: string
  account: string
  /** Signed: income is typically +, allocations typically − */
  amount: number
  note: string
}

export type PayHalf = {
  id: string
  title: string
  payDay: number
  lines: PayLine[]
}

export type DatePreset = '14-31' | '1-15' | 'custom'

export type Budget = {
  version: 1
  householdLabel: string
  halves: [PayHalf, PayHalf]
  accounts: string[]
  currencySymbol: string
  currencyLabel: string
  datePreset: DatePreset
  introDismissed: boolean
}

export type CellField = 'description' | 'account' | 'amount'

export type Selection = {
  halfId: string
  lineId: string
  field: CellField
}
