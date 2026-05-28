import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { API_URL } from '../../config';
import GameBadgeIcon from '../Games/GameBadgeIcon';
import { getBestBadgesByGame, getGameName } from '../../utils/gameBadges';
import { useRelationshipBadges } from '../../hooks/useRelationshipBadges';

interface DisplayBadgePickerProps {
  userId: string;
  displayBadgeGameId?: string | null;
  onSaved: (displayBadgeGameId: string | null) => void;
}

const DisplayBadgePicker: React.FC<DisplayBadgePickerProps> = ({
  userId,
  displayBadgeGameId,
  onSaved,
}) => {
  const { badges } = useRelationshipBadges();
  const availableBadges = getBestBadgesByGame(badges);
  const [selected, setSelected] = useState<string>(displayBadgeGameId || 'auto');

  useEffect(() => {
    setSelected(displayBadgeGameId || 'auto');
  }, [displayBadgeGameId]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const nextValue = selected === 'auto' ? null : selected;

      const response = await axios.put(
        `${API_URL}/api/settings/user/${userId}`,
        { displayBadgeGameId: nextValue ?? '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onSaved(response.data.user?.displayBadgeGameId ?? null);
    } catch {
      setError('Не удалось сохранить медаль');
    } finally {
      setSaving(false);
    }
  };

  if (availableBadges.length === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Медаль рядом с именем
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Пока нет медалей — попадите в топ-3 пар в любой игре.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
        Медаль рядом с именем
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        В чате и в шапке показывается одна медаль. По умолчанию — лучшая (топ-1, иначе 2, иначе 3).
      </Typography>

      <RadioGroup value={selected} onChange={(event) => setSelected(event.target.value)}>
        <FormControlLabel
          value="auto"
          control={<Radio size="small" />}
          label="Авто (лучшая медаль)"
        />
        {availableBadges.map((badge) => (
          <FormControlLabel
            key={badge.gameId}
            value={badge.gameId}
            control={<Radio size="small" />}
            sx={{ alignItems: 'center' }}
            label={
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                <GameBadgeIcon badge={badge} size={22} showTooltip={false} />
                <Typography variant="body2">
                  {getGameName(badge.gameId)} · топ-{badge.rank}
                </Typography>
              </Box>
            }
          />
        ))}
      </RadioGroup>

      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}

      <Button
        size="small"
        variant="outlined"
        sx={{ mt: 1.5 }}
        disabled={saving || selected === (displayBadgeGameId || 'auto')}
        onClick={handleSave}
      >
        {saving ? <CircularProgress size={18} /> : 'Сохранить медаль'}
      </Button>
    </Box>
  );
};

export default DisplayBadgePicker;
