import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography, useMediaQuery, useTheme } from '@mui/material';
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
  getAuthLandingFeaturesListSx,
  getAuthLandingFeaturesSx,
  getAuthLandingHeroSx,
  getAuthLandingHeroTitleSx,
  getAuthLandingImageFrameSx,
  getAuthLandingImageSx,
  getAuthLandingLeadSx,
  getAuthLandingSectionTitleSx,
  getAuthLandingCtaButtonSx,
  getAuthLandingOutlinedCtaSx,
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
  /** Intrinsic size — резервирует высоту до загрузки, иначе scroll к форме промахивается */
  width: number;
  height: number;
}

const LANDING_FEATURES: LandingFeature[] = [
  {
    id: 'feed',
    Icon: PhotoLibraryOutlinedIcon,
    lightFile: '1. avatars, feed light.PNG',
    darkFile: '1. avatars, feed dark.PNG',
    width: 1206,
    height: 2057,
  },
  {
    id: 'questions',
    Icon: QuizOutlinedIcon,
    lightFile: '2. question of the day light.PNG',
    darkFile: '2. question of the day dark.PNG',
    width: 1206,
    height: 2417,
  },
  {
    id: 'pets',
    Icon: PetsOutlinedIcon,
    lightFile: '3. pet light.PNG',
    darkFile: '3. pet dark.PNG',
    width: 1206,
    height: 2622,
  },
  {
    id: 'dateIdeas',
    Icon: LightbulbOutlinedIcon,
    lightFile: '4. date ideas light.PNG',
    darkFile: '4. date ideas dark.PNG',
    width: 1206,
    height: 2100,
  },
  {
    id: 'daysTogether',
    Icon: FavoriteBorderOutlinedIcon,
    lightFile: '5. days together light.PNG',
    darkFile: '5. days together dark.PNG',
    width: 1206,
    height: 1833,
  },
  {
    id: 'chat',
    Icon: ChatBubbleOutlineIcon,
    lightFile: '6. chat light.PNG',
    darkFile: '6. chat dark.PNG',
    width: 1206,
    height: 2334,
  },
  {
    id: 'guessLocation',
    Icon: PublicOutlinedIcon,
    lightFile: '7. game guess location light.png',
    darkFile: '7. game guess location dark.png',
    width: 425,
    height: 926,
  },
  {
    id: 'guessLocationResult',
    Icon: EmojiEventsOutlinedIcon,
    lightFile: '8. game guess location guesed location light.png',
    darkFile: '8. game guess location guesed location dark.png',
    width: 427,
    height: 633,
  },
  {
    id: 'guessDrawing',
    Icon: BrushOutlinedIcon,
    lightFile: '9. game guess painting light.png',
    darkFile: '9. game guess painting dark.png',
    width: 418,
    height: 852,
  },
  {
    id: 'calendar',
    Icon: CalendarMonthOutlinedIcon,
    lightFile: '10. calendar light.PNG',
    darkFile: '10. calendar dark.PNG',
    width: 1206,
    height: 1501,
  },
];

const getLandingImageSrc = (fileName: string): string =>
  getPublicAssetPath(`landing/${encodeURIComponent(fileName)}`);

const AuthLanding: React.FC<AuthLandingProps> = ({ onScrollToAuth }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
              sx={getAuthLandingCtaButtonSx(theme)}
            >
              {t('auth.landing.ctaRegister')}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => onScrollToAuth('login')}
              sx={getAuthLandingOutlinedCtaSx(theme)}
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

        <Box sx={getAuthLandingFeaturesListSx()}>
          {LANDING_FEATURES.map((feature, index) => {
            const { id, Icon, lightFile, darkFile, width, height } = feature;
            const imageSrc = getLandingImageSrc(isDark ? darkFile : lightFile);

            return (
              <RevealOnScroll
                key={id}
                delayMs={(index % 2) * 60}
                eager={index === 0 && isMobile}
              >
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
                  <Box sx={getAuthLandingImageFrameSx(theme, width, height)}>
                    <Box
                      component="img"
                      src={imageSrc}
                      alt={t(`auth.landing.features.${id}.imageAlt`)}
                      width={width}
                      height={height}
                      loading="lazy"
                      decoding="async"
                      sx={getAuthLandingImageSx()}
                    />
                  </Box>
                </Box>
              </RevealOnScroll>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default AuthLanding;
