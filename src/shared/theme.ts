export type Theme = 'light' | 'dark';

export const THEME_COOKIE = 'theme';
export const THEME_STORAGE_KEY = 'theme';
export const THEME_BROWSER_DARK_OVERRIDE_ID = 'theme-browser-dark-override';

export function isTheme(value: string | null | undefined): value is Theme {
  return value === 'light' || value === 'dark';
}

export const THEME_META_COLORS: Record<Theme, string> = {
  light: '#ffffff',
  dark: '#0a0a0c',
};

/**
 * `only light` opts out of Chrome/Samsung "Auto Dark Theme" when the browser UI is dark.
 * @see https://developer.chrome.com/blog/auto-dark-theme
 */
export const THEME_COLOR_SCHEME: Record<Theme, string> = {
  light: 'only light',
  dark: 'dark',
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

/**
 * Injected when site theme is light but the browser UI is dark (prefers-color-scheme: dark).
 * Chrome/Samsung apply algorithmic darkening on toggle unless every subtree opts out.
 */
export const THEME_BROWSER_DARK_OVERRIDE_CSS = `
@media (prefers-color-scheme: dark) {
  html[data-theme="light"],
  html.theme-light,
  html[data-theme="light"] *,
  html.theme-light * {
    color-scheme: only light !important;
    forced-color-adjust: none !important;
  }
  html[data-theme="light"],
  html.theme-light {
    filter: none !important;
    -webkit-filter: none !important;
    background-color: #ffffff !important;
    color: #18181b !important;
  }
  html[data-theme="light"] body,
  html.theme-light body {
    background-color: #ffffff !important;
    color: #18181b !important;
  }
}
`.trim();

/**
 * Minimal theme CSS inlined in <head> before globals.css.
 */
export const THEME_CRITICAL_CSS = `
html,body{margin:0;min-height:100%}
html[data-theme="dark"],html:not([data-theme="light"]){color-scheme:dark;background-color:#0a0a0c;color:#f8fafc}
html[data-theme="light"],html.theme-light,html[data-theme="light"] *,html.theme-light *{color-scheme:only light}
html[data-theme="light"],html.theme-light{background-color:#fff;color:#18181b;forced-color-adjust:none}
@media (prefers-color-scheme:dark){
  html[data-theme="light"],html.theme-light,html[data-theme="light"] *,html.theme-light *{color-scheme:only light!important;forced-color-adjust:none!important}
  html[data-theme="light"],html.theme-light{filter:none!important;-webkit-filter:none!important;background-color:#fff!important;color:#18181b!important}
}
`.trim();

export function applyThemeCssVariables(theme: Theme) {
  const root = document.documentElement;
  const vars = THEME_CSS_VARS[theme];
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

export function syncBrowserDarkOverride(theme: Theme) {
  const existing = document.getElementById(THEME_BROWSER_DARK_OVERRIDE_ID);
  if (theme === 'light') {
    const style = existing ?? document.createElement('style');
    style.id = THEME_BROWSER_DARK_OVERRIDE_ID;
    style.textContent = THEME_BROWSER_DARK_OVERRIDE_CSS;
    if (!existing) document.head.appendChild(style);
  } else if (existing) {
    existing.remove();
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
  const scheme = THEME_COLOR_SCHEME[theme];

  root.setAttribute('data-theme', theme);
  root.classList.remove('theme-light', 'theme-dark');
  root.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');
  root.style.colorScheme = scheme;

  applyThemeCssVariables(theme);
  syncBrowserDarkOverride(theme);

  if (document.body) {
    document.body.style.colorScheme = scheme;
    if (theme === 'light') {
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#18181b';
      document.body.style.filter = 'none';
    } else {
      document.body.style.removeProperty('background-color');
      document.body.style.removeProperty('color');
      document.body.style.removeProperty('filter');
    }
  }

  ensureMeta('theme-color', THEME_META_COLORS[theme]);
  ensureMeta('color-scheme', scheme);

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

function buildBootstrapSchemes(): string {
  return JSON.stringify(THEME_COLOR_SCHEME);
}

function buildBootstrapOverrideCss(): string {
  return JSON.stringify(THEME_BROWSER_DARK_OVERRIDE_CSS);
}

/**
 * Blocking inline script (layout <head>, first child).
 * Must stay self-contained — runs before paint and before React hydration.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var K='theme',html=document.documentElement,stored=null,cookie=null,theme='dark',SC=${buildBootstrapSchemes()},OVERRIDE_CSS=${buildBootstrapOverrideCss()};try{var ls=localStorage.getItem(K);stored=(ls==='light'||ls==='dark')?ls:null;}catch(e1){}var cm=document.cookie.match(/(?:^|;\\s*)theme=(light|dark)/);if(cm)cookie=cm[1];theme=stored||cookie||'dark';${buildBootstrapApplyVars()};var scheme=SC[theme]||'dark';html.setAttribute('data-theme',theme);html.classList.remove('theme-light','theme-dark');html.classList.add(theme==='light'?'theme-light':'theme-dark');html.style.colorScheme=scheme;applyVars(theme);function meta(n,v){var el=document.querySelector('meta[name="'+n+'"]');if(!el){el=document.createElement('meta');el.setAttribute('name',n);document.head.appendChild(el);}el.setAttribute('content',v);}meta('theme-color',theme==='light'?'#ffffff':'#0a0a0c');meta('color-scheme',scheme);if(theme==='light'){var s=document.getElementById('theme-browser-dark-override')||document.createElement('style');s.id='theme-browser-dark-override';s.textContent=OVERRIDE_CSS;if(!s.parentNode)document.head.appendChild(s);}else{var o=document.getElementById('theme-browser-dark-override');if(o)o.remove();}document.cookie=K+'='+theme+';path=/;max-age=31536000;SameSite=Lax';function paintBody(){if(!document.body)return;if(theme==='light'){document.body.style.colorScheme=scheme;document.body.style.backgroundColor='#ffffff';document.body.style.color='#18181b';document.body.style.filter='none';}else{document.body.style.colorScheme=scheme;document.body.style.removeProperty('background-color');document.body.style.removeProperty('color');document.body.style.removeProperty('filter');}}paintBody();document.addEventListener('DOMContentLoaded',paintBody);}catch(e2){var h=document.documentElement;h.setAttribute('data-theme','dark');h.classList.add('theme-dark');h.style.colorScheme='dark';}})();`;
