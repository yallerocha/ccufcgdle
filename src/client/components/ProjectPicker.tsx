'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Users } from 'lucide-react';
import { apiFetch } from '@/client/lib/api';

export interface ProjectEntry {
  id: string;
  name: string;
  memberCount: number;
}

interface ProjectPickerProps {
  selected: string[];
  onChange: (projects: string[]) => void;
  /** Projects already saved on the server (used to adjust counts on draft toggles). */
  savedProjects?: string[];
  /** When false, only existing catalog entries can be toggled (e.g. registration). */
  allowCreate?: boolean;
}

function displayMemberCount(
  project: ProjectEntry,
  selected: string[],
  savedProjects: string[]
): number {
  const wasSaved = savedProjects.includes(project.name);
  const isSelected = selected.includes(project.name);
  let count = project.memberCount;
  if (isSelected && !wasSaved) count += 1;
  if (!isSelected && wasSaved) count -= 1;
  return Math.max(0, count);
}

function normalizeSearch(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function ProjectPicker({
  selected,
  onChange,
  savedProjects = [],
  allowCreate = true,
}: ProjectPickerProps) {
  const { t } = useTranslation();
  const [catalog, setCatalog] = useState<ProjectEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadProjects = useCallback(async () => {
    setLoadError('');
    try {
      const res = await apiFetch('/api/game/projects');
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error || t('projects.loadError'));
        return;
      }
      setCatalog(data.projects ?? []);
    } catch (err) {
      console.error('Error loading projects:', err);
      setLoadError(t('projects.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const filteredCatalog = useMemo(() => {
    const q = normalizeSearch(searchQuery.trim());
    if (!q) return catalog;
    const matching = catalog.filter((p) => normalizeSearch(p.name).includes(q));
    const selectedHidden = catalog.filter(
      (p) => selected.includes(p.name) && !matching.some((m) => m.id === p.id)
    );
    return [...selectedHidden, ...matching];
  }, [catalog, searchQuery, selected]);

  const toggleProject = (name: string) => {
    onChange(selected.includes(name) ? [] : [name]);
  };

  const handleAddProject = async () => {
    const trimmed = newName.trim();
    if (!trimmed || adding) return;
    setAdding(true);
    setAddError('');
    try {
      const res = await apiFetch('/api/game/projects', {
        method: 'POST',
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || t('projects.addError'));
        return;
      }
      const createdName = data.project?.name as string;
      setNewName('');
      await loadProjects();
      if (createdName && !selected.includes(createdName)) {
        onChange([createdName]);
      }
    } catch (err) {
      console.error('Error creating project:', err);
      setAddError(t('projects.addError'));
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t('projects.loading')}</p>;
  }

  if (loadError) {
    return (
      <p style={{ fontSize: '0.85rem', color: '#ef4444' }}>
        {loadError}{' '}
        <button type="button" onClick={() => { setLoading(true); loadProjects(); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}>
          {t('projects.retry')}
        </button>
      </p>
    );
  }

  return (
    <div className="project-picker">
      <div className="project-search">
        <Search size={16} className="project-search-icon" aria-hidden="true" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('projects.searchPlaceholder')}
          aria-label={t('projects.searchPlaceholder')}
        />
      </div>

      {filteredCatalog.length === 0 ? (
        <p className="project-search-empty">{t('projects.noResults')}</p>
      ) : (
      <div className="project-list" role="listbox" aria-label={t('projects.searchPlaceholder')}>
        {filteredCatalog.map((project) => {
          const count = displayMemberCount(project, selected, savedProjects);
          const isSelected = selected.includes(project.name);
          return (
          <label
            key={project.id}
            role="option"
            aria-selected={isSelected}
            className={`project-list-item ${isSelected ? 'selected' : ''}`}
          >
            <input
              type="radio"
              name="project-picker"
              checked={isSelected}
              onChange={() => toggleProject(project.name)}
              aria-label={project.name}
            />
            <span className="project-list-name">{project.name}</span>
            <span className="project-list-count" title={t('projects.members', { count })}>
              <Users size={12} aria-hidden="true" />
              {count}
            </span>
          </label>
          );
        })}
      </div>
      )}

      {allowCreate && (
        <div className="project-add-row">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('projects.addPlaceholder')}
            maxLength={60}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddProject();
              }
            }}
          />
          <button
            type="button"
            className="btn btn-secondary project-add-btn"
            onClick={handleAddProject}
            disabled={adding || !newName.trim()}
          >
            <Plus size={16} />
            {adding ? t('projects.adding') : t('projects.addButton')}
          </button>
        </div>
      )}

      {addError && <p style={{ fontSize: '0.8rem', color: '#ef4444', margin: '0.5rem 0 0' }}>{addError}</p>}

      {!allowCreate && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginTop: '0.5rem' }}>
          {t('projects.registerHint')}
        </span>
      )}
    </div>
  );
}
