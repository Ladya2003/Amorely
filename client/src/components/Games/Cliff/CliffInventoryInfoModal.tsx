import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import CurrencyCoinIcon from '../../Pets/CurrencyCoinIcon';
import {
  CURRENCY_EARN_RULES,
  CURRENCY_GUIDE_SECTIONS,
  type CurrencyGuideSection,
} from '../../../config/currencyRewardCatalog';
import { CLIFF_ASSETS, cliffBoulderImage, cliffCaveItemImage } from './cliffAssets';
import CliffModalFrame from './CliffModalFrame';
import { getCliffModalBodySx, getCliffModalGhostButtonSx } from './cliffStyles';

export type CliffInventoryTopic =
  | 'coins'
  | 'iron'
  | 'copper'
  | 'quartz'
  | 'resin'
  | 'wickCup'
  | 'lensFlask'
  | 'lampBody'
  | 'lantern'
  | 'altitude'
  | 'time'
  | 'ironPickaxe'
  | 'copperPickaxe'
  | 'axe';

type CliffInventoryInfoModalProps = {
  topic: CliffInventoryTopic;
  onClose: () => void;
};

type InventoryInfoContent = {
  title: string;
  body: string;
  heroSrc?: string;
  hero?: React.ReactNode;
  roomy?: boolean;
};

const getInventoryInfo = (
  topic: CliffInventoryTopic,
  t: (key: string) => string
): InventoryInfoContent => {
  switch (topic) {
    case 'coins':
      return {
        title: t('games.cliff.inventory.coins.title'),
        body: t('games.cliff.inventory.coins.body'),
        hero: <CurrencyCoinIcon size={72} />,
        roomy: true,
      };
    case 'iron':
      return {
        title: t('games.cliff.inventory.iron.title'),
        body: t('games.cliff.inventory.iron.body'),
        heroSrc: cliffBoulderImage('iron'),
      };
    case 'copper':
      return {
        title: t('games.cliff.inventory.copper.title'),
        body: t('games.cliff.inventory.copper.body'),
        heroSrc: cliffBoulderImage('copper'),
      };
    case 'altitude':
      return {
        title: t('games.cliff.inventory.altitude.title'),
        body: t('games.cliff.inventory.altitude.body'),
        heroSrc: CLIFF_ASSETS.climbPath,
      };
    case 'time':
      return {
        title: t('games.cliff.inventory.time.title'),
        body: t('games.cliff.inventory.time.body'),
        heroSrc: CLIFF_ASSETS.catalog,
      };
    case 'ironPickaxe':
      return {
        title: t('games.cliff.inventory.ironPickaxe.title'),
        body: t('games.cliff.inventory.ironPickaxe.body'),
        heroSrc: CLIFF_ASSETS.pickaxeIron,
      };
    case 'copperPickaxe':
      return {
        title: t('games.cliff.inventory.copperPickaxe.title'),
        body: t('games.cliff.inventory.copperPickaxe.body'),
        heroSrc: CLIFF_ASSETS.pickaxeCopper,
      };
    case 'axe':
      return {
        title: t('games.cliff.inventory.axe.title'),
        body: t('games.cliff.inventory.axe.body'),
        heroSrc: CLIFF_ASSETS.axe,
      };
    case 'quartz':
      return {
        title: t('games.cliff.inventory.quartz.title'),
        body: t('games.cliff.inventory.quartz.body'),
        heroSrc: cliffCaveItemImage('quartz'),
      };
    case 'resin':
      return {
        title: t('games.cliff.inventory.resin.title'),
        body: t('games.cliff.inventory.resin.body'),
        heroSrc: cliffCaveItemImage('resin'),
      };
    case 'wickCup':
      return {
        title: t('games.cliff.inventory.wickCup.title'),
        body: t('games.cliff.inventory.wickCup.body'),
        heroSrc: cliffCaveItemImage('wick_cup'),
      };
    case 'lensFlask':
      return {
        title: t('games.cliff.inventory.lensFlask.title'),
        body: t('games.cliff.inventory.lensFlask.body'),
        heroSrc: cliffCaveItemImage('lens_flask'),
      };
    case 'lampBody':
      return {
        title: t('games.cliff.inventory.lampBody.title'),
        body: t('games.cliff.inventory.lampBody.body'),
        heroSrc: cliffCaveItemImage('lamp_body'),
      };
    case 'lantern':
      return {
        title: t('games.cliff.inventory.lantern.title'),
        body: t('games.cliff.inventory.lantern.body'),
        heroSrc: cliffCaveItemImage('lantern'),
      };
    default: {
      const exhaustive: never = topic;
      return exhaustive;
    }
  }
};

const CliffInventoryEarnList: React.FC = () => {
  const { t } = useTranslation();
  const rulesBySection = CURRENCY_GUIDE_SECTIONS.reduce<Record<CurrencyGuideSection, typeof CURRENCY_EARN_RULES>>(
    (acc, section) => {
      acc[section] = CURRENCY_EARN_RULES.filter((rule) => rule.section === section);
      return acc;
    },
    {} as Record<CurrencyGuideSection, typeof CURRENCY_EARN_RULES>
  );

  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography sx={{ fontWeight: 800, color: '#5c2618', mb: 0.75 }}>
        {t('pets.currencyGuide.title')}
      </Typography>
      <Typography variant="body2" sx={{ color: '#6a3a24', mb: 1.25 }}>
        {t('pets.currencyGuide.subtitle')}
      </Typography>
      {CURRENCY_GUIDE_SECTIONS.map((section) => {
        const rules = rulesBySection[section];
        if (rules.length === 0) {
          return null;
        }
        return (
          <Box key={section} sx={{ mb: 1.25 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: '#8b4a2b', mb: 0.5 }}>
              {t(`pets.currencyGuide.sections.${section}`)}
            </Typography>
            {rules.map((rule) => (
              <Box
                key={rule.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 1,
                  alignItems: 'start',
                  py: 0.65,
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#4a2414' }}>
                    {t(`pets.currencyGuide.rules.${rule.id}.action`)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#8a5a3a' }}>
                    {t(`pets.currencyGuide.rules.${rule.id}.period`)}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 800, color: '#8a5a12', whiteSpace: 'nowrap' }}>
                  {t('pets.currencyGuide.amount', { amount: rule.amount })}
                </Typography>
              </Box>
            ))}
          </Box>
        );
      })}
    </Box>
  );
};

const CliffInventoryInfoModal: React.FC<CliffInventoryInfoModalProps> = ({ topic, onClose }) => {
  const { t } = useTranslation();
  const info = getInventoryInfo(topic, t);

  return createPortal(
    <CliffModalFrame
      title={info.title}
      heroSrc={info.heroSrc}
      hero={info.hero}
      roomy={info.roomy}
      zIndex={20}
      pinned="fixed"
      actions={
        <Button onClick={onClose} sx={getCliffModalGhostButtonSx()}>
          {t('games.common.close')}
        </Button>
      }
    >
      <Typography variant="body2" sx={getCliffModalBodySx()}>
        {info.body}
      </Typography>
      {topic === 'coins' && <CliffInventoryEarnList />}
    </CliffModalFrame>,
    document.body
  );
};

export default CliffInventoryInfoModal;
