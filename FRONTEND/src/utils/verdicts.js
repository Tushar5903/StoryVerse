export const VERDICT_SCORE = { SKIP: 0, TIMEPASS: 1, GO_FOR_IT: 2, PERFECTION: 3 }

export const countsOf = reviews =>
  reviews.reduce((map, review) => {
    map[review.verdict] = (map[review.verdict] || 0) + 1
    return map
  }, {})

export const scoreOf = reviews => {
  if (!reviews.length) return 0
  const total = reviews.reduce((sum, review) => sum + (VERDICT_SCORE[review.verdict] ?? 0), 0)
  return total / reviews.length
}
