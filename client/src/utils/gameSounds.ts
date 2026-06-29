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

export const GAME_TIMER_LOW_THRESHOLD = TIMER_LOW_THRESHOLD;
