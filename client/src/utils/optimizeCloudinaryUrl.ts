interface OptimizeCloudinaryUrlOptions {
  width?: number;
}

export const optimizeCloudinaryUrl = (
  url: string,
  options: OptimizeCloudinaryUrlOptions = {}
): string => {
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }

  if (/\/upload\/(?:[^/]*?(?:f_auto|q_auto|w_\d+))/.test(url)) {
    return url;
  }

  const transforms = ['f_auto', 'q_auto'];
  if (options.width && Number.isFinite(options.width) && options.width > 0) {
    transforms.push(`w_${Math.round(options.width)}`);
  }

  return url.replace('/upload/', `/upload/${transforms.join(',')}/`);
};
