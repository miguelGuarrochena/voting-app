import confetti from 'canvas-confetti';

// ------------------------------------------------------------
//  fireWinnerConfetti
//  Dispara confeti una sola vez por token (usa sessionStorage
//  para no repetir si navegás atrás/adelante durante la misma
//  sesión). Abrir en otra pestaña/recargar reinicia la flag.
// ------------------------------------------------------------

const KEY_PREFIX = 'confettiShown:';

export function fireWinnerConfetti(token: string) {
  if (typeof window === 'undefined') return;
  try {
    const key = KEY_PREFIX + token;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, '1');
  } catch {
    // si falla sessionStorage igual tiramos confeti una vez
  }

  const colors = ['#FF4D6A', '#FFD700', '#2DD4A0', '#FFF8FA', '#8B5CF6'];

  // Burst central
  confetti({
    particleCount: 140,
    spread: 90,
    startVelocity: 45,
    origin: { x: 0.5, y: 0.35 },
    colors,
  });

  // Dos laterales con pequeño delay para efecto sostenido
  setTimeout(() => {
    confetti({
      particleCount: 70,
      spread: 70,
      angle: 60,
      origin: { x: 0, y: 0.6 },
      colors,
    });
    confetti({
      particleCount: 70,
      spread: 70,
      angle: 120,
      origin: { x: 1, y: 0.6 },
      colors,
    });
  }, 220);
}
