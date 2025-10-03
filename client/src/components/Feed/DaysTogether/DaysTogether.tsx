// Главный компонент DaysTogether с улучшениями

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DaysTogetherProps } from './types';
import { useDaysTogether } from './hooks/useDaysTogether';
import { getDaysWord, getRelationshipStatus, formatDate } from './utils/helpers';
import PhotoUploader from './components/PhotoUploader';
import SignatureDialog from './components/SignatureDialog';
import ProgressIndicator from './components/ProgressIndicator';
import MilestoneCard from './components/MilestoneCard';
import ExportButton from './components/ExportButton';
import ColorPicker, { colorThemes } from './components/ColorPicker';

const DaysTogether: React.FC<DaysTogetherProps> = ({
  daysCount,
  relationshipStartDate,
  onAddPhoto,
  onAddSignature,
  photo,
  signature,
  signatures
}) => {
  const navigate = useNavigate();
  
  const {
    signatureDialogOpen,
    showAchievements,
    nextMilestone,
    progress,
    achievements,
    daysUntilAnniversary,
    selectedTheme,
    handleSignatureDialogOpen,
    handleSignatureDialogClose,
    toggleAchievements,
    handleThemeChange
  } = useDaysTogether({ daysCount, relationshipStartDate });

  // Получаем цвета выбранной темы
  const currentTheme = colorThemes.find(t => t.id === selectedTheme) || colorThemes[0];
  const gradientColors = currentTheme.colors.join(', ');

  // Если нет данных - показываем заглушку
  if (!daysCount || !relationshipStartDate) {
    return (
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 2,
          textAlign: 'center',
          bgcolor: 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.3s',
          '&:hover': {
            transform: 'scale(1.02)',
            boxShadow: 6
          }
        }}
        onClick={() => navigate('/settings')}
      >
        <Typography variant="h6" gutterBottom>
          Добавьте партнера в настройках
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Чтобы видеть количество дней вместе, добавьте партнера и дату начала отношений
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        borderRadius: 2,
        bgcolor: 'background.paper',
        position: 'relative',
        overflow: 'hidden'
      }}
      id="days-together"
    >
      {/* Красивый градиентный фон вместо простой opacity */}
      {photo ? (
        <>
          {/* Фото на заднем плане */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${photo})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(8px)',
              opacity: 0.3,
              zIndex: 0
            }}
          />
          {/* Градиентный overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: `linear-gradient(135deg, ${gradientColors})`,
              backdropFilter: 'blur(10px)',
              zIndex: 1
            }}
          />
        </>
      ) : (
        // Если фото нет - просто красивый градиент с меньшей прозрачностью
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `linear-gradient(135deg, ${currentTheme.colors[0].replace(/0\.\d+/, '0.08')}, ${currentTheme.colors[1].replace(/0\.\d+/, '0.05')}, ${currentTheme.colors[2].replace(/0\.\d+/, '0.06')})`,
            zIndex: 0
          }}
        />
      )}

      {/* Основной контент */}
      <Box sx={{ position: 'relative', zIndex: 2 }}>
        {/* Заголовок с правильной локализацией */}
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          align="center"
          fontWeight="bold"
          sx={{
            color: photo ? '#fff' : currentTheme.preview,
            textShadow: photo 
              ? '0 2px 8px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.4)' 
              : `0 2px 4px ${currentTheme.colors[0].replace(/0\.\d+/, '0.3')}`,
            WebkitTextStroke: photo ? '0.5px rgba(0,0,0,0.2)' : 'none',
            filter: photo ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' : `drop-shadow(0 1px 2px ${currentTheme.colors[0].replace(/0\.\d+/, '0.2')})`
          }}
        >
          {daysCount} {getDaysWord(daysCount)} вместе
        </Typography>

        {/* Статус отношений */}
        <Typography
          variant="subtitle1"
          align="center"
          gutterBottom
          sx={{ 
            fontWeight: 500,
            color: photo ? 'rgba(255,255,255,0.9)' : currentTheme.preview,
            textShadow: photo ? '0 1px 2px rgba(0,0,0,0.3)' : `0 1px 2px ${currentTheme.colors[0].replace(/0\.\d+/, '0.2')}`
          }}
        >
          {getRelationshipStatus(daysCount)}
        </Typography>

        {/* Дата начала */}
        <Typography 
          variant="body2" 
          align="center" 
          gutterBottom
          sx={{
            color: photo ? 'rgba(255,255,255,0.8)' : `${currentTheme.preview}CC`,
            textShadow: photo ? '0 1px 2px rgba(0,0,0,0.2)' : `0 1px 2px ${currentTheme.colors[0].replace(/0\.\d+/, '0.15')}`
          }}
        >
          С {formatDate(relationshipStartDate)}
        </Typography>

        {/* Прогресс до следующей вехи */}
        <ProgressIndicator
          nextMilestone={nextMilestone}
          progress={progress}
          daysCount={daysCount}
          theme={currentTheme}
          hasPhoto={!!photo}
        />

        {/* Достижения */}
        {achievements.length > 0 && (
          <MilestoneCard
            achievements={achievements}
            showAchievements={showAchievements}
            onToggle={toggleAchievements}
            daysUntilAnniversary={daysUntilAnniversary}
          />
        )}

        {/* Подписи */}
        {(signatures?.user || signatures?.partner || signature) && (
          <Box
            sx={{
              mt: 2,
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              maxWidth: '100%',
              overflow: 'hidden',
              flexWrap: 'wrap'
            }}
          >
            {signatures?.user && (
              <img
                src={signatures.user}
                alt="Подпись пользователя"
                style={{
                  maxWidth: signatures?.partner ? '45%' : '100%',
                  maxHeight: '100px',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }}
              />
            )}
            {signatures?.partner && (
              <img
                src={signatures.partner}
                alt="Подпись партнера"
                style={{
                  maxWidth: signatures?.user ? '45%' : '100%',
                  maxHeight: '100px',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }}
              />
            )}
            {/* Fallback для старой подписи */}
            {!signatures?.user && !signatures?.partner && signature && (
              <img
                src={signature}
                alt="Подпись"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100px',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }}
              />
            )}
          </Box>
        )}

        {/* Кнопки управления */}
        <Box
          sx={{
            mt: 3,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap'
          }}
        >
          <PhotoUploader 
            onPhotoUpload={onAddPhoto} 
            photo={photo} 
            colorTheme={currentTheme}
          />
          <SignatureDialog
            open={signatureDialogOpen}
            onClose={handleSignatureDialogClose}
            onSave={onAddSignature}
            signature={signatures?.user || signature}
            colorTheme={currentTheme}
          />
          <ColorPicker selectedTheme={selectedTheme} onThemeChange={handleThemeChange} />
          <ExportButton targetId="days-together" />
        </Box>
      </Box>
    </Paper>
  );
};

export default DaysTogether;

