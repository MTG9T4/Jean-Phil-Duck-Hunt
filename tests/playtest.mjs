// Swing smoothness playtest: plays like a human (aim lag, rapid double-taps,
// wild mouse wiggles) and records Jean Phil's swing every 16ms frame.
// Fails if any single frame jumps more than 0.15 rad (a visible snap).
// Run: node tests/playtest.mjs
import { setupGame } from './stubs.mjs';

const { els, advance, fire, D } = setupGame();
const swings = [];
const snaps = [];
let lastSwing = 0;
const step = (ms) => {
  let r = ms;
  while (r > 0) { const q = Math.min(16, r); advance(q); r -= q; const s = D().aim; swings.push(s); if (Math.abs(s - lastSwing) > 0.15) snaps.push([lastSwing, s]); lastSwing = s; }
};

fire(els.game, 'pointerdown', 480, 300); step(300); step(2200);
let cx = 480, cy = 300, shots = 0, ducksSeen = 0, guard = 0;
while (D().state === 'play' && guard++ < 400) {
  const d = D().duck();
  if (!d || d.state !== 'fly') { step(100); continue; }
  ducksSeen++;
  for (let i = 0; i < 12; i++) { cx += (d.x - cx) * 0.25; cy += (d.y - cy) * 0.25; fire(els.game, 'pointermove', cx, cy); step(16); const dd = D().duck(); if (!dd || dd.state !== 'fly') break; }
  const dd = D().duck();
  if (dd && dd.state === 'fly' && Math.hypot(dd.x - cx, dd.y - cy) < 60) {
    fire(els.game, 'pointerdown', cx, cy); shots++; step(16);
    if (shots % 3 === 0) { fire(els.game, 'pointerdown', cx + 30, cy - 20); shots++; step(16); } // rapid double-tap
  }
  for (let i = 0; i < 6; i++) { fire(els.game, 'pointermove', 200 + Math.random() * 560, 150 + Math.random() * 300); step(16); }
  if (ducksSeen > 14) break;
}
const maxSwing = Math.max(...swings.map(Math.abs));
const nanCount = swings.filter((s) => !isFinite(s)).length;
console.log(`shots: ${shots} | max swing: ${maxSwing.toFixed(3)} | snaps: ${snaps.length} | NaN: ${nanCount} | final: ${D().aim}`);
snaps.slice(0, 5).forEach(([a, b]) => console.log(`  snap ${a.toFixed(3)} -> ${b.toFixed(3)}`));
const ok = snaps.length === 0 && nanCount === 0 && D().aim === 0;
console.log(ok ? 'PLAYTEST PASS' : 'PLAYTEST FAIL');
process.exit(ok ? 0 : 1);
