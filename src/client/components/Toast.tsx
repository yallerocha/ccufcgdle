'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, Info, AlertCircle } from 'lucide-react';

type ToastType = 'info' | 'success' | 'error';

interface ToastProps {
  message: string;
  type?: ToastType;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  info: <Info size={18} />,
  success: <CheckCircle size={18} />,
  error: <AlertCircle size={18} />,
};

// Fixed pop-up notification anchored to the top of the screen. Rendered through
// a portal on <body> so it floats above the victory modal overlay.
export function Toast({ message, type = 'info' }: ToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !message) return null;

  return createPortal(
    <div className="toast-container">
      <div className={`toast toast-${type}`} role="status" aria-live="polite">
        {ICONS[type]}
        <span>{message}</span>
      </div>
    </div>,
    document.body
  );
}
