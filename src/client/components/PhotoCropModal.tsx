'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Crop, X, Check } from 'lucide-react';
import { squareCropToDataUrl, loadImageFromFile } from '@/client/lib/image';

const CROP_SIZE = 280;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

interface PhotoCropModalProps {
  file: File | null;
  onConfirm: (dataUrl: string) => void;
  onClose: () => void;
}

function clampPan(
  panX: number,
  panY: number,
  imgW: number,
  imgH: number,
  scale: number,
): { x: number; y: number } {
  const renderedW = imgW * scale;
  const renderedH = imgH * scale;
  const minX = CROP_SIZE - renderedW;
  const minY = CROP_SIZE - renderedH;
  const maxX = 0;
  const maxY = 0;
  return {
    x: Math.min(maxX, Math.max(minX, panX)),
    y: Math.min(maxY, Math.max(minY, panY)),
  };
}

export function PhotoCropModal({ file, onConfirm, onClose }: PhotoCropModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [baseScale, setBaseScale] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const objectUrlRef = useRef<string | null>(null);

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
        const coverScale = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
        setBaseScale(coverScale);
        setZoom(MIN_ZOOM);
        const renderedW = img.naturalWidth * coverScale;
        const renderedH = img.naturalHeight * coverScale;
        setPan({
          x: (CROP_SIZE - renderedW) / 2,
          y: (CROP_SIZE - renderedH) / 2,
        });
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

  const scale = baseScale * zoom;

  const applyPan = useCallback(
    (nextPan: { x: number; y: number }) => {
      if (!image) return;
      setPan(clampPan(nextPan.x, nextPan.y, image.naturalWidth, image.naturalHeight, scale));
    },
    [image, scale],
  );

  const handleZoomChange = (nextZoom: number) => {
    if (!image) {
      setZoom(nextZoom);
      return;
    }

    const prevScale = baseScale * zoom;
    const nextScale = baseScale * nextZoom;
    const centerX = CROP_SIZE / 2;
    const centerY = CROP_SIZE / 2;

    setPan((currentPan) =>
      clampPan(
        centerX - (centerX - currentPan.x) * (nextScale / prevScale),
        centerY - (centerY - currentPan.y) * (nextScale / prevScale),
        image.naturalWidth,
        image.naturalHeight,
        nextScale,
      ),
    );
    setZoom(nextZoom);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!image) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !image) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    applyPan({
      x: dragRef.current.panX + dx,
      y: dragRef.current.panY + dy,
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleConfirm = () => {
    if (!image) return;
    const dataUrl = squareCropToDataUrl(image, scale, pan.x, pan.y, CROP_SIZE);
    onConfirm(dataUrl);
  };

  if (!mounted || !file) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content photo-crop-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Crop size={22} style={{ color: 'var(--primary)' }} /> {t('photo.cropTitle')}
        </h2>
        <p className="modal-subtitle">{t('photo.cropHint')}</p>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>{t('photo.cropLoading')}</p>
        ) : error ? (
          <p style={{ textAlign: 'center', color: '#ef4444', padding: '1rem 0' }}>{error}</p>
        ) : image ? (
          <div className="photo-crop-workspace">
            <div
              className="photo-crop-viewport"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <img
                src={previewUrl}
                alt=""
                draggable={false}
                style={{
                  width: `${image.naturalWidth * scale}px`,
                  height: `${image.naturalHeight * scale}px`,
                  transform: `translate(${pan.x}px, ${pan.y}px)`,
                }}
              />
            </div>

            <label className="photo-crop-zoom-label">
              <span>{t('photo.cropZoom')}</span>
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.01}
                value={zoom}
                onChange={(e) => handleZoomChange(Number(e.target.value))}
              />
            </label>
          </div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
          <button type="button" className="btn" style={{ width: '100%' }} onClick={handleConfirm} disabled={!image || loading || !!error}>
            <Check size={18} /> {t('photo.cropConfirm')}
          </button>
          <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={onClose}>
            <X size={18} /> {t('photo.cropCancel')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
