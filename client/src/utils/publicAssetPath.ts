/** Paths to files in `client/public/` — always prefix with CRA PUBLIC_URL (GitHub Pages basename). */
export const getPublicAssetPath = (assetPath: string): string => {
  const normalized = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  const publicUrl = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  return `${publicUrl}${normalized}`;
};
