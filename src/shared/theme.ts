export type Theme = 'light' | 'dark';

export const THEME_COOKIE = 'theme';
export const THEME_STORAGE_KEY = 'theme';

export function isTheme(value: string | null | undefined): value is Theme {
  return value === 'light' || value === 'dark';
}

export const THEME_META_COLORS: Record<Theme, string> = {
  light: '#ffffff',
  dark: '#0a0a0c',
};

/** CSS custom properties applied inline so mobile browsers cannot miss html[data-theme] rules. */
export const THEME_CSS_VARS: Record<Theme, Record<string, string>> = {
  dark: {
    '--bg-main': '#0a0a0c',
    '--bg-card': '#121215',
    '--bg-card-hover': '#18181d',
    '--bg-input': '#1a1a20',
    '--footer-bg': '#18181d',
    '--footer-text': '#94a3b8',
    '--modal-gray-bar-bg': '#2e2e36',
    '--text-primary': '#f8fafc',
    '--text-muted': '#94a3b8',
    '--text-dim': '#64748b',
    '--border-color': '#27272a',
    '--color-incorrect': '#27272a',
    '--bg-translucent': 'rgba(10, 10, 12, 0.85)',
    '--bg-board': 'rgba(18, 18, 21, 0.4)',
    '--overlay-bg': 'rgba(0, 0, 0, 0.8)',
    '--row-hover': 'rgba(255, 255, 255, 0.03)',
    '--tile-incorrect-bg': '#1a1a20',
    '--tile-incorrect-text': '#94a3b8',
    '--surface-subtle': 'rgba(255, 255, 255, 0.04)',
    '--tile-label-color': 'rgba(255, 255, 255, 0.65)',
  },
  light: {
    '--bg-main': '#ffffff',
    '--bg-card': '#ffffff',
    '--bg-card-hover': '#f4f4f5',
    '--bg-input': '#f4f4f5',
    '--footer-bg': '#f4f4f5',
    '--footer-text': '#52525b',
    '--modal-gray-bar-bg': '#e4e4e7',
    '--text-primary': '#18181b',
    '--text-muted': '#52525b',
    '--text-dim': '#71717a',
    '--border-color': '#e4e4e7',
    '--color-incorrect': '#e4e4e7',
    '--bg-translucent': 'rgba(255, 255, 255, 0.92)',
    '--bg-board': '#f4f4f5',
    '--overlay-bg': 'rgba(0, 0, 0, 0.45)',
    '--row-hover': 'rgba(0, 0, 0, 0.04)',
    '--tile-incorrect-bg': '#e4e4e7',
    '--tile-incorrect-text': '#52525b',
    '--surface-subtle': 'rgba(0, 0, 0, 0.04)',
    '--tile-label-color': '#71717a',
  },
};

export function applyThemeCssVariables(theme: Theme) {
  const root = document.documentElement;
  const vars = THEME_CSS_VARS[theme];
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

/** Resolve theme on the client: localStorage wins, then cookie, then dark. */
export function readClientTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isTheme(stored)) return stored;
  } catch {
    /* storage blocked */
  }

  const cookieMatch = document.cookie.match(/(?:^|;\s*)theme=(light|dark)/);
  if (cookieMatch && isTheme(cookieMatch[1])) return cookieMatch[1];

  const fromDom = document.documentElement.getAttribute('data-theme');
  if (isTheme(fromDom)) return fromDom;

  return 'dark';
}

function ensureMeta(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

/** Apply theme on the client (toggle, hydration sync). */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;

  root.setAttribute('data-theme', theme);
  root.classList.remove('theme-light', 'theme-dark');
  root.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');
  root.style.colorScheme = theme;

  applyThemeCssVariables(theme);

  ensureMeta('theme-color', THEME_META_COLORS[theme]);
  ensureMeta('color-scheme', theme);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.cookie = `${THEME_COOKIE}=${theme};path=/;max-age=31536000;SameSite=Lax`;
  } catch {
    /* private mode / restricted storage */
  }
}

function buildBootstrapApplyVars(): string {
  return `function applyVars(theme){var V=${JSON.stringify(THEME_CSS_VARS)};var vars=V[theme];for(var k in vars){if(Object.prototype.hasOwnProperty.call(vars,k))html.style.setProperty(k,vars[k]);}}`;
}

/**
 * Blocking inline script (layout <head>, first child).
 * Must stay self-contained — runs before paint and before React hydration.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var K='theme',html=document.documentElement,stored=null,cookie=null,theme='dark';try{var ls=localStorage.getItem(K);stored=(ls==='light'||ls==='dark')?ls:null;}catch(e1){}var cm=document.cookie.match(/(?:^|;\\s*)theme=(light|dark)/);if(cm)cookie=cm[1];theme=stored||cookie||'dark';${buildBootstrapApplyVars()};html.setAttribute('data-theme',theme);html.classList.remove('theme-light','theme-dark');html.classList.add(theme==='light'?'theme-light':'theme-dark');html.style.colorScheme=theme;applyVars(theme);function meta(n,v){var el=document.querySelector('meta[name="'+n+'"]');if(!el){el=document.createElement('meta');el.setAttribute('name',n);document.head.appendChild(el);}el.setAttribute('content',v);}meta('theme-color',theme==='light'?'#ffffff':'#0a0a0c');meta('color-scheme',theme);document.cookie=K+'='+theme+';path=/;max-age=31536000;SameSite=Lax';}catch(e2){html=document.documentElement;html.setAttribute('data-theme','dark');html.classList.add('theme-dark');html.style.colorScheme='dark';}})();`;
