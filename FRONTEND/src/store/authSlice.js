import { createSlice } from '@reduxjs/toolkit'
const initialState = { token: localStorage.getItem('sv_token'), user: null, hydrated: false }
const authSlice = createSlice({ name: 'auth', initialState, reducers: { setUser(state, action) { state.user = action.payload; state.hydrated = true }, clearSession(state) { state.token = null; state.user = null; state.hydrated = true; localStorage.removeItem('sv_token'); localStorage.removeItem('sv_refresh_token') } } })
export const { setUser, clearSession } = authSlice.actions
export default authSlice.reducer
