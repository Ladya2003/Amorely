import React, { useState } from 'react';
import { Box, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { AppPaperClipIcon, MoreHorizIcon } from '../UI/icons';
import type { KaifLifeDocumentBlock } from './kaifLifeTypes';

interface KaifLifeFileBlockProps {
  block: KaifLifeDocumentBlock;
  onDelete: () => void;
}

const KaifLifeFileBlockView: React.FC<KaifLifeFileBlockProps> = ({ block, onDelete }) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        width: '100%',
        px: 1.5,
        py: 1.15,
        borderRadius: 1.5,
        bgcolor: 'action.hover',
      }}
    >
      <Box
        component="a"
        href={block.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Открыть ${block.fileName}`}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          minWidth: 0,
          flex: 1,
          color: 'inherit',
          textDecoration: 'none',
          cursor: 'pointer',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: 1,
            bgcolor: 'background.paper',
            color: 'primary.main',
          }}
        >
          <AppPaperClipIcon sx={{ fontSize: 20 }} />
        </Box>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {block.fileName}
        </Typography>
      </Box>

      <IconButton
        size="small"
        aria-label="Действия с документом"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setMenuAnchor(event.currentTarget);
        }}
        sx={{
          width: 28,
          height: 28,
          flexShrink: 0,
          bgcolor: 'rgba(0,0,0,0.55)',
          color: 'common.white',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.72)' },
        }}
      >
        <MoreHorizIcon sx={{ fontSize: 18 }} />
      </IconButton>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            onDelete();
          }}
        >
          Удалить
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default React.memo(KaifLifeFileBlockView);
