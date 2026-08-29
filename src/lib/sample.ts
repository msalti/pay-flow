import type { Budget } from '../types.ts'

/** Obviously fake household — do not replace with real people or institutions. */
export const SAMPLE_BUDGET: Budget = {
  version: 1,
  householdLabel: 'Example data · Alex & Jordan',
  halves: [
    {
      id: 'half-h1',
      title: 'H1 Pay',
      payDay: 14,
      lines: [
        {
          id: 'h1-pay',
          kind: 'income',
          description: 'Pay — Alex',
          account: 'Northbank',
          amount: 3000,
          note: '',
        },
        {
          id: 'h1-rent',
          kind: 'allocation',
          description: 'Rent (half)',
          account: 'Northbank',
          amount: -1200,
          note: 'Example note: split across both pays.',
        },
        {
          id: 'h1-groceries',
          kind: 'allocation',
          description: 'Groceries',
          account: 'Paper Card',
          amount: -200,
          note: '',
        },
        {
          id: 'h1-transit',
          kind: 'allocation',
          description: 'Transit pass',
          account: 'Paper Card',
          amount: -100,
          note: '',
        },
        {
          id: 'h1-phone',
          kind: 'allocation',
          description: 'Phone',
          account: 'Northbank',
          amount: -40,
          note: '',
        },
        {
          id: 'h1-broker',
          kind: 'allocation',
          description: 'To brokerage',
          account: 'Oak Ledger',
          amount: -500,
          note: '',
        },
      ],
    },
    {
      id: 'half-h2',
      title: 'H2 Pay',
      payDay: 31,
      lines: [
        {
          id: 'h2-pay',
          kind: 'income',
          description: 'Pay — Jordan',
          account: 'Northbank',
          amount: 3000,
          note: '',
        },
        {
          id: 'h2-utils',
          kind: 'allocation',
          description: 'Utilities',
          account: 'Northbank',
          amount: -150,
          note: '',
        },
        {
          id: 'h2-groceries',
          kind: 'allocation',
          description: 'Groceries',
          account: 'Paper Card',
          amount: -200,
          note: '',
        },
        {
          id: 'h2-insure',
          kind: 'allocation',
          description: 'Insurance',
          account: 'Northbank',
          amount: -180,
          note: '',
        },
        {
          id: 'h2-fun',
          kind: 'allocation',
          description: 'Fun money',
          account: 'Paper Card',
          amount: -120,
          note: '',
        },
        {
          id: 'h2-broker',
          kind: 'allocation',
          description: 'To brokerage',
          account: 'Oak Ledger',
          amount: -500,
          note: '',
        },
      ],
    },
  ],
  accounts: ['Northbank', 'Paper Card', 'Oak Ledger'],
  currencySymbol: '$',
  currencyLabel: 'CAD',
  datePreset: '14-31',
  introDismissed: false,
}

export function cloneSample(): Budget {
  return structuredClone(SAMPLE_BUDGET)
}
