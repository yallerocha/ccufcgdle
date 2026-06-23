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

/** Single active scheme — must match data-theme (not "light dark", which follows the OS). */
export function themeColorScheme(theme: Theme): Theme {
  return theme;
}

function syncColorSchemeMeta(theme: Theme) {
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) meta.setAttribute('content', theme);
}

/** Apply theme on the client (toggle, hydration sync). */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  root.style.backgroundColor = THEME_BG_COLORS[theme];
  if (document.body) {
    document.body.style.backgroundColor = THEME_BG_COLORS[theme];
  }

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) themeColorMeta.setAttribute('content', THEME_META_COLORS[theme]);
  syncColorSchemeMeta(theme);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.cookie = `${THEME_COOKIE}=${theme};path=/;max-age=31536000;SameSite=Lax`;
  } catch {
    /* private mode / restricted storage */
  }
}

/** Blocking inline script (layout <head>) — must stay self-contained. */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var K='theme';var html=document.documentElement;var ls=localStorage.getItem(K);var stored=(ls==='light'||ls==='dark')?ls:null;var attr=html.getAttribute('data-theme');var fromAttr=(attr==='light'||attr==='dark')?attr:null;var theme=stored||fromAttr||'dark';var bg=theme==='light'?'#fafafa':'#0a0a0c';html.setAttribute('data-theme',theme);html.style.colorScheme=theme;html.style.backgroundColor=bg;var tc=document.querySelector('meta[name="theme-color"]');if(tc)tc.setAttribute('content',bg);var cs=document.querySelector('meta[name="color-scheme"]');if(cs)cs.setAttribute('content',theme);document.cookie=K+'='+theme+';path=/;max-age=31536000;SameSite=Lax';function paintBody(){if(document.body)document.body.style.backgroundColor=bg;}if(document.body)paintBody();else document.addEventListener('DOMContentLoaded',paintBody);}catch(e){var h=document.documentElement;h.setAttribute('data-theme','dark');h.style.colorScheme='dark';h.style.backgroundColor='#0a0a0c';}})();`;
