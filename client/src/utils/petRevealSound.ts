type PetRevealSoundKind = 'hatch' | 'levelUp';

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

/** Вызывать по клику «Вылупить» / «Прокачать» — снимает блокировку autoplay в браузере. */
export const unlockPetRevealAudio = (): void => {
  const ctx = getAudioContext();
  if (ctx?.state === 'suspended') {
    void ctx.resume();
  }
};

const scheduleTone = (
  ctx: AudioContext,
  startTime: number,
  frequency: number,
  duration: number,
  volume: number,
  destination: AudioNode,
  type: OscillatorType = 'sine'
) => {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.05);
};

const schedulePop = (ctx: AudioContext, startTime: number, destination: AudioNode, volume: number) => {
  const length = Math.floor(ctx.sampleRate * 0.12);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const samples = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    const envelope = 1 - i / length;
    samples[i] = (Math.random() * 2 - 1) * envelope * envelope;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(900, startTime);
  filter.Q.value = 0.7;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.12);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  source.start(startTime);
  source.stop(startTime + 0.15);
};

/** Короткий «магический» звук при вылуплении или переходе на новый уровень. */
export const playPetRevealSound = async (kind: PetRevealSoundKind): Promise<void> => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  } catch {
    return;
  }

  const start = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(kind === 'hatch' ? 0.9 : 0.85, start);
  master.connect(ctx.destination);

  if (kind === 'hatch') {
    schedulePop(ctx, start, master, 0.22);
  }

  const baseFrequency = kind === 'hatch' ? 392 : 523.25;
  const intervals = kind === 'hatch' ? [1, 1.25, 1.5, 2] : [1, 1.189, 1.498, 1.782, 2];
  const step = kind === 'hatch' ? 0.07 : 0.055;
  const toneVolume = kind === 'hatch' ? 0.11 : 0.1;

  intervals.forEach((ratio, index) => {
    scheduleTone(
      ctx,
      start + (kind === 'hatch' ? 0.04 : 0.02) + index * step,
      baseFrequency * ratio,
      kind === 'hatch' ? 0.55 : 0.48,
      toneVolume,
      master,
      index === intervals.length - 1 ? 'triangle' : 'sine'
    );
  });

  scheduleTone(ctx, start + 0.35, baseFrequency * 2.5, 0.7, 0.045, master, 'sine');
};

/** Нарастающий звук приближения фото яйца / старого уровня (фаза zoom). */
export const playPetZoomSound = async (
  kind: PetRevealSoundKind,
  durationMs: number
): Promise<void> => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  } catch {
    return;
  }

  const start = ctx.currentTime;
  const duration = durationMs / 1000;
  const peakAt = duration * 0.9;

  const master = ctx.createGain();
  master.gain.setValueAtTime(kind === 'hatch' ? 0.6 : 0.55, start);
  master.connect(ctx.destination);

  const sampleCount = Math.ceil(ctx.sampleRate * duration);
  const noiseBuffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
  const samples = noiseBuffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i += 1) {
    samples[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.Q.value = 1.1;
  bandpass.frequency.setValueAtTime(kind === 'hatch' ? 260 : 340, start);
  bandpass.frequency.exponentialRampToValueAtTime(kind === 'hatch' ? 1100 : 1500, start + peakAt);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.001, start);
  noiseGain.gain.exponentialRampToValueAtTime(kind === 'hatch' ? 0.16 : 0.14, start + peakAt);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, start + duration);

  noise.connect(bandpass);
  bandpass.connect(noiseGain);
  noiseGain.connect(master);
  noise.start(start);
  noise.stop(start + duration + 0.05);

  const hum = ctx.createOscillator();
  hum.type = 'sine';
  hum.frequency.setValueAtTime(kind === 'hatch' ? 98 : 130.81, start);
  hum.frequency.exponentialRampToValueAtTime(kind === 'hatch' ? 294 : 392, start + peakAt);

  const humGain = ctx.createGain();
  humGain.gain.setValueAtTime(0.001, start);
  humGain.gain.exponentialRampToValueAtTime(0.07, start + peakAt);
  humGain.gain.exponentialRampToValueAtTime(0.001, start + duration);

  hum.connect(humGain);
  humGain.connect(master);
  hum.start(start);
  hum.stop(start + duration + 0.05);
};

/** Задержки всплывающих сердечек при поглаживании (см. HEART_POSITIONS в PetDetailView). */
const PET_HEART_POP_OFFSETS_SEC = [0, 0.14, 0.28, 0.46, 0.62, 0.82, 0.98] as const;
const PET_HEART_POP_FREQUENCIES = [784, 880, 987.77, 1046.5, 987.77, 880, 1174.66] as const;

const scheduleHeartBoop = (
  ctx: AudioContext,
  startTime: number,
  frequency: number,
  volume: number,
  destination: AudioNode
) => {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency * 0.88, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.06, startTime + 0.04);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.94, startTime + 0.11);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.13);

  oscillator.connect(gain);
  gain.connect(destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + 0.16);
};

/** Мягкая серия «бульков» при появлении сердечек после поглаживания. */
export const playPetHeartsSound = async (): Promise<void> => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  } catch {
    return;
  }

  const start = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.82, start);
  master.connect(ctx.destination);

  scheduleTone(ctx, start, 659.25, 0.22, 0.035, master, 'sine');

  PET_HEART_POP_OFFSETS_SEC.forEach((offset, index) => {
    const popTime = start + offset;
    const volume = 0.058 - index * 0.002;
    scheduleHeartBoop(ctx, popTime, PET_HEART_POP_FREQUENCIES[index], volume, master);
    if (index % 2 === 0) {
      schedulePop(ctx, popTime, master, 0.045);
    }
  });
};
