import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { usePartnerId } from '../../hooks/usePartnerId';
import { buildSharedGameRef, sendGameLobbyInvite } from '../../services/sendGameLobbyInvite';
import { getGamePlayOutlinedButtonSx } from './gamePlayPageStyles';
import CustomSnackbar from '../UI/CustomSnackbar';

interface GameLobbyRemindButtonProps {
  gameId: string;
  visible: boolean;
}

const GameLobbyRemindButton: React.FC<GameLobbyRemindButtonProps> = ({ gameId, visible }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const partnerId = usePartnerId();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (!visible) {
      setSent(false);
    }
  }, [visible]);

  if (!visible && !toast.open) {
    return null;
  }

  const handleClick = () => {
    if (!partnerId || sending || sent) {
      return;
    }

    const title = t(`games.${gameId}.name`);
    const sharedGame = buildSharedGameRef(gameId, title);
    if (!sharedGame) {
      setToast({
        open: true,
        message: t('games.common.remindPartnerFailed'),
        severity: 'error',
      });
      return;
    }

    setSending(true);
    try {
      sendGameLobbyInvite(partnerId, sharedGame, t);
      setSent(true);
      setToast({
        open: true,
        message: t('games.common.partnerReminded'),
        severity: 'success',
      });
    } catch {
      setToast({
        open: true,
        message: t('games.common.remindPartnerFailed'),
        severity: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {visible ? (
        <Button
          variant="outlined"
          size="large"
          fullWidth
          sx={{ ...getGamePlayOutlinedButtonSx(theme), mt: 1.5 }}
          disabled={!partnerId || sending || sent}
          onClick={handleClick}
        >
          {sent ? t('games.common.partnerRemindedShort') : t('games.common.remindPartner')}
        </Button>
      ) : null}
      <CustomSnackbar
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
};

export default GameLobbyRemindButton;
