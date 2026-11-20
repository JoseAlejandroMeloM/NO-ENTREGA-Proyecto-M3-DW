import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { currentLang, currentTheme, setLang, setTheme } from '../i18n/preferences';

/** Language (EN/ES) and light/dark switches, shown in the app top bar and on public pages. */
export default function PreferenceToggles({ onDark = false }: { onDark?: boolean }) {
  const [lang, setLangState] = useState(currentLang);
  const [theme, setThemeState] = useState(currentTheme);
  const style = `grid h-9 min-w-9 place-items-center rounded-lg px-2 text-xs font-semibold transition-colors ${
    onDark ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'
  }`;
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className={style}
        // Names the other language in its own words (neither text is in the dictionary).
        aria-label={lang === 'en' ? 'Ver en español' : 'View in English'}
        onClick={() => {
          const next = lang === 'en' ? 'es' : 'en';
          setLang(next);
          setLangState(next);
        }}
      >
        {lang === 'en' ? 'ES' : 'EN'}
      </button>
      <button
        type="button"
        className={style}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-pressed={theme === 'dark'}
        onClick={() => {
          const next = theme === 'dark' ? 'light' : 'dark';
          setTheme(next);
          setThemeState(next);
        }}
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
