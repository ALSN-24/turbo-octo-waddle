'use client'

/**
 * components/theme-toggle.tsx
 *
 * Three-way theme switcher: Light · Dark · System (auto).
 *
 * Uses next-themes under the hood — the selected preference is persisted in
 * localStorage so it survives page reloads. "System" means the app follows
 * the OS dark/light preference via the `prefers-color-scheme` media query.
 *
 * The toggle is a compact segmented control that fits naturally in the
 * sidebar footer without needing a dropdown or extra click.
 */

import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSyncExternalStore } from 'react'

const options = [
  { value: 'light',  Icon: Sun,     label: 'Light'  },
  { value: 'dark',   Icon: Moon,    label: 'Dark'   },
  { value: 'system', Icon: Monitor, label: 'System' },
] as const

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  // next-themes renders on the server without knowing the theme — avoid
  // hydration mismatch by only rendering the active state after mount.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  return (
    <div
      className={cn(
        'flex items-center rounded-md border border-sidebar-border bg-sidebar p-0.5',
        className,
      )}
      role="group"
      aria-label="Theme"
    >
      {options.map(({ value, Icon, label }) => {
        const active = mounted && theme === value
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            title={label}
            aria-pressed={active}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium transition-colors',
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                : 'text-sidebar-foreground/50 hover:text-sidebar-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
