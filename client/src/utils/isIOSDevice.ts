export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent;
  const platform = navigator.platform ?? '';
  const maxTouchPoints = navigator.maxTouchPoints ?? 0;
  const isStandalonePwa =
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  return (
    /iPad|iPhone|iPod/i.test(ua) ||
    (platform === 'MacIntel' && maxTouchPoints > 1) ||
    (/Macintosh/i.test(ua) && maxTouchPoints > 1) ||
    (isStandalonePwa && /Mobile|iPhone|iPad/i.test(ua))
  );
}
