// Enhancement checks: screen shake fires on shoot, SO CLOSE! near-miss banner,
// ducks stay above Jean Phil's head in the center column (y <= 330 there).
// Run: node tests/enhancements.mjs
import { setupGame } from './stubs.mjs';

const { els, advance, fire, D } = setupGame();
let fail = 0;
const check = (n, cond, label) => { console.log(`${n}. ${label}: ${cond ? 'OK' : 'FAIL'}`); if (!cond) fail++; };

fire(els.game, 'pointerdown', 480, 300); advance(300); advance(2200);

const d0 = D().duck();
fire(els.game, 'pointermove', d0.x, d0.y); fire(els.game, 'pointerdown', d0.x, d0.y);
check(1, D().shake > 0, `screen shake triggers on shoot (shakeT=${D().shake.toFixed(3)})`);
advance(300);

let d = null, g2 = 0;
while ((!(d = D().duck()) || d.x < 80 || d.x > 880) && g2++ < 40) advance(100);
const offset = d.x > 480 ? -55 : 55;
fire(els.game, 'pointerdown', d.x + offset, d.y); advance(150); // HIT_R=40, near-miss < 68
check(2, D().banner === 'SO CLOSE!', `near-miss banner ("${D().banner}")`);
advance(1000);

let maxY = 0, guard = 0;
while ((D().state === 'play' || D().state === 'clear') && guard++ < 300) {
  const dd = D().duck();
  if (dd && dd.state === 'fly' && Math.abs(dd.x - 480) < 210) maxY = Math.max(maxY, dd.y);
  advance(200);
}
check(3, maxY > 0 && maxY <= 330, `duck ceiling in center column (max y=${maxY.toFixed(0)}, expect <=330)`);

console.log(fail === 0 ? 'ENHANCEMENTS PASS' : 'ENHANCEMENTS FAIL');
process.exit(fail === 0 ? 0 : 1);
