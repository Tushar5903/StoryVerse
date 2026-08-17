import { memo, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cloudinaryUrl } from '../../../utils/cloudinary'
import PosterSkeleton from './PosterSkeleton'

const OFFSETS = ['0px', '36px', '14px', '44px', '22px']

function PosterCard({ book, index }) {
  const [inView, setInView] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') { setInView(true); return }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setInView(true); observer.disconnect() }
    }, { rootMargin: '300px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  const cover = cloudinaryUrl(book.coverImage || book.thumbnailUrl, { width: 400 })
  const title = book.title || 'Untitled story'
  const genre = book.genre || ''
  const delay = (index % 7) * 0.6
  const duration = 6 + (index % 5) * 0.9
  return (
    <article className="poster-card" ref={ref} style={{ marginTop: OFFSETS[index % OFFSETS.length] }}>
      <motion.div
        className="poster-float"
        animate={{ y: [0, -7, 0] }}
        transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
        whileHover={{ scale: 1.04, transition: { duration: 0.2, ease: 'easeOut' } }}
      >
        {inView ? (cover ? (
          <img src={cover} alt={`${title}${genre ? ` — ${genre}` : ''}`} loading="lazy" decoding="async" onLoad={() => setLoaded(true)} style={{ opacity: loaded ? 1 : 0 }} />
        ) : (
          <div className="poster-placeholder" role="img" aria-label={`${title} — cover coming soon`}><span>SV</span><small>{title}</small></div>
        )) : <PosterSkeleton />}
        {inView && cover && !loaded && <PosterSkeleton />}
        <figcaption><strong>{title}</strong>{genre && <span>{genre}</span>}</figcaption>
      </motion.div>
    </article>
  )
}

export default memo(PosterCard)
