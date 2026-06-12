import { OCCASIONS, type Occasion } from './types'

interface OccasionFilterProps {
  selectedOccasion: Occasion | null
  onSelect: (occasion: Occasion) => void
}

export default function OccasionFilter({ selectedOccasion, onSelect }: OccasionFilterProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Филтрирай по повод"
      className="flex flex-wrap gap-3 mb-8"
    >
      {OCCASIONS.map((occasion) => {
        const isSelected = selectedOccasion === occasion
        return (
          <button
            key={occasion}
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(occasion)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                onSelect(occasion)
              }
            }}
            className={`px-4 py-2 text-sm uppercase tracking-wide rounded transition-colors
              ${isSelected
                ? 'border-2 border-[var(--color-amber)] text-[var(--color-chocolate)] bg-transparent'
                : 'border-2 border-transparent text-[var(--color-chocolate)] bg-[var(--color-sand)] hover:[border-color:var(--color-amber)]'
              }`}
            style={{ fontFamily: 'var(--font-ui)' }}
          >
            {occasion}
          </button>
        )
      })}
    </div>
  )
}
