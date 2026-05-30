import React, { useRef, useState } from 'react';
import ResponsiveDialog from './ResponsiveDialog';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  fileName: string
): Promise<File> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const outputWidth = Math.round(crop.width * scaleX);
  const outputHeight = Math.round(crop.height * scaleY);
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(new File([blob], fileName, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.95
    );
  });
}

interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string | null;
  originalFile: File | null;
  onClose: () => void;
  onConfirm: (file: File) => void;
  title?: string;
  aspect?: number;
  showUploadWithoutCrop?: boolean;
}

const ImageCropDialog: React.FC<ImageCropDialogProps> = ({
  open,
  imageSrc,
  originalFile,
  onClose,
  onConfirm,
  title = 'Обрезать фото',
  aspect,
  showUploadWithoutCrop = true,
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const resetCropState = () => {
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  const handleClose = () => {
    resetCropState();
    onClose();
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const defaultCrop = {
      unit: '%' as const,
      width: 80,
      height: aspect ? 80 : 80,
      x: 10,
      y: 10,
    };
    setCrop(defaultCrop);

    const pixelCrop = {
      x: Math.round((defaultCrop.x / 100) * img.width),
      y: Math.round((defaultCrop.y / 100) * img.height),
      width: Math.round((defaultCrop.width / 100) * img.width),
      height: Math.round((defaultCrop.height / 100) * img.height),
      unit: 'px' as const,
    };
    setCompletedCrop(pixelCrop);
  };

  const handleCropComplete = async () => {
    if (!imgRef.current || !originalFile) return;

    const cropToUse =
      completedCrop ||
      (crop && {
        x: Math.round((crop.x / 100) * imgRef.current.width),
        y: Math.round((crop.y / 100) * imgRef.current.height),
        width: Math.round((crop.width / 100) * imgRef.current.width),
        height: Math.round((crop.height / 100) * imgRef.current.height),
        unit: 'px' as const,
      });

    if (!cropToUse) {
      onConfirm(originalFile);
      handleClose();
      return;
    }

    try {
      const croppedFile = await getCroppedImg(imgRef.current, cropToUse, originalFile.name);
      onConfirm(croppedFile);
      handleClose();
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  const handleUploadWithoutCrop = () => {
    if (originalFile) {
      onConfirm(originalFile);
      handleClose();
    }
  };

  return (
    <ResponsiveDialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {imageSrc && (
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              onLoad={handleImageLoad}
              style={{ maxWidth: '100%', maxHeight: '60vh' }}
            />
          </ReactCrop>
        )}
      </DialogContent>
      <DialogActions>
        {showUploadWithoutCrop && (
          <Button onClick={handleUploadWithoutCrop}>Без обрезки</Button>
        )}
        <Button onClick={handleClose}>Отмена</Button>
        <Button onClick={handleCropComplete} variant="contained">
          Применить
        </Button>
      </DialogActions>
    </ResponsiveDialog>
  );
};

export default ImageCropDialog;
