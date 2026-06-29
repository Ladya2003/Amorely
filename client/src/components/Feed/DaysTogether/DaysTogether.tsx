import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DaysTogetherProps } from './types';
import { useDaysTogether } from './hooks/useDaysTogether';
import { getDaysWord, getRelationshipStatus, formatDate } from './utils/helpers';
import PhotoUploader from './components/PhotoUploader';
import SignatureDialog from './components/SignatureDialog';
import ProgressIndicator from './components/ProgressIndicator';
import MilestoneCard from './components/MilestoneCard';
import ExportButton from './components/ExportButton';
import ColorPicker, { getThemeById } from './components/ColorPicker';
import {
  getDaysTogetherActionsRowSx,
  getDaysTogetherBackgroundGradientSx,
  getDaysTogetherBackgroundPhotoSx,
  getDaysTogetherCardSx,
  getDaysTogetherEmptySx,
  getDaysTogetherHeroPanelSx,
  getDaysTogetherSignatureImageSx,
} from './daysTogetherStyles';

const DEFAULT_ROMANTIC_BG =
  'https://img.freepik.com/free-photo/couple-making-heart-from-hands-sea-shore_23-2148019887.jpg?w=360';

const DaysTogether: React.FC<DaysTogetherProps> = ({
  daysCount,
  relationshipStartDate,
  onAddPhoto,
  onAddSignature,
  photo,
  signature,
  signatures,
  currentUserId,
  relationshipOwnerId,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();

  const isOwner = currentUserId && relationshipOwnerId && currentUserId === relationshipOwnerId;
  const currentUserSignature = isOwner ? signatures?.user : signatures?.partner;

  const {
    showAchievements,
    nextMilestone,
    progress,
    achievements,
    daysUntilAnniversary,
    selectedTheme,
    toggleAchievements,
    handleThemeChange,
  } = useDaysTogether({ daysCount, relationshipStartDate });

  const currentTheme = getThemeById(selectedTheme, t);
  const backgroundPhoto = photo || DEFAULT_ROMANTIC_BG;

  if (!daysCount || !relationshipStartDate) {
    return (
      <Box sx={getDaysTogetherEmptySx(theme)} onClick={() => navigate('/settings?tab=partner')}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          {t('feed.addPartnerTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('feed.addPartnerDescription')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={getDaysTogetherCardSx(theme)} id="days-together">
      <Box sx={getDaysTogetherBackgroundPhotoSx(backgroundPhoto)} />
      <Box sx={getDaysTogetherBackgroundGradientSx(theme, currentTheme)} />

      <Box sx={{ position: 'relative', zIndex: 2 }}>
        <Box sx={getDaysTogetherHeroPanelSx(theme)}>
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.75rem', sm: '2rem' },
              lineHeight: 1.15,
              color: 'text.primary',
            }}
          >
            {t('feed.daysTogether', {
              count: daysCount,
              daysWord: getDaysWord(daysCount, t),
            })}
          </Typography>

          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: 'text.primary',
            }}
          >
            {getRelationshipStatus(daysCount, t)}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {t('feed.since', { date: formatDate(relationshipStartDate, i18n.language) })}
          </Typography>
        </Box>

        <ProgressIndicator
          nextMilestone={nextMilestone}
          progress={progress}
          daysCount={daysCount}
          theme={currentTheme}
        />

        {achievements.length > 0 && (
          <MilestoneCard
            achievements={achievements}
            showAchievements={showAchievements}
            onToggle={toggleAchievements}
            daysUntilAnniversary={daysUntilAnniversary}
            theme={currentTheme}
          />
        )}

        {(signatures?.user || signatures?.partner || signature) && (
          <Box
            sx={{
              mt: 2,
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              maxWidth: '100%',
              overflow: 'hidden',
              flexWrap: 'wrap',
            }}
          >
            {signatures?.user && (
              <Box
                component="img"
                src={signatures.user}
                alt={t('feed.signatureUser')}
                sx={getDaysTogetherSignatureImageSx(signatures?.partner ? '45%' : '100%')}
              />
            )}
            {signatures?.partner && (
              <Box
                component="img"
                src={signatures.partner}
                alt={t('feed.signaturePartner')}
                sx={getDaysTogetherSignatureImageSx(signatures?.user ? '45%' : '100%')}
              />
            )}
            {!signatures?.user && !signatures?.partner && signature && (
              <Box
                component="img"
                src={signature}
                alt={t('feed.signature')}
                sx={getDaysTogetherSignatureImageSx()}
              />
            )}
          </Box>
        )}

        <Box sx={getDaysTogetherActionsRowSx(theme)}>
          <PhotoUploader onPhotoUpload={onAddPhoto} photo={photo} colorTheme={currentTheme} />
          <SignatureDialog
            onSave={onAddSignature}
            signature={currentUserSignature || signature}
            colorTheme={currentTheme}
          />
          <ColorPicker selectedTheme={selectedTheme} onThemeChange={handleThemeChange} />
          <ExportButton targetId="days-together" colorTheme={currentTheme} />
        </Box>
      </Box>
    </Box>
  );
};

export default DaysTogether;
