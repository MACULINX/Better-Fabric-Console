import React, { useState } from 'react';
import { PlusIcon, TrashIcon, SlidersIcon, ShieldAlertIcon } from './Icons';

export interface FilterRule {
  id: string;
  pattern: string;
  type: 'include' | 'exclude' | 'highlight';
  highlightColor?: string;
  active: boolean;
}

interface FiltersProps {
  filters: FilterRule[];
  onSaveFilters: (newFilters: FilterRule[]) => void;
}

const PRESETS = [
  { name: 'Cyan Glow', hex: '#00f2fe' },
  { name: 'Sleek Purple', hex: '#a855f7' },
  { name: 'Warning Orange', hex: '#fbbf24' },
  { name: 'Danger Red', hex: '#f43f5e' },
  { name: 'Success Green', hex: '#10b981' },
];

export const Filters: React.FC<FiltersProps> = ({ filters, onSaveFilters }) => {
  const [newPattern, setNewPattern] = useState('');
  const [newType, setNewType] = useState<'include' | 'exclude' | 'highlight'>('highlight');
  const [newColor, setNewColor] = useState('#00f2fe');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!newPattern.trim()) {
      setValidationError('Regex pattern cannot be empty.');
      return;
    }

    // Verify regex syntax
    try {
      new RegExp(newPattern);
    } catch (err) {
      setValidationError('Invalid Regular Expression syntax.');
      return;
    }

    const newRule: FilterRule = {
      id: Date.now().toString(),
      pattern: newPattern.trim(),
      type: newType,
      active: true,
      ...(newType === 'highlight' ? { highlightColor: newColor } : {}),
    };

    onSaveFilters([...filters, newRule]);
    setNewPattern('');
    setValidationError(null);
  };

  const handleToggleRule = (id: string) => {
    const updated = filters.map((rule) => {
      if (rule.id === id) {
        return { ...rule, active: !rule.active };
      }
      return rule;
    });
    onSaveFilters(updated);
  };

  const handleDeleteRule = (id: string) => {
    const updated = filters.filter((rule) => rule.id !== id);
    onSaveFilters(updated);
  };

  return (
    <div className="filters-view animate-fade-in">
      <div className="view-header">
        <h2>Console Filter Rules</h2>
        <p className="subtitle">Configure regex filters to dynamically include, hide, or highlight server events.</p>
      </div>

      <div className="filters-grid">
        {/* Left Column: Rules List */}
        <div className="glass-card rules-list-card">
          <h3>Active Filter Rules</h3>
          
          {filters.length === 0 ? (
            <div className="rules-empty">
              <SlidersIcon size={40} className="text-purple-muted" />
              <p>No filters defined. All logs are currently streamed raw.</p>
            </div>
          ) : (
            <div className="rules-list">
              {filters.map((rule) => (
                <div key={rule.id} className={`rule-item ${!rule.active ? 'inactive' : ''}`}>
                  <div className="rule-info">
                    <span className={`rule-badge badge-${rule.type}`}>
                      {rule.type}
                    </span>
                    <code className="rule-pattern">{rule.pattern}</code>
                    {rule.type === 'highlight' && rule.highlightColor && (
                      <span 
                        className="color-pill-indicator" 
                        style={{ backgroundColor: rule.highlightColor }}
                        title={`Highlight Color: ${rule.highlightColor}`}
                      ></span>
                    )}
                  </div>
                  <div className="rule-actions">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={rule.active}
                        onChange={() => handleToggleRule(rule.id)}
                      />
                      <span className="slider round"></span>
                    </label>
                    <button
                      type="button"
                      className="btn-icon btn-danger-icon"
                      onClick={() => handleDeleteRule(rule.id)}
                      title="Delete Rule"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Add Filter Rule */}
        <div className="glass-card add-rule-card">
          <h3>Create Filter Rule</h3>
          
          {validationError && (
            <div className="error-banner small-banner">
              <ShieldAlertIcon size={16} />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handleAddRule}>
            <div className="form-group">
              <label htmlFor="pattern-input">Regex Pattern</label>
              <input
                id="pattern-input"
                type="text"
                className="form-control"
                placeholder="e.g. joined the game|issued server command"
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="type-select">Filter Type</label>
              <select
                id="type-select"
                className="form-control"
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
              >
                <option value="highlight">Highlight Log Line</option>
                <option value="exclude">Exclude/Hide Log Line</option>
                <option value="include">Only Include Log Line</option>
              </select>
            </div>

            {newType === 'highlight' && (
              <div className="form-group">
                <label>Highlight Color</label>
                <div className="color-presets">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      className={`color-preset-btn ${newColor === preset.hex ? 'active' : ''}`}
                      style={{ backgroundColor: preset.hex }}
                      onClick={() => setNewColor(preset.hex)}
                      title={preset.name}
                    ></button>
                  ))}
                  <input
                    type="color"
                    className="custom-color-picker"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    title="Custom Color"
                  />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full">
              <PlusIcon size={16} />
              Add Rule
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
