import React, { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "travel-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )
  const { user } = useAuth()

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  // Load user's theme preference from database
  useEffect(() => {
    if (user) {
      loadUserTheme()
    }
  }, [user])

  const loadUserTheme = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('theme_mode')
        .eq('user_id', user?.id)
        .maybeSingle()

      if (data?.theme_mode) {
        setTheme(data.theme_mode as Theme)
        localStorage.setItem(storageKey, data.theme_mode)
      }
    } catch (error) {
      console.error('Erro ao carregar tema do usuário:', error)
    }
  }

  const updateTheme = async (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem(storageKey, newTheme)

    // Update user's theme preference in database
    if (user && newTheme !== "system") {
      try {
        await supabase
          .from('profiles')
          .update({ theme_mode: newTheme })
          .eq('user_id', user.id)
      } catch (error) {
        console.error('Erro ao salvar tema:', error)
      }
    }
  }

  const value = {
    theme,
    setTheme: updateTheme,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}