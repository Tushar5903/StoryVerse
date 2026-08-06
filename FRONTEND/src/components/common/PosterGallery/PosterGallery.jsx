import { memo, useEffect, useState } from 'react'
import { listBooks } from '../../../services/booksApi'
import PosterCard from './PosterCard'
import './PosterGallery.css'

function PosterGallery({ count = 48 }) {
  const [books, setBooks] = useState([])
  useEffect(() => {
    let active = true
    listBooks(`?size=${count}&sort=createdAt,desc`)
      .then(page => { if (active) setBooks(page?.content || []) })
      .catch(() => { if (active) setBooks([]) })
    return () => { active = false }
  }, [count])
  return <div className="poster-gallery" aria-label="Featured story covers">{books.map((book, index) => <PosterCard key={book.id} book={book} index={index} />)}</div>
}

export default memo(PosterGallery)
