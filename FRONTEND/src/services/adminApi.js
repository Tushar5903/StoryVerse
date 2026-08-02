import { apiClient } from './apiClient'
export const getDashboard = () => apiClient('/admin/dashboard')
export const listAllBooks = query => apiClient(`/admin/books${query || ''}`)
export const listAllUsers = query => apiClient(`/admin/users${query || ''}`)
export const listAllAuthors = query => apiClient(`/admin/authors${query || ''}`)
