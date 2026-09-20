# Tests

Stubbed-DOM tests that run the real `index.html` game script under node with
virtual time. No browser needed.

```bash
node tests/harness.mjs      # 13 gameplay checks (title -> game over -> restart)
node tests/playtest.mjs     # swing smoothness: 0 frame-snaps allowed
node tests/enhancements.mjs # shake, SO CLOSE!, duck ceiling
node tests/draw-audit.mjs   # every frame repaints bg first, save/restore balanced
```

**Important:** these stubs do NOT render. A green suite does not prove the game
looks right. After any change touching `draw()` or its callees, the draw audit
must pass AND a human must eyeball the game (sandbox preview) before deploy.
On 2026-09-20 a dropped `drawBackground()` call passed all logic tests while
smearing frames in a real browser.
