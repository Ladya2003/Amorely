import React, { useCallback, useRef, useState } from 'react';
import { Box, IconButton, Menu, MenuItem } from '@mui/material';
import { MoreHorizIcon } from '../UI/icons';
import type { KaifLifeMediaBlock as KaifLifeMediaBlockType } from './kaifLifeTypes';

const MIN_WIDTH_PERCENT = 15;
const MAX_WIDTH_PERCENT = 100;

type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se';

interface KaifLifeMediaBlockProps {
  block: KaifLifeMediaBlockType;
  rowWidth: number;
  onChangeWidth: (widthPercent: number) => void;
  onDelete: () => void;
  onOpen: () => void;
}

const KaifLifeMediaBlockView: React.FC<KaifLifeMediaBlockProps> = ({
  block,
  rowWidth,
  onChangeWidth,
  onDelete,
  onOpen,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [resizing, setResizing] = useState(false);
  const startRef = useRef({ x: 0, width: block.widthPercent, corner: 'se' as ResizeCorner });

  const clampWidth = (value: number) => Math.min(MAX_WIDTH_PERCENT, Math.max(MIN_WIDTH_PERCENT, value));

  const handleResizePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, corner: ResizeCorner) => {
      event.preventDefault();
      event.stopPropagation();
      startRef.current = {
        x: event.clientX,
        width: block.widthPercent,
        corner,
      };

      const handleMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - startRef.current.x;
        const sign = startRef.current.corner === 'ne' || startRef.current.corner === 'se' ? 1 : -1;
        const container = rowWidth > 0 ? rowWidth : 1;
        const deltaPercent = (dx / container) * 100 * sign;
        onChangeWidth(clampWidth(startRef.current.width + deltaPercent));
      };

      const handleUp = () => {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    },
    [block.widthPercent, onChangeWidth, rowWidth]
  );

  const handle = (corner: ResizeCorner) => {
    const isNorth = corner === 'nw' || corner === 'ne';
    const isWest = corner === 'nw' || corner === 'sw';
    return (
      <Box
        onPointerDown={(event) => handleResizePointerDown(event, corner)}
        onClick={(event) => event.stopPropagation()}
        sx={{
          position: 'absolute',
          width: 14,
          height: 14,
          bgcolor: 'primary.main',
          border: '2px solid',
          borderColor: 'common.white',
          borderRadius: '2px',
          zIndex: 2,
          cursor: isNorth ? (isWest ? 'nwse-resize' : 'nesw-resize') : isWest ? 'nesw-resize' : 'nwse-resize',
          top: isNorth ? -7 : 'auto',
          bottom: isNorth ? 'auto' : -7,
          left: isWest ? -7 : 'auto',
          right: isWest ? 'auto' : -7,
          touchAction: 'none',
        }}
      />
    );
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: `${block.widthPercent}%`,
        maxWidth: '100%',
        flex: '0 0 auto',
        borderRadius: 1.5,
        overflow: 'visible',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          borderRadius: 1.5,
          overflow: 'hidden',
          outline: resizing ? '2px solid' : 'none',
          outlineColor: 'primary.main',
          bgcolor: 'action.hover',
          cursor: resizing ? 'default' : 'pointer',
        }}
        onClick={() => {
          if (resizing) {
            setResizing(false);
            return;
          }
          onOpen();
        }}
      >
        {block.mediaType === 'video' ? (
          <Box
            component="video"
            src={block.url}
            playsInline
            muted
            preload="metadata"
            sx={{ width: '100%', display: 'block', verticalAlign: 'top', pointerEvents: 'none' }}
          />
        ) : (
          <Box
            component="img"
            src={block.url}
            alt=""
            sx={{ width: '100%', display: 'block', verticalAlign: 'top', pointerEvents: 'none' }}
          />
        )}

        <IconButton
          size="small"
          aria-label="Действия с медиа"
          onClick={(event) => {
            event.stopPropagation();
            setMenuAnchor(event.currentTarget);
          }}
          sx={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 28,
            height: 28,
            bgcolor: 'rgba(0,0,0,0.55)',
            color: 'common.white',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.72)' },
          }}
        >
          <MoreHorizIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {resizing && (
        <>
          {handle('nw')}
          {handle('ne')}
          {handle('sw')}
          {handle('se')}
        </>
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            setResizing((prev) => !prev);
          }}
        >
          {resizing ? 'Применить' : 'Изменить размер'}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            setResizing(false);
            onDelete();
          }}
        >
          Удалить
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default React.memo(KaifLifeMediaBlockView);
