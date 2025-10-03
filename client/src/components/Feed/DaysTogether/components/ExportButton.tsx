// Кнопка для экспорта открытки как изображения

import React, { useState } from 'react';
import { IconButton, Snackbar, Alert, CircularProgress, Tooltip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import html2canvas from 'html2canvas';
import { ColorTheme } from './ColorPicker';

interface ExportButtonProps {
  targetId: string;
  colorTheme: ColorTheme;
}

const ExportButton: React.FC<ExportButtonProps> = ({ targetId, colorTheme }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    try {
      const element = document.getElementById(targetId);
      if (!element) {
        throw new Error('Элемент не найден');
      }

      // Создаем canvas из элемента
      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 2, // Увеличиваем качество
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      // Конвертируем в blob
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Не удалось создать изображение');
        }

        // Создаем ссылку для скачивания
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `love-card-${new Date().toISOString().split('T')[0]}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);

        setSuccess(true);
        setLoading(false);
      }, 'image/png');
    } catch (err) {
      console.error('Error exporting image:', err);
      setError('Не удалось экспортировать открытку');
      setLoading(false);
    }
  };

  return (
    <>
      <Tooltip title="Скачать открытку" arrow>
        <IconButton
          onClick={handleExport}
          disabled={loading}
          sx={{
            bgcolor: `${colorTheme.colors[0].replace(/0\.\d+/, '0.1')}`,
            color: colorTheme.preview,
            '&:hover': { 
              bgcolor: `${colorTheme.colors[0].replace(/0\.\d+/, '0.2')}`,
              color: colorTheme.preview
            }
          }}
        >
          {loading ? <CircularProgress size={24} sx={{ color: colorTheme.preview }} /> : <DownloadIcon />}
        </IconButton>
      </Tooltip>

      {/* Уведомление об успехе */}
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Открытка успешно сохранена! 📸
        </Alert>
      </Snackbar>

      {/* Уведомление об ошибке */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ExportButton;

