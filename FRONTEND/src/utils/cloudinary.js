

const MARKER = '/image/upload/'

export const cloudinaryUrl = (url, { width, height, crop, quality = 'auto', format = 'auto' } = {}) => {
  if (!url || !url.includes(MARKER)) return url
  const parts = []
  if (width && height) parts.push(crop === 'fill' ? `w_${width},h_${height},c_fill` : `w_${width},h_${height}`)
  else if (width) parts.push(`w_${width}`)
  else if (height) parts.push(`h_${height}`)
  if (quality) parts.push(`q_${quality}`)
  if (format) parts.push(`f_${format}`)
  if (!parts.length) return url
  const index = url.indexOf(MARKER) + MARKER.length
  return `${url.slice(0, index)}${parts.join(',')}/${url.slice(index)}`
}
