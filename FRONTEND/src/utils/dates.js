const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const ordinal = day => {
  const mod10 = day % 10
  const mod100 = day % 100
  if (mod10 === 1 && mod100 !== 11) return 'st'
  if (mod10 === 2 && mod100 !== 12) return 'nd'
  if (mod10 === 3 && mod100 !== 13) return 'rd'
  return 'th'
}

const absolute = date => {
  const base = `${date.getDate()}${ordinal(date.getDate())} ${MONTHS[date.getMonth()]}`
  return date.getFullYear() === new Date().getFullYear() ? base : `${base} ${date.getFullYear()}`
}

const relative = date => {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  const months = Math.round(days / 30)
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`
  const years = Math.round(months / 12)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

export function formatReviewDate(value, mode = 'relative') {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return mode === 'absolute' ? absolute(date) : relative(date)
}
