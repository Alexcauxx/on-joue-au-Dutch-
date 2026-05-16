/**
 * useAuth — Gestion de profil local sans dépendance à Supabase Auth.
 * Le profil est stocké entièrement dans localStorage.
 */
import { useState, useEffect } from 'react'

export interface PlayerProfile {
  id: string
  display_name: string
  avatar_color: string
  games_played: number
  games_won: number
  created_at: string
}

const PROFILE_KEY = 'dutch_profile'

function getStoredProfile(): PlayerProfile | null {
  const raw = localStorage.getItem(PROFILE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PlayerProfile
  } catch (error) {
    console.error('[AUTH] Impossible de parser le profil local', error)
    return null
  }
}

function saveProfile(profile: PlayerProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export async function resetAuth() {
  localStorage.removeItem(PROFILE_KEY)
  window.location.reload()
}

export function useAuth() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)

  useEffect(() => {
    console.log('[AUTH] INIT LOCAL PROFILE')
    try {
      const stored = getStoredProfile()
      if (stored) {
        setProfile(stored)
      }
      setLoading(false)
    } catch (error: any) {
      console.error('[AUTH] PROFILE INIT ERROR', error)
      setInitError(error?.message ?? 'Impossible de charger le profil.')
      setLoading(false)
    }
  }, [])

  const signInAnonymously = async (displayName: string, avatarColor = '#d4a853') => {
    const profileData: PlayerProfile = {
      id: crypto.randomUUID(),
      display_name: displayName.trim(),
      avatar_color: avatarColor,
      games_played: 0,
      games_won: 0,
      created_at: new Date().toISOString(),
    }
    saveProfile(profileData)
    setProfile(profileData)
    return profileData
  }

  const sendMagicLink = async () => {
    throw new Error('La connexion par email n’est pas disponible dans cette version.')
  }

  const updateProfile = async (updates: Partial<Pick<PlayerProfile, 'display_name' | 'avatar_color'>>) => {
    if (!profile) return
    const updated = { ...profile, ...updates }
    saveProfile(updated)
    setProfile(updated)
  }

  const recordGameResult = async (won: boolean) => {
    if (!profile) return
    const updated = {
      ...profile,
      games_played: profile.games_played + 1,
      games_won: won ? profile.games_won + 1 : profile.games_won,
    }
    saveProfile(updated)
    setProfile(updated)
  }

  const signOut = async () => {
    localStorage.removeItem(PROFILE_KEY)
    setProfile(null)
  }

  return {
    profile,
    loading,
    initError,
    isAuthenticated: !!profile,
    signInAnonymously,
    sendMagicLink,
    updateProfile,
    recordGameResult,
    signOut,
    resetAuth,
  }
}
