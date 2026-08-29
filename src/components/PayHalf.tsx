import { GhostRow, LineRow } from './LineRow.tsx'
import { formatAmount, ordinal, parseAmount } from '../lib/money.ts'
import { halfRemainder } from '../lib/budget.ts'
import type { CellField, LineKind, PayHalf as PayHalfData, PayLine, Selection } from '../types.ts'

type PayHalfProps = {
  half: PayHalfData
  accounts: string[]
  currencySymbol: string
  selection: Selection | null
  onSelect: (lineId: string, field: CellField) => void
  onChangeLine: (lineId: string, patch: Partial<PayLine>) => void
  onRemoveLine: (lineId: string) => void
  onMoveLine: (lineId: string, direction: -1 | 1) => void
  onDropLine: (sourceId: string, targetId: string) => void
  onAddLine: (kind: LineKind, seed?: Partial<PayLine>) => void
  onMeta: (meta: { title?: string; payDay?: number }) => void
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

export function PayHalf({
  half,
  accounts,
  currencySymbol,
  selection,
  onSelect,
  onChangeLine,
  onRemoveLine,
  onMoveLine,
  onDropLine,
  onAddLine,
  onMeta,
}: PayHalfProps) {
  const income = half.lines.filter((line) => line.kind === 'income')
  const allocations = half.lines.filter((line) => line.kind === 'allocation')
  const remainder = halfRemainder(half)
  const listId = `accounts-${half.id}`

  function createGhost(kind: LineKind, field: CellField, value: string) {
    const seed: Partial<PayLine> = { kind }
    if (field === 'description') seed.description = value.trim()
    if (field === 'account') seed.account = value.trim()
    if (field === 'amount') {
      seed.amount = parseAmount(value, kind) ?? 0
    }
    onAddLine(kind, seed)
  }

  return (
    <section className="half" aria-labelledby={`${half.id}-title`}>
      <datalist id={listId}>
        {accounts.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <div className="half-head">
        <input
          id={`${half.id}-title`}
          className="half-title"
          value={half.title}
          aria-label="Half title"
          onChange={(event) => onMeta({ title: event.target.value })}
        />
        <label className="half-day">
          <span className="sr-only">Pay day</span>
          <span aria-hidden="true">(</span>
          <select
            value={half.payDay}
            onChange={(event) => onMeta({ payDay: Number(event.target.value) })}
          >
            {DAYS.map((day) => (
              <option key={day} value={day}>
                {ordinal(day)}
              </option>
            ))}
          </select>
          <span aria-hidden="true">)</span>
        </label>
      </div>

      <div className="half-table-wrap">
        <table className="pay-grid">
          <colgroup>
            <col className="col-tools" />
            <col className="col-desc" />
            <col className="col-account" />
            <col className="col-amount" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="cell-tools">
                <span className="sr-only">Actions</span>
              </th>
              <th scope="col">Description</th>
              <th scope="col">Account</th>
              <th scope="col" className="th-amount">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {income.map((line) => (
              <LineRow
                key={line.id}
                halfId={half.id}
                line={line}
                currencySymbol={currencySymbol}
                selection={selection}
                onSelect={(field) => onSelect(line.id, field)}
                onChange={(patch) => onChangeLine(line.id, patch)}
                onRemove={() => onRemoveLine(line.id)}
                onMove={(direction) => onMoveLine(line.id, direction)}
                onDropOn={(sourceId) => onDropLine(sourceId, line.id)}
              />
            ))}
            {allocations.map((line) => (
              <LineRow
                key={line.id}
                halfId={half.id}
                line={line}
                currencySymbol={currencySymbol}
                selection={selection}
                onSelect={(field) => onSelect(line.id, field)}
                onChange={(patch) => onChangeLine(line.id, patch)}
                onRemove={() => onRemoveLine(line.id)}
                onMove={(direction) => onMoveLine(line.id, direction)}
                onDropOn={(sourceId) => onDropLine(sourceId, line.id)}
              />
            ))}
            <GhostRow
              key={`ghost-alloc-a-${allocations.length}`}
              halfId={half.id}
              kind="allocation"
              onCreate={(field, value) => createGhost('allocation', field, value)}
            />
            <GhostRow
              key={`ghost-alloc-b-${allocations.length}`}
              halfId={half.id}
              kind="allocation"
              onCreate={(field, value) => createGhost('allocation', field, value)}
            />
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={3}>
                Half Total
              </th>
              <td className="cell-amount">
                <span className="half-total-value">{formatAmount(remainder, currencySymbol)}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="half-actions">
        <button type="button" className="text-btn" onClick={() => onAddLine('income')}>
          Add income
        </button>
        <button type="button" className="text-btn" onClick={() => onAddLine('allocation')}>
          Add allocation
        </button>
      </div>
    </section>
  )
}
