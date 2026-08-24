import React from 'react';
import { Box, Checkbox, FormControlLabel, Link, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { PUBLIC_PATHS } from '../../legal/publicSite';

type LegalConsentCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: boolean;
};

const LegalConsentCheckbox: React.FC<LegalConsentCheckboxProps> = ({
  checked,
  onChange,
  disabled,
  error,
}) => {
  const { t } = useTranslation();

  return (
    <Box sx={{ mt: 1.5, mb: 0.5 }}>
      <FormControlLabel
        sx={{ alignItems: 'flex-start', mr: 0 }}
        control={
          <Checkbox
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
            disabled={disabled}
            color="primary"
            sx={{ mt: -0.5 }}
          />
        }
        label={
          <Typography variant="body2" color={error ? 'error' : 'text.secondary'} sx={{ lineHeight: 1.45 }}>
            <Trans
              i18nKey="legal.consent.label"
              components={{
                terms: (
                  <Link
                    component={RouterLink}
                    to={PUBLIC_PATHS.terms}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="always"
                    color="primary"
                    onClick={(event) => event.stopPropagation()}
                  />
                ),
                privacy: (
                  <Link
                    component={RouterLink}
                    to={PUBLIC_PATHS.privacy}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="always"
                    color="primary"
                    onClick={(event) => event.stopPropagation()}
                  />
                ),
              }}
            />
          </Typography>
        }
      />
      {error && (
        <Typography variant="caption" color="error" sx={{ display: 'block', ml: 4.5 }}>
          {t('legal.consent.required')}
        </Typography>
      )}
    </Box>
  );
};

export default LegalConsentCheckbox;
