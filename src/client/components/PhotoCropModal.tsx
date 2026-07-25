'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Crop, X, Check, ZoomIn, ZoomOut } from 'lucide-react';
import { squareCropToDataUrl, loadImageFromFile, cropGeometry } from '@/client/lib/image';
import { ModalColorBar } from '@/client/components/ModalColorBar';
import { useModalDismiss } from '@/client/hooks/useModalDismiss';

// The cropper follows the conventional pattern (Instagram/react-easy-crop): the
// whole photo stays visible on a dark stage, dimmed outside a bright crop window,
// and is dragged/zoomed under it. Position is stored as the normalized image point
// pinned to the centre of that window, so it survives a resize of the window
// itself — the window is measured, never assumed, which keeps what you see on a
// phone identical to what gets exported.
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;
const KEY_PAN_PX = 12;

interface PhotoCropModalProps {
  file: File | null;
  onConfirm: (dataUrl: string) => void;
  onClose: () => void;
  /** Viewport shape: circle for avatars (default), square for note images. */
  shape?: 'circle' | 'square';
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function PhotoCropModal({ file, onConfirm, onClose, shape = 'circle' }: PhotoCropModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  // null = untouched, so the photo opens filling the whole stage (see fillZoom).
  const [zoom, setZoom] = useState<number | null>(null);
  const [center, setCenter] = useState({ x: 0.5, y: 0.5 });
  const [cropSize, setCropSize] = useState(0);
  const [stageSize, setStageSize] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  // Live pointers, so one finger pans and two fingers pinch-zoom.
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!file) {
      setImage(null);
      setPreviewUrl('');
      setError('');
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');
    loadImageFromFile(file)
      .then(({ image: img, objectUrl }) => {
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = objectUrl;
        setPreviewUrl(objectUrl);
        setZoom(null);
        setCenter({ x: 0.5, y: 0.5 });
        setImage(img);
      })
      .catch(() => {
        if (!cancelled) setError(t('photo.cropLoadError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [file, t]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  // Both boxes are sized by CSS (they shrink on narrow phones). Measuring the
  // crop window keeps the exported crop in sync with the preview; measuring the
  // stage is what lets the photo open filling it.
  useEffect(() => {
    const frame = frameRef.current;
    const stage = stageRef.current;
    if (!frame || !stage) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const setter = entry.target === frame ? setCropSize : setStageSize;
        setter(entry.contentRect.width);
      }
    });
    observer.observe(frame);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [image]);

  // Opening zoomed to cover the stage leaves no dead space around the photo; the
  // slider still goes down to MIN_ZOOM, where the largest possible square fits.
  const fillZoom = cropSize ? clamp(stageSize / cropSize, MIN_ZOOM, MAX_ZOOM) : MIN_ZOOM;
  const currentZoom = zoom ?? fillZoom;

  // Wheel zoom needs a non-passive listener to keep the modal from scrolling.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => clamp((z ?? fillZoom) * (1 - e.deltaY * 0.0015), MIN_ZOOM, MAX_ZOOM));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [image, fillZoom]);

  const { scale, renderedW, renderedH, panX, panY } = cropGeometry(
    image?.naturalWidth ?? 0,
    image?.naturalHeight ?? 0,
    cropSize,
    currentZoom,
    center.x,
    center.y,
  );

  // Pan from the clamped position, so dragging into an edge stops there instead
  // of building up slack that has to be dragged back.
  const panBy = (dx: number, dy: number) => {
    if (!renderedW || !renderedH) return;
    setCenter({
      x: (cropSize / 2 - panX) / renderedW - dx / renderedW,
      y: (cropSize / 2 - panY) / renderedH - dy / renderedH,
    });
  };

  const zoomBy = (delta: number) => setZoom((z) => clamp((z ?? fillZoom) + delta, MIN_ZOOM, MAX_ZOOM));

  const pointerDistance = () => {
    const [a, b] = [...pointersRef.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!image) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) pinchRef.current = { dist: pointerDistance(), zoom: currentZoom };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointersRef.current.get(e.pointerId);
    if (!prev || !image) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const ratio = pointerDistance() / pinchRef.current.dist;
      setZoom(clamp(pinchRef.current.zoom * ratio, MIN_ZOOM, MAX_ZOOM));
      return;
    }
    panBy(e.clientX - prev.x, e.clientY - prev.y);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Arrows nudge the framing, +/- zoom: the drag surface stays usable without a
  // pointing device.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const pan: Record<string, [number, number]> = {
      ArrowLeft: [KEY_PAN_PX, 0],
      ArrowRight: [-KEY_PAN_PX, 0],
      ArrowUp: [0, KEY_PAN_PX],
      ArrowDown: [0, -KEY_PAN_PX],
    };
    if (pan[e.key]) {
      e.preventDefault();
      panBy(...pan[e.key]);
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      zoomBy(ZOOM_STEP);
    } else if (e.key === '-') {
      e.preventDefault();
      zoomBy(-ZOOM_STEP);
    }
  };

  const handleConfirm = () => {
    if (!image || !cropSize) return;
    onConfirm(squareCropToDataUrl(image, scale, panX, panY, cropSize));
  };

  useModalDismiss(Boolean(file), onClose);

  if (!mounted || !file) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content photo-crop-modal modal-has-bottom-bar" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-body">
          <h2 className="modal-title photo-crop-title">
            <Crop size={22} style={{ color: 'var(--gold)' }} /> {t('photo.cropTitle')}
          </h2>
          <p className="modal-subtitle">{t('photo.cropHint')}</p>

          {loading ? (
            <p className="photo-crop-status">{t('photo.cropLoading')}</p>
          ) : error ? (
            <p className="photo-crop-status photo-crop-status--error">{error}</p>
          ) : image ? (
            <>
              <div
                ref={stageRef}
                className="photo-crop-stage"
                role="group"
                aria-label={t('photo.cropStageAria')}
                tabIndex={0}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={onKeyDown}
              >
                <div ref={frameRef} className="photo-crop-frame">
                  <img
                    src={previewUrl}
                    alt=""
                    draggable={false}
                    style={{ width: `${renderedW}px`, height: `${renderedH}px`, transform: `translate(${panX}px, ${panY}px)` }}
                  />
                </div>
                <div className={`photo-crop-mask photo-crop-mask--${shape}`} aria-hidden="true" />
              </div>

              <div className="photo-crop-zoom">
                <button type="button" className="btn btn-secondary" onClick={() => zoomBy(-ZOOM_STEP)} disabled={currentZoom <= MIN_ZOOM} aria-label={t('photo.cropZoomOut')}>
                  <ZoomOut size={16} />
                </button>
                <input
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step={0.01}
                  value={currentZoom}
                  aria-label={t('photo.cropZoom')}
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
                <button type="button" className="btn btn-secondary" onClick={() => zoomBy(ZOOM_STEP)} disabled={currentZoom >= MAX_ZOOM} aria-label={t('photo.cropZoomIn')}>
                  <ZoomIn size={16} />
                </button>
              </div>
            </>
          ) : null}

          <div className="photo-crop-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              <X size={18} /> {t('photo.cropCancel')}
            </button>
            <button type="button" className="btn" onClick={handleConfirm} disabled={!image || loading || !!error}>
              <Check size={18} /> {t('photo.cropConfirm')}
            </button>
          </div>
        </div>
        <ModalColorBar />
      </div>
    </div>,
    document.body,
  );
}
