/**
 * Client Supabase — utilisé dans toute l'application.
 *
 * On crée le client une seule fois (singleton) et on l'exporte.
 * Les variables d'environnement sont lues depuis .env.local
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl      = import.meta.env.VITE_SUPABASE_URL      as string
const supabaseAnonKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Vérification au démarrage : si les variables manquent, erreur claire
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '❌ Variables Supabase manquantes !\n' +
    'Crée un fichier .env.local avec :\n' +
    'VITE_SUPABASE_URL=...\n' +
    'VITE_SUPABASE_ANON_KEY=...'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
