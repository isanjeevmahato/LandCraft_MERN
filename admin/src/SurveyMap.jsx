import "./App.css";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { comparePolygons } from "./overlapEngine.js";

function calculatePolygonArea(points) {
    const earthRadius = 6378137;

    if (points.length < 3) {
        return null;
    }

    const coordinates = points.map((point) => ({
        lat: Number(point.latitude) * Math.PI / 180,
        lng: Number(point.longitude) * Math.PI / 180,
    }));

    let total = 0;

    for (let i = 0; i < coordinates.length; i++) {
        const current = coordinates[i];
        const next = coordinates[(i + 1) % coordinates.length];

        total +=
            (next.lng - current.lng) *
            (2 + Math.sin(current.lat) + Math.sin(next.lat));
    }

    return Math.abs(total * earthRadius * earthRadius / 2);
}


function SurveyMap({ points = [] }) {
    const mapElementRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef(null);
    const boundaryRef = useRef(null);
    const testOverlapLayerRef = useRef(null);
    const [testComparisonVisible, setTestComparisonVisible] = useState(false);
    const [mapType, setMapType] = useState("simple");
    const [testOverlapMode, setTestOverlapMode] = useState(false);
    const [boundaryCreated, setBoundaryCreated] = useState(false);
    const [areaSqMeters, setAreaSqMeters] = useState(null);
    const [boundaryError, setBoundaryError] = useState("");
    const [comparisonResult, setComparisonResult] = useState(null);
    const [referenceMode, setReferenceMode] = useState(false);
    const [referencePoints, setReferencePoints] = useState([]);
    const [referenceClosed, setReferenceClosed] = useState(false);

    const referenceLayerRef = useRef(null);
    const referenceModeRef = useRef(false);
    const comparisonLayerRef = useRef(null);

    const referenceTestPolygon = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
    ];

    const roverTestPolygon = [
        { x: 2, y: 0 },
        { x: 12, y: 0 },
        { x: 12, y: 10 },
        { x: 2, y: 10 },
    ];



    const roverActualPolygon = (() => {
        const validPoints = points.filter(
            (point) =>
                Number.isFinite(Number(point.latitude)) &&
                Number.isFinite(Number(point.longitude))
        );

        if (validPoints.length === 0) {
            return [];
        }

        // Use the first rover point as the local origin.
        const originLat =
            Number(validPoints[0].latitude) * Math.PI / 180;

        const originLng =
            Number(validPoints[0].longitude) * Math.PI / 180;

        const earthRadius = 6378137;

        return validPoints.map((point) => {
            const lat = Number(point.latitude) * Math.PI / 180;
            const lng = Number(point.longitude) * Math.PI / 180;

            return {
                x: earthRadius * (lng - originLng) * Math.cos(originLat),
                y: earthRadius * (lat - originLat),
            };
        });
    })();



    const testComparison = comparePolygons(
        referenceTestPolygon,
        roverTestPolygon
    );

    const actualComparison =
        roverActualPolygon.length >= 3
            ? null
            : null;


    function drawTestOverlap() {
        const map = mapRef.current;
        const layer = testOverlapLayerRef.current;

        if (!map || !layer) return;

        layer.clearLayers();

        if (!testOverlapMode) {
            return;
        }

        // Convert local test coordinates to map display coordinates.
        // These are illustrative positions, not real GPS locations.
        const toMapCoordinates = (polygon) =>
            polygon.map((point) => [
                22.7144 + point.y / 111320,
                86.2294 + point.x / (111320 * Math.cos(22.7144 * Math.PI / 180)),
            ]);

        const referenceLatLngs = toMapCoordinates(referenceTestPolygon);
        const roverLatLngs = toMapCoordinates(roverTestPolygon);
        const intersectionLatLngs = toMapCoordinates(
            testComparison.intersectionPolygon
        );

        L.polygon(referenceLatLngs, {
            color: "#2563eb",
            weight: 3,
            fillColor: "#2563eb",
            fillOpacity: 0.08,
        })
            .bindTooltip("Reference boundary")
            .addTo(layer);

        L.polygon(roverLatLngs, {
            color: "#16a34a",
            weight: 3,
            fillColor: "#16a34a",
            fillOpacity: 0.08,
        })
            .bindTooltip("Test rover boundary")
            .addTo(layer);

        if (intersectionLatLngs.length >= 3) {
            L.polygon(intersectionLatLngs, {
                color: "#dc2626",
                weight: 2,
                fillColor: "#dc2626",
                fillOpacity: 0.35,
            })
                .bindTooltip("Intersection: " + testComparison.intersectionArea + " m²")
                .addTo(layer);
        }

        map.fitBounds(
            L.latLngBounds([...referenceLatLngs, ...roverLatLngs]),
            { padding: [35, 35], maxZoom: 19 }
        );
    }


    function createBoundary() {
        const validPoints = points.filter(
            (point) =>
                Number.isFinite(Number(point.latitude)) &&
                Number.isFinite(Number(point.longitude))
        );

        if (validPoints.length < 3) {
            setBoundaryError("Save at least 3 valid GPS points first.");
            setBoundaryCreated(false);
            setAreaSqMeters(null);
            return;
        }

        const area = calculatePolygonArea(validPoints);

        if (area === null || area <= 0) {
            setBoundaryError("Unable to calculate area. Check your GPS points.");
            setBoundaryCreated(false);
            setAreaSqMeters(null);
            return;
        }

        setBoundaryError("");
        setAreaSqMeters(area);
        setBoundaryCreated(true);
    }



    useEffect(() => {
        if (mapRef.current || !mapElementRef.current) return;

        const map = L.map(mapElementRef.current).setView(
            [22.7144, 86.2294],
            18
        );

        const normalLayer = L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution: "&copy; OpenStreetMap contributors",
                maxZoom: 19,
            }
        );

        const satelliteLayer = L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            {
                attribution: "Tiles &copy; Esri",
                maxZoom: 19,
            }
        );

        normalLayer.addTo(map);

        mapRef.current = map;
        map.normalLayer = normalLayer;
        map.satelliteLayer = satelliteLayer;

        markersRef.current = L.layerGroup().addTo(map);

        testOverlapLayerRef.current = L.layerGroup().addTo(map);

        referenceLayerRef.current = L.layerGroup().addTo(map);
        const comparisonLayer = L.layerGroup().addTo(map);
        comparisonLayerRef.current = comparisonLayer;

        map.on("click", (event) => {
            if (!referenceModeRef.current) return;

            const point = {
                id: Date.now(),
                latitude: event.latlng.lat,
                longitude: event.latlng.lng,
            };

            setReferencePoints((previous) => [...previous, point]);
            setReferenceClosed(false);
        });

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        if (mapType === "satellite") {
            map.removeLayer(map.normalLayer);
            map.satelliteLayer.addTo(map);
        } else {
            map.removeLayer(map.satelliteLayer);
            map.normalLayer.addTo(map);
        }
    }, [mapType]);

    useEffect(() => {
        drawTestOverlap();
    }, [testOverlapMode]);

    useEffect(() => {
        const map = mapRef.current;
        const markers = markersRef.current;

        if (!map || !markers) return;

        markers.clearLayers();

        if (boundaryRef.current) {
            map.removeLayer(boundaryRef.current);
            boundaryRef.current = null;
        }

        const validPoints = points.filter(
            (point) =>
                Number.isFinite(Number(point.latitude)) &&
                Number.isFinite(Number(point.longitude))
        );

        const coordinates = validPoints.map((point) => [
            Number(point.latitude),
            Number(point.longitude),
        ]);

        validPoints.forEach((point, index) => {
            const marker = L.circleMarker(
                [Number(point.latitude), Number(point.longitude)],
                {
                    radius: 7,
                    color: "#ffffff",
                    weight: 2,
                    fillColor: "#16a34a",
                    fillOpacity: 1,
                }
            );

            marker.bindTooltip(`P${point.id ?? index + 1}`);
            marker.bindPopup(
                `P${point.id ?? index + 1}<br>` +
                `Latitude: ${point.latitude}<br>` +
                `Longitude: ${point.longitude}`
            );

            marker.addTo(markers);
        });

        if (coordinates.length >= 3) {
            boundaryRef.current = L.polygon(coordinates, {
                color: "#0f52ba",
                weight: 3,
                fillColor: "#0f52ba",
                fillOpacity: 0.15,
            }).addTo(map);
        }

        if (coordinates.length > 0) {
            const bounds = L.latLngBounds(coordinates);
            map.fitBounds(bounds, { padding: [35, 35], maxZoom: 19 });
        }
    }, [points]);

    useEffect(() => {
        const map = mapRef.current;
        const layer = referenceLayerRef.current;

        if (!map || !layer) return;

        layer.clearLayers();

        const coordinates = referencePoints.map((point) => [
            point.latitude,
            point.longitude,
        ]);

        referencePoints.forEach((point, index) => {
            L.circleMarker(coordinates[index], {
                radius: 6,
                color: "#ffffff",
                weight: 2,
                fillColor: "#2563eb",
                fillOpacity: 1,
            })
                .bindTooltip(`Reference P${index + 1}`)
                .bindPopup(
                    `Reference P${index + 1}<br>` +
                    `Latitude: ${point.latitude.toFixed(7)}<br>` +
                    `Longitude: ${point.longitude.toFixed(7)}`
                )
                .addTo(layer);
        });

        if (coordinates.length >= 3) {
            L.polygon(coordinates, {
                color: "#2563eb",
                weight: 3,
                fillColor: "#2563eb",
                fillOpacity: referenceClosed ? 0.15 : 0.04,
            }).addTo(layer);
        }
    }, [referencePoints, referenceClosed]);

    useEffect(() => {
        const map = mapRef.current;
        const layer = comparisonLayerRef.current;

        if (!map || !layer) return;

        layer.clearLayers();

        if (!referenceClosed || referencePoints.length < 3 || points.length < 3) {
            setComparisonResult(null);
            return;
        }

        const validRoverPoints = points.filter(
            (point) =>
                Number.isFinite(Number(point.latitude)) &&
                Number.isFinite(Number(point.longitude))
        );

        if (validRoverPoints.length < 3) return;

        // Use the same origin for both polygons.
        const originLat = Number(referencePoints[0].latitude);
        const originLng = Number(referencePoints[0].longitude);
        const earthRadius = 6378137;
        const originLatRad = originLat * Math.PI / 180;

        function toLocal(point) {
            const lat = Number(point.latitude);
            const lng = Number(point.longitude);

            return {
                x: earthRadius *
                    (lng - originLng) * Math.PI / 180 *
                    Math.cos(originLatRad),
                y: earthRadius *
                    (lat - originLat) * Math.PI / 180,
            };
        }

        function toLatLng(point) {
            return [
                originLat + (point.y / earthRadius) * 180 / Math.PI,
                originLng +
                (point.x / (earthRadius * Math.cos(originLatRad))) *
                180 / Math.PI,
            ];
        }

        try {
            const referencePolygon = referencePoints.map(toLocal);
            const roverPolygon = validRoverPoints.map(toLocal);

            const result = comparePolygons(referencePolygon, roverPolygon);

            if (result.intersectionPolygon.length >= 3) {
                L.polygon(
                    result.intersectionPolygon.map(toLatLng),
                    {
                        color: "#dc2626",
                        weight: 2,
                        fillColor: "#dc2626",
                        fillOpacity: 0.4,
                    }
                )
                    .bindTooltip("Actual overlap")
                    .addTo(layer);
            }

            setComparisonResult(result);
        } catch (error) {
            console.error("Boundary comparison failed:", error);
        }
    }, [referencePoints, referenceClosed, points]);



    function downloadSurveyReport() {
        const escapeHtml = (value) =>
            String(value ?? "").replace(/[&<>"']/g, (char) => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            }[char]));

        const formatArea = (value) =>
            Number.isFinite(value) ? value.toFixed(2) : "Not available";

        const referenceRows = referencePoints.map((point, index) => `
        <tr>
            <td>P${index + 1}</td>
            <td>${escapeHtml(Number(point.latitude).toFixed(7))}</td>
            <td>${escapeHtml(Number(point.longitude).toFixed(7))}</td>
        </tr>
    `).join("");

        const roverRows = points.map((point, index) => `
        <tr>
            <td>P${point.id ?? index + 1}</td>
            <td>${escapeHtml(point.latitude)}</td>
            <td>${escapeHtml(point.longitude)}</td>
            <td>${escapeHtml(point.satellites ?? "N/A")}</td>
            <td>${escapeHtml(point.savedAt ?? "N/A")}</td>
        </tr>
    `).join("");

        const hasComparison = comparisonResult !== null;

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>LandCraft Survey Report</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    color: #1e293b;
                    margin: 28px;
                    font-size: 12px;
                }
                h1 {
                    color: #003366;
                    text-align: center;
                    margin-bottom: 4px;
                }
                .subtitle {
                    text-align: center;
                    color: #526579;
                    margin-bottom: 24px;
                }
                h2 {
                    color: #003366;
                    font-size: 16px;
                    margin-top: 24px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                }
                th, td {
                    border: 1px solid #cbd5e1;
                    padding: 8px;
                    text-align: left;
                    overflow-wrap: anywhere;
                }
                th {
                    background: #003366;
                    color: white;
                }
                tr:nth-child(even) {
                    background: #f8fafc;
                }
                .status {
                    padding: 12px;
                    background: #f1f5f9;
                    border-left: 4px solid #0f52ba;
                }
                .footer {
                    margin-top: 30px;
                    color: #64748b;
                    font-size: 10px;
                }
                @media print {
                    body { margin: 12mm; }
                    h2 { break-after: avoid; }
                    table { break-inside: auto; }
                    tr { break-inside: avoid; }
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>LANDCRAFT</h1>
            <div class="subtitle">Land Survey & Boundary Comparison Report</div>

            <p><strong>Generated:</strong>
                ${escapeHtml(new Date().toLocaleString())}</p>

            <h2>Comparison Summary</h2>
            <div class="status">
                <strong>Status:</strong>
                ${hasComparison
                ? "Comparison calculated"
                : "Awaiting valid rover boundary comparison"}
            </div>

            <table>
                <tr><th>Metric</th><th>Area (m²)</th></tr>
                <tr><td>Reference area</td>
                    <td>${hasComparison
                ? formatArea(comparisonResult.referenceArea)
                : "Not available"}</td></tr>
                <tr><td>Rover area</td>
                    <td>${hasComparison
                ? formatArea(comparisonResult.roverArea)
                : "Not available"}</td></tr>
                <tr><td>Overlap area</td>
                    <td>${hasComparison
                ? formatArea(comparisonResult.intersectionArea)
                : "Not available"}</td></tr>
                <tr><td>Reference-only area</td>
                    <td>${hasComparison
                ? formatArea(comparisonResult.referenceOnlyArea)
                : "Not available"}</td></tr>
                <tr><td>Rover outside reference</td>
                    <td>${hasComparison
                ? formatArea(comparisonResult.roverOutsideArea)
                : "Not available"}</td></tr>
            </table>

            <h2>Reference Boundary Points</h2>
            <table>
                <tr><th>Point</th><th>Latitude</th><th>Longitude</th></tr>
                ${referenceRows || "<tr><td colspan='3'>No reference points saved</td></tr>"}
            </table>

            <h2>Rover Survey Points</h2>
            <table>
                <tr>
                    <th>Point</th><th>Latitude</th><th>Longitude</th>
                    <th>Satellites</th><th>Saved At</th>
                </tr>
                ${roverRows || "<tr><td colspan='5'>No rover points saved</td></tr>"}
            </table>

            <p class="footer">
                LandCraft prototype report. Comparison figures depend on
                valid reference and rover boundary data.
            </p>

            <script>
                window.onload = () => window.print();
            </script>
        </body>
        </html>
    `;

        const reportWindow = window.open("", "_blank");

        if (!reportWindow) {
            alert("Allow pop-ups for localhost, then try again.");
            return;
        }

        reportWindow.document.open();
        reportWindow.document.write(html);
        reportWindow.document.close();
    }



    return (
        <div className="survey-map-container">

            <div className="survey-map-toolbar">
                <h2>Survey Map</h2>
                <div className="boundary-actions">
                    <button
                        type="button"
                        onClick={() => {
                            referenceModeRef.current = true;
                            setReferenceMode(true);
                        }}
                        disabled={referenceMode}
                    >
                        Add Reference Points
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            referenceModeRef.current = false;
                            setReferenceMode(false);

                            if (referencePoints.length >= 3) {
                                setReferenceClosed(true);
                            }
                        }}
                        disabled={!referenceMode || referencePoints.length < 3}
                    >
                        Finish Reference Boundary
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setReferencePoints((previous) => previous.slice(0, -1));
                            setReferenceClosed(false);
                        }}
                        disabled={referencePoints.length === 0}
                    >
                        Undo Last Point
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            referenceModeRef.current = false;
                            setReferenceMode(false);
                            setReferencePoints([]);
                            setReferenceClosed(false);
                        }}
                    >
                        Clear Reference
                    </button>

                    <button
                        type="button"
                        onClick={downloadSurveyReport}
                    >
                        Download Survey Report
                    </button>
                </div>

                <p className="survey-map-note">
                    {referenceMode
                        ? "Reference mode ON: click the map to add boundary points."
                        : "Reference mode OFF: map clicks will not add reference points."}
                    {" "}Reference points: {referencePoints.length}
                </p>
                <div className="survey-map-switch">
                    <button
                        type="button"
                        className={mapType === "simple" ? "active" : ""}
                        onClick={() => setMapType("simple")}
                    >
                        Normal Map
                    </button>

                    <button
                        type="button"
                        className={mapType === "satellite" ? "active" : ""}
                        onClick={() => setMapType("satellite")}
                    >
                        Satellite
                    </button>

                    <button
                        type="button"
                        className={testOverlapMode ? "active" : ""}
                        onClick={() => setTestOverlapMode((previous) => !previous)}
                    >
                        {testOverlapMode
                            ? "Exit Test Overlap Mode"
                            : "Test Overlap Mode"}
                    </button>
                </div>
            </div>

            {comparisonResult && (
                <div className="boundary-area">
                    <h3>Boundary Comparison Results</h3>

                    <div className="area-values">
                        <div>
                            <strong>{comparisonResult.referenceArea.toFixed(2)}</strong>
                            <span>Reference area (m²)</span>
                        </div>

                        <div>
                            <strong>{comparisonResult.roverArea.toFixed(2)}</strong>
                            <span>Rover area (m²)</span>
                        </div>

                        <div>
                            <strong>{comparisonResult.intersectionArea.toFixed(2)}</strong>
                            <span>Overlap area (m²)</span>
                        </div>

                        <div>
                            <strong>{comparisonResult.referenceOnlyArea.toFixed(2)}</strong>
                            <span>Reference-only area (m²)</span>
                        </div>

                        <div>
                            <strong>{comparisonResult.roverOutsideArea.toFixed(2)}</strong>
                            <span>Rover outside reference (m²)</span>
                        </div>
                    </div>
                </div>
            )}

            {boundaryError && (
                <p className="boundary-error">{boundaryError}</p>
            )}


            {testOverlapMode && (
                <div className="boundary-area">
                    <h3>Boundary Comparison Results (Test)</h3>

                    <div className="area-values">
                        <div>
                            <strong>
                                {testComparison.referenceArea.toFixed(2)}
                            </strong>
                            <span>Reference area (m²)</span>
                        </div>

                        <div>
                            <strong>
                                {testComparison.roverArea.toFixed(2)}
                            </strong>
                            <span>Rover area (m²)</span>
                        </div>

                        <div>
                            <strong>
                                {testComparison.intersectionArea.toFixed(2)}
                            </strong>
                            <span>Intersection (m²)</span>
                        </div>

                        <div>
                            <strong>
                                {testComparison.referenceOnlyArea.toFixed(2)}
                            </strong>
                            <span>Reference-only (m²)</span>
                        </div>

                        <div>
                            <strong>
                                {testComparison.roverOutsideArea.toFixed(2)}
                            </strong>
                            <span>Rover outside reference (m²)</span>
                        </div>
                    </div>

                    <p className="survey-map-note">
                        Test data only. These results do not represent an actual land survey.
                    </p>
                </div>
            )}


            {boundaryCreated && areaSqMeters !== null && (
                <div className="boundary-area">
                    <h3>Calculated Land Area</h3>

                    <div className="area-values">
                        <div>
                            <strong>{areaSqMeters.toFixed(2)}</strong>
                            <span>Square metres (m²)</span>
                        </div>

                        <div>
                            <strong>{(areaSqMeters / 4046.8564224).toFixed(4)}</strong>
                            <span>Acres</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="boundary-actions">
                <button
                    type="button"
                    onClick={createBoundary}
                    disabled={points.length < 3}
                >
                    Create Boundary
                </button>
            </div>

            <div
                ref={mapElementRef}
                className="survey-map"
                aria-label="Interactive land survey map"
            />

            <p className="survey-map-note">
                {points.length} saved survey point(s). A boundary appears
                when at least three valid points are available.
            </p>
        </div>
    );
}

export default SurveyMap;
