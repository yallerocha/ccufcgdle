export type Theme = 'light' | 'dark';

export const THEME_COOKIE = 'theme';
export const THEME_STORAGE_KEY = 'theme';

export function isTheme(value: string | null | undefined): value is Theme {
  return value === 'light' || value === 'dark';
}

export const THEME_META_COLORS: Record<Theme, string> = {
  light: '#fafafa',
  dark: '#0a0a0c',
};

export const THEME_BG_COLORS: Record<Theme, string> = {
  light: '#fafafa',
  dark: '#0a0a0c',
};

/** CSS color-scheme with `only` — stops in-app browsers (e.g. WhatsApp) from auto-inverting. */
export function themeColorScheme(theme: Theme): string {
  return theme === 'light' ? 'only light' : 'only dark';
}

/** Apply theme on the client (toggle, hydration sync). */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = themeColorScheme(theme);
  root.style.backgroundColor = THEME_BG_COLORS[theme];
  if (document.body) {
    document.body.style.backgroundColor = THEME_BG_COLORS[theme];
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_META_COLORS[theme]);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.cookie = `${THEME_COOKIE}=${theme};path=/;max-age=31536000;SameSite=Lax`;
  } catch {
    /* private mode / restricted WebView */
  }
}

/** Blocking inline script (layout <head>) — must stay self-contained. */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var K='theme';var html=document.documentElement;var ls=localStorage.getItem(K);var stored=(ls==='light'||ls==='dark')?ls:null;var attr=html.getAttribute('data-theme');var fromAttr=(attr==='light'||attr==='dark')?attr:null;var theme=stored||fromAttr||'dark';var scheme=theme==='light'?'only light':'only dark';var bg=theme==='light'?'#fafafa':'#0a0a0c';html.setAttribute('data-theme',theme);html.style.colorScheme=scheme;html.style.backgroundColor=bg;var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',bg);document.cookie=K+'='+theme+';path=/;max-age=31536000;SameSite=Lax';function paintBody(){if(document.body)document.body.style.backgroundColor=bg;}if(document.body)paintBody();else document.addEventListener('DOMContentLoaded',paintBody);}catch(e){var html=document.documentElement;html.setAttribute('data-theme','dark');html.style.colorScheme='only dark';html.style.backgroundColor='#0a0a0c';}})();`;
