'use client';

// Self-contained sound engine for O Show da Computação. Everything is synthesized
// with the Web Audio API — no audio files, no copyrighted assets. Covers the game
// SFX (select/correct/wrong/lifeline/start/win/stop) plus a low "suspense" music
// bed that plays while a question is on screen. Respects a persisted mute flag.

const MUTE_KEY = 'show-muted';

let ctx: AudioContext | null = null;
let muted = false;
try {
  muted = typeof localStorage !== 'undefined' && localStorage.getItem(MUTE_KEY) === '1';
} catch {
  /* storage blocked */
}

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Call on a user gesture (e.g. the Start button) so the browser lets audio play. */
export function unlockAudio(): void {
  if (!muted) ac();
}

export function isMuted(): boolean {
  return muted;
}

export function toggleMuted(): boolean {
  muted = !muted;
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* ignore */
  }
  if (muted) stopMusic();
  else ac();
  return muted;
}

// One shaped note: an oscillator with an attack/decay envelope, optional pitch glide.
function note(
  freq: number,
  when: number,
  dur: number,
  opts: { type?: OscillatorType; peak?: number; attack?: number; glideTo?: number } = {}
): void {
  const c = ac();
  if (!c || muted) return;
  const { type = 'sine', peak = 0.18, attack = 0.008, glideTo } = opts;
  const t = c.currentTime + when;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(peak, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

// ── SFX ───────────────────────────────────────────────────────────────────────
export function sfxSelect(): void {
  note(520, 0, 0.07, { type: 'square', peak: 0.08 });
}

export function sfxCorrect(): void {
  note(659, 0, 0.16, { type: 'triangle', peak: 0.16 });
  note(988, 0.11, 0.35, { type: 'triangle', peak: 0.2 });
}

export function sfxWrong(): void {
  note(196, 0, 0.5, { type: 'sawtooth', peak: 0.22, glideTo: 90 });
  note(146, 0.02, 0.5, { type: 'sawtooth', peak: 0.15, glideTo: 70 });
}

export function sfxLifeline(): void {
  note(300, 0, 0.28, { type: 'sine', peak: 0.14, glideTo: 1300 });
}

export function sfxStart(): void {
  [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.08, 0.28, { type: 'triangle', peak: 0.16 }));
}

export function sfxWin(): void {
  [523, 659, 784, 1047, 1319].forEach((f, i) => note(f, i * 0.1, 0.5, { type: 'triangle', peak: 0.2 }));
  note(1047, 0.5, 0.9, { type: 'sine', peak: 0.18 });
}

export function sfxStop(): void {
  note(784, 0, 0.18, { type: 'triangle', peak: 0.18 });
  note(1047, 0.1, 0.4, { type: 'triangle', peak: 0.2 });
}

// ── Suspense music bed ─────────────────────────────────────────────────────────
// A sequenced minor-key ostinato in the 220–440Hz range (laptop speakers roll
// off hard below ~200Hz, so a low drone is inaudible on most hardware). Eighth
// notes at ~136 BPM with a low pulse every bar — the classic "thinking" bed.
let music: { timer: number } | null = null;

export function startMusic(): void {
  const c = ac();
  if (!c || muted) return;
  stopMusic();

  // A-minor tension loop; the 6th step leans on F (349.23) for unease.
  const seq = [220, 261.63, 329.63, 261.63, 220, 261.63, 349.23, 329.63];
  let step = 0;
  const tick = () => {
    if (muted) return;
    note(seq[step % seq.length], 0, 0.17, { type: 'triangle', peak: 0.09 });
    if (step % 8 === 0) note(110, 0, 0.55, { type: 'sine', peak: 0.16 }); // low heartbeat
    if (step % 8 === 4) note(116.54, 0, 0.55, { type: 'sine', peak: 0.13 }); // Bb2 tension
    step++;
  };
  tick();
  music = { timer: window.setInterval(tick, 220) };
}

export function stopMusic(): void {
  if (!music) return;
  window.clearInterval(music.timer);
  music = null;
}

// ── Lobby / intro music ─────────────────────────────────────────────────────────
// The real Show do Milhão opening theme, looped, playing only on the intro screen.
// A plain <audio> element (native loop) — no Web Audio needed for file playback.
let lobby: HTMLAudioElement | null = null;

export function startLobbyMusic(): void {
  if (typeof window === 'undefined' || muted) return;
  if (!lobby) {
    lobby = new Audio('/lobby-theme.mp3');
    lobby.loop = true;
    lobby.volume = 0.6;
  }
  // play() may reject until the user has interacted with the page; that's fine —
  // the intro effect retries on the first gesture.
  void lobby.play().catch(() => {});
}

export function stopLobbyMusic(): void {
  if (!lobby) return;
  lobby.pause();
  lobby.currentTime = 0;
}
