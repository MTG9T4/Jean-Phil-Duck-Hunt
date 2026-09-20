// Full gameplay regression: title -> intro -> play -> continuous gameplay (no mid-round mood popups) ->
// round clear (smile reaction) -> round 2 -> game over (cry reaction) -> restart -> mute -> best-score persistence.
// Run: node tests/harness.mjs   (expect ALL CHECKS DONE, exit 0)
import { setupGame } from './stubs.mjs';

const { els, advance, fire, shootAt, D } = setupGame();
let fail = 0;
const check = (n, cond, label) => { console.log(`${n}. ${label}: ${cond ? 'OK' : 'FAIL'}`); if (!cond) fail++; };

advance(400);
check(1, D().state === 'title', 'boot state title');
shootAt(480, 300); advance(300);
check(2, D().state === 'intro', 'click -> intro');
advance(1500);
check(3, D().state === 'play' && !!D().duck(), 'intro -> play with duck');

let d = D().duck(); shootAt(d.x, d.y); advance(200);
check(4, D().score > 0 && D().mood === 'normal' && D().bullets === 2, `hit duck (score ${D().score}, continuous gameplay: mood ${D().mood}, bullets ${D().bullets})`);
advance(500);
check(5, D().duckIdx === 1 && !!D().duck(), 'next duck spawns quickly');

for (let i = 0; i < 40 && D().duck(); i++) advance(200);
check(6, D().mood === 'normal', `escape -> continuous gameplay (mood ${D().mood})`);
advance(500);
check(7, D().duckIdx === 2 && !!D().duck(), 'resolve -> next duck');

shootAt(30, 550); advance(100); shootAt(930, 550); advance(100); shootAt(480, 550); advance(100);
check(8, D().bullets === 0 && D().mood === 'normal', `shells out -> continuous gameplay (bullets ${D().bullets}, mood ${D().mood})`);
advance(500);

let guard = 0;
while (D().state === 'play' && guard++ < 40) {
  const dd = D().duck();
  if (dd && dd.state === 'fly') shootAt(dd.x, dd.y);
  advance(600);
}
check(9, D().state === 'clear' && D().round === 1 && D().mood === 'happy' && D().hits >= 3, `round clear -> smile screenshot (hits ${D().hits}, mood ${D().mood})`);
advance(2200);
check(10, D().state === 'intro' && D().round === 2, 'round 2 intro');
advance(1500);

guard = 0;
while (D().state === 'play' && guard++ < 120) { advance(500); } // let every duck escape in round 2
check(11, D().state === 'gameover' && D().mood === 'crying', `game over on quota miss -> crying reaction (state ${D().state}, mood ${D().mood})`);
const best = globalThis.localStorage.getItem('jp_duck_best');
check(12, best !== null && Number(best) >= 0, `best score persisted (${best})`);

shootAt(480, 300); advance(300);
check(13, D().state === 'intro' && D().round === 1 && D().score === 0, 'restart resets game');

fire(els.mute, 'pointerdown', 10, 10); advance(50);
console.log('14. mute toggled without throwing: OK');

console.log(fail === 0 ? 'ALL CHECKS DONE' : `${fail} CHECKS FAILED`);
process.exit(fail === 0 ? 0 : 1);
