import { useEffect, useRef } from 'react';

const TIMER_LOW_THRESHOLD = 10;

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

/** Разблокировать аудио по клику (Ready, Tap, ответ). */
export const unlockGameAudio = (): void => {
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

/** Кнопка «Играть» на странице игры. */
export const playGamePlayButtonSound = async (): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx) return;

  const start = ctx.currentTime;
  playTone(ctx, start, 392, 0.08, 0.1, 'sine');
  playTone(ctx, start + 0.06, 523.25, 0.1, 0.11, 'sine');
  playTone(ctx, start + 0.12, 659.25, 0.14, 0.09, 'triangle');
};

/** Нажатие «Готов» / кружок готовности. */
export const playGameReadySound = async (): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx) return;

  const start = ctx.currentTime;
  playTone(ctx, start, 440, 0.07, 0.11, 'sine');
  playTone(ctx, start + 0.05, 554.37, 0.12, 0.1, 'triangle');
};

/** Старт раунда после лобби-countdown. */
export const playRoundStartSound = async (): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx) return;

  const start = ctx.currentTime;
  playTone(ctx, start, 329.63, 0.12, 0.16, 'sine');
  playTone(ctx, start + 0.07, 493.88, 0.14, 0.15, 'sine');
  playTone(ctx, start + 0.14, 659.25, 0.2, 0.16, 'triangle');
  playTone(ctx, start + 0.21, 783.99, 0.28, 0.14, 'sine');
  playTone(ctx, start + 0.28, 987.77, 0.32, 0.12, 'triangle');
};

/** Кнопка «Следующий раунд» / «Играть дальше». */
export const playNextRoundSound = async (): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx) return;

  const start = ctx.currentTime;
  playTone(ctx, start, 349.23, 0.09, 0.1, 'sine');
  playTone(ctx, start + 0.07, 440, 0.11, 0.11, 'sine');
  playTone(ctx, start + 0.14, 554.37, 0.15, 0.1, 'triangle');
};

/** Тик лобби перед стартом раунда (3, 2, 1…). */
export const playLobbyCountdownTick = async (secondsLeft: number): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx || secondsLeft <= 0) return;

  const start = ctx.currentTime;
  const pitch = 330 + Math.max(0, 4 - secondsLeft) * 55;
  playTone(ctx, start, pitch, 0.1, 0.13, 'sine');
  if (secondsLeft <= 3) {
    playTone(ctx, start + 0.05, pitch * 1.5, 0.08, 0.06, 'triangle');
  }
};

/** Тик срочного таймера (красная зона, ≤10 сек). */
export const playTimerUrgentTick = async (secondsLeft: number): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx || secondsLeft <= 0 || secondsLeft > TIMER_LOW_THRESHOLD) return;

  const start = ctx.currentTime;
  const urgency = (TIMER_LOW_THRESHOLD - secondsLeft + 1) / TIMER_LOW_THRESHOLD;
  playTone(ctx, start, 180 + urgency * 120, 0.09, 0.07 + urgency * 0.05, secondsLeft <= 3 ? 'square' : 'triangle');
};

/** Время раунда вышло. */
export const playTimerExpiredSound = async (): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx) return;

  const start = ctx.currentTime;
  playTone(ctx, start, 220, 0.18, 0.12, 'sawtooth');
  playTone(ctx, start + 0.12, 165, 0.22, 0.1, 'sine');
};

/** Успешный раунд (confetti). */
export const playRoundSuccessSound = async (): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx) return;

  const start = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, index) => {
    playTone(ctx, start + index * 0.07, freq, 0.22, 0.09, index === notes.length - 1 ? 'triangle' : 'sine');
  });
};

/** Неуспешный раунд. */
export const playRoundFailureSound = async (): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx) return;

  const start = ctx.currentTime;
  playTone(ctx, start, 349.23, 0.2, 0.1, 'sine');
  playTone(ctx, start + 0.14, 293.66, 0.28, 0.09, 'sine');
  playTone(ctx, start + 0.28, 246.94, 0.35, 0.07, 'triangle');
};

const TAP_SOUND_COUNT = 6;
let lastTapSoundIndex = -1;

