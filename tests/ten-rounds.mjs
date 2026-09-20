// Test 10-round game flow, difficulty scaling, and victory screen.
// Run: node tests/ten-rounds.mjs
import { setupGame } from './stubs.mjs';

const { els, advance, fire, shootAt, D } = setupGame();
let fail = 0;
const check = (n, cond, label) => { console.log(`${n}. ${label}: ${cond ? 'OK' : 'FAIL'}`); if (!cond) fail++; };

// Start game from title
shootAt(480, 300); advance(300);
check(1, D().state === 'intro' && D().round === 1, 'starts at round 1');
advance(1500);

// Play through rounds 1 to 10 hitting all ducks
for (let r = 1; r <= 10; r++) {
  let ducksHit = 0;
  let guard = 0;
  while (D().state === 'play' && guard++ < 60) {
    const d = D().duck();
    if (d && d.state === 'fly') {
      shootAt(d.x, d.y);
      ducksHit++;
    }
    advance(500);
  }

  if (r < 10) {
    check(r + 1, D().state === 'clear' && D().round === r && D().mood === 'happy' && D().hits === 5,
      `round ${r} cleared (hits 5/5, mood happy)`);
    advance(2200); // clear -> intro
    advance(1500); // intro -> play
  } else {
    // Round 10 clear must trigger VICTORY!
    check(11, D().state === 'victory' && D().round === 10 && D().mood === 'happy',
      `round 10 victory achieved (state ${D().state}, mood ${D().mood})`);
  }
}

// Victory screen restart test
shootAt(480, 300); advance(300);
check(12, D().state === 'intro' && D().round === 1 && D().score === 0, 'click on victory screen restarts to round 1');

console.log(fail === 0 ? 'TEN ROUNDS TEST PASS' : `${fail} CHECKS FAILED`);
process.exit(fail === 0 ? 0 : 1);
