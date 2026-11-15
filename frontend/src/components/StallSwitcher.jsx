import { useMenu } from '../context/MenuContext.jsx'

// Which stall the owner and cook screens are showing. There is no staff login to say "this is
// your stall", so the screen follows the stall chosen here (the same stall the Order section
// shows). Hidden when the centre has only one stall.
export default function StallSwitcher() {
  const { centre, stalls, stall, selectStall, switching } = useMenu()
  if (stalls.length < 2) return null

  return (
    <label className="flex flex-col items-start gap-1">
      <span className="text-[11px] font-bold uppercase text-muted">Stall{centre ? ` at ${centre.name}` : ''}</span>
      <select
        value={stall?.stall_id ?? ''}
        onChange={(event) => selectStall(Number(event.target.value))}
        disabled={switching}
        className="w-full max-w-[420px] rounded-full bg-surface px-4 py-2.5 text-[13px] font-semibold text-ink outline-none disabled:cursor-wait disabled:opacity-50"
      >
        {stalls.map((option) => (
          <option key={option.stall_id} value={option.stall_id}>
            {option.name}
            {option.cuisine_type ? ` (${option.cuisine_type})` : ''}
          </option>
        ))}
      </select>
    </label>
  )
}
