const PAGE_BUDGET = 2400

export const looksLikeHtml = value => /<\/?[a-z][\s\S]*>/i.test(String(value || '').trim())

const escapeHtml = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

const paginateHtml = (html, budget) => {
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  const blocks = Array.from(parsed.body.children)
  if (!blocks.length) return ['']
  const pages = []
  let current = []
  let currentLength = 0
  const flush = () => {
    pages.push(current.map(block => block.outerHTML).join(''))
    current = []
    currentLength = 0
  }
  for (const block of blocks) {
    const length = block.textContent.length
    if (current.length && currentLength + length > budget) flush()
    current.push(block)
    currentLength += length
  }
  if (current.length) flush()
  return pages
}

const paginateText = (text, budget) => {
  const paragraphs = String(text).split('\n')
  const pages = []
  let current = []
  let currentLength = 0
  const flush = () => {
    pages.push(current.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join(''))
    current = []
    currentLength = 0
  }
  for (const paragraph of paragraphs) {
    if (current.length && currentLength + paragraph.length > budget) flush()
    current.push(paragraph)
    currentLength += paragraph.length
  }
  if (current.length) flush()
  return pages
}

export const paginateChapter = (content, budget = PAGE_BUDGET) => {
  if (!content || !String(content).trim()) return ['']
  return looksLikeHtml(content) ? paginateHtml(content, budget) : paginateText(content, budget)
}
