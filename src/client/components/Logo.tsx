import React from 'react';

/** Theme-specific logo assets in /public. "O Show da Computação" branding — a
 *  gold game-show badge with a terminal (>_) glyph. The badge reads on both
 *  themes; only the wordmark color changes between dark/light variants. */
export const LOGO_PATHS = {
  full: { dark: '/osdc-full-dark.svg', light: '/osdc-full-light.svg' },
  icon: { dark: '/osdc-icon.svg', light: '/osdc-icon.svg' },
  wide: { dark: '/osdc-wide-dark.svg', light: '/osdc-wide-light.svg' },
} as const;

type LogoVariant = keyof typeof LOGO_PATHS;

interface LogoProps {
  variant?: LogoVariant;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

/** Renders the logo matching `data-theme` on `<html>` (dark default). */
export function Logo({
  variant = 'full',
  alt = 'O Show da Computação',
  className = '',
  style,
}: LogoProps) {
  const paths = LOGO_PATHS[variant];
  const cls = ['theme-logo', className].filter(Boolean).join(' ');

  return (
    <>
      <img
        src={paths.dark}
        alt={alt}
        className={`${cls} theme-logo--dark`}
        style={style}
      />
      <img
        src={paths.light}
        alt=""
        aria-hidden
        className={`${cls} theme-logo--light`}
        style={style}
      />
    </>
  );
}
