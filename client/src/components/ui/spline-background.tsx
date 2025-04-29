import React from 'react';

interface SplineBackgroundProps {
  url: string;
  opacity?: number;
  overlayColor?: string;
  zIndex?: number;
}

export function SplineBackground({
  url,
  opacity = 0.3,
  overlayColor = 'black',
  zIndex = -1
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
      <div 
        className="absolute inset-0"
        style={{ 
          backgroundColor: overlayColor,
          opacity: opacity
        }}
      ></div>
    </div>
  );
}