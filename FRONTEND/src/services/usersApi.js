import { apiClient } from './apiClient'

let meCache = { token: null, promise: null }

export const getMe = () => {
  const token = localStorage.getItem('sv_token')
  if (meCache.token === token && meCache.promise) return meCache.promise
  meCache = {
    token,
    promise: apiClient('/users/me').catch(error => {
      meCache = { token: null, promise: null }
      throw error
    }),
  }
  return meCache.promise
}

export const getUser = id => apiClient(`/users/${id}`)
export const updateMe = (payload, image) => { const body = new FormData(); Object.entries(payload).forEach(([key, value]) => value != null && body.append(key, value)); if (image) body.append('image', image); return apiClient('/users/me', { method: 'PUT', body }) }
