import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  useTheme,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatCalendarDate } from '../../localization/calendarHelpers';
import {
  getEventEditorUploadCardSx,
  getEventMediaDeleteButtonSx,
  getEventMediaPreviewSx,
} from '../Calendar/calendarDrawerStyles';

interface AddContentDialogProps {
  open: boolean;
  onClose: () => void;
  date: Date | null;
  onSave: (files: File[]) => void;
}

const AddContentDialog: React.FC<AddContentDialogProps> = ({ open, onClose, date, onSave }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles([...files, ...newFiles]);

      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setPreviews([...previews, ...newPreviews]);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleSave = () => {
    onSave(files);
    previews.forEach((url) => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviews([]);
    onClose();
  };

  const handleClose = () => {
    previews.forEach((url) => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviews([]);
    onClose();
  };

  const formattedDate = date ? formatCalendarDate(date, i18n.language) : '';

  return (
    <ResponsiveDialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {t('calendar.addContent.title', { date: formattedDate })}
      </DialogTitle>
      <DialogContent>
        <Box sx={getEventEditorUploadCardSx(theme)}>
          <input
            accept="image/*,video/*"
            style={{ display: 'none' }}
            id="upload-media"
            multiple
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="upload-media">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
              fullWidth
              sx={{ mb: 1.5 }}
            >
              {t('calendar.addContent.selectMedia')}
            </Button>
          </label>
          <Typography variant="body2" color="text.secondary">
            {t('calendar.media.supported')}
          </Typography>
        </Box>

        {previews.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {previews.map((preview, index) => (
              <Box key={index} sx={getEventMediaPreviewSx(theme)}>
                {files[index].type.startsWith('image/') ? (
                  <img
                    src={preview}
                    alt={`Preview ${index}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <video
                    src={preview}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                )}
                <IconButton
                  size="small"
                  sx={getEventMediaDeleteButtonSx(theme)}
                  onClick={() => handleRemoveFile(index)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('calendar.common.cancel')}</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={files.length === 0}
        >
          {t('calendar.common.save')}
        </Button>
      </DialogActions>
    </ResponsiveDialog>
  );
};

export default AddContentDialog;
