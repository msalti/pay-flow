import { useEffect, useId, useRef, useState } from 'react'
import type { Budget } from '../types.ts'

type SettingsPanelProps = {
  budget: Budget
  open: boolean
  onClose: () => void
  onSettings: (
    settings: Partial<
      Pick<Budget, 'currencySymbol' | 'currencyLabel' | 'householdLabel' | 'accounts'>
    >,
  ) => void
  onExportJson: () => void
  onExportCsv: () => void
  onImportJson: (text: string) => void
  onReset: () => void
}

export function SettingsPanel({
  budget,
  open,
  onClose,
  onSettings,
  onExportJson,
  onExportCsv,
  onImportJson,
  onReset,
}: SettingsPanelProps) {
  const titleId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [chipDraft, setChipDraft] = useState('')
  const [importError, setImportError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function addChip() {
    const name = chipDraft.trim()
    if (!name) return
    if (budget.accounts.some((item) => item.toLowerCase() === name.toLowerCase())) {
      setChipDraft('')
      return
    }
    onSettings({ accounts: [...budget.accounts, name] })
    setChipDraft('')
  }

  function removeChip(name: string) {
    onSettings({ accounts: budget.accounts.filter((item) => item !== name) })
  }

  async function onPickFile(file: File | undefined) {
    if (!file) return
    setImportError(null)
    try {
      const text = await file.text()
      onImportJson(text)
      onClose()
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Could not import that file.')
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-head">
          <h2 id={titleId}>Settings</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close settings">
            ×
          </button>
        </div>

        <div className="dialog-body">
          <label className="field">
            Household label
            <input
              value={budget.householdLabel}
              onChange={(event) => onSettings({ householdLabel: event.target.value })}
            />
          </label>

          <div className="field-row">
            <label className="field">
              Currency symbol
              <input
                value={budget.currencySymbol}
                maxLength={4}
                onChange={(event) => onSettings({ currencySymbol: event.target.value || '$' })}
              />
            </label>
            <label className="field">
              Currency label
              <input
                value={budget.currencyLabel}
                maxLength={8}
                placeholder="CAD"
                onChange={(event) => onSettings({ currencyLabel: event.target.value.toUpperCase() })}
              />
            </label>
          </div>
          <p className="hint">Label only — Paygrid does not convert currencies.</p>

          <fieldset className="field">
            <legend>Account tags</legend>
            <p className="hint">Short names you can pick on a line. Type a new one anytime.</p>
            <ul className="chip-list">
              {budget.accounts.map((name) => (
                <li key={name} className="chip">
                  <span>{name}</span>
                  <button type="button" aria-label={`Remove ${name}`} onClick={() => removeChip(name)}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className="chip-add">
              <input
                value={chipDraft}
                placeholder="New tag"
                onChange={(event) => setChipDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addChip()
                  }
                }}
              />
              <button type="button" onClick={addChip}>
                Add tag
              </button>
            </div>
          </fieldset>

          <fieldset className="field">
            <legend>This browser</legend>
            <p className="hint">
              Export a copy, or replace the current grid. Import reads Paygrid JSON only.
            </p>
            <div className="btn-row">
              <button type="button" onClick={onExportJson}>
                Export JSON
              </button>
              <button type="button" onClick={onExportCsv}>
                Export CSV
              </button>
              <button type="button" onClick={() => fileRef.current?.click()}>
                Import JSON
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                void onPickFile(file)
                event.target.value = ''
              }}
            />
            {importError ? <p className="error">{importError}</p> : null}
            <button
              type="button"
              className="danger-btn"
              onClick={() => {
                if (window.confirm('Replace this grid with the example household?')) {
                  onReset()
                  onClose()
                }
              }}
            >
              Reset to sample
            </button>
          </fieldset>
        </div>
      </div>
    </div>
  )
}
