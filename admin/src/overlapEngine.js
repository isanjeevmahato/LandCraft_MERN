
/*
 * LandCraft basic overlap engine
 *
 * Coordinates are local planar X/Y values in metres.
 * This first version supports convex polygons only.
 */

function cross(a, b, c) {
  return (
    (b.x - a.x) * (c.y - a.y) -
    (b.y - a.y) * (c.x - a.x)
  );
}

function polygonArea(polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) {
    throw new Error("A polygon needs at least 3 points.");
  }

  let sum = 0;

  for (let i = 0; i < polygon.length; i++) {
    const current = polygon[i];
    const next = polygon[(i + 1) % polygon.length];

    if (
      !Number.isFinite(current.x) ||
      !Number.isFinite(current.y)
    ) {
      throw new Error("Every point needs valid X and Y coordinates.");
    }

    sum += current.x * next.y - next.x * current.y;
  }

  return Math.abs(sum) / 2;
}

function lineIntersection(start, end, clipStart, clipEnd) {
  const dx1 = end.x - start.x;
  const dy1 = end.y - start.y;
  const dx2 = clipEnd.x - clipStart.x;
  const dy2 = clipEnd.y - clipStart.y;

  const denominator = dx1 * dy2 - dy1 * dx2;

  if (Math.abs(denominator) < 1e-10) {
    return end;
  }

  const t =
    ((clipStart.x - start.x) * dy2 -
      (clipStart.y - start.y) * dx2) /
    denominator;

  return {
    x: start.x + t * dx1,
    y: start.y + t * dy1,
  };
}

function clipPolygon(subject, clip) {
  let output = [...subject];

  // Ensure the clipping polygon is counterclockwise.
  const clipPolygonCCW =
    signedArea(clip) < 0 ? [...clip].reverse() : clip;

  for (let i = 0; i < clipPolygonCCW.length; i++) {
    const clipStart = clipPolygonCCW[i];
    const clipEnd =
      clipPolygonCCW[(i + 1) % clipPolygonCCW.length];

    const input = output;
    output = [];

    if (input.length === 0) break;

    let start = input[input.length - 1];

    for (const end of input) {
      const endInside =
        cross(clipStart, clipEnd, end) >= -1e-10;

      const startInside =
        cross(clipStart, clipEnd, start) >= -1e-10;

      if (endInside) {
        if (!startInside) {
          output.push(
            lineIntersection(
              start,
              end,
              clipStart,
              clipEnd
            )
          );
        }

        output.push(end);
      } else if (startInside) {
        output.push(
          lineIntersection(
            start,
            end,
            clipStart,
            clipEnd
          )
        );
      }

      start = end;
    }
  }

  return output;
}

function signedArea(polygon) {
  let sum = 0;

  for (let i = 0; i < polygon.length; i++) {
    const current = polygon[i];
    const next = polygon[(i + 1) % polygon.length];

    sum += current.x * next.y - next.x * current.y;
  }

  return sum / 2;
}

export function comparePolygons(reference, rover) {
  const referenceArea = polygonArea(reference);
  const roverArea = polygonArea(rover);

  const intersectionPolygon = clipPolygon(reference, rover);

  const intersectionArea =
    intersectionPolygon.length >= 3
      ? polygonArea(intersectionPolygon)
      : 0;

  return {
    referenceArea,
    roverArea,
    intersectionArea,
    referenceOnlyArea: Math.max(
      0,
      referenceArea - intersectionArea
    ),
    roverOutsideArea: Math.max(
      0,
      roverArea - intersectionArea
    ),
    intersectionPolygon,
  };
}
