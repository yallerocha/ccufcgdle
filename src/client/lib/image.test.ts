import assert from 'node:assert/strict';
import test from 'node:test';
import { cropGeometry } from './image';

// The crop window must always be fully covered by the photo — otherwise the
// exported JPEG would include blank edges the user never framed.
const CROP = 232;

function assertCovers(g: ReturnType<typeof cropGeometry>, label: string) {
  assert.ok(g.panX <= 0.001, `${label}: left edge gap (panX=${g.panX})`);
  assert.ok(g.panY <= 0.001, `${label}: top edge gap (panY=${g.panY})`);
  assert.ok(g.panX >= CROP - g.renderedW - 0.001, `${label}: right edge gap`);
  assert.ok(g.panY >= CROP - g.renderedH - 0.001, `${label}: bottom edge gap`);
}

test('cropGeometry keeps the window covered at any zoom, pan or aspect ratio', () => {
  const sizes: [number, number][] = [[4000, 3000], [800, 1600], [512, 512], [3000, 400]];
  for (const [w, h] of sizes) {
    for (const zoom of [1, 1.5, 3]) {
      for (const c of [0, 0.5, 1, -5, 7]) {
        assertCovers(cropGeometry(w, h, CROP, zoom, c, 1 - c), `${w}x${h} z${zoom} c${c}`);
      }
    }
  }
});

test('cropGeometry centres the photo at zoom 1', () => {
  const g = cropGeometry(1000, 500, CROP, 1, 0.5, 0.5);
  assert.equal(Math.round(g.renderedH), CROP); // short side covers exactly
  assert.equal(Math.round(g.panY), 0);
  assert.equal(Math.round(g.panX), Math.round((CROP - g.renderedW) / 2));
});

test('cropGeometry maps the window to a region inside the photo', () => {
  const [w, h] = [1200, 900];
  const g = cropGeometry(w, h, CROP, 2, 0.8, 0.2);
  // Same mapping squareCropToDataUrl uses to read pixels off the source.
  const x = -g.panX / g.scale;
  const y = -g.panY / g.scale;
  const side = CROP / g.scale;
  assert.ok(x >= 0 && y >= 0, 'crop starts inside the photo');
  assert.ok(x + side <= w + 0.001 && y + side <= h + 0.001, 'crop ends inside the photo');
});
