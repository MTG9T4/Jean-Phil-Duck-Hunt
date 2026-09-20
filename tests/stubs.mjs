// Shared stub environment for testing Jean Phil's Duck Hunt (index.html) under node.
// Replaces the browser DOM/canvas/audio with virtual-time stubs, then evals the
// game's <script> so tests can drive it via synthetic pointer events.
//
// Usage:
//   import { setupGame } from './stubs.mjs';
//   const { els, advance, fire, shootAt, D } = setupGame();
//   fire(els.game, 'pointerdown', 480, 300); advance(300);
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const noop = () => {};

export function setupGame(opts = {}) {
  // ---- virtual time ----
  let __now = 0;
  const __timers = [];
  const __setTimeout = (fn, ms) => { const t = { time: __now + ms, fn, repeat: 0 }; __timers.push(t); return t; };
  const __setInterval = (fn, ms) => { const t = { time: __now + ms, fn, repeat: ms }; __timers.push(t); return t; };
  const __clear = (t) => { const i = __timers.indexOf(t); if (i >= 0) __timers.splice(i, 1); };
  function advance(ms) {
    const end = __now + ms;
    let guard = 0;
    while (guard++ < 500000) {
      let bi = -1, bt = Infinity;
      for (let i = 0; i < __timers.length; i++) { if (__timers[i].time < bt) { bt = __timers[i].time; bi = i; } }
      if (bi < 0 || bt > end) break;
      const t = __timers.splice(bi, 1)[0]; __now = t.time; t.fn();
      if (t.repeat) { t.time = __now + t.repeat; __timers.push(t); }
    }
    __now = end;
  }

  // ---- canvas stub (optionally logs every draw call per rAF frame) ----
  const drawlog = []; // [frameId, method, args]
  let __frame = 0;
  const ctxStub = new Proxy({}, {
    get(t, p) {
      if (p === 'canvas') return {};
      if (p === 'createLinearGradient' || p === 'createRadialGradient') {
        return (...a) => { if (opts.logDraw) drawlog.push([__frame, p, a]); return { addColorStop: noop }; };
      }
      if (p === 'measureText') return () => ({ width: 10 });
      return (...a) => { if (opts.logDraw) drawlog.push([__frame, p, a]); };
    },
    set() { return true; }
  });

  function makeEl(id) {
    const handlers = {};
    return {
      id, _handlers: handlers, textContent: '', innerHTML: '',
      style: new Proxy({}, { get: (t, p) => t[p] ?? '', set: (t, p, v) => (t[p] = v, true) }),
      dataset: {}, width: 960, height: 600,
      classList: { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); }, toggle(c) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); }, contains(c) { return this._s.has(c); } },
      addEventListener: (t, f) => { (handlers[t] = handlers[t] || []).push(f); },
      removeEventListener: () => {}, appendChild: () => {}, remove: () => {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 600 }),
      getContext: () => ctxStub,
    };
  }
  const els = { game: makeEl('game'), mute: makeEl('mute') };

  globalThis.document = { getElementById: (id) => els[id] || makeEl(id), createElement: () => makeEl('dyn'), body: makeEl('body'), hidden: false, addEventListener: () => {} };
  globalThis.Image = class { constructor() { this._s = ''; this.onload = null; this.width = 0; this.height = 0; } set src(v) { this._s = v; this.width = 448; this.height = 448; if (this.onload) this.onload(); } get src() { return this._s; } };
  function makeAC() {
    return {
      currentTime: 0, state: 'running', sampleRate: 44100, destination: {},
      resume: () => Promise.resolve(),
      createOscillator: () => ({ type: '', frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }),
      createGain: () => ({ gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }),
      createBuffer: (ch, len) => ({ getChannelData: () => new Float32Array(len) }),
      createBufferSource: () => ({ buffer: null, connect() {}, start() {} }),
      createBiquadFilter: () => ({ type: '', frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }),
    };
  }
  globalThis.window = globalThis;
  globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'node' }, configurable: true });
  globalThis.localStorage = { _m: {}, getItem(k) { return this._m[k] ?? null; }, setItem(k, v) { this._m[k] = String(v); }, removeItem(k) { delete this._m[k]; } };
  globalThis.innerWidth = 960; globalThis.innerHeight = 600; globalThis.devicePixelRatio = 1;
  globalThis.AudioContext = makeAC; globalThis.webkitAudioContext = makeAC;
  globalThis.setTimeout = __setTimeout; globalThis.setInterval = __setInterval;
  globalThis.clearTimeout = __clear; globalThis.clearInterval = __clear;
  globalThis.requestAnimationFrame = (fn) => __setTimeout(() => { __frame++; fn(); }, 16);
  globalThis.performance = { now: () => __now };

  function fire(el, type, x, y) {
    (el._handlers[type] || []).forEach((f) => f.call(el, { clientX: x, clientY: y, pointerType: 'mouse', preventDefault() {}, stopPropagation() {} }));
  }
  const shootAt = (x, y) => { fire(els.game, 'pointermove', x, y); fire(els.game, 'pointerdown', x, y); };

  // ---- load the game ----
  const html = fs.readFileSync(path.join(__dir, '..', 'index.html'), 'utf8');
  const src = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  try { eval(src); } catch (e) { console.log('INIT THREW:', e.message); process.exit(1); }

  return { els, advance, fire, shootAt, drawlog, now: () => __now, D: () => globalThis.__duck };
}
