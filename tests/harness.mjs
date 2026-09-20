// Full gameplay regression: title -> intro -> play -> hit / escape / shells-out ->
// round clear -> round 2 -> game over -> restart -> mute -> best-score persistence.
// Run: node tests/harness.mjs   (expect ALL CHECKS DONE, exit 0)
import { setupGame } from './stubs.mjs';

const { els, advance, fire, shootAt, D } = setupGame();
let fail = 0;
const check = (n, cond, label) => { console.log(`${n}. ${label}: ${cond ? 'OK' : 'FAIL'}`); if (!cond) fail++; };

advance(400);
check(1, D().state === 'title', 'boot state title');
shootAt(480, 300); advance(300);
check(2, D().state === 'intro', 'click -> intro');
advance(2200);
check(3, D().state === 'play' && !!D().duck(), 'intro -> play with duck');

let d = D().duck(); shootAt(d.x, d.y); advance(200);
check(4, D().score > 0 && D().mood === 'happy' && D().bullets === 2, `hit duck (score ${D().score}, mood ${D().mood}, bullets ${D().bullets})`);
advance(2200);
check(5, D().duckIdx === 1 && !!D().duck(), 'next duck spawns');

for (let i = 0; i < 40 && D().duck(); i++) advance(400);
check(6, D().mood === 'crying', `escape -> crying (mood ${D().mood})`);
advance(2500);
check(7, D().duckIdx === 2 && !!D().duck(), 'resolve -> next duck');

shootAt(30, 550); advance(100); shootAt(930, 550); advance(100); shootAt(480, 550); advance(200);
check(8, D().bullets === 0 && D().mood === 'crying', `shells out (bullets ${D().bullets}, mood ${D().mood})`);
advance(2600);

let guard = 0;
while (D().state === 'play' && guard++ < 40) {
  const dd = D().duck();
  if (dd && dd.state === 'fly') shootAt(dd.x, dd.y);
  advance(2300);
}
check(9, D().state === 'clear' && D().round === 1 && D().hits >= 6, `round clear (hits ${D().hits})`);
advance(2600);
check(10, D().state === 'intro' && D().round === 2, 'round 2 intro');
advance(2200);

guard = 0;
while (D().state === 'play' && guard++ < 60) { advance(2300); } // let every duck escape
check(11, D().state === 'gameover', `game over on quota miss (state ${D().state})`);
const best = globalThis.localStorage.getItem('jp_duck_best');
check(12, best !== null && Number(best) >= 0, `best score persisted (${best})`);

shootAt(480, 300); advance(300);
check(13, D().state === 'intro' && D().round === 1 && D().score === 0, 'restart resets game');

fire(els.mute, 'pointerdown', 10, 10); advance(50);
console.log('14. mute toggled without throwing: OK');

console.log(fail === 0 ? 'ALL CHECKS DONE' : `${fail} CHECKS FAILED`);
process.exit(fail === 0 ? 0 : 1);
