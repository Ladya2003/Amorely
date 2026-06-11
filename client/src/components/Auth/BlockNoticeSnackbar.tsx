import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { resolveAppLocale } from '../../localization/locale';
import { resolveBlockReasonForLocale } from '../../utils/handleAccountBlocked';
import CustomSnackbar from '../UI/CustomSnackbar';

const BlockNoticeSnackbar: React.FC = () => {
  const { blockReasons, blockReasonFallback, clearBlockNotice } = useAuth();
  const { i18n } = useTranslation();

  const message = resolveBlockReasonForLocale(
    blockReasons,
    resolveAppLocale(i18n.language),
    blockReasonFallback
  );

  return (
    <CustomSnackbar
      open={Boolean(message)}
      message={message || ''}
      severity="error"
      onClose={clearBlockNotice}
    />
  );
};

export default BlockNoticeSnackbar;
