import { useEffect, useRef, useState } from 'react'

function useAnimatedNumber(target, duration = 700) {
  const [value, setValue] = useState(0)
  const previous = useRef(0)
  useEffect(() => {
    let frame
    const from = previous.current
    const start = performance.now()
    const step = now => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
      setValue(Math.round(from + (target - from) * eased))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(frame)
      previous.current = target
    }
  }, [target, duration])
  return value
}

export default function MeterCenter({ percentage, votes, totalVotes, color, label }) {
  const animated = useAnimatedNumber(percentage)
  if (!totalVotes) return <div className="moctale-center"><strong style={{ color }}>—</strong><span>No reviews yet</span></div>
  return <div className="moctale-center" aria-live="polite">
    <strong style={{ color }}>{animated}%</strong>
    <span>{label ? `${votes} votes` : `${votes} / ${totalVotes} Votes`}</span>
  </div>
}
