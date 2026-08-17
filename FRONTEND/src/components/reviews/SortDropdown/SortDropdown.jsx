import { useEffect, useRef, useState } from 'react'
import { FiCheck, FiChevronDown } from 'react-icons/fi'
import './SortDropdown.css'

const REVIEW_SORTS = [
  ['createdAt,desc', 'Most Recent'],
  ['createdAt,asc', 'Oldest']
]

export default function SortDropdown({ value, onChange, options = REVIEW_SORTS, variant = 'pill', prefix = 'Sort: ' }) {
  const [open, setOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const [focusIndex, setFocusIndex] = useState(0)
  const rootRef = useRef(null)
  const menuRef = useRef(null)
  const current = options.find(([key]) => key === value) || options[0]

  useEffect(() => {
    if (!open) return
    const close = event => { if (!rootRef.current?.contains(event.target)) setOpen(false) }
    const onKey = event => { if (event.key === 'Escape') { setOpen(false); rootRef.current?.querySelector('.sort-trigger')?.focus() } }
    document.addEventListener('click', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open || !menuRef.current) return
    const index = Math.max(0, options.findIndex(([key]) => key === value))
    setFocusIndex(index)
    menuRef.current.querySelectorAll('[role="option"]')[index]?.focus()
  }, [open])

  const toggle = () => {
    if (open) { setOpen(false); return }
    const rect = rootRef.current?.getBoundingClientRect()
    const estimatedHeight = options.length * 44 + 16
    setOpenUp((window.innerHeight - (rect?.bottom || 0) - 96) < estimatedHeight)
    setOpen(true)
  }
  const select = (key, label) => { setOpen(false); onChange(key, label) }
  const focusOption = index => { menuRef.current?.querySelectorAll('[role="option"]')[index]?.focus() }
  const onMenuKey = event => {
    if (event.key === 'ArrowDown') { event.preventDefault(); const next = (focusIndex + 1) % options.length; setFocusIndex(next); focusOption(next) }
    if (event.key === 'ArrowUp') { event.preventDefault(); const next = (focusIndex - 1 + options.length) % options.length; setFocusIndex(next); focusOption(next) }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(options[focusIndex][0], options[focusIndex][1]) }
  }
  return (
    <div className={`sort-dropdown ${variant}${open && openUp ? ' open-up' : ''}`} ref={rootRef}>
      <button type="button" className="sort-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={toggle}>
        <span>
          {prefix && <span className="sort-prefix">{prefix}</span>}
          <b>{current[1]}</b>
        </span>
        <FiChevronDown size={15} className={open ? 'open' : ''} />
      </button>
      {open && <div className="sort-menu" role="listbox" aria-label="Sort options" onKeyDown={onMenuKey} ref={menuRef}>
        {options.map(([key, label], index) => (
          <button type="button" role="option" aria-selected={key === value} tabIndex={index === focusIndex ? 0 : -1}
            className={key === value ? 'selected' : ''} key={key}
            onClick={() => select(key, label)} onMouseEnter={() => setFocusIndex(index)}>
            <span>{label}</span>{key === value && <FiCheck size={14} />}
          </button>
        ))}
      </div>}
    </div>
  )
}
