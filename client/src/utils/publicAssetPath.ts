/** Paths to files in `client/public/` — always prefix with CRA PUBLIC_URL (GitHub Pages basename). */
export const getPublicAssetPath = (assetPath: string): string => {
  const normalized = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  const publicUrl = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  return `${publicUrl}${normalized}`;
};

/** Landing filename, site-root path, or absolute URL for blog covers. */
export const getBlogImageSrc = (imageFile: string): string => {
  if (/^https?:\/\//i.test(imageFile)) {
    return imageFile;
  }
  if (imageFile.startsWith('/')) {
    return getPublicAssetPath(imageFile);
  }
  return getPublicAssetPath(`landing/${encodeURIComponent(imageFile)}`);
};
