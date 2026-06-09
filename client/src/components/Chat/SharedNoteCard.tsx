import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Chip, Typography } from '@mui/material';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import ImageIcon from '@mui/icons-material/Image';
import DecryptedMedia from '../common/DecryptedMedia';
import type { SharedNoteMediaRef, SharedNoteRef } from './ChatDialog';
import type { ContentMediaEnvelope } from '../../crypto/contentCryptoService';
import { decryptSharedEventMediaItem } from '../../crypto/contentCryptoService';
import { useCrypto } from '../../contexts/CryptoContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePartnerId } from '../../hooks/usePartnerId';

interface SharedNoteCardProps {
  sharedNote: SharedNoteRef;
  isOwn?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

const resolveMediaItems = (sharedNote: SharedNoteRef): SharedNoteMediaRef[] => {
  if (sharedNote.media?.length) {
    return sharedNote.media.filter((item) => item.url?.trim());
  }

  if (!sharedNote.previewUrl?.trim()) {
    return [];
  }

  return [
    {
      url: sharedNote.previewUrl,
      resourceType: sharedNote.previewResourceType || 'image',
      encrypted: sharedNote.previewEncrypted,
      previewMediaEnvelope: sharedNote.previewMediaEnvelope,
      encryptedMediaEnvelope: sharedNote.previewEncryptedMediaEnvelope
    }
  ];
};

const SharedNoteCard: React.FC<SharedNoteCardProps> = ({
  sharedNote,
  isOwn = false,
  compact = false,
  onClick
}) => {
  const { t } = useTranslation();
  const { localDeviceKeys } = useCrypto();
  const { user } = useAuth();
  const partnerId = usePartnerId();
  const mediaItems = useMemo(() => resolveMediaItems(sharedNote), [sharedNote]);
  const [previewEnvelopes, setPreviewEnvelopes] = useState<Array<ContentMediaEnvelope | undefined>>(
    () => mediaItems.map((item) => item.previewMediaEnvelope)
  );

  const metadata = useMemo(
    () => ({
      previewMetadataSenderId: sharedNote.previewMetadataSenderId,
      previewMetadataRecipientId: sharedNote.previewMetadataRecipientId
    }),
    [sharedNote.previewMetadataRecipientId, sharedNote.previewMetadataSenderId]
  );

  useEffect(() => {
    let cancelled = false;

    const resolvePreviews = async () => {
      if (!localDeviceKeys) {
        setPreviewEnvelopes(mediaItems.map((item) => item.previewMediaEnvelope));
        return;
      }

      const resolved = await Promise.all(
        mediaItems.map(async (item) => {
          if (!item.encrypted) {
            return item.previewMediaEnvelope;
          }

          try {
            return await decryptSharedEventMediaItem(
              localDeviceKeys,
              item,
              metadata,
              user?._id,
              partnerId || undefined
            );
          } catch {
            return undefined;
          }
        })
      );

      if (!cancelled) {
        setPreviewEnvelopes(resolved);
      }
    };

    void resolvePreviews();

    return () => {
      cancelled = true;
    };
  }, [localDeviceKeys, mediaItems, metadata, partnerId, user?._id]);

  const previewMedia = mediaItems[0];
  const previewEnvelope = previewEnvelopes[0];
  const extraMediaCount = Math.max(0, mediaItems.length - 1);
  const hasPreview = Boolean(previewMedia?.url);

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        gap: 1,
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: isOwn ? 'rgba(255,255,255,0.25)' : 'divider',
        bgcolor: isOwn ? 'rgba(255,255,255,0.12)' : 'action.hover',
        cursor: onClick ? 'pointer' : 'default',
        maxWidth: compact ? '100%' : 280
      }}
    >
      <Box
        sx={{
          width: compact ? 56 : 72,
          minWidth: compact ? 56 : 72,
          height: compact ? 56 : 72,
          bgcolor: isOwn ? 'rgba(255,255,255,0.1)' : 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          pointerEvents: 'none'
        }}
      >
        {hasPreview ? (
          <>
            <DecryptedMedia
              cacheKey={`shared-note-${sharedNote.noteId}-${previewMedia?.id || '0'}`}
              url={previewMedia!.url}
              resourceType={previewMedia!.resourceType || 'image'}
              encrypted={Boolean(previewEnvelope?.mediaKey) || Boolean(previewMedia!.encrypted)}
              mediaEnvelope={previewEnvelope}
              videoPreview={previewMedia!.resourceType === 'video'}
              imageStyle={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              videoStyle={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              loadingMinHeight={0}
            />
            {extraMediaCount > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  right: 4,
                  bottom: 4,
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 1,
                  bgcolor: 'rgba(0,0,0,0.65)',
                  color: 'common.white',
                  fontSize: 11,
                  fontWeight: 600,
                  lineHeight: 1.2
                }}
              >
                +{extraMediaCount}
              </Box>
            )}
          </>
        ) : (
          <ImageIcon
            sx={{
              fontSize: compact ? 24 : 28,
              color: isOwn ? 'rgba(255,255,255,0.6)' : 'text.disabled'
            }}
          />
        )}
      </Box>
      <Box sx={{ py: 0.75, pr: 1, minWidth: 0, flex: 1 }}>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            fontWeight: 600,
            color: isOwn ? 'rgba(255,255,255,0.85)' : 'primary.main',
            mb: 0.25
          }}
        >
          {t('chat.note.label')}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: isOwn ? 'rgba(255,255,255,0.95)' : 'text.primary',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.3
          }}
        >
          {sharedNote.title}
        </Typography>
        {sharedNote.category && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
            <StickyNote2Icon
              sx={{
                fontSize: 12,
                color: isOwn ? 'rgba(255,255,255,0.7)' : 'text.secondary'
              }}
            />
            <Chip
              label={sharedNote.category}
              size="small"
              sx={{
                height: 18,
                fontSize: 10,
                '& .MuiChip-label': { px: 0.75 },
                bgcolor: isOwn ? 'rgba(255,255,255,0.15)' : 'action.selected',
                color: isOwn ? 'rgba(255,255,255,0.85)' : 'text.secondary'
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SharedNoteCard;
