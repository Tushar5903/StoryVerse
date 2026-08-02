import { apiClient } from './apiClient'
export const getMe = () => apiClient('/users/me')
export const getUser = id => apiClient(`/users/${id}`)
export const updateMe = (payload, image) => { const body = new FormData(); Object.entries(payload).forEach(([key, value]) => value != null && body.append(key, value)); if (image) body.append('image', image); return apiClient('/users/me', { method: 'PUT', body }) }
