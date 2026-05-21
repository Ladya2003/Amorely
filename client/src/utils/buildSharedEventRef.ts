import type { SharedEventRef } from '../components/Chat/ChatDialog';
import type { ContentMediaEnvelope } from '../crypto/contentCryptoService';

interface EventMediaFile {
  _id: string;
  url: string;
  resourceType: 'image' | 'video';
  encrypted?: boolean;
  mediaEnvelope?: ContentMediaEnvelope;
}

interface EventLike {
  _id: string;
  eventId?: string;
  title?: string;
  eventDate?: string;
  createdAt: string;
  media?: EventMediaFile[];
}

export const buildSharedEventRef = (event: EventLike): SharedEventRef => {
  const firstMedia = (event.media || []).find((media) => media.url && media.url.trim().length > 0);

  return {
    eventId: event.eventId || event._id,
    title: event.title || 'Без названия',
    previewUrl: firstMedia?.url,
    previewResourceType: firstMedia?.resourceType,
    previewEncrypted: firstMedia?.encrypted,
    previewMediaEnvelope: firstMedia?.mediaEnvelope,
    eventDate: event.eventDate || event.createdAt
  };
};
