import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { getStoredCarer, logout as authLogout } from '../lib/auth'
import type { Carer } from '../types'

interface AuthContextType {
  carer: Carer | null
  isLoading: boolean
  login: (carer: Carer) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [carer, setCarer] = useState<Carer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = getStoredCarer()
    setCarer(stored)
    setIsLoading(false)
  }, [])

  const login = useCallback((c: Carer) => {
    setCarer(c)
  }, [])

  const logout = useCallback(() => {
    authLogout()
    setCarer(null)
  }, [])

  return (
    <AuthContext.Provider value={{ carer, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
