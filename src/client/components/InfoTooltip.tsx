'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

interface InfoTooltipProps {
  /** Text shown inside the tooltip bubble. */
  text: string;
  /** Accessible label for the trigger button. */
  label?: string;
}

/**
 * Small question-mark circle that reveals an explanatory bubble on hover
 * (desktop) or tap (touch devices). The bubble is rendered through a portal
 * with fixed positioning so it is never clipped by scrollable ancestors
 * (e.g. the horizontally-scrolling game board).
 */
export function InfoTooltip({ text, label }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipId = useId();

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
  };

  const show = () => {
    updatePosition();
    setOpen(true);
  };
  const hide = () => setOpen(false);
  const toggle = () => (open ? hide() : show());

  // Reposition while open (scroll/resize) and close when clicking elsewhere.
  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => updatePosition();
    const onPointerDown = (e: PointerEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        hide();
      }
    };
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="info-tooltip-trigger"
        aria-label={label || text}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
      >
        <HelpCircle size={14} />
      </button>

      {open &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <span
            id={tooltipId}
            role="tooltip"
            className="info-tooltip-bubble"
            style={{ top: coords.top, left: coords.left }}
          >
            {text}
          </span>,
          document.body
        )}
    </>
  );
}
