import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const handleBuy = async (itemId: string) => {
    setBuyingId(itemId);
    try {
      const nextState = await buyTapShopItem(itemId);
      onPurchased(nextState);
      onClose();
    } catch (error: any) {
      onError(error?.response?.data?.error || t('games.common.errors.buyFailed'));
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <ResponsiveDialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1 }}>{t('games.tap.shop.title')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('games.tap.shop.yourPoints', { points: state.points })}
          {state.activeBoost && (
            <>
              {' '}
              ·{' '}
              {t('games.tap.shop.activeBoost', {
                multiplier: state.activeBoost.multiplier,
                remaining: state.activeBoost.remainingUses,
              })}
            </>
          )}
        </Typography>

        <Grid container spacing={1.5}>
          {shopItems.map((item) => {
            const isLocked = state.round < item.minRound;
            const canBuy = !isLocked && state.points >= item.cost && !state.activeBoost;
            const itemName = t(`games.tap.shop.items.${item.id}.name`, { defaultValue: item.name });
            const itemDescription = t(`games.tap.shop.items.${item.id}.description`, {
              defaultValue: item.description,
            });

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
                    alt={itemName}
                    sx={{ width: 72, height: 72, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0 }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {itemName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {itemDescription}
                    </Typography>
                    {isLocked ? (
                      <Typography variant="caption" color="text.secondary">
                        {t('games.tap.shop.availableAfterRound', { round: item.minRound - 1 })}
                      </Typography>
                    ) : (
                      <Button
                        size="small"
                        variant="contained"
                        disabled={!canBuy || buyingId === item.id}
                        onClick={() => handleBuy(item.id)}
                      >
                        {t('games.tap.shop.buyFor', { cost: item.cost })}
                      </Button>
                    )}
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onClose}>{t('games.tap.shop.close')}</Button>
      </DialogActions>
    </ResponsiveDialog>
  );
};

export default TapGameShop;
