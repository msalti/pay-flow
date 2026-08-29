import { useEffect, useRef, useState, type DragEvent } from 'react'
import { amountTone, formatAmount, parseAmount } from '../lib/money.ts'
import type { CellField, LineKind, PayLine, Selection } from '../types.ts'

type LineRowProps = {
  halfId: string
  line: PayLine
  currencySymbol: string
  selection: Selection | null
  onSelect: (field: CellField) => void
  onChange: (patch: Partial<PayLine>) => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
  onDropOn: (sourceId: string) => void
}

export function LineRow({
  halfId,
  line,
  currencySymbol,
  selection,
  onSelect,
  onChange,
  onRemove,
  onMove,
  onDropOn,
}: LineRowProps) {
  const [amountDraft, setAmountDraft] = useState<string | null>(null)
  const [noteOpen, setNoteOpen] = useState(false)
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const descRef = useRef<HTMLInputElement>(null)
  const accountRef = useRef<HTMLInputElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  const didFocus = useRef(false)

  useEffect(() => {
    if (noteOpen) noteRef.current?.focus()
  }, [noteOpen])

  const selectedField =
    selection?.halfId === halfId && selection.lineId === line.id ? selection.field : null

  useEffect(() => {
    if (!selectedField || didFocus.current) return
    didFocus.current = true
    const node =
      selectedField === 'description'
        ? descRef.current
        : selectedField === 'account'
          ? accountRef.current
          : amountRef.current
    node?.focus()
    if (selectedField !== 'amount') {
      const len = node?.value.length ?? 0
      node?.setSelectionRange(len, len)
    }
  }, [selectedField])

  const displayAmount = formatAmount(line.amount, currencySymbol)
  const tone = amountTone(line.amount)
  const listId = `accounts-${halfId}`

  function commitAmount(raw: string) {
    const parsed = parseAmount(raw, line.kind)
    setAmountDraft(null)
    if (parsed === null) return
    onChange({ amount: parsed })
  }

  function closeMenu(event: { currentTarget: HTMLElement }) {
    event.currentTarget.closest('details')?.removeAttribute('open')
  }

  function onDragStart(event: DragEvent<HTMLTableRowElement>) {
    event.dataTransfer.setData('text/paygrid-line', line.id)
    event.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(event: DragEvent<HTMLTableRowElement>) {
    if (event.dataTransfer.types.includes('text/paygrid-line')) {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
    }
  }

  function onDrop(event: DragEvent<HTMLTableRowElement>) {
    event.preventDefault()
    const sourceId = event.dataTransfer.getData('text/paygrid-line')
    if (sourceId) onDropOn(sourceId)
  }

  return (
    <tr
      className={`grid-row ${line.kind === 'income' ? 'is-income' : 'is-allocation'}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <td className="cell-tools">
        <span className="drag-handle" title="Drag to reorder" aria-hidden="true">
          ::
        </span>
        <details className="row-menu">
          <summary aria-label={`Actions for ${line.description || 'line'}`}>⋯</summary>
          <div className="row-menu-panel">
            <button
              type="button"
              onClick={(event) => {
                onMove(-1)
                closeMenu(event)
              }}
            >
              Move up
            </button>
            <button
              type="button"
              onClick={(event) => {
                onMove(1)
                closeMenu(event)
              }}
            >
              Move down
            </button>
            <button
              type="button"
              onClick={(event) => {
                onChange({ kind: line.kind === 'income' ? 'allocation' : 'income' })
                closeMenu(event)
              }}
            >
              {line.kind === 'income' ? 'Make allocation' : 'Make income'}
            </button>
            <button
              type="button"
              onClick={(event) => {
                setNoteOpen(true)
                closeMenu(event)
              }}
            >
              {line.note ? 'Edit note' : 'Add note'}
            </button>
            <button
              type="button"
              className="danger"
              onClick={(event) => {
                onRemove()
                closeMenu(event)
              }}
            >
              Remove line
            </button>
          </div>
        </details>
      </td>
      <td
        className={`cell-desc ${selectedField === 'description' ? 'is-selected' : ''} ${line.note ? 'has-note' : ''}`}
      >
        <input
          ref={descRef}
          aria-label="Description"
          value={line.description}
          placeholder={line.kind === 'income' ? 'Pay description' : 'Bill or allocation'}
          onFocus={() => onSelect('description')}
          onChange={(event) => onChange({ description: event.target.value })}
        />
        {line.note ? (
          <button
            type="button"
            className="note-flag"
            aria-label="Edit note"
            title={line.note}
            onClick={() => setNoteOpen(true)}
          />
        ) : null}
        {noteOpen ? (
          <div className="note-pop">
            <label>
              Note
              <textarea
                ref={noteRef}
                value={line.note}
                rows={3}
                onChange={(event) => onChange({ note: event.target.value })}
              />
            </label>
            <button type="button" onClick={() => setNoteOpen(false)}>
              Done
            </button>
          </div>
        ) : null}
      </td>
      <td className={`cell-account ${selectedField === 'account' ? 'is-selected' : ''}`}>
        <input
          ref={accountRef}
          aria-label="Account"
          list={listId}
          value={line.account}
          placeholder="Tag"
          onFocus={() => onSelect('account')}
          onChange={(event) => onChange({ account: event.target.value })}
          onBlur={(event) => onChange({ account: event.target.value.trim() })}
        />
      </td>
      <td className={`cell-amount ${selectedField === 'amount' ? 'is-selected' : ''}`}>
        <input
          ref={amountRef}
          aria-label="Amount"
          className={`amount-input tone-${tone}`}
          inputMode="decimal"
          value={amountDraft ?? displayAmount}
          onFocus={() => {
            onSelect('amount')
            setAmountDraft(line.amount === 0 ? '' : String(line.amount))
          }}
          onChange={(event) => setAmountDraft(event.target.value)}
          onBlur={(event) => commitAmount(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur()
            }
            if (event.key === 'Escape') {
              setAmountDraft(null)
              event.currentTarget.blur()
            }
          }}
        />
      </td>
    </tr>
  )
}

type GhostRowProps = {
  halfId: string
  kind: LineKind
  onCreate: (field: CellField, value: string) => void
}

export function GhostRow({ halfId, kind, onCreate }: GhostRowProps) {
  const listId = `accounts-${halfId}`

  function start(field: CellField, value: string) {
    if (!value.trim()) return
    if (field === 'amount' && !/\d/.test(value)) return
    onCreate(field, value)
  }

  return (
    <tr className={`grid-row is-ghost ${kind === 'income' ? 'is-income' : 'is-allocation'}`}>
      <td className="cell-tools" />
      <td className="cell-desc">
        <input
          aria-label={`New ${kind} description`}
          defaultValue=""
          placeholder=""
          onChange={(event) => start('description', event.target.value)}
        />
      </td>
      <td className="cell-account">
        <input
          aria-label={`New ${kind} account`}
          list={listId}
          defaultValue=""
          placeholder=""
          onChange={(event) => start('account', event.target.value)}
        />
      </td>
      <td className="cell-amount">
        <input
          aria-label={`New ${kind} amount`}
          className="amount-input tone-zero"
          inputMode="decimal"
          defaultValue=""
          placeholder=""
          onChange={(event) => start('amount', event.target.value)}
        />
      </td>
    </tr>
  )
}
