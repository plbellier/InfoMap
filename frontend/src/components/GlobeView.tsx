import React, { useMemo } from 'react';
import Globe from 'react-globe.gl';

interface GlobeViewProps {
  globeRef: React.MutableRefObject<any>;
  webglSupported: boolean | null;
  dimensions: { width: number; height: number };
  geoData: any;
  history: any[];
  onPolygonClick: (polygon: any) => void;
}

export const GlobeView: React.FC<GlobeViewProps> = ({
  globeRef,
  webglSupported,
  dimensions,
  geoData,
  history,
  onPolygonClick
}) => {
  const polygons = useMemo(() => geoData ? geoData.features : [], [geoData]);

  if (!webglSupported) return null;

  return (
    <div className="absolute inset-0 z-0">
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        polygonsData={polygons}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        polygonCapColor={(d: any) => {
          const countryName = d.properties.NAME || d.properties.name || d.properties.ADMIN;
          const isInHistory = history.some(h => h.country === countryName);
          return isInHistory ? 'rgba(249, 115, 22, 0.4)' : 'rgba(29, 78, 216, 0.2)';
        }}
        polygonSideColor={() => 'rgba(0, 0, 0, 0.6)'}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        polygonStrokeColor={(d: any) => {
          const countryName = d.properties.NAME || d.properties.name || d.properties.ADMIN;
          const isInHistory = history.some(h => h.country === countryName);
          return isInHistory ? '#fb923c' : '#3b82f6';
        }}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        polygonLabel={({ properties: d }: any) => `
          <div style="background: rgba(13, 17, 23, 0.95); color: white; border: 1px solid #30363d; padding: 6px 12px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); pointer-events: none;">
            <b style="font-size: 14px;">${d.NAME || d.name || d.ADMIN}</b>
          </div>
        `}
        onPolygonClick={onPolygonClick}
        polygonAltitude={0.01}
      />
    </div>
  );
};
