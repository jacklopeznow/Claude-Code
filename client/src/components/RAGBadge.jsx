import React from 'react';

/**
 * RAGBadge Component
 * Red/Amber/Green severity badge
 *
 * Props:
 * - severity: 'red' | 'amber' | 'green'
 * - label: optional custom label (defaults to severity capitalized)
 * - size: 'sm' | 'base' | 'lg' (default: 'base')
 * - icon: optional icon emoji/text to display before label
 * - onClick: optional click handler
 */
export default function RAGBadge({
  severity = 'green',
  label = null,
  size = 'base',
  icon = null,
  onClick = null,
}) {
  // Map severity to CSS class
  const severityClass = {
    red: 'badge-red',
    amber: 'badge-amber',
    green: 'badge-green',
  }[severity] || 'badge-green';

  const sizeClass = {
    sm: 'badge-sm',
    base: '',
    lg: 'badge-lg',
  }[size];

  // Default labels
  const defaultLabels = {
    red: 'At Risk',
    amber: 'Caution',
    green: 'Ready',
  };

  const displayLabel = label || defaultLabels[severity];

  // Icon mapping
  const defaultIcons = {
    red: '⚠️',
    amber: '⏱️',
    green: '✓',
  };

  const displayIcon = icon || defaultIcons[severity];

  const badgeClasses = ['badge', severityClass, sizeClass].filter(Boolean).join(' ');

  return (
    <span
      className={badgeClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyPress={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onClick(e);
              }
            }
          : undefined
      }
    >
      {displayIcon && <span className="badge-icon">{displayIcon}</span>}
      <span className="badge-label">{displayLabel}</span>
    </span>
  );
}
