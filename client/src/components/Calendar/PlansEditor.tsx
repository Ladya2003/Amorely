import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Tabs, Tab } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';

const PlansEditor: React.FC = () => {
  const [markdown, setMarkdown] = useState('');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  const handleModeChange = (event: React.SyntheticEvent, newMode: 'edit' | 'preview') => {
    setMode(newMode);
  };

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Tabs
        value={mode}
        onChange={handleModeChange}
        aria-label="editor mode"
        sx={{ mb: 2 }}
      >
        <Tab icon={<EditIcon />} label="Редактировать" value="edit" />
        <Tab icon={<VisibilityIcon />} label="Просмотр" value="preview" />
      </Tabs>

      {mode === 'edit' ? (
        <TextField
          fullWidth
          multiline
          rows={12}
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          placeholder="Напишите свои планы в формате Markdown..."
          variant="outlined"
          sx={{ flexGrow: 1 }}
        />
      ) : (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            flexGrow: 1, 
            overflow: 'auto',
            bgcolor: 'background.default',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          {markdown ? (
            <ReactMarkdown>{markdown}</ReactMarkdown>
          ) : (
            <Typography color="text.secondary" align="center">
              Здесь будет отображаться предварительный просмотр ваших планов
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default PlansEditor; 