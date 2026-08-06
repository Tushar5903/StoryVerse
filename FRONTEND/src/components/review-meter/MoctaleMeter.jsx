import { useState } from 'react'
import { CATEGORIES, METER } from './constants'
import { useMeterCalculation } from './useMeterCalculation'
import MeterArc from './MeterArc'
import MeterCenter from './MeterCenter'
import MeterLegend from './MeterLegend'
import './MoctaleMeter.css'

export default function MoctaleMeter({ reviews }) {
  const { counts, totalVotes, percentages, highestCategory, segments } = useMeterCalculation(reviews)
  const [hovered, setHovered] = useState(null)
  const [selected, setSelected] = useState(null)

  const focusKey = hovered ?? selected
  const currentKey = focusKey || highestCategory
  const currentCategory = CATEGORIES.find(category => category.key === currentKey)

  const select = key => setSelected(selected === key ? null : key)

  return <section className="moctale-meter" aria-label="Review meter">
    <h2 className="moctale-meter__title">Review Meter</h2>
    <div className="moctale-meter__gauge">
      <svg viewBox={METER.VIEWBOX} className="moctale-svg" role="img" aria-label="Community review distribution">
        {segments.map(segment => <MeterArc
          key={segment.key}
          segment={segment}
          category={CATEGORIES.find(category => category.key === segment.key)}
          count={counts[segment.key]}
          percentage={percentages[segment.key]}
          dimmed={focusKey != null && focusKey !== segment.key}
          emphasized={focusKey === segment.key}
          glowing={hovered === segment.key}
        />)}
      </svg>
      <MeterCenter
        percentage={percentages[currentKey] ?? 0}
        votes={counts[currentKey] ?? 0}
        totalVotes={totalVotes}
        color={currentCategory?.color}
        label={focusKey ? currentCategory?.label : null}
      />
    </div>
    <MeterLegend
      percentages={percentages}
      active={selected}
      onHover={setHovered}
      onLeave={() => setHovered(null)}
      onSelect={select}
    />
  </section>
}
