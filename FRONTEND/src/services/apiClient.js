const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082/api'

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password']

export class ApiError extends Error {
  constructor(status, message, payload) { super(message); this.status = status; this.payload = payload }
}

export async function apiClient(path, options = {}) {
  const token = localStorage.getItem('sv_token')
  let body = options.body
  if (typeof body === 'string' && (path === '/auth/login' || path === '/auth/register')) {
    const payload = JSON.parse(body)
    body = JSON.stringify(path === '/auth/login' ? { email: payload.email || payload.usernameOrEmail, password: payload.password } : { ...payload, role: payload.role || 'USER' })
  }
  const headers = { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, body, headers })
  const text = await response.text()
  let payload
  try { payload = text ? JSON.parse(text) : null } catch { payload = { message: text } }
  if (path.startsWith('/books/') && path.endsWith('/chapters') && Array.isArray(payload)) payload = payload.map(chapter => ({ ...chapter, title: chapter.title || chapter.chapterTitle, content: chapter.content || chapter.chapterContent }))
  if (path === '/admin/dashboard' && payload) payload = { ...payload, totalUsers: payload.totalUsers ?? payload.users, totalBooks: payload.totalBooks ?? payload.books, totalReviews: payload.totalReviews ?? payload.reviews }
  if (response.status === 401 && !AUTH_PATHS.some(authPath => window.location.pathname.startsWith(authPath))) {
    clearAuth()
    if (window.location.pathname !== '/login') window.location.replace('/login')
  }
  if (!response.ok) throw new ApiError(response.status, payload?.message || payload?.error || `Request failed (${response.status})`, payload)
  return payload
}

export function saveAuth(response) { if (response?.accessToken) localStorage.setItem('sv_token', response.accessToken); if (response?.refreshToken) localStorage.setItem('sv_refresh_token', response.refreshToken); return response }
export function clearAuth() { localStorage.removeItem('sv_token'); localStorage.removeItem('sv_refresh_token') }
export { API_BASE_URL }
