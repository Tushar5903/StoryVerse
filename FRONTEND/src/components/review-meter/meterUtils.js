export function sumValues(object) {
  return Object.values(object).reduce((sum, value) => sum + value, 0)
}

export function calculatePercentages(counts) {
  const totalVotes = sumValues(counts)
  if (!totalVotes) return Object.fromEntries(Object.keys(counts).map(key => [key, 0]))
  return Object.fromEntries(Object.entries(counts).map(([key, votes]) => [key, Math.round((votes / totalVotes) * 100)]))
}

export function findHighestCategory(counts, percentages) {
  let highestCategory = null
  let highestVotes = -1
  for (const key of Object.keys(counts)) {
    if (counts[key] > highestVotes) {
      highestCategory = key
      highestVotes = counts[key]
    }
  }
  return { highestCategory, highestVotes, highestPercentage: highestCategory ? percentages[highestCategory] : 0 }
}

function polarToCartesian(cx, cy, radius, degree) {
  const radians = (degree * Math.PI) / 180
  return { x: cx + radius * Math.cos(radians), y: cy - radius * Math.sin(radians) }
}

function buildSegmentArc({ cx, cy, radius, from, to }) {
  const start = polarToCartesian(cx, cy, radius, from)
  const end = polarToCartesian(cx, cy, radius, to)
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`
}

export function buildSegments(categories, percentages, meter) {
  const { SWEEP, GAP, CX, CY, RADIUS } = meter
  const visible = categories.filter(category => (percentages[category.key] || 0) > 0)
  if (!visible.length) return []
  const available = SWEEP - (visible.length - 1) * GAP
  let cursor = SWEEP
  return visible.map(category => {
    const angle = ((percentages[category.key] || 0) / 100) * available
    const from = cursor
    const to = from - angle
    cursor = to - GAP
    return { key: category.key, from, to, path: buildSegmentArc({ cx: CX, cy: CY, radius: RADIUS, from, to }) }
  })
}
