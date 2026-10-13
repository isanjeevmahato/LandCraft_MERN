import { useEffect, useMemo, useState } from "react";
import L from "leaflet";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import "./LandMap.css";

// Demo locations within the existing LandCraft map area.
// These are illustrative coordinates, not verified survey results.
const demoFlags = [
  {
    id: "completed-1",
    type: "completed",
    title: "Survey Completed — Demo Location 1",
    position: [23.7044, 86.1845],
  },
  {
    id: "completed-2",
    type: "completed",
    title: "Survey Completed — Demo Location 2",
    position: [23.7035, 86.1860],
  },
  {
    id: "completed-3",
    type: "completed",
    title: "Survey Completed — Demo Location 3",
    position: [23.7025, 86.1874],
  },
  {
    id: "pending-1",
    type: "pending",
    title: "Survey In Progress — Demo Location 1",
    position: [23.7049, 86.1855],
  },
  {
    id: "pending-2",
    type: "pending",
    title: "Survey In Progress — Demo Location 2",
    position: [23.7042, 86.1870],
  },
  {
    id: "pending-3",
    type: "pending",
    title: "Survey In Progress — Demo Location 3",
    position: [23.7031, 86.1848],
  },
  {
    id: "pending-4",
    type: "pending",
    title: "Survey In Progress — Demo Location 4",
    position: [23.7022, 86.1859],
  },
  {
    id: "pending-5",
    type: "pending",
    title: "Survey In Progress — Demo Location 5",
    position: [23.7037, 86.1880],
  },
  {
    id: "discrepancy-1",
    type: "discrepancy",
    title: "Discrepancy Detected — Demo Location 1",
    position: [23.7019, 86.1847],
  },
  {
    id: "discrepancy-2",
    type: "discrepancy",
    title: "Discrepancy Detected — Demo Location 2",
    position: [23.7047, 86.1876],
  },
];

// Create individual flag-shaped SVG markers.
function createFlagIcon(type) {
  const colors = {
    completed: "#168348",
    pending: "#eab308",
    discrepancy: "#dc2626",
  };

  const color = colors[type];

  const flagSvg = `
    <svg
      width="30"
      height="34"
      viewBox="0 0 30 34"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 31 V3"
        stroke="#ffffff"
        stroke-width="4"
        stroke-linecap="round"
      />
      <path
        d="M7 3 V31"
        stroke="#26332f"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <path
        d="M8 4 C15 2 19 8 27 4 V17 C19 21 15 15 8 18 Z"
        fill="${color}"
        stroke="#ffffff"
        stroke-width="1"
        stroke-linejoin="round"
      />
    </svg>
  `;

  return L.divIcon({
    className: "landcraft-map-div-icon",
    html: `<span class="lc-flag">${flagSvg}</span>`,
    iconSize: [30, 34],
    iconAnchor: [7, 31],
    popupAnchor: [8, -29],
  });
}

// Automatically frame all the demo flag locations.
function FitDemoFlags() {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds(
      demoFlags.map((flag) => flag.position)
    );

    map.fitBounds(bounds, {
      padding: [45, 45],
      maxZoom: 16,
    });
  }, [map]);

  return null;
}

function LandMap() {
  // Start with satellite imagery.
  const [mapType, setMapType] = useState("satellite");

  const flagIcons = useMemo(
    () => ({
      completed: createFlagIcon("completed"),
      pending: createFlagIcon("pending"),
      discrepancy: createFlagIcon("discrepancy"),
    }),
    []
  );

  return (
    <div className="landcraft-map-wrapper">
      <MapContainer
        className="landcraft-map-canvas"
        center={[23.7035, 86.1860]}
        zoom={16}
        scrollWheelZoom={true}
      >
        {mapType === "satellite" ? (
          <>
            <TileLayer
              key="satellite"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri"
              maxZoom={19}
            />

            {/* Place-name labels over satellite imagery */}
            <TileLayer
              key="satellite-labels"
              url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              attribution="Labels &copy; Esri"
              maxZoom={19}
            />
          </>
        ) : (
          <TileLayer
            key="normal"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
            maxZoom={19}
          />
        )}

        <FitDemoFlags />

        {/* Individual demo flags only: no parcel polygons */}
        {demoFlags.map((flag) => (
          <Marker
            key={flag.id}
            position={flag.position}
            icon={flagIcons[flag.type]}
          >
            <Popup>
              <strong>{flag.title}</strong>
              <p>
                Demonstration marker. Actual survey data will
                be connected later.
              </p>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map view controls */}
      <div className="landcraft-map-controls">
        <button
          type="button"
          className={mapType === "normal" ? "active" : ""}
          onClick={() => setMapType("normal")}
        >
          Normal
        </button>

        <button
          type="button"
          className={mapType === "satellite" ? "active" : ""}
          onClick={() => setMapType("satellite")}
        >
          Satellite
        </button>
      </div>

      {/* Legend */}
      <div className="landcraft-map-legend">
        <strong>Survey Status — Demo</strong>

        <div>
          <span className="lc-legend-dot completed" />
          Surveys Completed (3)
        </div>

        <div>
          <span className="lc-legend-dot pending" />
          Surveys In Progress (5)
        </div>

        <div>
          <span className="lc-legend-dot discrepancy" />
          Discrepancies (2)
        </div>
      </div>
    </div>
  );
}

export default LandMap;