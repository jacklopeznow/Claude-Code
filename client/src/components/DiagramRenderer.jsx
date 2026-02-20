import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

/**
 * DiagramRenderer Component
 * Renders Mermaid.js diagrams and provides export functionality
 *
 * Props:
 * - mermaidDefinition: Mermaid diagram definition string (required)
 * - steps: Array of workflow steps (optional, for reference)
 * - scores: Scores data to overlay (optional)
 * - layout: Layout configuration object (optional)
 * - title: Diagram title (optional)
 * - onExport: Callback when export is triggered
 * - showExportButtons: Whether to show PNG/SVG export buttons (default: true)
 */
export default function DiagramRenderer({
  mermaidDefinition = '',
  steps = [],
  scores = null,
  layout = null,
  title = 'Workflow Diagram',
  onExport = null,
  showExportButtons = true,
}) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Initialize mermaid on mount
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        padding: 20,
      },
    });
  }, []);

  // Render diagram when definition changes
  useEffect(() => {
    if (!mermaidDefinition || !containerRef.current) {
      return;
    }

    const renderDiagram = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Clear previous content
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Create a unique ID for this diagram instance
        const diagramId = `diagram-${Date.now()}`;

        // Render the diagram
        const { svg } = await mermaid.render(diagramId, mermaidDefinition);

        // Insert rendered SVG
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          svgRef.current = containerRef.current.querySelector('svg');

          // Make SVG responsive
          if (svgRef.current) {
            svgRef.current.style.maxWidth = '100%';
            svgRef.current.style.height = 'auto';
            svgRef.current.style.display = 'block';
          }
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError('Failed to render diagram. Please check the diagram definition.');
      } finally {
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [mermaidDefinition]);

  /**
   * Export diagram as PNG
   */
  const exportAsPNG = async () => {
    if (!svgRef.current) {
      console.error('SVG not available for export');
      return;
    }

    try {
      setExporting(true);

      // Get SVG content
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      // Set canvas size
      const bbox = svgRef.current.getBBox();
      canvas.width = bbox.width;
      canvas.height = bbox.height;

      // Draw the image
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `workflow-diagram-${Date.now()}.png`;
        link.click();

        setExporting(false);
        onExport?.('png');
      };

      // Convert SVG to image
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error('PNG export error:', err);
      setExporting(false);
    }
  };

  /**
   * Export diagram as SVG
   */
  const exportAsSVG = () => {
    if (!svgRef.current) {
      console.error('SVG not available for export');
      return;
    }

    try {
      setExporting(true);

      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const link = document.createElement('a');
      link.href = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      link.download = `workflow-diagram-${Date.now()}.svg`;
      link.click();

      setExporting(false);
      onExport?.('svg');
    } catch (err) {
      console.error('SVG export error:', err);
      setExporting(false);
    }
  };

  /**
   * Copy SVG to clipboard
   */
  const copyToClipboard = async () => {
    if (!svgRef.current) {
      console.error('SVG not available for clipboard');
      return;
    }

    try {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      await navigator.clipboard.writeText(svgData);
      onExport?.('clipboard');
    } catch (err) {
      console.error('Clipboard copy error:', err);
    }
  };

  return (
    <div className="diagram-renderer">
      {/* Header with controls */}
      <div className="diagram-header">
        <h3 className="diagram-title">{title}</h3>

        {showExportButtons && (
          <div className="diagram-controls">
            <button
              className="btn-tertiary btn-sm"
              onClick={exportAsPNG}
              disabled={isLoading || exporting}
              title="Export as PNG"
            >
              {exporting ? '⟳' : '⬇'} PNG
            </button>

            <button
              className="btn-tertiary btn-sm"
              onClick={exportAsSVG}
              disabled={isLoading || exporting}
              title="Export as SVG"
            >
              {exporting ? '⟳' : '⬇'} SVG
            </button>

            <button
              className="btn-tertiary btn-sm"
              onClick={copyToClipboard}
              disabled={isLoading}
              title="Copy to clipboard"
            >
              📋 Copy
            </button>
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="diagram-loading">
          <div className="spinner"></div>
          <p>Rendering diagram...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <div>
            <div className="alert-title">Diagram Error</div>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Diagram container */}
      <div
        ref={containerRef}
        className="diagram-container"
        style={{ display: isLoading ? 'none' : 'block' }}
      />

      {/* Footer info */}
      {steps.length > 0 && (
        <div className="diagram-footer">
          <small>
            {steps.length} workflow steps
            {scores && ` • Readiness: ${scores.overall}%`}
          </small>
        </div>
      )}
    </div>
  );
}
