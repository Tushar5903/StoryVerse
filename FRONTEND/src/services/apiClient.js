import { requestBus } from './requestBus'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082/api'

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password']

export class ApiError extends Error {
  constructor(status, message, payload) { super(message); this.status = status; this.payload = payload }
}

async function refreshAuth() {
  const refreshToken = localStorage.getItem('sv_refresh_token')
  if (!refreshToken) return false
  requestBus.start()
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!response.ok) return false
    const payload = await response.json()
    saveAuth(payload)
    return true
  } catch {
    return false
  } finally {
    requestBus.end()
  }
}

export async function apiClient(path, options = {}, retried = false) {
  const token = localStorage.getItem('sv_token')
  let body = options.body
  if (typeof body === 'string' && path === '/auth/login') {
    const payload = JSON.parse(body)
    body = JSON.stringify({ email: payload.email || payload.usernameOrEmail, password: payload.password })
  }
  const headers = { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
  requestBus.start()
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, body, headers })
    const text = await response.text()
    let payload
    try { payload = text ? JSON.parse(text) : null } catch { payload = { message: text } }
    if (path.startsWith('/books/') && path.endsWith('/chapters') && Array.isArray(payload)) payload = payload.map(chapter => ({ ...chapter, title: chapter.title || chapter.chapterTitle, content: chapter.content || chapter.chapterContent }))
    if (path === '/admin/dashboard' && payload) payload = { ...payload, totalUsers: payload.totalUsers ?? payload.users, totalBooks: payload.totalBooks ?? payload.books, totalReviews: payload.totalReviews ?? payload.reviews }
    if (response.status === 401 && !retried && path !== '/auth/refresh' && !AUTH_PATHS.some(authPath => window.location.pathname.startsWith(authPath))) {
      if (await refreshAuth()) return apiClient(path, options, true)
      clearAuth()
      if (window.location.pathname !== '/login') window.location.replace('/login')
    }
    if (!response.ok) throw new ApiError(response.status, payload?.message || payload?.error || `Request failed (${response.status})`, payload)
    return payload
  } finally {
    requestBus.end()
  }
}

export function saveAuth(response) { if (response?.accessToken) localStorage.setItem('sv_token', response.accessToken); if (response?.refreshToken) localStorage.setItem('sv_refresh_token', response.refreshToken); return response }
export function clearAuth() { localStorage.removeItem('sv_token'); localStorage.removeItem('sv_refresh_token') }
export { API_BASE_URL }