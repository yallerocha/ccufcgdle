import React from 'react';

/** Theme-specific logo assets in /public (replace *-light.png with your light-mode art). */
export const LOGO_PATHS = {
  full: { dark: '/logo-dark.png', light: '/logo-light.png' },
  icon: { dark: '/logo_icone-dark.png', light: '/logo_icone-light.png' },
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
  alt = 'LSD Logo',
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
