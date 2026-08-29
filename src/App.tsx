import { useRef, useState } from 'react'
import { PayHalf } from './components/PayHalf.tsx'
import { SettingsPanel } from './components/SettingsPanel.tsx'
import { useBudget } from './hooks/useBudget.ts'
import { monthRemainder } from './lib/budget.ts'
import { budgetToCsv, budgetToJson, downloadText, stampFilename } from './lib/io.ts'
import { amountTone, formatAmount } from './lib/money.ts'
import type { CellField } from './types.ts'

export default function App() {
  const {
    budget,
    selection,
    setSelection,
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
  } = useBudget()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)
  const leftover = monthRemainder(budget)
  const leftoverTone = amountTone(leftover)

  function exportJson() {
    downloadText(stampFilename('json'), budgetToJson(budget), 'application/json')
    setStatus('Downloaded JSON.')
  }

  function exportCsv() {
    downloadText(stampFilename('csv'), budgetToCsv(budget), 'text/csv')
    setStatus('Downloaded CSV.')
  }

  async function onImportFile(file: File | undefined) {
    if (!file) return
    try {
      importJson(await file.text())
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Import failed.')
    }
  }

  function applyAccountChip(name: string) {
    if (!selection) {
      setStatus('Select a line, then tap a tag.')
      return
    }
    updateLine(selection.halfId, selection.lineId, { account: name })
  }

  return (
    <div className="app">
      <a className="skip-link" href="#grid">
        Skip to grid
      </a>

      <header className="masthead">
        <div className="brand">
          <p className="wordmark">Paygrid</p>
          <p className="tagline">Budget by payday, not by month.</p>
        </div>
        <div className="mast-actions">
          <span className="currency-pill" title="Currency label">
            {budget.currencyLabel || '—'} {budget.currencySymbol}
          </span>
          <button type="button" onClick={exportJson}>
            Export
          </button>
          <button type="button" onClick={() => importRef.current?.click()}>
            Import
          </button>
          <button type="button" onClick={() => window.print()}>
            Print
          </button>
          <button type="button" className="primary" onClick={() => setSettingsOpen(true)}>
            Settings
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(event) => {
              void onImportFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </div>
      </header>

      {!budget.introDismissed ? (
        <section className="intro" aria-label="Welcome">
          <p>
            Two paycheques, two halves. Assign each dollar on the pay it lands — then see what is
            still unassigned.
          </p>
          <p>
            Nothing is uploaded. The grid lives in this browser. The names and amounts below are
            invented so you can click around.
          </p>
          <button type="button" className="text-btn" onClick={dismissIntro}>
            Hide this
          </button>
        </section>
      ) : null}

      <p className="household">{budget.householdLabel}</p>

      <section className="month-bar" aria-live="polite">
        <div>
          <p className="month-label">This month leftover</p>
          <p className={`month-value tone-${leftoverTone}`}>
            {formatAmount(leftover, budget.currencySymbol)}
          </p>
        </div>
        <fieldset className="preset">
          <legend className="sr-only">Pay-day preset</legend>
          <label>
            <input
              type="radio"
              name="preset"
              checked={budget.datePreset === '14-31'}
              onChange={() => setPreset('14-31')}
            />
            14th &amp; 31st
          </label>
          <label>
            <input
              type="radio"
              name="preset"
              checked={budget.datePreset === '1-15'}
              onChange={() => setPreset('1-15')}
            />
            1st &amp; 15th
          </label>
          {budget.datePreset === 'custom' ? <span className="preset-custom">Custom days</span> : null}
        </fieldset>
      </section>

      {leftover > 0 ? (
        <p className="nudge">
          Leftover is unassigned. Give it a job if you want — savings, debt, or spend.
        </p>
      ) : leftover < 0 ? (
        <p className="nudge is-over">This month is over-assigned. Trim a line or add a pay.</p>
      ) : (
        <p className="nudge">Assigned to the dollar.</p>
      )}

      <div id="grid" className="halves">
        {budget.halves.map((half) => (
          <PayHalf
            key={half.id}
            half={half}
            accounts={budget.accounts}
            currencySymbol={budget.currencySymbol}
            selection={selection}
            onSelect={(lineId: string, field: CellField) =>
              setSelection({ halfId: half.id, lineId, field })
            }
            onChangeLine={(lineId, patch) => updateLine(half.id, lineId, patch)}
            onRemoveLine={(lineId) => removeLine(half.id, lineId)}
            onMoveLine={(lineId, direction) => shiftLine(half.id, lineId, direction)}
            onDropLine={(sourceId, targetId) => dropLine(half.id, sourceId, targetId)}
            onAddLine={(kind, seed) => addLine(half.id, kind, seed)}
            onMeta={(meta) => setHalfMeta(half.id, meta)}
          />
        ))}
      </div>

      <section className="chips" aria-label="Account tags">
        <p className="chips-label">Tags</p>
        <div className="chip-row">
          {budget.accounts.map((name) => (
            <button key={name} type="button" className="chip-btn" onClick={() => applyAccountChip(name)}>
              {name}
            </button>
          ))}
        </div>
      </section>

      {status ? (
        <p className="status" role="status">
          {status}
        </p>
      ) : null}

      <footer className="colophon">
        <p>Paygrid stays in this browser. No account, no sync, no ads.</p>
      </footer>

      <SettingsPanel
        budget={budget}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSettings={setSettings}
        onExportJson={exportJson}
        onExportCsv={exportCsv}
        onImportJson={importJson}
        onReset={resetSample}
      />
    </div>
  )
}
