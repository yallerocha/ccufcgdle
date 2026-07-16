'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, Info, AlertCircle } from 'lucide-react';

type ToastType = 'info' | 'success' | 'error';

interface ToastProps {
  message: string;
  type?: ToastType;
  // Called when the toast auto-dismisses, so the parent can clear its message.
  onClose?: () => void;
  // Auto-dismiss delay in ms.
  duration?: number;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  info: <Info size={18} />,
  success: <CheckCircle size={18} />,
  error: <AlertCircle size={18} />,
};

// Fixed pop-up notification anchored to the top of the screen. Rendered through
// a portal on <body> so it floats above the victory modal overlay. When given an
// `onClose`, it auto-dismisses after `duration`.
export function Toast({ message, type = 'info', onClose, duration = 4000 }: ToastProps) {
  const [mounted, setMounted] = useState(false);

  // Keep the latest onClose without resetting the dismiss timer on every render.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => closeRef.current?.(), duration);
    return () => clearTimeout(id);
  }, [message, duration]);

  if (!mounted || !message) return null;

  // Errors interrupt the screen reader (assertive); info/success wait politely.
  const isError = type === 'error';

  return createPortal(
    <div className="toast-container">
      <div
        className={`toast toast-${type}`}
        role={isError ? 'alert' : 'status'}
        aria-live={isError ? 'assertive' : 'polite'}
        onClick={() => closeRef.current?.()}
      >
        {ICONS[type]}
        <span>{message}</span>
      </div>
    </div>,
    document.body
  );
}
