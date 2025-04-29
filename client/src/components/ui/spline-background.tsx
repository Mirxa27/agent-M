import React from 'react';

interface SplineBackgroundProps {
  url: string;
  opacity?: number;
  overlayColor?: string;
  zIndex?: number;
  gradientOverlay?: boolean;
}

export function SplineBackground({
  url,
  opacity = 0.5, // Increased default opacity for better text contrast
  overlayColor = 'black',
  zIndex = -1,
  gradientOverlay = false
}: SplineBackgroundProps) {
  return (
    <div 
      className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none"
      style={{ zIndex }}
    >
      {/* Spline 3D Model Background */}
      <iframe
        src={url}
        frameBorder="0"
        width="100%"
        height="100%"
        style={{
          pointerEvents: 'none',
          border: 'none',
          background: 'transparent'
        }}
        title="Mirxa AI 3D Background"
      ></iframe>
      
      {/* Overlay to ensure content readability */}
      {gradientOverlay ? (
        <div 
          className="absolute inset-0"
          style={{ 
            background: `linear-gradient(to bottom, ${overlayColor}CC, ${overlayColor}99)`,
            opacity: opacity
          }}
        ></div>
      ) : (
        <div 
          className="absolute inset-0"
          style={{ 
            backgroundColor: overlayColor,
            opacity: opacity
          }}
        ></div>
      )}
    </div>
  );
}