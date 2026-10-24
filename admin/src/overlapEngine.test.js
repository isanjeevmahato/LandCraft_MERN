
import { comparePolygons } from "./overlapEngine.js";

// Reference plot: 10 m × 10 m = 100 m²
const reference = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
];

// Rover boundary: 10 m × 10 m, shifted 8 m east.
// Only 2 m of its width overlaps the reference.
const rover = [
  { x: 8, y: 0 },
  { x: 18, y: 0 },
  { x: 18, y: 10 },
  { x: 8, y: 10 },
];

const result = comparePolygons(reference, rover);

console.log("Reference area:", result.referenceArea, "m²");
console.log("Rover area:", result.roverArea, "m²");
console.log("Intersection:", result.intersectionArea, "m²");
console.log("Reference-only area:", result.referenceOnlyArea, "m²");
console.log("Rover-outside area:", result.roverOutsideArea, "m²");

const passed =
  result.referenceArea === 100 &&
  result.roverArea === 100 &&
  result.intersectionArea === 20 &&
  result.referenceOnlyArea === 80 &&
  result.roverOutsideArea === 80;

console.log("Test passed:", passed);
