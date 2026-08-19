import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi'
import './Pager.css'

export default function Pager({ page, totalPages, totalElements, onPage }) {
    if (totalPages <= 1) return null
    const window = []
    const start = Math.max(0, Math.min(page - 2, totalPages - 5))
    const end = Math.min(totalPages - 1, start + 4)
    for (let i = start; i <= end; i++) window.push(i)
    const first = page === 0
    const last = page >= totalPages - 1
    return <nav className="pager" aria-label="Pagination">
        <span className="pager-count">{totalElements.toLocaleString()} <em>total</em></span>
        <div className="pager-buttons">
            <button className="pager-btn pager-btn--nav" disabled={first} onClick={() => onPage(0)} aria-label="First page"><FiChevronsLeft /></button>
            <button className="pager-btn pager-btn--nav" disabled={first} onClick={() => onPage(page - 1)} aria-label="Previous page"><FiChevronLeft /></button>
            {start > 0 && <span className="pager-ellipsis" aria-hidden="true">…</span>}
            {window.map(i => <button key={i} className={`pager-btn${i === page ? ' active' : ''}`} aria-current={i === page ? 'page' : undefined} aria-label={`Page ${i + 1}`} onClick={() => onPage(i)}>{i + 1}</button>)}
            {end < totalPages - 1 && <span className="pager-ellipsis" aria-hidden="true">…</span>}
            <button className="pager-btn pager-btn--nav" disabled={last} onClick={() => onPage(page + 1)} aria-label="Next page"><FiChevronRight /></button>
            <button className="pager-btn pager-btn--nav" disabled={last} onClick={() => onPage(totalPages - 1)} aria-label="Last page"><FiChevronsRight /></button>
        </div>
    </nav>
}