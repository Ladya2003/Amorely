let audioContext: AudioContext | null = null;

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

export const unlockChatAudio = (): void => {
  const ctx = getAudioContext();
  if (ctx?.state === 'suspended') {
    void ctx.resume();
  }
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
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.04);
};

/** Отправка сообщения в чате. */
export const playChatSendSound = async (): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx) return;

  const start = ctx.currentTime;
  playTone(ctx, start, 520, 0.06, 0.07, 'sine');
  playTone(ctx, start + 0.04, 698.46, 0.08, 0.085, 'triangle');
  playTone(ctx, start + 0.07, 880, 0.1, 0.06, 'sine');
};

/** Удаление сообщения в чате. */
export const playChatDeleteSound = async (): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx) return;

  const start = ctx.currentTime;
  playTone(ctx, start, 420, 0.09, 0.075, 'triangle');
  playTone(ctx, start + 0.06, 311.13, 0.12, 0.065, 'sine');
  playTone(ctx, start + 0.1, 220, 0.14, 0.05, 'sine');
};
