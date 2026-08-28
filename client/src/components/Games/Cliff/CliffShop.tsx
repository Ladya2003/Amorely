import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Stack, Typography } from '@mui/material';
import type { CliffGameState, CliffShopItemId } from '../../../services/gamesService';
import CurrencyCoinIcon from '../../Pets/CurrencyCoinIcon';
import { cliffBoulderImage, cliffItemImage, CLIFF_ASSETS } from './cliffAssets';
import CliffInventoryPack from './CliffInventoryPack';
import CliffModalFrame from './CliffModalFrame';
import { getCliffModalBuyButtonSx, getCliffModalGhostButtonSx, getCliffModalItemSx } from './cliffStyles';

const CLIFF_SHOP_PICKAXE_COST = 50;
const CLIFF_SHOP_AXE_IRON = 20;
const CLIFF_SHOP_AXE_COPPER = 20;

const costIconSx = {
  width: 20,
  height: 20,
  objectFit: 'contain' as const,
  flexShrink: 0,
};

type CliffShopProps = {
  state: CliffGameState;
  buying: boolean;
  onBuy: (itemId: CliffShopItemId) => void;
  onClose: () => void;
};

const ITEMS: CliffShopItemId[] = ['iron_pickaxe', 'copper_pickaxe', 'axe'];

const CliffShop: React.FC<CliffShopProps> = ({ state, buying, onBuy, onClose }) => {
  const { t } = useTranslation();

  return (
    <CliffModalFrame
      title={t('games.cliff.shop.title')}
      heroSrc={CLIFF_ASSETS.shopStall}
      roomy
      actions={
        <Button onClick={onClose} sx={getCliffModalGhostButtonSx()}>
          {t('games.common.close')}
        </Button>
      }
    >
      <Box sx={{ mb: 1.25 }}>
        <CliffInventoryPack state={state} tone="parchment" />
      </Box>
      <Stack spacing={1.25}>
        {ITEMS.map((itemId) => {
          const item = state.shopItems.find((entry) => entry.id === itemId);
          const lockReason = item?.lockReason ?? null;
          return (
            <Box key={itemId} sx={getCliffModalItemSx()}>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Box
                  component="img"
                  src={cliffItemImage(itemId)}
                  alt=""
                  sx={{ width: 72, height: 72, objectFit: 'contain', flexShrink: 0 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, color: '#5c2618' }}>
                    {t(`games.cliff.shop.items.${itemId}.name`)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6a3a24' }}>
                    {t(`games.cliff.shop.items.${itemId}.description`)}
                  </Typography>
                  {lockReason && (
                    <Typography variant="caption" sx={{ color: '#b42318', fontWeight: 700, display: 'block' }}>
                      {t(`games.cliff.shop.lock.${lockReason}`)}
                    </Typography>
                  )}
                </Box>
              </Box>
              <Button
                disabled={!item?.canBuy || buying}
                onClick={() => onBuy(itemId)}
                sx={getCliffModalBuyButtonSx()}
              >
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5,
                    flexWrap: 'wrap',
                    lineHeight: 1.2,
                  }}
                >
                  <Box component="span">{t('games.cliff.shop.buyFor')}</Box>
                  {itemId === 'axe' ? (
                    <>
                      <Box component="img" src={cliffBoulderImage('iron')} alt="" sx={costIconSx} />
                      <Box component="span">{t('games.cliff.shop.ironCost', { amount: CLIFF_SHOP_AXE_IRON })}</Box>
                      <Box component="span">{t('games.cliff.shop.and')}</Box>
                      <Box component="img" src={cliffBoulderImage('copper')} alt="" sx={costIconSx} />
                      <Box component="span">{t('games.cliff.shop.copperCost', { amount: CLIFF_SHOP_AXE_COPPER })}</Box>
                    </>
                  ) : (
                    <>
                      <CurrencyCoinIcon size={20} />
                      <Box component="span">
                        {t('games.cliff.shop.coinsCost', { amount: CLIFF_SHOP_PICKAXE_COST })}
                      </Box>
                    </>
                  )}
                </Box>
              </Button>
            </Box>
          );
        })}
      </Stack>
    </CliffModalFrame>
  );
};

export default CliffShop;
