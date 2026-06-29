const BATCH_WINDOW_MS = 120;
const MIN_PLAY_INTERVAL_MS = 260;

let audioContext: AudioContext | null = null;
let batchCount = 0;
let batchTimer: number | null = null;
let queuedPlays = 0;
let isPlayingQueue = false;
let lastPlayedAt = 0;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;

  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor) return null;

  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContextCtor();
  }

  return audioContext;
};

const ensureAudioReady = async (): Promise<AudioContext | null> => {
  const ctx = getAudioContext();
  if (!ctx) return null;

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  } catch {
    return null;
  }

  return ctx;
};

const playTone = (
  ctx: AudioContext,
  start: number,
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine'
) => {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
};

const playCurrencyAwardSoundOnce = async (mergedAwards: number) => {
  const ctx = await ensureAudioReady();
  if (!ctx) return;

  const start = ctx.currentTime;
  const volume = Math.min(0.16, 0.085 + Math.log2(mergedAwards + 1) * 0.018);

  playTone(ctx, start, 987.77, 0.1, volume * 0.92, 'sine');
  playTone(ctx, start + 0.05, 1318.51, 0.12, volume, 'triangle');
  playTone(ctx, start + 0.08, 1567.98, 0.08, volume * 0.55, 'sine');
};

const drainSoundQueue = async () => {
  if (isPlayingQueue) return;
  isPlayingQueue = true;

  while (queuedPlays > 0) {
    const mergedAwards = queuedPlays;
    queuedPlays = 0;

    const elapsed = Date.now() - lastPlayedAt;
    if (elapsed < MIN_PLAY_INTERVAL_MS) {
      await new Promise((resolve) => {
        window.setTimeout(resolve, MIN_PLAY_INTERVAL_MS - elapsed);
      });
    }

    await playCurrencyAwardSoundOnce(mergedAwards);
    lastPlayedAt = Date.now();
  }

  isPlayingQueue = false;
};

const flushBatch = () => {
  batchTimer = null;
  if (batchCount <= 0) return;

  queuedPlays += batchCount;
  batchCount = 0;
  void drainSoundQueue();
};

/** Звук начисления аморок; быстрые серии сливаются, очередь сглаживает наложения. */
export const playCurrencyAwardSound = (): void => {
  batchCount += 1;

  if (batchTimer !== null) {
    window.clearTimeout(batchTimer);
  }

  batchTimer = window.setTimeout(flushBatch, BATCH_WINDOW_MS);
};
