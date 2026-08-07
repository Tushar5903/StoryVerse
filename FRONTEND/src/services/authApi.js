import { apiClient, saveAuth, clearAuth } from './apiClient'
export const sendRegistrationOtp = payload => apiClient('/auth/register/send-otp', { method: 'POST', body: JSON.stringify({ ...payload, role: payload.role || 'USER' }) })
export const verifyRegistrationOtp = payload => apiClient('/auth/register/verify', { method: 'POST', body: JSON.stringify(payload) }).then(saveAuth)
export const login = payload => apiClient('/auth/login', { method: 'POST', body: JSON.stringify(payload) }).then(saveAuth)
export const forgotPassword = email => apiClient('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })
export const logout = refreshToken => apiClient('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }).finally(clearAuth)
