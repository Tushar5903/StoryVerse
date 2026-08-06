import { CATEGORIES } from './constants'

export default function MeterLegend({ percentages, active, onHover, onLeave, onSelect }) {
  return <div className="moctale-legend" role="group" aria-label="Review categories">
    {CATEGORIES.map(category => {
      const selected = active === category.key
      return <button
        type="button"
        key={category.key}
        className={selected ? 'moctale-legend-item selected' : 'moctale-legend-item'}
        aria-pressed={selected}
        onMouseEnter={() => onHover(category.key)}
        onMouseLeave={onLeave}
        onFocus={() => onHover(category.key)}
        onBlur={onLeave}
        onClick={() => onSelect(category.key)}
      >
        <i style={{ background: category.color }} aria-hidden="true" />
        <span>{category.label}</span>
        <b>{percentages[category.key]}%</b>
      </button>
    })}
  </div>
}
