import { useCallback, useEffect, useRef, useState } from 'react'

const STEP_FACTOR = 0.75
const STEP_MIN = 260

export default function useScrollRow() {
  const ref = useRef(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      setCanPrev(el.scrollLeft > 4)
      setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    }
    const frame = requestAnimationFrame(measure)
    el.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [])

  const scrollPrev = useCallback(() => {
    const el = ref.current
    if (el) el.scrollBy({ left: -Math.max(el.clientWidth * STEP_FACTOR, STEP_MIN), behavior: 'smooth' })
  }, [])
  const scrollNext = useCallback(() => {
    const el = ref.current
    if (el) el.scrollBy({ left: Math.max(el.clientWidth * STEP_FACTOR, STEP_MIN), behavior: 'smooth' })
  }, [])

  return { ref, canPrev, canNext, scrollPrev, scrollNext }
}
