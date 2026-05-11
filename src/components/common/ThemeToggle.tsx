import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      dir="ltr"
      onClick={toggleTheme}
      className={`relative inline-flex h-[34px] w-16 items-center rounded-full border border-dark-700 bg-dark-900 p-1 text-dark-500 shadow-sm transition-all duration-300 hover:border-dark-600 focus:outline-none focus:ring-2 focus:ring-astro-500/20 ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      aria-pressed={isDark}
    >
      <span
        className={`absolute left-1 top-1 h-[26px] w-[26px] rounded-full bg-mono-button shadow-md transition-transform duration-300 ease-out ${
          isDark ? 'translate-x-[30px]' : 'translate-x-0'
        }`}
        aria-hidden="true"
      />
      <span
        className={`relative z-10 flex h-[26px] w-[26px] items-center justify-center rounded-full transition-colors ${
          !isDark ? 'text-mono-buttonText' : 'text-dark-500'
        }`}
      >
        <Sun className="h-3.5 w-3.5" />
      </span>
      <span
        className={`relative z-10 ms-[4px] flex h-[26px] w-[26px] items-center justify-center rounded-full transition-colors ${
          isDark ? 'text-mono-buttonText' : 'text-dark-500'
        }`}
      >
        <Moon className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}
