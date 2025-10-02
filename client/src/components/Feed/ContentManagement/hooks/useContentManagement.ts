// Основной хук для управления состоянием контента

import { useState, useEffect } from 'react';
import { ContentItem, ViewMode, SizeFilter, DateFilter, FrequencySettings } from '../types';

interface UseContentManagementProps {
  open: boolean;
  existingContent: ContentItem[];
  onSave: (
    files: File[],
    target: 'self' | 'partner',
    frequency: FrequencySettings,
    applyNow: boolean,
    resetRotation?: boolean
  ) => void;
  onDeleteContent?: (contentId: string) => void;
  onClose: () => void;
}

export const useContentManagement = ({
  open,
  existingContent,
  onSave,
  onDeleteContent,
  onClose
}: UseContentManagementProps) => {
  // Вкладки и отображение
  const [activeTab, setActiveTab] = useState<number>(() => {
    const saved = localStorage.getItem('contentActiveTab');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('contentViewMode');
    return (saved as ViewMode) || 'grid';
  });

  // Фильтры
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  // Загрузка файлов
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Настройки частоты
  const [contentCount, setContentCount] = useState<number>(3);
  const [hoursInterval, setHoursInterval] = useState<number>(24);
  const [applyNow, setApplyNow] = useState<boolean>(true);
  const [showFrequencyChange, setShowFrequencyChange] = useState<boolean>(false);
  const [initialContentCount, setInitialContentCount] = useState<number>(3);
  const [initialHoursInterval, setInitialHoursInterval] = useState<number>(24);

  // Диалоги
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [contentToDelete, setContentToDelete] = useState<ContentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [frequencyChangeOpen, setFrequencyChangeOpen] = useState<boolean>(false);
  const [pendingFrequency, setPendingFrequency] = useState<FrequencySettings | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Вычисляемые значения
  const hasFrequencyChanges = contentCount !== initialContentCount || hoursInterval !== initialHoursInterval;
  const canSave = files.length > 0 || hasFrequencyChanges;

  // Загрузка настроек частоты при открытии
  useEffect(() => {
    if (open && existingContent.length > 0) {
      const firstContent = existingContent[0];
      if (firstContent.frequency) {
        const { count, hours } = firstContent.frequency;
        setContentCount(count);
        setHoursInterval(hours);
        setInitialContentCount(count);
        setInitialHoursInterval(hours);
      }
    } else if (open && existingContent.length === 0) {
      setContentCount(3);
      setHoursInterval(24);
      setInitialContentCount(3);
      setInitialHoursInterval(24);
    }
  }, [open, existingContent]);

  // Обработчики файлов
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles([...files, ...newFiles]);
      
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews([...previews, ...newPreviews]);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  // Обработчики изменения настроек
  const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
    if (newMode) {
      setViewMode(newMode);
      localStorage.setItem('contentViewMode', newMode);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    localStorage.setItem('contentActiveTab', newValue.toString());
  };

  // Обработчики удаления
  const handleDeleteContent = (contentId: string) => {
    const content = existingContent.find(item => item.id === contentId);
    if (content) {
      setContentToDelete(content);
      setConfirmDeleteOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!contentToDelete || !onDeleteContent) return;

    setIsDeleting(true);
    try {
      await onDeleteContent(contentToDelete.id);
      setConfirmDeleteOpen(false);
      setContentToDelete(null);
    } catch (error) {
      console.error('Ошибка при удалении контента:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteOpen(false);
    setContentToDelete(null);
    setIsDeleting(false);
  };

  // Обработчики сохранения
  const handleSave = () => {
    const newFrequency = { count: contentCount, hours: hoursInterval };
    
    if (files.length > 0) {
      onSave(files, 'partner', newFrequency, applyNow);
      handleClose();
      return;
    }
    
    if (hasFrequencyChanges && existingContent.length > 0) {
      setPendingFrequency(newFrequency);
      setFrequencyChangeOpen(true);
    } else {
      onSave(files, 'partner', newFrequency, applyNow);
      handleClose();
    }
  };

  const handleFrequencyChangeConfirm = async (resetRotation: boolean) => {
    if (!pendingFrequency) return;
    
    setIsSaving(true);
    try {
      await onSave(files, 'partner', pendingFrequency, applyNow, resetRotation);
      setFrequencyChangeOpen(false);
      setPendingFrequency(null);
      handleClose();
    } catch (error) {
      console.error('Ошибка при сохранении настроек:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFrequencyChangeCancel = () => {
    setFrequencyChangeOpen(false);
    setPendingFrequency(null);
    setIsSaving(false);
  };

  // Закрытие диалога
  const handleClose = () => {
    previews.forEach(url => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviews([]);
    setContentCount(3);
    setHoursInterval(24);
    setApplyNow(true);
    setShowFrequencyChange(false);
    setSearchQuery('');
    setSizeFilter('all');
    setDateFilter('all');
    setInitialContentCount(3);
    setInitialHoursInterval(24);
    setConfirmDeleteOpen(false);
    setContentToDelete(null);
    setIsDeleting(false);
    
    onClose();
  };

  return {
    // Состояние
    activeTab,
    viewMode,
    searchQuery,
    sizeFilter,
    dateFilter,
    files,
    previews,
    contentCount,
    hoursInterval,
    applyNow,
    showFrequencyChange,
    hasFrequencyChanges,
    canSave,
    confirmDeleteOpen,
    contentToDelete,
    isDeleting,
    frequencyChangeOpen,
    pendingFrequency,
    isSaving,
    initialContentCount,
    initialHoursInterval,

    // Сеттеры
    setSearchQuery,
    setSizeFilter,
    setDateFilter,
    setContentCount,
    setHoursInterval,
    setShowFrequencyChange,

    // Обработчики
    handleFileChange,
    handleRemoveFile,
    handleViewModeChange,
    handleTabChange,
    handleDeleteContent,
    handleConfirmDelete,
    handleCancelDelete,
    handleSave,
    handleFrequencyChangeConfirm,
    handleFrequencyChangeCancel,
    handleClose
  };
};

