/**
 * Звуки как на piliapp random wheel:
 * - tick: blockly disconnect (Web Audio, т.к. тики идут после клика)
 * - bell: ion-sound bell_ring (HTML Audio)
 */

export const FORTUNE_WHEEL_SPIN_DURATION_MS = 4500;

const TICK_SRC = `${process.env.PUBLIC_URL ?? ''}/sounds/fortune-wheel/tick.mp3`;
const BELL_SRC = `${process.env.PUBLIC_URL ?? ''}/sounds/fortune-wheel/bell.mp3`;

const TICK_VOLUME = 1;
const TICK_SLOW_VOLUME = 0.62;
const BELL_VOLUME = 0.15;

const SPIN_EASING = { x1: 0.15, y1: 0.85, x2: 0.2, y2: 1 } as const;
const SLOW_PHASE_START = 0.52;

let audioContext: AudioContext | null = null;
let tickBuffer: AudioBuffer | null = null;
let tickBufferPromise: Promise<AudioBuffer | null> | null = null;
let bellAudio: HTMLAudioElement | null = null;
let spinRafId: number | null = null;

export type FortuneWheelSpinTickOptions = {
  segmentCount: number;
  startRotation: number;
  deltaRotation: number;
  durationMs?: number;
};

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor) {
    return null;
  }

  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContextCtor();
  }

  return audioContext;
};

const ensureAudioReady = async (): Promise<AudioContext | null> => {
  const ctx = getAudioContext();
  if (!ctx) {
    return null;
  }

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  } catch {
    return null;
  }

  return ctx;
};

const loadTickBuffer = async (ctx: AudioContext): Promise<AudioBuffer | null> => {
  if (tickBuffer) {
    return tickBuffer;
  }

  if (!tickBufferPromise) {
    tickBufferPromise = (async () => {
      try {
        const response = await fetch(TICK_SRC);
        if (!response.ok) {
          return null;
        }
        const data = await response.arrayBuffer();
        tickBuffer = await ctx.decodeAudioData(data);
        return tickBuffer;
      } catch {
        return null;
      }
    })();
  }

  return tickBufferPromise;
};

const getBellAudio = (): HTMLAudioElement => {
  if (!bellAudio) {
    bellAudio = new Audio(BELL_SRC);
    bellAudio.preload = 'auto';
  }
  return bellAudio;
};

const bezierComponent = (t: number, a: number, b: number): number => {
  const inv = 1 - t;
  return 3 * inv * inv * t * a + 3 * inv * t * t * b + t * t * t;
};

const easeSpin = (progress: number): number => {
  const clamped = Math.min(1, Math.max(0, progress));
  if (clamped <= 0) {
    return 0;
  }
  if (clamped >= 1) {
    return 1;
  }

  let low = 0;
  let high = 1;
  for (let i = 0; i < 14; i += 1) {
    const mid = (low + high) / 2;
    const x = bezierComponent(mid, SPIN_EASING.x1, SPIN_EASING.x2);
    if (x < clamped) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const t = (low + high) / 2;
  return bezierComponent(t, SPIN_EASING.y1, SPIN_EASING.y2);
};

export const prepareFortuneWheelSounds = async (): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (ctx) {
    await loadTickBuffer(ctx);
  }
};

export const unlockFortuneWheelAudio = (): void => {
  const ctx = getAudioContext();
  if (ctx?.state === 'suspended') {
    void ctx.resume();
  }

  void prepareFortuneWheelSounds();

  const bell = getBellAudio();
  bell.volume = BELL_VOLUME;
  if (bell.paused) {
    bell.muted = true;
    void bell
      .play()
      .then(() => {
        bell.pause();
        bell.currentTime = 0;
        bell.muted = false;
      })
      .catch(() => {
        bell.muted = false;
      });
  }
};

export const playFortuneWheelSpinStartSound = (): void => {
  void playFortuneWheelSpinTickSound(false);
};

export const playFortuneWheelSpinTickSound = async (slowPhase: boolean): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx) {
    return;
  }

  const buffer = await loadTickBuffer(ctx);
  if (!buffer) {
    return;
  }

  const source = ctx.createBufferSource();
  const gain = ctx.createGain();

  source.buffer = buffer;
  source.playbackRate.value = slowPhase ? 0.68 : 1.05;
  gain.gain.value = slowPhase ? TICK_SLOW_VOLUME : TICK_VOLUME;

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
};

export const startFortuneWheelSpinTicks = ({
  segmentCount,
  startRotation,
  deltaRotation,
  durationMs = FORTUNE_WHEEL_SPIN_DURATION_MS,
}: FortuneWheelSpinTickOptions): void => {
  stopFortuneWheelSpinTicks();

  if (segmentCount <= 0 || deltaRotation <= 0) {
    return;
  }

  const segmentAngle = 360 / segmentCount;
  const spinStart = performance.now();
  let lastTickRotation = startRotation;

  void playFortuneWheelSpinTickSound(false);

  const frame = (now: number) => {
    const elapsed = now - spinStart;
    const progress = Math.min(1, elapsed / durationMs);
    const eased = easeSpin(progress);
    const currentRotation = startRotation + deltaRotation * eased;
    const slowPhase = progress >= SLOW_PHASE_START;

    const crossed = Math.floor((currentRotation - lastTickRotation) / segmentAngle);
    if (crossed > 0) {
      for (let i = 0; i < crossed; i += 1) {
        void playFortuneWheelSpinTickSound(slowPhase);
      }
      lastTickRotation += crossed * segmentAngle;
    }

    if (progress < 1) {
      spinRafId = requestAnimationFrame(frame);
    } else {
      spinRafId = null;
    }
  };

  spinRafId = requestAnimationFrame(frame);
};

export const stopFortuneWheelSpinTicks = (): void => {
  if (spinRafId !== null) {
    cancelAnimationFrame(spinRafId);
    spinRafId = null;
  }
};

export const playFortuneWheelResultSound = (): void => {
  try {
    const bell = getBellAudio();
    bell.volume = BELL_VOLUME;
    bell.currentTime = 0;
    void bell.play();
  } catch {
    // ignore autoplay errors
  }
};
