// Сетка контента

import React from 'react';
import { Box } from '@mui/material';
import { ContentItem } from '../types';
import ContentCard from './ContentCard';

interface ContentGridProps {
  content: ContentItem[];
  draggedItem: string | null;
  dragOverItem: string | null;
  isDragging: boolean;
  onPointerDown: (e: React.MouseEvent | React.TouchEvent, itemId: string) => void;
  onDelete: (contentId: string) => void;
}

const ContentGrid: React.FC<ContentGridProps> = ({
  content,
  draggedItem,
  dragOverItem,
  isDragging,
  onPointerDown,
  onDelete
}) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(auto-fill, minmax(200px, 1fr))'
        },
        gap: { xs: 1, sm: 2 },
        mt: 2
      }}
    >
      {content.map((item) => (
        <ContentCard
          key={item.id}
          item={item}
          isDragged={draggedItem === item.id}
          isDragOver={dragOverItem === item.id}
          isDragging={isDragging}
          onPointerDown={onPointerDown}
          onDelete={onDelete}
        />
      ))}
    </Box>
  );
};

export default ContentGrid;

