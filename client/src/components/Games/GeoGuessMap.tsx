import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ACTIVE_GEO_MAP_STYLE, GEO_MAP_TILES } from '../../config/geoMapTiles';

const mapTiles = GEO_MAP_TILES[ACTIVE_GEO_MAP_STYLE];

export interface GeoMapMarker {
  id: string;
  lat: number;
  lng: number;
  color: string;
}

interface GeoGuessMapProps {
  draftGuess: { lat: number; lng: number } | null;
  markers: GeoMapMarker[];
  actual: { lat: number; lng: number } | null;
  showLines?: boolean;
  onGuessChange?: (lat: number, lng: number) => void;
  interactive: boolean;
}

const MapClickHandler: React.FC<{
  onGuessChange?: (lat: number, lng: number) => void;
  interactive: boolean;
}> = ({ onGuessChange, interactive }) => {
  useMapEvents({
    click(event) {
      if (!interactive || !onGuessChange) {
        return;
      }
      onGuessChange(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
};

const GeoGuessMap: React.FC<GeoGuessMapProps> = ({
  draftGuess,
  markers,
  actual,
  showLines = false,
  onGuessChange,
  interactive,
}) => {
  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, [draftGuess, markers, actual, interactive, showLines]);

  const allGuessPoints = [
    ...markers.map((marker) => ({ id: marker.id, lat: marker.lat, lng: marker.lng, color: marker.color })),
    ...(draftGuess ? [{ id: 'draft', lat: draftGuess.lat, lng: draftGuess.lng, color: '#FF4B8D' }] : []),
  ];

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      maxZoom={18}
      style={{ width: '100%', height: '100%' }}
      worldCopyJump
      attributionControl={false}
    >
      <TileLayer attribution="" url={mapTiles.url} subdomains="abcd" />
      <MapClickHandler onGuessChange={onGuessChange} interactive={interactive} />
      {allGuessPoints.map((point) => (
        <CircleMarker
          key={point.id}
          center={[point.lat, point.lng]}
          radius={8}
          pathOptions={{ color: point.color, fillColor: point.color, fillOpacity: 1, weight: 2 }}
        />
      ))}
      {actual && (
        <CircleMarker
          center={[actual.lat, actual.lng]}
          radius={8}
          pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1, weight: 2 }}
        />
      )}
      {showLines &&
        actual &&
        allGuessPoints.map((point) => (
          <Polyline
            key={`line-${point.id}`}
            positions={[
              [point.lat, point.lng],
              [actual.lat, actual.lng],
            ]}
            pathOptions={{ color: point.color, weight: 2, dashArray: '6 8' }}
          />
        ))}
    </MapContainer>
  );
};

export default GeoGuessMap;
