import React from 'react';

/**
 * Logo Component
 * Enscope stylized scope/crosshair logo with text
 * Uses CSS-rendered scope made from bracket symbols in teal on navy
 */
export default function Logo({ tagline = false, size = 'normal' }) {
  const sizeClass = {
    small: 'logo-sm',
    normal: 'logo',
    large: 'logo-lg',
  }[size] || 'logo';

  return (
    <div className={sizeClass}>
      <span className="logo-scope">⟨⟩</span>
      <span className="logo-text">ENSCOPE</span>
      {tagline && <span className="logo-tagline">Workflow Readiness Platform</span>}
    </div>
  );
}
