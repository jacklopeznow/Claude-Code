import React, { useMemo } from 'react';

/**
 * ProgressRing Component
 * Animated SVG circular progress indicator in teal
 *
 * Props:
 * - percentage: 0-100 (number)
 * - size: 'small' (80), 'medium' (120), 'large' (160) - in pixels
 * - strokeWidth: thickness of the ring (default: 8)
 * - animated: whether to animate the ring fill (default: true)
 * - showLabel: whether to show percentage text inside (default: true)
 * - color: override teal color with custom CSS color (optional)
 */
export default function ProgressRing({
  percentage = 75,
  size = 'medium',
  strokeWidth = 8,
  animated = true,
  showLabel = true,
  color = 'var(--color-accent-teal)',
  label = null,
}) {
  // Determine SVG size
  const sizeMap = {
    small: 80,
    medium: 120,
    large: 160,
  };

  const radius = (sizeMap[size] || sizeMap.medium) / 2;
  const circumference = 2 * Math.PI * (radius - strokeWidth / 2);

  // Calculate stroke-dashoffset based on percentage
  const strokeDashoffset = useMemo(() => {
    const percentage_clamped = Math.min(100, Math.max(0, percentage));
    return circumference - (percentage_clamped / 100) * circumference;
  }, [percentage, circumference]);

  const svgSize = sizeMap[size] || sizeMap.medium;
  const center = svgSize / 2;
  const circleRadius = radius - strokeWidth / 2;

  return (
    <div className="progress-ring-container">
      <svg
        width={svgSize}
        height={svgSize}
        className="progress-ring"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={circleRadius}
          fill="none"
          stroke="var(--color-bg-light-alt)"
          strokeWidth={strokeWidth}
          className="progress-ring-bg"
        />

        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={circleRadius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`progress-ring-fill ${animated ? 'animated' : ''}`}
        />
      </svg>

      {/* Center label */}
      {showLabel && (
        <div className="progress-ring-label">
          {label ? (
            <>
              <div className="progress-ring-percentage">{percentage}%</div>
              <div className="progress-ring-text">{label}</div>
            </>
          ) : (
            <div className="progress-ring-percentage">{percentage}%</div>
          )}
        </div>
      )}
    </div>
  );
}
