import confetti from 'canvas-confetti';

const ROUND_CONFETTI_COLORS = ['#FF4B8D', '#FF8FAB', '#FFB3C6', '#FFD166', '#FFFFFF'];

export const fireRoundConfetti = () => {
  const burst = () => {
    confetti({
      particleCount: 100,
      spread: 72,
      startVelocity: 32,
      origin: { y: 0.58 },
      colors: ROUND_CONFETTI_COLORS,
      zIndex: 9999,
      disableForReducedMotion: true,
    });
  };

  burst();

  window.setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 50,
      origin: { x: 0, y: 0.65 },
      colors: ROUND_CONFETTI_COLORS,
      zIndex: 9999,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 50,
      origin: { x: 1, y: 0.65 },
      colors: ROUND_CONFETTI_COLORS,
      zIndex: 9999,
      disableForReducedMotion: true,
    });
  }, 180);
};
