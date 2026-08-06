import { useMemo } from 'react'
import { CATEGORIES, METER } from './constants'
import { buildSegments, calculatePercentages, findHighestCategory, sumValues } from './meterUtils'

export function useMeterCalculation(reviews) {
  return useMemo(() => {
    const counts = { SKIP: 0, TIMEPASS: 0, GO_FOR_IT: 0, PERFECTION: 0 }
    for (const review of reviews || []) {
      if (Object.prototype.hasOwnProperty.call(counts, review?.verdict)) counts[review.verdict] += 1
    }
    const totalVotes = sumValues(counts)
    const percentages = calculatePercentages(counts)
    const highest = findHighestCategory(counts, percentages)
    const segments = buildSegments(CATEGORIES, percentages, METER)
    return { counts, totalVotes, percentages, segments, ...highest }
  }, [reviews])
}
