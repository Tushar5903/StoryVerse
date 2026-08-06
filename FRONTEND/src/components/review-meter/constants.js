export const VERDICT_LABELS = { SKIP: 'Skip', TIMEPASS: 'Timepass', GO_FOR_IT: 'Go For It', PERFECTION: 'Perfection' }

export const VERDICT_COLORS = { SKIP: '#FF5F7D', TIMEPASS: '#F4B400', GO_FOR_IT: '#00D084', PERFECTION: '#A855F7' }

export const CATEGORIES = Object.keys(VERDICT_LABELS).map(key => ({ key, label: VERDICT_LABELS[key], color: VERDICT_COLORS[key] }))

export const METER = {
  VIEWBOX: '0 0 400 230',
  CX: 200,
  CY: 200,
  RADIUS: 170,
  STROKE: 22,
  SWEEP: 180,
  GAP: 10,
  ANIMATION_MS: 700,
}