/** Очень тихий вариативный звук тапа в тыкалке. */
export const playTapSound = async (): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx) return;

  let index = Math.floor(Math.random() * TAP_SOUND_COUNT);
  if (index === lastTapSoundIndex) {
    index = (index + 1) % TAP_SOUND_COUNT;
  }
  lastTapSoundIndex = index;

  const start = ctx.currentTime;
  const baseFrequency = 280 + index * 38 + Math.random() * 24;
  const waveTypes: OscillatorType[] = ['sine', 'triangle', 'sine', 'triangle', 'sine', 'triangle'];
  playTone(ctx, start, baseFrequency, 0.035, 0.028 + index * 0.002, waveTypes[index]);

  if (index % 2 === 0) {
    playTone(ctx, start + 0.008, baseFrequency * 1.8, 0.025, 0.012, 'sine');
  }
};

/** Лобби-countdown: тики и звук старта раунда. */
export const useLobbyCountdownSound = (
  secondsLeft: number,
  inLobby: boolean,
  roundActive: boolean
) => {
  const previousSecondsRef = useRef<number | null>(null);
  const roundStartPlayedRef = useRef(false);

  useEffect(() => {
    if (inLobby) {
      if (secondsLeft > 0 && previousSecondsRef.current === null) {
        roundStartPlayedRef.current = false;
      }

      const previous = previousSecondsRef.current;

      if (secondsLeft <= 0) {
        if (previous === 1 && !roundStartPlayedRef.current) {
          roundStartPlayedRef.current = true;
          void playRoundStartSound();
        }
        previousSecondsRef.current = null;
        return;
      }

      if (previous !== secondsLeft) {
        void playLobbyCountdownTick(secondsLeft);
      }

      previousSecondsRef.current = secondsLeft;
      return;
    }

    if (roundActive && !roundStartPlayedRef.current && previousSecondsRef.current !== null) {
      roundStartPlayedRef.current = true;
      void playRoundStartSound();
    }

    if (!inLobby) {
      previousSecondsRef.current = null;
    }
  }, [secondsLeft, inLobby, roundActive]);
};

/** Таймер раунда: срочные тики и окончание времени. */
export const useRoundTimerSound = (secondsLeft: number, active: boolean) => {
  const previousSecondsRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      previousSecondsRef.current = null;
      return;
    }

    const previous = previousSecondsRef.current;
    if (previous !== null && secondsLeft < previous) {
      if (secondsLeft === 0) {
        void playTimerExpiredSound();
      } else if (secondsLeft <= TIMER_LOW_THRESHOLD) {
        void playTimerUrgentTick(secondsLeft);
      }
    }

    previousSecondsRef.current = secondsLeft;
  }, [secondsLeft, active]);
};

export const playCliffBuySound = async (itemId?: 'iron_pickaxe' | 'copper_pickaxe' | 'axe'): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx) return;
  const start = ctx.currentTime;
  playTone(ctx, start, 987.77, 0.1, 0.12, 'sine');
  playTone(ctx, start + 0.05, 1318.51, 0.12, 0.13, 'triangle');
  playTone(ctx, start + 0.09, 1567.98, 0.1, 0.08, 'sine');
  if (!itemId) {
    playTone(ctx, start + 0.14, 784, 0.14, 0.07, 'triangle');
    return;
  }
  switch (itemId) {
    case 'axe':
      playTone(ctx, start + 0.12, 330, 0.14, 0.16, 'sawtooth');
      playTone(ctx, start + 0.18, 196, 0.16, 0.14, 'square');
      playTone(ctx, start + 0.26, 130, 0.18, 0.12, 'sawtooth');
      return;
    case 'iron_pickaxe':
    case 'copper_pickaxe':
      playTone(ctx, start + 0.14, 784, 0.14, 0.07, 'triangle');
      return;
    default: {
      const exhaustive: never = itemId;
      return exhaustive;
    }
  }
};

export const playCliffMineTapSound = async (): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx) return;
  const start = ctx.currentTime;
  playTone(ctx, start, 140 + Math.random() * 40, 0.05, 0.06, 'square');
};

export const playCliffOreDropSound = async (): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx) return;
  const start = ctx.currentTime;
  playTone(ctx, start, 392, 0.08, 0.1, 'triangle');
  playTone(ctx, start + 0.07, 523.25, 0.12, 0.09, 'sine');
};

