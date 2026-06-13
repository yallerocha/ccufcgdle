'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layers } from 'lucide-react';
import { AREA_OPTIONS, MAX_AREAS_PER_USER } from '@/shared/validation';

interface AreaPickerProps {
  selected: string[];
  onChange: (areas: string[]) => void;
}

export function AreaPicker({ selected, onChange }: AreaPickerProps) {
  const { t } = useTranslation();

  const toggleArea = (area: string) => {
    onChange(
      selected.includes(area)
        ? selected.filter((a) => a !== area)
        : selected.length >= MAX_AREAS_PER_USER
          ? selected
          : [...selected, area]
    );
  };

  return (
    <div className="area-picker">
      <div className="checkbox-group">
        {AREA_OPTIONS.map((opt) => (
          <label key={opt} className={`checkbox-chip ${selected.includes(opt) ? 'selected' : ''}`}>
            <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggleArea(opt)} />
            {opt}
          </label>
        ))}
      </div>
      <p className="area-picker-hint">
        <Layers size={13} aria-hidden="true" />
        {t('areas.hint')}
      </p>
      {selected.length >= MAX_AREAS_PER_USER && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginTop: '0.35rem' }}>
          {t('areas.maxSelected', { max: MAX_AREAS_PER_USER })}
        </span>
      )}
    </div>
  );
}
