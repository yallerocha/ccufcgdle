'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface BackLinkProps {
  href: string;
  label: string;
  /** Optional margin override for the wrapper (defaults to '0 0 0.5rem 0'). */
  style?: React.CSSProperties;
}

/** Standard "back to ..." button used at the top of every inner page. */
export function BackLink({ href, label, style }: BackLinkProps) {
  return (
    <div style={{ margin: '0 0 0.5rem 0', ...style }}>
      <Link
        href={href}
        className="btn btn-secondary"
        style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', textDecoration: 'none' }}
      >
        <ArrowLeft size={16} /> {label}
      </Link>
    </div>
  );
}
