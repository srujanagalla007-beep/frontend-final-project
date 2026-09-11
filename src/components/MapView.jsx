import { useEffect, useState } from 'react'
import L from 'leaflet'
import 'leaflet-routing-machine'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet'

import { SEVERITY_COLORS, formatTime } from '../utils/normalizeEvents'

// Flood marker icon
function floodIcon(severity) {
  const size = { minor: 22, major: 28, severe: 34 }[severity] || 24

  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;
      height:${size}px;
      border-radius:9999px;
      background:${SEVERITY_COLORS[severity]};
      border:2px solid #0c4a6e;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:${size * 0.55}px;
      line-height:1;
      box-shadow:0 0 0 2px rgba(255,255,255,0.15);
    ">🌊</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// Selected location icon
function locationPinIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:26px;
      height:26px;
      border-radius:9999px 9999px 9999px 0;
      background:#38bdf8;
      transform:rotate(45deg);
      border:2px solid #075985;
      box-shadow:0 0 0 2px rgba(255,255,255,0.2);
    "></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  })
}

// Hospital / shelter icons
function facilityIcon(facilityType) {
  const emoji = facilityType === 'hospital' ? '🏥' : '⛺'
  const bg = facilityType === 'hospital' ? '#0ea5e9' : '#f59e0b'

  return L.divIcon({
    className: '',
    html: `<div style="
      width:24px;
      height:24px;
      border-radius:9999px;
      background:${bg};
      border:2px solid rgba(0,0,0,0.3);
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:13px;
      line-height:1;
      box-shadow:0 0 0 2px rgba(255,255,255,0.15);
    ">${emoji}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

// Recenter map when selected location changes
function RecenterMap({ lat, lon }) {
  const map = useMap()

  useEffect(() => {
    if (lat != null && lon != null) {
      map.setView([lat, lon], 13)
    }
  }, [lat, lon, map])

  return null
}

// Draw route between selected location and facility
function RouteControl({ origin, destination }) {
  const map = useMap()

  useEffect(() => {
    if (!origin || !destination) return

    if (
      origin.lat == null ||
      origin.lon == null ||
      destination.lat == null ||
      destination.lon == null
    ) {
      return
    }

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(origin.lat, origin.lon),
        L.latLng(destination.lat, destination.lon),
      ],

      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      showAlternatives: false,
      fitSelectedRoutes: true,

      createMarker: () => null,

      lineOptions: {
        styles: [
          {
            color: '#2563eb',
            opacity: 0.8,
            weight: 5,
          },
        ],
      },
    }).addTo(map)

    return () => {
      map.removeControl(routingControl)
    }
  }, [map, origin, destination])

  return null
}

export default function MapView({
  events = [],
  onSelect,
  mode = 'disasters',
  selectedLocation = null,
  facilities = [],
}) {
  // Stores the facility selected for directions
  const [routeDestination, setRouteDestination] = useState(null)

  // Clear the route when selected location changes
  useEffect(() => {
    setRouteDestination(null)
  }, [selectedLocation])

  return (
    <MapContainer
      center={[20, 78]}
      zoom={3}
      minZoom={2}
      worldCopyJump={true}
      className="h-[50vh] min-h-[300px] w-full md:h-full"
    >
      <MapResize />

      {/* Recenter when a location is selected */}
      {mode === 'help' && selectedLocation && (
        <RecenterMap
          lat={selectedLocation.lat}
          lon={selectedLocation.lon}
        />
      )}

      {/* Route */}
      {mode === 'help' &&
        selectedLocation &&
        routeDestination && (
          <RouteControl
            origin={selectedLocation}
            destination={routeDestination}
          />
        )}

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Disaster markers */}
      {mode === 'disasters' &&
        events.map((e) =>
          e.type === 'Flood' ? (
            <Marker
              key={e.id}
              position={[e.lat, e.lon]}
              icon={floodIcon(e.severity)}
              eventHandlers={{
                click: () => onSelect(e),
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">
                    {e.title}
                  </p>

                  <p className="text-xs text-slate-600">
                    {formatTime(e.time)}
                  </p>
                </div>
              </Popup>
            </Marker>
          ) : (
            <CircleMarker
              key={e.id}
              center={[e.lat, e.lon]}
              radius={severityRadius(e)}
              pathOptions={{
                color: SEVERITY_COLORS[e.severity],
                fillColor: SEVERITY_COLORS[e.severity],
                fillOpacity: 0.7,
                weight: 1,
              }}
              eventHandlers={{
                click: () => onSelect(e),
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">
                    {e.title}
                  </p>

                  <p className="text-xs text-slate-600">
                    {formatTime(e.time)}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          )
        )}

      {/* Selected location */}
      {mode === 'help' && selectedLocation && (
        <Marker
          position={[
            selectedLocation.lat,
            selectedLocation.lon,
          ]}
          icon={locationPinIcon()}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">
                {selectedLocation.label}
              </p>
          </div>
          </Popup>
        </Marker>
      )}

      {/* Nearby facilities */}
      {mode === 'help' &&
        facilities.map((f) => (
          <Marker
            key={f.id}
            position={[f.lat, f.lon]}
            icon={facilityIcon(f.facilityType)}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">
                  {f.name}
                </p>

                <p className="text-xs text-slate-600">
                  {f.facilityType === 'hospital'
                    ? 'Hospital/Clinic'
                    : 'Shelter'}{' '}
                  · {f.distanceKm.toFixed(1)} km away
                </p>

                {/* Get Directions */}
                {selectedLocation && (
                  <button
                    type="button"
                    onClick={() => setRouteDestination(f)}
                    className="mt-2 inline-block rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    Get Directions
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  )
}

// Resize Leaflet map when screen size changes
function MapResize() {
  const map = useMap()

  useEffect(() => {
    const resizeMap = () => {
      map.invalidateSize()
    }

    resizeMap()

    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 300)

    window.addEventListener('resize', resizeMap)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', resizeMap)
    }
  }, [map])

  return null
}

// Disaster marker size based on severity
function severityRadius(e) {
  if (e.type === 'Earthquake' && e.magnitude != null) {
    return Math.max(4, e.magnitude * 2.5)
  }

  const bySeverity = {
    minor: 5,
    moderate: 7,
    major: 9,
    severe: 12,
  }

  return bySeverity[e.severity] || 6
}