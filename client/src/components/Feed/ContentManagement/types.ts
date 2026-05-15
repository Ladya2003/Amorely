// Типы и интерфейсы для управления контентом

import type { ContentMediaEnvelope } from '../../../crypto/contentCryptoService';

export interface ContentItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  name: string;
  size: number;
  uploadedAt: Date;
  uploadedBy?: any;
  publicId?: string;
  frequency?: { count: number; hours: number };
  encrypted?: boolean;
  mediaEnvelope?: ContentMediaEnvelope;
}

export interface ContentManagementDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (
    files: File[], 
    target: 'self' | 'partner', 
    frequency: { count: number; hours: number }, 
    applyNow: boolean, 
    resetRotation?: boolean
  ) => void;
  hasPartner: boolean;
  existingContent?: ContentItem[];
  onDeleteContent?: (contentId: string) => void;
  onContentReordered?: () => void;
}

export interface FrequencySettings {
  count: number;
  hours: number;
}

export type ViewMode = 'grid' | 'list';
export type SizeFilter = 'all' | 'small' | 'medium' | 'large';
export type DateFilter = 'all' | 'today' | 'week' | 'month' | 'older';