export const playCliffWoodBreakSound = async (): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx) return;
  const start = ctx.currentTime;
  playTone(ctx, start, 260, 0.1, 0.16, 'sawtooth');
  playTone(ctx, start + 0.05, 170, 0.12, 0.14, 'square');
  playTone(ctx, start + 0.11, 120, 0.16, 0.13, 'sawtooth');
  playTone(ctx, start + 0.18, 85, 0.14, 0.1, 'square');
};

export const playCliffThrowSound = async (): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx) return;
  playTone(ctx, ctx.currentTime, 310, 0.08, 0.07, 'sine');
};

export const playCliffHitSound = async (): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx) return;
  const start = ctx.currentTime;
  playTone(ctx, start, 523.25, 0.08, 0.1, 'triangle');
  playTone(ctx, start + 0.05, 783.99, 0.12, 0.09, 'sine');
};

export const playCliffMissSound = async (): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx) return;
  playTone(ctx, ctx.currentTime, 196, 0.12, 0.07, 'sine');
};

export const playCliffBridgeRepairSound = async (): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx) return;
  const start = ctx.currentTime;
  [392, 494, 587, 784].forEach((freq, index) => {
    playTone(ctx, start + index * 0.08, freq, 0.18, 0.08, index === 3 ? 'triangle' : 'sine');
  });
};

const playCliffLiftRumble = (ctx: AudioContext, start: number, duration: number, volume: number) => {
  const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < sampleCount; index += 1) {
    samples[index] = (Math.random() * 2 - 1) * (1 - index / sampleCount);
  }

  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(180, start);
  filter.frequency.exponentialRampToValueAtTime(360, start + duration * 0.7);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(start);
};

export const playCliffLiftRiseSound = async (): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx) return;
  const start = ctx.currentTime;

  playTone(ctx, start, 220, 0.1, 0.06, 'triangle');
  playTone(ctx, start + 0.14, 196, 0.12, 0.055, 'sine');
  playCliffLiftRumble(ctx, start + 0.48, 2.15, 0.08);
  playTone(ctx, start + 0.5, 82, 0.7, 0.05, 'sawtooth');
  playTone(ctx, start + 1.05, 98, 0.7, 0.045, 'square');
  playTone(ctx, start + 1.6, 123, 0.55, 0.04, 'sawtooth');
  playTone(ctx, start + 2.15, 392, 0.22, 0.06, 'sine');
  playTone(ctx, start + 2.3, 523.25, 0.26, 0.055, 'triangle');
  playTone(ctx, start + 2.46, 659.25, 0.28, 0.05, 'sine');
};

export const playCliffRopeSwingSound = async (): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx) return;
  const start = ctx.currentTime;
  playTone(ctx, start, 196, 0.16, 0.05, 'sine');
  playTone(ctx, start + 0.06, 247, 0.18, 0.045, 'triangle');
  playTone(ctx, start + 0.14, 165, 0.2, 0.04, 'sine');
};

export const playCliffRopeJumpSound = async (): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx) return;
  const start = ctx.currentTime;
  playTone(ctx, start, 392, 0.08, 0.07, 'triangle');
  playTone(ctx, start + 0.05, 523.25, 0.1, 0.06, 'sine');
  playTone(ctx, start + 0.12, 659.25, 0.12, 0.05, 'triangle');
};

export const playCliffRopeFallSound = async (): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx) return;
  const start = ctx.currentTime;
  playTone(ctx, start, 247, 0.1, 0.07, 'sawtooth');
  playTone(ctx, start + 0.08, 185, 0.14, 0.08, 'square');
  playTone(ctx, start + 0.18, 123, 0.2, 0.07, 'sawtooth');
  playTone(ctx, start + 0.32, 82, 0.22, 0.06, 'sine');
};

export const playCliffSpeechSound = async (): Promise<void> => {
  const ctx = await ensureAudioReady();
  if (!ctx) return;
  const start = ctx.currentTime;
  playTone(ctx, start, 349.23, 0.05, 0.05, 'sine');
  playTone(ctx, start + 0.05, 392, 0.06, 0.05, 'sine');
};

export const GAME_TIMER_LOW_THRESHOLD = TIMER_LOW_THRESHOLD;
