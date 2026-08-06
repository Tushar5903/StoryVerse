import { motion } from 'framer-motion'
import { METER } from './constants'

export default function MeterArc({ segment, category, count, percentage, dimmed, emphasized, glowing }) {
  return <motion.path
    role="img"
    aria-label={`${category.label}, ${percentage}%, ${count} votes`}
    className="moctale-arc"
    initial={false}
    animate={{
      d: segment.path,
      opacity: dimmed ? 0.4 : 1,
      strokeWidth: emphasized ? METER.STROKE * 1.35 : METER.STROKE,
    }}
    transition={{
      d: { duration: METER.ANIMATION_MS / 1000, ease: 'easeInOut' },
      opacity: { duration: 0.25 },
      strokeWidth: { duration: 0.25 },
    }}
    stroke={category.color}
    fill="none"
    strokeLinecap="round"
    style={{ filter: glowing ? `drop-shadow(0 0 10px ${category.color})` : 'none' }}
  />
}
