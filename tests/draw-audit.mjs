// Draw-call audit: records every canvas op per rAF frame across all game states
// (firing shots to exercise the shake/recoil path) and asserts:
//   1. every frame's FIRST fillRect is the full-sky background repaint
//      fillRect(0,0,960,468) -- this exact call was once dropped by a bad edit,
//      which left smeared/ghosted frames in real browsers while logic tests passed.
//   2. save()/restore() are balanced within every frame.
// Run: node tests/draw-audit.mjs
import { setupGame } from './stubs.mjs';

const { els, advance, fire, drawlog, D } = setupGame({ logDraw: true });

fire(els.game, 'pointerdown', 480, 300); advance(300); advance(2200);
let shots = 0;
for (let i = 0; i < 40 && D().state === 'play'; i++) {
  const d = D().duck();
  if (d && d.state === 'fly') { fire(els.game, 'pointermove', d.x, d.y); fire(els.game, 'pointerdown', d.x, d.y); shots++; }
  advance(400);
}

const byFrame = {};
for (const [f, op, args] of drawlog) (byFrame[f] = byFrame[f] || []).push(`${op}(${args.join(',')})`);
let badBg = 0, badBal = 0, n = 0;
for (const id of Object.keys(byFrame)) {
  const ops = byFrame[id]; n++;
  const firstFill = ops.find((o) => o.startsWith('fillRect('));
  if (firstFill !== 'fillRect(0,0,960,468)') { badBg++; if (badBg < 3) console.log(`  frame ${id} first fillRect: ${firstFill}`); }
  let bal = 0;
  for (const o of ops) { if (o === 'save()') bal++; if (o === 'restore()') bal--; }
  if (bal !== 0) badBal++;
}
console.log(`frames audited: ${n} | shots: ${shots}`);
console.log(`frames missing background-first repaint: ${badBg} (expect 0)`);
console.log(`frames with unbalanced save/restore: ${badBal} (expect 0)`);
const ok = n > 100 && badBg === 0 && badBal === 0;
console.log(ok ? 'DRAW AUDIT PASS' : 'DRAW AUDIT FAIL');
process.exit(ok ? 0 : 1);
