import React, { useState } from 'react';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from '@mui/material';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import type { TapGameState, TapShopItem } from '../../services/gamesService';
import { buyTapShopItem } from '../../services/gamesService';

interface TapGameShopProps {
  open: boolean;
  onClose: () => void;
  shopItems: TapShopItem[];
  state: TapGameState;
  onPurchased: (state: TapGameState) => void;
  onError: (message: string) => void;
}

const TapGameShop: React.FC<TapGameShopProps> = ({
  open,
  onClose,
  shopItems,
  state,
  onPurchased,
  onError,
}) => {
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const handleBuy = async (itemId: string) => {
    setBuyingId(itemId);
    try {
      const nextState = await buyTapShopItem(itemId);
      onPurchased(nextState);
      onClose();
    } catch (error: any) {
      onError(error?.response?.data?.error || 'Не удалось купить предмет');
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <ResponsiveDialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1 }}>Магазин</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Ваши баллы: <strong>{state.points}</strong>
          {state.activeBoost && (
            <> · Активно: ×{state.activeBoost.multiplier} ({state.activeBoost.remainingUses} наж.)</>
          )}
        </Typography>

        <Grid container spacing={1.5}>
          {shopItems.map((item) => {
            const canBuy = state.points >= item.cost && !state.activeBoost;
            return (
              <Grid key={item.id} size={{ xs: 12 }}>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box
                    component="img"
                    src={item.imageUrl}
                    alt={item.name}
                    sx={{ width: 72, height: 72, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0 }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {item.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {item.description}
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      disabled={!canBuy || buyingId === item.id}
                      onClick={() => handleBuy(item.id)}
                    >
                      Купить за {item.cost}
                    </Button>
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </ResponsiveDialog>
  );
};

export default TapGameShop;
