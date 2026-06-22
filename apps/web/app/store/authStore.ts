'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { api } from '../lib/api'

interface AuthUser {
  id: string
  username: string
  email: string
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      error: null,

      login: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const { token, user } = await api.auth.login(email, password)
          if (typeof window !== 'undefined') {
            localStorage.setItem('mayhero_token', token)
          }
          set({ user, loading: false })
        } catch (e: unknown) {
          set({ loading: false, error: e instanceof Error ? e.message : 'Erro ao entrar.' })
          throw e
        }
      },

      register: async (username, email, password) => {
        set({ loading: true, error: null })
        try {
          const { token, user } = await api.auth.register(username, email, password)
          if (typeof window !== 'undefined') {
            localStorage.setItem('mayhero_token', token)
          }
          set({ user, loading: false })
        } catch (e: unknown) {
          set({ loading: false, error: e instanceof Error ? e.message : 'Erro ao registrar.' })
          throw e
        }
      },

      logout: async () => {
        try {
          await api.auth.logout()
        } catch {
          // Always clear local auth state, even if API call fails.
        }
        if (typeof window !== 'undefined') {
          localStorage.removeItem('mayhero_token')
        }
        set({ user: null })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'mayhero-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user }),
    }
  )
)
