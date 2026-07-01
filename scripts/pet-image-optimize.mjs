#!/usr/bin/env node
/**
 * Downscale and compress pet PNG assets → WebP for faster loading on slow networks.
 * Max display ~50vh with scale(1.35); 1024px (~67% of 1536 source) keeps detail on retina.
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export const PET_IMAGE_MAX_DIMENSION = Number(process.env.PET_IMAGE_MAX_DIMENSION || 1024);
export const PET_IMAGE_WEBP_QUALITY = Number(process.env.PET_IMAGE_WEBP_QUALITY || 85);

/** @returns {{ webpPath: string, bytesBefore: number, bytesAfter: number }} */
export async function optimizePetImage(pngPath, { removeSource = false } = {}) {
  const webpPath = pngPath.replace(/\.png$/i, '.webp');
  const bytesBefore = fs.statSync(pngPath).size;

  await sharp(pngPath)
    .resize(PET_IMAGE_MAX_DIMENSION, PET_IMAGE_MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: PET_IMAGE_WEBP_QUALITY })
    .toFile(webpPath);

  const bytesAfter = fs.statSync(webpPath).size;

  if (removeSource) {
    fs.unlinkSync(pngPath);
  }

  return { webpPath, bytesBefore, bytesAfter };
}
