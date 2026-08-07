import React from 'react';
import { Box, Skeleton, useTheme } from '@mui/material';
import { SURFACE_BORDER_RADIUS } from '../../../theme/surfaceStyles';
import { getResultQuestionCardSx } from './resultQuestionStyles';

/** Скелетон диалога ответа на вопрос дня */
export const CategoryFlowSkeleton: React.FC = () => (
  <Box aria-busy="true">
    <Skeleton variant="rounded" animation="wave" height={4} sx={{ mb: 2, borderRadius: 2 }} />
    <Skeleton variant="text" animation="wave" width={120} height={20} sx={{ mb: 2 }} />
    <Skeleton variant="text" animation="wave" width="92%" height={28} />
    <Skeleton variant="text" animation="wave" width="68%" height={28} sx={{ mb: 2.5 }} />
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Skeleton
        variant="rounded"
        animation="wave"
        height={52}
        sx={{ borderRadius: `${Math.round(SURFACE_BORDER_RADIUS * 0.5)}px` }}
      />
      <Skeleton
        variant="rounded"
        animation="wave"
        height={52}
        sx={{ borderRadius: `${Math.round(SURFACE_BORDER_RADIUS * 0.5)}px` }}
      />
      <Skeleton
        variant="rounded"
        animation="wave"
        height={52}
        sx={{ borderRadius: `${Math.round(SURFACE_BORDER_RADIUS * 0.5)}px` }}
      />
    </Box>
  </Box>
);

/** Скелетон диалога результатов категории */
export const CategoryResultsSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <Box aria-busy="true">
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
        <Skeleton variant="circular" animation="wave" width={72} height={72} />
      </Box>
      <Skeleton
        variant="text"
        animation="wave"
        width={140}
        height={20}
        sx={{ mx: 'auto', mb: 2, display: 'block' }}
      />

      {[0, 1].map((key) => (
        <Box key={key} sx={getResultQuestionCardSx(theme)}>
          <Skeleton variant="text" animation="wave" width="88%" height={24} sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mb: 1.25 }}>
            <Skeleton variant="circular" animation="wave" width={32} height={32} />
            <Skeleton
              variant="rounded"
              animation="wave"
              width="55%"
              height={40}
              sx={{ borderRadius: '20px' }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, flexDirection: 'row-reverse' }}>
            <Skeleton variant="circular" animation="wave" width={32} height={32} />
            <Skeleton
              variant="rounded"
              animation="wave"
              width="48%"
              height={40}
              sx={{ borderRadius: '20px' }}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
};
