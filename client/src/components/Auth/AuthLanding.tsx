import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography, useTheme } from '@mui/material';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import PetsOutlinedIcon from '@mui/icons-material/PetsOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import BrushOutlinedIcon from '@mui/icons-material/BrushOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import { SvgIconComponent } from '@mui/icons-material';
import { getPublicAssetPath } from '../../utils/publicAssetPath';
import RevealOnScroll from './RevealOnScroll';
import {
  getAuthLandingCtaRowSx,
  getAuthLandingFeatureBodySx,
  getAuthLandingFeatureCopySx,
  getAuthLandingFeatureRowSx,
  getAuthLandingFeatureTitleSx,
  getAuthLandingFeaturesSx,
  getAuthLandingHeroSx,
  getAuthLandingHeroTitleSx,
  getAuthLandingImageFrameSx,
  getAuthLandingImageSx,
  getAuthLandingLeadSx,
  getAuthLandingSectionTitleSx,
  getAuthOutlinedButtonSx,
  getAuthPrimaryButtonSx,
} from './authPageStyles';

export type AuthLandingMode = 'login' | 'register';

interface AuthLandingProps {
  onScrollToAuth: (mode: AuthLandingMode) => void;
}

type FeatureId =
  | 'feed'
  | 'questions'
  | 'pets'
  | 'dateIdeas'
  | 'daysTogether'
  | 'chat'
  | 'guessLocation'
  | 'guessLocationResult'
  | 'guessDrawing'
  | 'calendar';

interface LandingFeature {
  id: FeatureId;
  Icon: SvgIconComponent;
  lightFile: string;
  darkFile: string;
}

const LANDING_FEATURES: LandingFeature[] = [
  {
    id: 'feed',
    Icon: PhotoLibraryOutlinedIcon,
    lightFile: '1. avatars, feed light.PNG',
    darkFile: '1. avatars, feed dark.PNG',
  },
  {
    id: 'questions',
    Icon: QuizOutlinedIcon,
    lightFile: '2. question of the day light.PNG',
    darkFile: '2. question of the day dark.PNG',
  },
  {
    id: 'pets',
    Icon: PetsOutlinedIcon,
    lightFile: '3. pet light.PNG',
    darkFile: '3. pet dark.PNG',
  },
  {
    id: 'dateIdeas',
    Icon: LightbulbOutlinedIcon,
    lightFile: '4. date ideas light.PNG',
    darkFile: '4. date ideas dark.PNG',
  },
  {
    id: 'daysTogether',
    Icon: FavoriteBorderOutlinedIcon,
    lightFile: '5. days together light.PNG',
    darkFile: '5. days together dark.PNG',
  },
  {
    id: 'chat',
    Icon: ChatBubbleOutlineIcon,
    lightFile: '6. chat light.PNG',
    darkFile: '6. chat dark.PNG',
  },
  {
    id: 'guessLocation',
    Icon: PublicOutlinedIcon,
    lightFile: '7. game guess location light.png',
    darkFile: '7. game guess location dark.png',
  },
  {
    id: 'guessLocationResult',
    Icon: EmojiEventsOutlinedIcon,
    lightFile: '8. game guess location guesed location light.png',
    darkFile: '8. game guess location guesed location dark.png',
  },
  {
    id: 'guessDrawing',
    Icon: BrushOutlinedIcon,
    lightFile: '9. game guess painting light.png',
    darkFile: '9. game guess painting dark.png',
  },
  {
    id: 'calendar',
    Icon: CalendarMonthOutlinedIcon,
    lightFile: '10. calendar light.PNG',
    darkFile: '10. calendar dark.PNG',
  },
];

const getLandingImageSrc = (fileName: string): string =>
  getPublicAssetPath(`landing/${encodeURIComponent(fileName)}`);

const AuthLanding: React.FC<AuthLandingProps> = ({ onScrollToAuth }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box component="section" aria-label={t('auth.landing.ariaLabel')}>
      <RevealOnScroll>
        <Box sx={getAuthLandingHeroSx()}>
          <Typography component="h1" sx={getAuthLandingHeroTitleSx()}>
            {t('auth.landing.heroTitle')}
          </Typography>
          <Typography sx={getAuthLandingLeadSx()}>{t('auth.landing.heroLead')}</Typography>
          <Box sx={getAuthLandingCtaRowSx()}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => onScrollToAuth('register')}
              sx={{ ...getAuthPrimaryButtonSx(), mt: 0, mb: 0 }}
            >
              {t('auth.landing.ctaRegister')}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => onScrollToAuth('login')}
              sx={getAuthOutlinedButtonSx(theme)}
            >
              {t('auth.landing.ctaLogin')}
            </Button>
          </Box>
        </Box>
      </RevealOnScroll>

      <Box component="section" sx={getAuthLandingFeaturesSx()}>
        <RevealOnScroll>
          <Typography component="h2" sx={getAuthLandingSectionTitleSx()}>
            {t('auth.landing.featuresTitle')}
          </Typography>
        </RevealOnScroll>

        {LANDING_FEATURES.map((feature, index) => {
          const { id, Icon, lightFile, darkFile } = feature;
          const imageSrc = getLandingImageSrc(isDark ? darkFile : lightFile);

          return (
            <RevealOnScroll key={id} delayMs={(index % 2) * 60}>
              <Box sx={getAuthLandingFeatureRowSx(index % 2 === 1)}>
                <Box sx={getAuthLandingFeatureCopySx()}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Icon color="primary" fontSize="small" aria-hidden />
                    <Typography component="h3" sx={getAuthLandingFeatureTitleSx()}>
                      {t(`auth.landing.features.${id}.title`)}
                    </Typography>
                  </Box>
                  <Typography sx={getAuthLandingFeatureBodySx()}>
                    {t(`auth.landing.features.${id}.body`)}
                  </Typography>
                </Box>
                <Box sx={getAuthLandingImageFrameSx(theme)}>
                  <Box
                    component="img"
                    src={imageSrc}
                    alt={t(`auth.landing.features.${id}.imageAlt`)}
                    loading="lazy"
                    sx={getAuthLandingImageSx()}
                  />
                </Box>
              </Box>
            </RevealOnScroll>
          );
        })}
      </Box>
    </Box>
  );
};

export default AuthLanding;
