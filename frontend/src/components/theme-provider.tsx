import { createContext, useContext, useEffect, useState } from "react"

// Available theme options
type Theme = "dark" | "light" | "system"

// Props for ThemeProvider component
type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

// State structure for theme context
type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

// Initial state for theme context
const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

// React context for theme management
const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

// Theme provider component that manages theme state and applies CSS classes
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  // Initialize theme from localStorage or use default
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  // Apply theme changes to document root element
  useEffect(() => {
    const root = window.document.documentElement

    // Remove existing theme classes
    root.classList.remove("light", "dark")

    // Handle system theme preference
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    // Apply selected theme
    root.classList.add(theme)
  }, [theme])

  // Context value with theme state and setter
  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

// Hook to access theme context
export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}