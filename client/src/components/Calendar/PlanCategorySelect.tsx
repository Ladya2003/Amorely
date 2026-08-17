import React, { useId, useState } from 'react';
import { Box, Button, ListItemIcon, Menu, MenuItem, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  getCalendarCategorySelectButtonSx,
  getCalendarCategorySelectMenuItemSx,
  getCalendarCategorySelectMenuPaperSx,
} from './calendarPageStyles';
import { CheckRoundedIcon, ExpandMoreRoundedIcon, LabelOutlinedIcon } from '../UI/icons';

type PlanCategorySelectProps = {
  categories: string[];
  value: string | null;
  onChange: (category: string | null) => void;
};

const PlanCategorySelect: React.FC<PlanCategorySelectProps> = ({
  categories,
  value,
  onChange,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const menuId = useId();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const label = value ?? t('calendar.plans.all');

  const handleSelect = (category: string | null) => {
    setAnchorEl(null);
    onChange(category);
  };

  return (
    <>
      <Button
        id={`${menuId}-button`}
        aria-controls={open ? `${menuId}-menu` : undefined}
        aria-haspopup="listbox"
        aria-expanded={open ? 'true' : undefined}
        aria-label={t('calendar.plans.category')}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        startIcon={<LabelOutlinedIcon sx={{ fontSize: '1.1rem !important' }} />}
        endIcon={
          <ExpandMoreRoundedIcon
            sx={{
              fontSize: '1.2rem !important',
              transition: 'transform 0.2s ease',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        }
        sx={getCalendarCategorySelectButtonSx(theme, open)}
      >
        <Typography
          component="span"
          noWrap
          sx={{ fontWeight: 600, fontSize: 'inherit', textAlign: 'left' }}
        >
          {label}
        </Typography>
      </Button>

      <Menu
        id={`${menuId}-menu`}
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{
          'aria-labelledby': `${menuId}-button`,
          role: 'listbox',
          dense: true,
          sx: { py: 0.75 },
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: getCalendarCategorySelectMenuPaperSx(theme),
          },
        }}
      >
        <Box sx={{ px: 1.75, pt: 1, pb: 0.75 }}>
          <Typography
            sx={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'text.secondary',
            }}
          >
            {t('calendar.plans.category')}
          </Typography>
        </Box>

        <MenuItem
          selected={value === null}
          onClick={() => handleSelect(null)}
          role="option"
          aria-selected={value === null}
          sx={getCalendarCategorySelectMenuItemSx(theme, value === null)}
        >
          <Typography noWrap sx={{ flex: 1, fontWeight: 'inherit', fontSize: 'inherit' }}>
            {t('calendar.plans.all')}
          </Typography>
          <ListItemIcon
            sx={{
              minWidth: 24,
              justifyContent: 'flex-end',
              color: 'primary.main',
              opacity: value === null ? 1 : 0,
            }}
          >
            <CheckRoundedIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
        </MenuItem>

        {categories.map((category) => {
          const selected = value === category;
          return (
            <MenuItem
              key={category}
              selected={selected}
              onClick={() => handleSelect(category)}
              role="option"
              aria-selected={selected}
              sx={getCalendarCategorySelectMenuItemSx(theme, selected)}
            >
              <Typography noWrap sx={{ flex: 1, fontWeight: 'inherit', fontSize: 'inherit' }}>
                {category}
              </Typography>
              <ListItemIcon
                sx={{
                  minWidth: 24,
                  justifyContent: 'flex-end',
                  color: 'primary.main',
                  opacity: selected ? 1 : 0,
                }}
              >
                <CheckRoundedIcon sx={{ fontSize: 18 }} />
              </ListItemIcon>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default PlanCategorySelect;
