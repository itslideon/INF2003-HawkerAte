import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)
const STORAGE_KEY = 'hawkerate.auth.user'

function nameFromEmail(email) {
  const local = email.split('@')[0] || email
  return local
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      // private browsing etc — just keep it in memory then
    }
  }, [user])

  const signIn = (email, name) => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) return
    const trimmedName = name?.trim()
    setUser({
      customer_id: trimmedEmail.toLowerCase(), // matches Lideon's customer_id
      email: trimmedEmail,
      name: trimmedName || nameFromEmail(trimmedEmail),
    })
  }

  const updateProfile = (updates) => setUser((prev) => (prev ? { ...prev, ...updates } : prev))

  const signOut = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, updateProfile }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
